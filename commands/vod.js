// commands/vod.js
const fs = require('fs');
const path = require('path');

// --- CORREÇÃO AQUI: Importação do gameState ---
const { verdadeOuDesafioState, TIMEOUT_DURATION_VOD } = require('../gameState'); 
const { gerarConteudoComGemini } = require('../serviço-gemini');

const vodHistoricoPath = path.join(__dirname, '..', 'data', 'vod_historico.json');

function carregarVodHistorico() {
    try {
        if (fs.existsSync(vodHistoricoPath)) {
            const data = fs.readFileSync(vodHistoricoPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Erro ao carregar vod_historico.json:', e);
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

// --- Funções de controle de estado (agora no comando) ---
function endCurrentTurn() {
    verdadeOuDesafioState.isActive = false;
    verdadeOuDesafioState.currentPlayerId = null;
    verdadeOuDesafioState.currentPlayerContact = null;
    verdadeOuDesafioState.choice = null;
    verdadeOuDesafioState.level = 0;
    clearTimeout(verdadeOuDesafioState.gameTimeout);
    verdadeOuDesafioState.gameTimeout = null;
}

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
// --- Fim das funções de controle de estado ---


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
🎉 Bem-vindos ao *Verdade ou Desafio*! 🎉

Para jogar:
* Use \`!vod [verdade/desafio]\` para iniciar uma rodada.
    * Ex: \`!vod verdade\`
* Para iniciar o jogo e já marcar alguém para jogar:
    * Ex: \`!vod desafio @[nome da pessoa]\`
* As verdades e desafios são sempre de nível 5 (picantes e ousados!).

A pessoa sorteada/marcada terá um tempo para responder ou realizar. Se ela conseguir, ela ganha o direito de desafiar a próxima pessoa!`;
        msg.reply(helpMessage);
        return;
    }

    if (verdadeOuDesafioState.isActive) {
        if (autorId !== verdadeOuDesafioState.currentPlayerId) {
            await msg.reply(
                `O Jogo "Verdade ou Desafio" já está ativo! É a vez de @${verdadeOuDesafioState.currentPlayerContact.id.user} responder ou realizar o(a) ${verdadeOuDesafioState.choice}.`,
                null,
                { mentions: [verdadeOuDesafioState.currentPlayerContact] }
            );
            return;
        } else {
            verdadeOuDesafioState.nextChooserId = autorId;
            await msg.reply(`Parabéns, @${autorContact.id.user}! Você concluiu seu ${verdadeOuDesafioState.choice}! Agora você pode usar \`!vod [verdade/desafio] @[nova pessoa]\` para desafiar a próxima pessoa!`);
            endCurrentTurn();
            return;
        }
    }
    
    if (verdadeOuDesafioState.nextChooserId && autorId !== verdadeOuDesafioState.nextChooserId) {
        const nextChooserContact = await client.getContactById(verdadeOuDesafioState.nextChooserId);
        await msg.reply(
            `No momento, apenas @${nextChooserContact.id.user} pode iniciar a próxima rodada do Verdade ou Desafio!`,
            null,
            { mentions: [nextChooserContact] }
        );
        return;
    }

    if (!choice || !['verdade', 'desafio'].includes(choice)) {
        msg.reply('Para começar, use `!vod [verdade/desafio]`. Ex: `!vod verdade`.');
        return;
    }

    let sorteadoId;
    let sorteadoContact;

    if (idMencionadoParaJogar) {
        if (!todosParticipantesIds.includes(idMencionadoParaJogar)) {
            msg.reply('A pessoa mencionada não é um participante válido do grupo. Por favor, mencione um membro do grupo para o desafio.');
            return;
        }
        if (idMencionadoParaJogar === autorId) {
            msg.reply('Você não pode se desafiar, desafie outra pessoa!');
            return;
        }
        sorteadoId = idMencionadoParaJogar;
        sorteadoContact = await client.getContactById(sorteadoId);
    } else {
        const participantesParaSorteio = todosParticipantesIds.filter(id => id !== autorId);
        if (participantesParaSorteio.length === 0) {
            msg.reply('Não há outros participantes suficientes no grupo para iniciar o "Verdade ou Desafio".');
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
        `🎉 O Jogo *Verdade ou Desafio* começou! 🎉\n\n` +
        `E a pessoa para jogar é... @${sorteadoContact.id.user}! ` +
        `Sua escolha foi **${choice.toUpperCase()}**.\n\n` +
        `Preparando a pergunta/desafio com a IA...`,
        { mentions: [sorteadoContact] }
    );

    let perguntaGerada;
    try {
        const historicoVod = carregarVodHistorico();
        let promptBase = `Gere uma ${choice} para o jogo "Verdade ou Desafio".`;

        const instrucaoNivel = `O nível é 5 (picante, ousada, direta, safada e no entanto não-explicita. Use insinuações, referências a flertes, beijos, fantasias, crushes secretos, ou situações de balada/conquista de forma sugestiva e divertida, sem termos chulos).`;
        
        let promptCompleto = `${promptBase} ${instrucaoNivel} Não inclua a palavra "verdade" ou "desafio" na resposta.`;

        if (historicoVod.length > 0) {
            const entradasFormatadas = historicoVod.map(e => `"${e.replace(/"/g, '')}"`).join(', ');
            promptCompleto += ` **Não repita nenhuma das seguintes frases:** ${entradasFormatadas}.`;
        }

        perguntaGerada = await gerarConteudoComGemini(promptCompleto);
        
        if (!perguntaGerada || perguntaGerada.trim() === '') {
            perguntaGerada = `Não foi possível gerar uma ${choice} para você neste momento. Tente novamente!`;
        }
    } catch (error) {
        console.error('Erro ao gerar conteúdo com Gemini para Verdade ou Desafio:', error);
        perguntaGerada = `Houve um erro ao gerar a ${choice} com a IA. Por favor, tente novamente mais tarde.`;
    }

    await chat.sendMessage(
        `@${sorteadoContact.id.user}, aqui está seu(sua) ${choice}:\n\n` +
        `"${perguntaGerada.trim()}"\n\n` +
        `Você tem 5 minutos para responder/realizar! Para avisar que terminou, envie \`!vod\`.`,
        { mentions: [sorteadoContact] }
    );

    salvarVodHistorico(perguntaGerada.trim());

    verdadeOuDesafioState.gameTimeout = setTimeout(async () => {
        if (verdadeOuDesafioState.isActive && verdadeOuDesafioState.currentPlayerId === sorteadoId) {
            await chat.sendMessage(
                `Tempo esgotado para o @${sorteadoContact.id.user}! O "Verdade ou Desafio" foi resetado. Qualquer pessoa pode iniciar uma nova rodada com \`!vod [verdade/desafio]\`.`,
                { mentions: [sorteadoContact] }
            );
            resetVodState();
        }
    }, TIMEOUT_DURATION_VOD);
};