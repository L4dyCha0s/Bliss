module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    const autorId = msg.author || msg.from; // Quem enviou o comando
    const autorContact = await client.getContactById(autorId);

    const mentionedIds = msg.mentionedIds; // IDs das pessoas mencionadas

    // 1. Validação do número de pessoas mencionadas
    if (!mentionedIds || mentionedIds.length < 2 || mentionedIds.length > 4) {
        msg.reply('Para usar o !shipp, você precisa mencionar entre 2 a 4 pessoas para shippar! Ex: `!shipp @Pessoa1 @Pessoa2`');
        return;
    }

    // 2. Filtrar para garantir que são participantes do grupo e não o bot
    const participantesDoGrupo = chat.participants.map(p => p.id._serialized);
    const shippadosIds = [];
    const shippadosContacts = [];

    for (const id of mentionedIds) {
        // Ignora o bot ou qualquer ID que não seja um participante real do grupo
        if (id === client.info.wid._serialized) {
            msg.reply(`O bot não pode ser shippado! Por favor, mencione apenas membros do grupo.`);
            return; // Interrompe se o bot for mencionado
        }
        if (id === autorId) {
            msg.reply(`Você não pode se incluir no shipp! Mencione apenas outras pessoas.`);
            return; // Interrompe se o autor for mencionado
        }
        if (participantesDoGrupo.includes(id)) {
            shippadosIds.push(id);
            shippadosContacts.push(await client.getContactById(id));
        }
    }

    // Se após a filtragem não houver pessoas suficientes para shippar
    if (shippadosIds.length < 2) {
        msg.reply('Não foi possível shippar! Certifique-se de mencionar 2 a 4 membros válidos do grupo, excluindo você e o bot.');
        return;
    }

    // 3. Gerar a combinação de nomes para o shipp
    let shippNomes = shippadosContacts.map(c => `@${c.id.user}`);
    let shippString;

    if (shippNomes.length === 2) {
        shippString = `${shippNomes[0]} e ${shippNomes[1]}`;
    } else if (shippNomes.length === 3) {
        shippString = `${shippNomes[0]}, ${shippNomes[1]} e ${shippNomes[2]}`;
    } else if (shippNomes.length === 4) {
        shippString = `${shippNomes[0]}, ${shippNomes[1]}, ${shippNomes[2]} e ${shippNomes[3]}`;
    } else {
        // Caso inesperado, mas para segurança
        msg.reply('Ocorreu um erro ao formar o shipp. Tente novamente.');
        return;
    }

    // 4. Calcular a compatibilidade (apenas uma porcentagem aleatória, como no !match)
    const compatibilidade = Math.floor(Math.random() * 91) + 10; // Entre 10% e 100%

    let sugestaoFrase = '';
    // Definir a frase com base na porcentagem de compatibilidade (reutilizando sua lógica)
    if (compatibilidade >= 10 && compatibilidade <= 29) {
        sugestaoFrase = "Hmm, acho que esses deveriam sair na mão. A Stella aposta 2 reais na segunda pessoa do @! 😉";
    } else if (compatibilidade >= 30 && compatibilidade <= 49) {
        sugestaoFrase = "Pode ser que existam algumas diferenças, mas quem sabe um bom papo não resolve? 🤔";
    } else if (compatibilidade >= 50 && compatibilidade <= 69) {
        sugestaoFrase = "Uma combinação razoável! Talvez tenham mais em comum do que imaginam. ✨";
    } else if (compatibilidade >= 70 && compatibilidade <= 89) {
        sugestaoFrase = "Uau! Uma ótima compatibilidade! Esses deveriam tentar algo juntos. 😍";
    } else if (compatibilidade >= 90 && compatibilidade <= 96) {
        sugestaoFrase = "Uau! Uma compatibilidade quase perfeita, por pouco a Stella não aprova o shipp! Mas eles deveriam tentar algo juntos. 😍";
    } else if (compatibilidade >= 97 && compatibilidade <= 100) {
        sugestaoFrase = "Combinação P-E-R-F-E-I-T-A! \nUma equipe digna de histórias épicas e românticas! \nConforme as regras do grupo, eles vão ter que se beijar... Além disso, a Stella aprova o shipp!! 💫💜";
    }

    const texto = `💖 *Novo Shipp Gerado!* 💖\n\n` +
                 `O shipp de ${shippString} tem uma compatibilidade de: *${compatibilidade}%*!\n\n` +
                 `${sugestaoFrase}`;

    await chat.sendMessage(texto, { mentions: shippadosContacts.map(c => c.id._serialized) });

    console.log(`Shipp gerado para: ${shippNomes.join(', ')}`);
};