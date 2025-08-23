const fs = require('fs');
const path = require('path');

// Importação do gameState, que contém o estado e a constante do tempo
const { verdadeOuDesafioState, TIMEOUT_DURATION_VOD } = require('../gameState'); 
const { gerarConteudoComGemini } = require('../serviço-gemini');

const vodHistoricoPath = path.join(__dirname, '..', 'data', 'vod_historico.json');

// Banco de fallback para quando a IA falhar
const PERGUNTAS_FALLBACK = {
    verdade: [
        "Qual foi a última vez que você se masturbou?",
        "Já ficou excitado(a) com alguém deste grupo? Quem?",
        "Qual sua fantasia sexual mais secreta?",
        "Já traiu algum namorado(a)?",
        "Qual a coisa mais vergonhosa que já fez por paixão?",
        "Já mandou nudes para alguém? Para quem?",
        "Qual app de paquera você mais usa?",
        "Já ficou com alguém do trabalho/faculdade escondido?",
        "Qual sua posição sexual favorita?",
        "Já fez sexo em lugar público? Onde?"
    ],
    desafio: [
        "Mande uma mensagem de voz gemendo dramaticamente",
        "Poste uma foto sua de infância no status",
        "Mande um áudio cantando uma música romântica desafinado",
        "Coloque uma foto de um animal fofo como foto de perfil por 1 hora",
        "Mande um áudio imitando um personagem famoso",
        "Poste no status 'Estou grávido(a)' sem contexto",
        "Mande uma mensagem de voz dizendo 'Eu te amo' para 3 contatos aleatórios",
        "Faça uma story fazendo caras e bocas",
        "Mande um áudio contando uma piada ruim",
        "Poste uma letra de música brega no status"
    ]
};

function carregarVodHistorico() {
    try {
        if (fs.existsSync(vodHistoricoPath)) {
            const data = fs.readFileSync(vodHistoricoPath, 'utf8');
            const parsedData = JSON.parse(data);
            return Array.isArray(parsedData) ? parsedData : [];
        }
    } catch (e) {
        console.error('Erro ao carregar ou parsear vod_historico.json:', e);
    }
    return [];
}

