// commands/aprovarsaidinha.js
const fs = require('fs');
const path = require('path');
const { saidinhaState } = require('../gameState');

// Caminho do arquivo para salvar as saidinhas aprovadas
const arquivoSaidinhasAprovadas = path.join(__dirname, '../data', 'saidinhasAprovadas.json');

// Funções auxiliares para ler e salvar JSON (copiadas do seu index.js para manter o comando independente)
function carregarJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content ? JSON.parse(content) : [];
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return [];
        }
    }
    return [];
}

function salvarJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    name: 'aprovarsaidinha',
    description: 'Aprova uma saidinha e a envia para o grupo.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;
        
        // Verifica se a mensagem foi enviada em um grupo
        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        // Verifica se o autor é um administrador
        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('Apenas administradores podem aprovar uma saidinha.');
            return;
        }

        // Verifica se há uma saidinha para aprovar
        if (!saidinhaState.isActive || !saidinhaState.proposalMessage) {
            msg.reply('Não há nenhuma sugestão de saidinha aguardando aprovação no momento.');
            return;
        }

        // Verifica se o comando está respondendo à mensagem correta
        if (!msg.hasQuotedMsg || msg.getQuotedMessage()._data.id._serialized !== saidinhaState.proposalMessage.id._serialized) {
            msg.reply('⚠️ Você deve **responder** à mensagem de sugestão da saidinha para aprová-la.');
            return;
        }

        // Obtém todos os participantes do grupo para marcar
        const allParticipants = chat.participants.filter(p => p.id._serialized !== client.info.wid._serialized);
        const allMentions = allParticipants.map(p => p.id._serialized);

        const saidinhaMessage = `
🎉 *SAIDINHA APROVADA!* 🎉
A sugestão de saidinha foi aprovada e está confirmada!

${saidinhaState.proposalMessage.body}

*Atenção:* Um administrador deve fixar esta mensagem por 48h para manter todos informados.
`;
        
        // Envia a mensagem marcando todos os participantes
        await chat.sendMessage(saidinhaMessage, { mentions: allMentions });

        // --- NOVO: Lógica para registrar a saidinha no JSON ---
        const autorSugestao = await client.getContactById(saidinhaState.authorId);
        const autorAprovacao = await client.getContactById(autorId);

        const novaSaidinha = {
            id: saidinhaState.proposalMessage.id._serialized,
            dataHoraAprovacao: new Date().toISOString(),
            sugestaoPor: {
                id: saidinhaState.authorId,
                nome: autorSugestao.pushname || autorSugestao.name
            },
            aprovadoPor: {
                id: autorId,
                nome: autorAprovacao.pushname || autorAprovacao.name
            },
            conteudo: saidinhaState.proposalMessage.body
        };

        try {
            const saidinhasAtuais = carregarJson(arquivoSaidinhasAprovadas);
            saidinhasAtuais.push(novaSaidinha);
            salvarJson(arquivoSaidinhasAprovadas, saidinhasAtuais);
            console.log(`✅ Nova saidinha aprovada e salva em ${arquivoSaidinhasAprovadas}`);
        } catch (error) {
            console.error('❌ Erro ao salvar a saidinha aprovada:', error);
            msg.reply('❌ Ocorreu um erro ao registrar a saidinha. Verifique o console.');
        }
        // --- FIM DA NOVA LÓGICA ---

        // Limpa o estado após a aprovação
        saidinhaState.isActive = false;
        saidinhaState.authorId = null;
        saidinhaState.proposalMessage = null;
    }
};