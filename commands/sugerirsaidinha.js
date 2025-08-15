module.exports = {
    name: 'sugerirsaidinha',
    description: 'Sugere uma saidinha, marcando os administradores para aprovação. Use como resposta a uma ficha preenchida.',
    async execute(client, msg) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Para sugerir uma saidinha, você deve **responder** à mensagem que contém a ficha preenchida com este comando.');
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();
        const autorId = quotedMsg.author || quotedMsg.from;

        let allParticipants = [];
        try {
            allParticipants = await chat.getParticipants();
        } catch (e) {
            console.error('Erro ao obter participantes do grupo:', e);
            msg.reply('❌ Ocorreu um erro ao buscar os participantes do grupo. Por favor, tente novamente.');
            return;
        }
        
        const adms = allParticipants.filter(p => p.isAdmin);

        if (adms.length === 0) {
            msg.reply('Sua sugestão foi recebida, mas não há administradores para aprová-la.');
            return;
        }

        const mentions = adms.map(p => p.id._serialized);
        const autorContact = await client.getContactById(autorId);
        
        mentions.push(autorContact.id._serialized);

        const saidinhaMessage = `📣 **NOVA SAIDINHA PROPOSTA!** 📣
A ficha abaixo foi enviada por @${autorContact.id.user} para aprovação.

-----------------------------------
${quotedMsg.body}
-----------------------------------

Um administrador pode aprovar esta sugestão.
`;
        
        await chat.sendMessage(saidinhasMessage, { mentions: mentions });
        msg.reply('✅ Sua sugestão foi enviada para os administradores.');
    }
};