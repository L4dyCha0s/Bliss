const fs = require('fs');
const path = require('path');
const arquivoTempo = path.join(__dirname, '../data/tempo.json');
const arquivoRanking = path.join(__dirname, '../data/ranking.json'); // Precisamos também do ranking.json

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    // 1. Ação: Verifica se o comando foi usado em um chat individual.
    if (!chat.isGroup) {
        return msg.reply('Este comando só funciona em grupos.');
    }

    let resposta = '';
    const contatosParaMencionar = [];

    // --- PARTE 1: Identificar Usuários Inativos (Aqueles que já interagiram, mas pararam) ---
    resposta += '--- *STATUS DE ATIVIDADE DO GRUPO* ---\n\n';

    let tempoData = {};
    if (fs.existsSync(arquivoTempo)) {
        try {
            tempoData = JSON.parse(fs.readFileSync(arquivoTempo, 'utf8'));
        } catch (error) {
            console.error('Erro ao ler ou parsear tempo.json para !inativos:', error);
            resposta += '❌ Erro ao carregar dados de *última atividade*.\n';
        }
    }

    const agora = Date.now();
    const participantesNoGrupo = chat.participants.map(p => p.id._serialized); // Pega o ID serializado de todos os membros do grupo

    const inativosComRegistro = Object.entries(tempoData)
        .map(([id, lastTime]) => ({ id, dias: Math.floor((agora - lastTime) / (1000 * 60 * 60 * 24)) }))
        .filter(u => u.dias > 3 && participantesNoGrupo.includes(u.id)) // Filtra: > 3 dias inativos E ainda estão no grupo
        .sort((a, b) => b.dias - a.dias) // Do mais inativo para o menos inativo
        .slice(0, 10); // Pega os 10 mais inativos (ajuste se quiser mais/menos)

    if (inativosComRegistro.length > 0) {
        resposta += '😴 *Membros inativos há mais de 3 dias (já interagiram antes):*\n';
        for (const { id, dias } of inativosComRegistro) {
            try {
                const contato = await client.getContactById(id);
                // Validação robusta para menções
                if (contato && contato.id && typeof contato.id.user === 'string' && typeof contato.id._serialized === 'string' && contato.id._serialized.length > 0 && contato.id._serialized.includes('@c.us')) {
                    resposta += `@${contato.id.user}: ${dias} dias\n`;
                    contatosParaMencionar.push(contato);
                } else {
                    console.warn(`[!inativos] Contato problemático na lista de inativos com registro: ${id}. Ignorando menção.`);
                    resposta += `Usuário Desconhecido (${id.substring(0, 5)}...): ${dias} dias\n`;
                }
            } catch (error) {
                console.error(`[!inativos] Erro ao buscar contato ${id} para inativos com registro:`, error.message);
                resposta += `Usuário Desconhecido (${id.substring(0, 5)}...): ${dias} dias\n`;
            }
        }
        resposta += '\n'; // Adiciona uma linha em branco para separar as seções
    } else {
        resposta += '✅ Ninguém está inativo há mais de 3 dias (dentre os que já interagiram).\n\n';
    }


    // --- PARTE 2: Identificar "Novatos Silenciosos" (Aqueles que nunca enviaram mensagem) ---
    let rankingData = {};
    if (fs.existsSync(arquivoRanking)) {
        try {
            rankingData = JSON.parse(fs.readFileSync(arquivoRanking, 'utf8'));
        } catch (error) {
            console.error('Erro ao ler ou parsear ranking.json para !inativos:', error);
            if (!resposta.includes('❌ Erro ao carregar dados de *última atividade*.')) { // Evita erro duplicado
                resposta += '❌ Erro ao carregar dados de *ranking de mensagens*.\n';
            }
        }
    }

    const idsQueJaInteragiram = new Set(Object.keys(rankingData));
    const novatosSilenciosos = [];

    const todosParticipantes = chat.participants; // Pega todos os objetos de participantes do grupo

    for (const participant of todosParticipantes) {
        const participantId = participant.id._serialized;
        // Se o participante está no grupo e o ID dele NÃO está no ranking (nunca interagiu)
        if (!idsQueJaInteragiram.has(participantId)) {
            try {
                const contato = await client.getContactById(participantId);
                // Validação robusta para menção
                if (contato && contato.id && typeof contato.id.user === 'string' && typeof contato.id._serialized === 'string' && contato.id._serialized.length > 0 && contato.id._serialized.includes('@c.us')) {
                    novatosSilenciosos.push(contato.id.user);
                    contatosParaMencionar.push(contato); // Adiciona ao array combinado de menções
                } else {
                    console.warn(`[!inativos] Contato problemático na lista de novatos silenciosos: ${participantId}. Ignorando menção.`);
                    novatosSilenciosos.push(`Usuário Desconhecido (${participantId.substring(0, 5)}...)`);
                }
            } catch (error) {
                console.error(`[!inativos] Erro ao buscar contato ${participantId} para novatos silenciosos:`, error.message);
                novatosSilenciosos.push(`Usuário Desconhecido (${participantId.substring(0, 5)}...)`);
            }
        }
    }

    if (novatosSilenciosos.length > 0) {
        resposta += '🤫 *Membros que ainda não enviaram nenhuma mensagem:*\n';
        for (const user of novatosSilenciosos) {
            resposta += `@${user}\n`;
        }
    } else {
        resposta += '🎉 Todos os membros do grupo já enviaram pelo menos uma mensagem!\n';
    }
    
    // Se a resposta final não tem conteúdo além dos erros iniciais, ou está vazia
    if (resposta.trim() === '--- *STATUS DE ATIVIDADE DO GRUPO* ---' || resposta.trim().includes('❌ Erro')) {
        return msg.reply(resposta.trim());
    }

    // Envia a resposta final com as menções combinadas
    await msg.reply(resposta, { mentions: contatosParaMencionar });
};