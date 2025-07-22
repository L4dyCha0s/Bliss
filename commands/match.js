// Ajuste o caminho conforme a localização de gameState.js em relação à pasta 'commands'
// Se gameState.js está na raiz e 'commands' está na raiz, use '../gameState'
const { jogoDoMatchState } = require('../gameState');

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    const autorId = msg.author || msg.from;
    const autorContato = await client.getContactById(autorId);

    let alvoId; // ID da pessoa para o match, pode ser mencionada ou sorteada

    // Obtém todos os participantes do grupo (excluindo o bot) para validação
    const todosParticipantesIds = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized)
        .map(p => p.id._serialized);

    if (todosParticipantesIds.length < 2) {
        msg.reply('Não há participantes suficientes neste grupo para gerar um match.');
        return;
    }

    // --- LÓGICA DE CONTROLE DO JOGO DO MATCH ---
    if (jogoDoMatchState.isActive) {
        // Se o Jogo do Match está ativo...
        if (autorId === jogoDoMatchState.currentChooserId) {
            // ...e o autor da mensagem É a pessoa sorteada:
            if (!msg.mentionedIds || msg.mentionedIds.length === 0) {
                msg.reply('Como você é a pessoa sorteada no Jogo do Match, você deve usar `!match @[nome da pessoa que você quer]` para revelar seu match!');
                return; // Bloqueia o match aleatório se for o sorteado e não mencionar
            }

            const idMencionado = msg.mentionedIds[0];

            // Valida se a pessoa mencionada é um participante válido, não é o bot e não é o próprio autor
            if (todosParticipantesIds.includes(idMencionado) && idMencionado !== client.info.wid._serialized && idMencionado !== autorId) {
                alvoId = idMencionado;
                // A escolha foi feita! Limpa o estado do jogo e o timeout.
                clearTimeout(jogoDoMatchState.chooserTimeout);
                jogoDoMatchState.isActive = false;
                jogoDoMatchState.currentChooserId = null;
                jogoDoMatchState.currentChooserContact = null;
                jogoDoMatchState.chooserTimeout = null;

                // Mensagem de confirmação específica para o Jogo do Match
                await chat.sendMessage(`🎉 @${autorContato.id.user} revelou seu match no Jogo do Match! 🎉`, { mentions: [autorContato] });

            } else if (idMencionado === autorId) {
                msg.reply('Você não pode escolher a si mesmo no Jogo do Match! Por favor, escolha outra pessoa.');
                return;
            } else {
                msg.reply('A pessoa mencionada não é um participante válido do grupo. Por favor, mencione um membro do grupo para o seu match.');
                return;
            }
        } else {
            // ...e o autor da mensagem NÃO É a pessoa sorteada:
            await msg.reply(`O Jogo do Match está ativo! Apenas @${jogoDoMatchState.currentChooserContact.id.user} pode usar o \`!match\` agora para revelar seu par.`, null, { mentions: [jogoDoMatchState.currentChooserContact] });
            return; // Bloqueia o !match para todos os outros
        }
    } else {
        // --- LÓGICA EXISTENTE PARA O COMANDO !match NORMAL (aleatório ou direcionado) ---
        // Se o Jogo do Match NÃO está ativo, o comando !match funciona como de costume.

        // Filtra participantes para o sorteio: exclui o bot e a pessoa que usou o comando
        const participantesParaSorteio = todosParticipantesIds.filter(id => id !== autorId);

        if (participantesParaSorteio.length === 0) {
            msg.reply('Não há outros participantes suficientes para fazer um match neste grupo.');
            return;
        }

        // Verifica se a mensagem contém menções para match direcionado
        if (msg.mentionedIds && msg.mentionedIds.length > 0) {
            const idMencionado = msg.mentionedIds[0];

            if (participantesParaSorteio.includes(idMencionado) && idMencionado !== client.info.wid._serialized) { // Já exclui o autor
                alvoId = idMencionado;
            } else if (idMencionado === autorId) {
                 msg.reply('Você não pode fazer match consigo mesmo. Tente mencionar outra pessoa!');
                 return;
            } else {
                msg.reply('A pessoa mencionada não é um participante válido do grupo. Gerando match aleatório...');
                // Fallback para aleatório se a menção for inválida
                alvoId = undefined;
            }
        }

        // Se não houver alvoId definido (sem menção válida), sorteia aleatoriamente
        if (!alvoId) {
            alvoId = participantesParaSorteio[Math.floor(Math.random() * participantesParaSorteio.length)];
        }
    }

    // Garante que temos um alvoId válido antes de prosseguir
    if (!alvoId) {
        msg.reply('Não foi possível determinar um alvo para o match. Tente novamente.');
        return;
    }

    const alvoContato = await client.getContactById(alvoId);

    // Gera compatibilidade entre 10% e 100%
    const compatibilidade = Math.floor(Math.random() * 91) + 10;

    let sugestaoFrase = '';

    // Define a frase com base na porcentagem de compatibilidade
    if (compatibilidade >= 10 && compatibilidade <= 29) { // 10-29%
        sugestaoFrase = "Hmm, acho que vocês deveriam sair na mão. A Stella aposta 2 reais na segunda pessoa do @! 😉";
    } else if (compatibilidade >= 30 && compatibilidade <= 49) { // 30-49%
        sugestaoFrase = "Pode ser que existam algumas diferenças, mas quem sabe um bom papo não resolve? 🤔";
    } else if (compatibilidade >= 50 && compatibilidade <= 69) { // 50-69%
        sugestaoFrase = "Uma combinação razoável! Talvez vocês tenham mais em comum do que imaginam. ✨";
    } else if (compatibilidade >= 70 && compatibilidade <= 89) { // 70-89%
        sugestaoFrase = "Uau! Uma ótima compatibilidade! Vocês deveriam tentar algo juntos. 😍";
    } else if (compatibilidade >= 90 && compatibilidade <= 96) { // 70-89%
        sugestaoFrase = "Uau! Uma compatibilidade quase perfeita, por pouco a Stella não aprova o casal! Mas vocês deveriam tentar algo juntos. 😍";
    } else if (compatibilidade >= 97 && compatibilidade <= 100) { // 90-100%
        sugestaoFrase = "Combinação P-E-R-F-E-I-T-A! \nUma dupla digna de histórias épicas e românticas! \nConforme as regras do grupo vocês vão ter que se beijar... Além disso, a Stella aprova o casal!! 💫💜";
    }

    const texto = `💘 Match gerado!\n@${autorContato.id.user} + @${alvoContato.id.user}\n\nCompatibilidade: ${compatibilidade}%\n\n${sugestaoFrase}`;

    await chat.sendMessage(texto, { mentions: [autorContato, alvoContato] });
};