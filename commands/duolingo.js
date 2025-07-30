module.exports = {
    name: 'duolingo',
    description: 'Envia um lembrete para os usuários marcados fazerem a lição do Duolingo.',
    async execute(client, msg) {
        // Pega a lista de IDs de todos os usuários marcados na mensagem
        const taggedUsers = msg.mentionedIds;

        // Se nenhum usuário foi marcado, o bot responde com a instrução de uso
        if (taggedUsers.length === 0) {
            msg.reply('⚠️ Para lembrar alguém de fazer o Duolingo, você precisa marcá-lo(s). Ex: `!duolingo @pessoa1 @pessoa2`');
            return;
        }

        // Constrói a mensagem de lembrete.
        // O `taggedUsers` já é uma array de IDs que o `msg.reply` saberá como mencionar.
        const message = 'Não se esqueçam de fazer sua lição do Duolingo do dia! 🦉';
        
        // Envia a mensagem, marcando todos os usuários que foram marcados na mensagem original
        // `reply` aceita a opção `mentions` para enviar as menções corretamente.
        await msg.reply(message, null, { mentions: taggedUsers });
        
        console.log(`Lembrete de Duolingo enviado para: ${taggedUsers.join(', ')}`);
    }
};