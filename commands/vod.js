const fs = require('fs');
const path = require('path');

const { verdadeOuDesafioState, TIMEOUT_DURATION_VOD } = require('../gameState'); // Ajuste o caminho
const { gerarConteudoComGemini } = require('../serviço-gemini'); // Ajuste o caminho para seu módulo Gemini

// Caminho do arquivo para salvar as perguntas/desafios já usados
const vodHistoricoPath = path.join(__dirname, '..', 'data', 'vod_historico.json');

// Função para carregar o histórico de VOD
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

// Função para salvar uma nova verdade/desafio no histórico
function salvarVodHistorico(novaEntrada) {
    let historico = carregarVodHistorico();
    
    // Adiciona a nova entrada ao início da lista
    historico.unshift(novaEntrada);
    
    // Limita o número de entradas salvas (ex: últimas 100)
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

// Função para resetar o estado do jogo VOD
function resetVodState() {
    verdadeOuDesafioState.isActive = false;
    verdadeOuDesafioState.currentPlayerId = null;
    verdadeOuDesafioState.currentPlayerContact = null;
    verdadeOuDesafioState.choice = null;
    verdadeOuDesafioState.level = 0;
    clearTimeout(verdadeOuDesafioState.gameTimeout); // Limpa qualquer timeout ativo
    verdadeOuDesafioState.gameTimeout = null;
    verdadeOuDesafioState.nextChooserId = null; // Reseta o próximo desafiante
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
    let choice = args[0]; // 'verdade' ou 'desafio'
    let level = parseInt(args[1]); // Nível de 1 a 5
    let idMencionadoParaJogar = msg.mentionedIds && msg.mentionedIds.length > 0 ? msg.mentionedIds[0] : null;

    const todosParticipantesIds = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized)
        .map(p => p.id._serialized);

    // --- Lógica de ajuda e ativação do jogo ---
    if (args.length === 0 || (args.length === 1 && !['verdade', 'desafio'].includes(choice))) {
        const helpMessage = `
🎉 Bem-vindos ao *Verdade ou Desafio*! 🎉

Para jogar:
* Use \`!vod [verdade/desafio] [nível 1-5]\` para iniciar uma rodada.
    * Ex: \`!vod verdade 3\` (para uma verdade de nível médio)
    * Ex: \`!vod desafio 5\` (para um desafio super ousado)
* Para iniciar o jogo e já marcar alguém para jogar a primeira rodada:
    * Ex: \`!vod verdade 5 @[nome da pessoa]\`
* Níveis: 1 (bem leve) a 5 (mais ousado, mas divertido!).

A pessoa sorteada/marcada terá um tempo para responder ou realizar. Se ela conseguir, ela ganha o direito de desafiar a próxima pessoa!`;
        msg.reply(helpMessage);
        return;
    }

    // --- Lógica de controle do jogo ativo ---
    if (verdadeOuDesafioState.isActive) {
        if (autorId !== verdadeOuDesafioState.currentPlayerId) {
            await msg.reply(
                `O Jogo "Verdade ou Desafio" já está ativo! É a vez de @${verdadeOuDesafioState.currentPlayerContact.id.user} responder ou realizar o(a) ${verdadeOuDesafioState.choice}.`,
                null,
                { mentions: [verdadeOuDesafioState.currentPlayerContact] }
            );
            return;
        } else {
            // Se o jogador atual tenta iniciar o jogo novamente, isso significa que ele respondeu.
            // Concede a ele o direito de ser o "próximo desafiante".
            verdadeOuDesafioState.nextChooserId = autorId;
            await msg.reply(`Parabéns, @${autorContact.id.user}! Você concluiu seu ${verdadeOuDesafioState.choice}! Agora você pode usar \`!vod [verdade/desafio] [nível 1-5] @[nova pessoa]\` para desafiar a próxima pessoa!`);
            resetVodState(); // Reseta o estado do jogo, mas mantém nextChooserId
            return;
        }
    }
    
    // --- Validação para quem pode iniciar o jogo ---
    if (verdadeOuDesafioState.nextChooserId && autorId !== verdadeOuDesafioState.nextChooserId) {
        const nextChooserContact = await client.getContactById(verdadeOuDesafioState.nextChooserId);
        await msg.reply(
            `No momento, apenas @${nextChooserContact.id.user} pode iniciar a próxima rodada do Verdade ou Desafio!`,
            null,
            { mentions: [nextChooserContact] }
        );
        return;
    }

    // --- Validação dos argumentos para iniciar o jogo (novo ou pelo nextChooserId) ---
    if (!choice || !['verdade', 'desafio'].includes(choice)) {
        msg.reply('Para começar, use `!vod [verdade/desafio] [nível 1-5]`. Ex: `!vod verdade 3` ou `!vod desafio 5`.');
        return;
    }
    if (isNaN(level) || level < 1 || level > 5) {
        msg.reply('O nível deve ser um número entre 1 e 5. Ex: `!vod verdade 3`.');
        return;
    }

    // --- Determina quem será o jogador (sorteado ou marcado) ---
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

    // Atualiza o estado do jogo
    verdadeOuDesafioState.isActive = true;
    verdadeOuDesafioState.currentPlayerId = sorteadoId;
    verdadeOuDesafioState.currentPlayerContact = sorteadoContact;
    verdadeOuDesafioState.choice = choice;
    verdadeOuDesafioState.level = level;
    verdadeOuDesafioState.nextChooserId = null; // Reseta o próximo desafiante ao iniciar uma nova rodada

    // Explicação do jogo e sorteio/marcação
    await chat.sendMessage(
        `🎉 O Jogo *Verdade ou Desafio* começou! 🎉\n\n` +
        `E a pessoa para jogar é... @${sorteadoContact.id.user}! ` +
        `Sua escolha foi **${choice.toUpperCase()}** no nível ${level}.\n\n` +
        `Preparando a pergunta/desafio para o nível ${level} com a IA...`,
        { mentions: [sorteadoContact] }
    );

    let perguntaGerada;
    try {
        const historicoVod = carregarVodHistorico();
        let promptBase = `Gere uma ${choice} para o jogo "Verdade ou Desafio".`;
        let instrucaoNivel;

        switch (level) {
            case 1:
                instrucaoNivel = `O nível é 1 (muito leve, totalmente inocente e divertido, para todas as idades).`;
                break;
            case 2:
                instrucaoNivel = `O nível é 2 (leve, divertido, talvez um pouco constrangedor mas nada demais).`;
                break;
            case 3:
                instrucaoNivel = `O nível é 3 (médio, pode ser um pouco pessoal, divertido, mas ainda apropriado para a maioria dos grupos).`;
                break;
            case 4:
                instrucaoNivel = `O nível é 4 (ousado, íntimo, talvez um pouco picante ou com duplo sentido, mas nunca explícito. Focado em flerte, crushes, ou situações de festa).`;
                break;
            case 5:
                instrucaoNivel = `O nível é 5 (bastante íntimo, sexual, ou promíscuo, mas *sem ser explícito ou vulgar*. Use insinuações, referências a flertes, beijos, fantasias, crushes secretos, ou situações de balada/conquista de forma sugestiva e divertida, sem termos chulos).`;
                break;
            default:
                instrucaoNivel = `O nível é ${level} (padrão).`;
        }

        let promptCompleto = `${promptBase} ${instrucaoNivel} Não inclua a palavra "verdade" ou "desafio" na resposta.`;

        // Adiciona a instrução para não repetir perguntas anteriores
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

    // Envia a pergunta/desafio gerada pela IA
    await chat.sendMessage(
        `@${sorteadoContact.id.user}, aqui está seu(sua) ${choice} (Nível ${level}):\n\n` +
        `"${perguntaGerada.trim()}"\n\n` +
        `Você tem ${TIMEOUT_DURATION_VOD / 1000 / 60} minutos para responder/realizar! Para avisar que terminou, envie \`!vod\`.`,
        { mentions: [sorteadoContact] }
    );

    // Salva a pergunta/desafio gerada para evitar repetição futura
    salvarVodHistorico(perguntaGerada.trim());

    // Define o timeout para a resposta do jogador
    verdadeOuDesafioState.gameTimeout = setTimeout(async () => {
        if (verdadeOuDesafioState.isActive && verdadeOuDesafioState.currentPlayerId === sorteadoId) {
            await chat.sendMessage(
                `Tempo esgotado para o @${sorteadoContact.id.user}! O "Verdade ou Desafio" foi resetado. Alguém pode iniciar uma nova rodada com \`!vod [verdade/desafio] [nível 1-5]\`.`,
                { mentions: [sorteadoContact] }
            );
            resetVodState(); // Reseta tudo, incluindo nextChooserId
        }
    }, TIMEOUT_DURATION_VOD);
};