function salvarVodHistorico(novaEntrada) {
    let historico = carregarVodHistorico();
    
    historico.unshift(novaEntrada);
    
    const maxEntradas = 100; 
    if (historico.length > maxEntradas) {
        historico = historico.slice(0, maxEntradas);
    }

    try {
        fs.writeFileSync(vodHistoricoPath, JSON.stringify(historico, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar nova entrada no vod_historico.json:', e);
    }
}

// --- Funções de controle de estado OTIMIZADAS ---
function resetVodState() {
    verdadeOuDesafioState.isActive = false;
    verdadeOuDesafioState.currentPlayerId = null;
    verdadeOuDesafioState.currentPlayerContact = null;
    verdadeOuDesafioState.choice = null;
    verdadeOuDesafioState.level = 0;
    clearTimeout(verdadeOuDesafioState.gameTimeout);
    verdadeOuDesafioState.gameTimeout = null;
    verdadeOuDesafioState.nextChooserId = null;
}

function endVodTurn(nextChooserId) {
    verdadeOuDesafioState.isActive = false;
    verdadeOuDesafioState.currentPlayerId = null;
    verdadeOuDesafioState.currentPlayerContact = null;
    verdadeOuDesafioState.choice = null;
    verdadeOuDesafioState.level = 0;
    clearTimeout(verdadeOuDesafioState.gameTimeout);
    verdadeOuDesafioState.gameTimeout = null;
    verdadeOuDesafioState.nextChooserId = nextChooserId;
}
// --- Fim das funções de controle de estado ---

// Função para obter pergunta do fallback aleatoriamente
function obterPerguntaFallback(choice) {
    const perguntas = PERGUNTAS_FALLBACK[choice];
    return perguntas[Math.floor(Math.random() * perguntas.length)];
}

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    const autorId = msg.author || msg.from;
    const autorContact = await client.getContactById(autorId);
    
    const partesMsg = msg.body.trim().toLowerCase().split(' ');
    const args = partesMsg.slice(1);
    let choice = args[0];
    const level = 5; 
    let idMencionadoParaJogar = msg.mentionedIds && msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : null;

    const todosParticipantesIds = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized)
        .map(p => p.id._serialized);

    if (args.length === 0 || !['verdade', 'desafio'].includes(choice)) {
        const helpMessage = `
🎉 *Verdade ou Desafio Digital*! 🎉

Para jogar:
* Use \`!vod [verdade/desafio]\` para iniciar
* Ex: \`!vod verdade\` ou \`!vod desafio @amigo\`

📱 *Desafios Digitais:* Ações que podem ser feitas pelo WhatsApp!
🔥 *Verdades Picantes:* Perguntas ousadas e vergonhosas!

A pessoa terá 5 minutos para responder/realizar!`;
        msg.reply(helpMessage);
        return;
    }

    if (verdadeOuDesafioState.isActive) {
        if (autorId !== verdadeOuDesafioState.currentPlayerId) {
            await msg.reply(
                `O Jogo já está ativo! É a vez de @${verdadeOuDesafioState.currentPlayerContact.id.user} responder o(a) ${verdadeOuDesafioState.choice}.`,
                null,
                { mentions: [verdadeOuDesafioState.currentPlayerContact] }
            );
            return;
        } else {
            endVodTurn(autorId);
            await msg.reply(`✅ Parabéns, @${autorContact.id.user}! Agora você pode desafiar alguém com \`!vod [verdade/desafio] @pessoa\`!`);
            return;
        }
    }
    
    if (verdadeOuDesafioState.nextChooserId && autorId !== verdadeOuDesafioState.nextChooserId) {
        const nextChooserContact = await client.getContactById(verdadeOuDesafioState.nextChooserId);
        await msg.reply(
            `Apenas @${nextChooserContact.id.user} pode iniciar a próxima rodada!`,
            null,
            { mentions: [nextChooserContact] }
        );
        return;
    }

    let sorteadoId;
    let sorteadoContact;

    if (idMencionadoParaJogar) {
        if (!todosParticipantesIds.includes(idMencionadoParaJogar)) {
            msg.reply('Mencione um membro válido do grupo!');
            return;
        }
        if (idMencionadoParaJogar === autorId) {
            msg.reply('Você não pode se desafiar!');
            return;
        }
        sorteadoId = idMencionadoParaJogar;
        sorteadoContact = await client.getContactById(sorteadoId);
    } else {
        const participantesParaSorteio = todosParticipantesIds.filter(id => id !== autorId);
        if (participantesParaSorteio.length === 0) {
            msg.reply('Não há participantes suficientes!');
            return;
        }
        sorteadoId = participantesParaSorteio[Math.floor(Math.random() * participantesParaSorteio.length)];
        sorteadoContact = await client.getContactById(sorteadoId);
    }

    verdadeOuDesafioState.isActive = true;
    verdadeOuDesafioState.currentPlayerId = sorteadoId;
    verdadeOuDesafioState.currentPlayerContact = sorteadoContact;
    verdadeOuDesafioState.choice = choice;
    verdadeOuDesafioState.level = level;
    verdadeOuDesafioState.nextChooserId = null;

    await chat.sendMessage(
        `🎉 *Verdade ou Desafio Digital*! 🎉\n\n` +
        `Sorteado: @${sorteadoContact.id.user}\n` +
        `Escolha: **${choice.toUpperCase()}**\n\n` +
        `Gerando ${choice}...`,
        { mentions: [sorteadoContact] }
    );

    let perguntaGerada;
    try {
        const historicoVod = carregarVodHistorico();
        
        // PROMPTS OTIMIZADOS PARA WHATSAPP
        const prompts = {
            verdade: `Gere uma VERDADE picante/vergonhosa para WhatsApp (máximo 2 linhas). 
            Deve ser ousada mas não explícita. Foco em: histórias vergonhas, segredos sexuais, paixões secretas, traições, fantasias, experiências íntimas.
            Exemplos: "Qual sua pior história de paquera?" "Já ficou com amigo(a) de seu ex?"`,
            
            desafio: `Gere um DESAFIO DIGITAL para WhatsApp (máximo 2 linhas). 
            Deve ser uma ação que pode ser feita pelo celular: enviar áudio, mudar foto, postar status, mandar mensagem, etc.
            Exemplos: "Mande áudio cantando música brega" "Poste status com emoji de coração por 1h"`
        };

        let promptCompleto = `${prompts[choice]} Nível 5 (ousado). Não inclua a palavra "verdade" ou "desafio" na resposta.`;

        if (historicoVod.length > 0) {
            const ultimasPerguntas = historicoVod.slice(0, 10).join(' | ');
            promptCompleto += ` Não repita: ${ultimasPerguntas}`;
        }

        perguntaGerada = await gerarConteudoComGemini(promptCompleto);
        
        // Fallback se a IA gerar algo ruim
        if (!perguntaGerada || perguntaGerada.trim() === '' || perguntaGerada.length > 200) {
            perguntaGerada = obterPerguntaFallback(choice);
        }

    } catch (error) {
        console.error('Erro ao gerar conteúdo:', error);
        perguntaGerada = obterPerguntaFallback(choice);
    }

    // Garantir que a pergunta seja curta
    perguntaGerada = perguntaGerada.trim().substring(0, 150);

    await chat.sendMessage(
        `@${sorteadoContact.id.user}, seu(sua) ${choice}:\n\n` +
        `"${perguntaGerada}"\n\n` +
        `⏰ 5 minutos para responder/realizar!\n` +
        `✅ Use \`!vod\` quando terminar!`,
        { mentions: [sorteadoContact] }
    );

    salvarVodHistorico(perguntaGerada);

    verdadeOuDesafioState.gameTimeout = setTimeout(async () => {
        if (verdadeOuDesafioState.isActive && verdadeOuDesafioState.currentPlayerId === sorteadoId) {
            await chat.sendMessage(
                `⏰ Tempo esgotado para @${sorteadoContact.id.user}! O jogo foi resetado.`,
                { mentions: [sorteadoContact] }
            );
            resetVodState();
        }
    }, TIMEOUT_DURATION_VOD);
};