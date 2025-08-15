const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'sugerirsaidinha',
    description: 'Sugere uma saidinha respondendo à ficha preenchida.',
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
        const autorId = msg.author || msg.from;

        // NOVO: Gera um ID único para esta saidinha
        const saidinhaId = Date.now().toString();

        // NOVO: Cria um objeto para a saidinha e o adiciona ao array
        const novaSaidinha = {
            id: saidinhaId,
            authorId: autorId,
            proposalMessage: quotedMsg.body,
            groupId: chat.id._serialized
        };
        saidinhaState.push(novaSaidinha);
        
        // Filtra e pega o ID dos administradores
        const allParticipants = await chat.getParticipants();
        const adms = allParticipants.filter(p => p.isAdmin && p.id._serialized !== client.info.wid._serialized);
        
        if (adms.length === 0) {
            await msg.reply('Sua sugestão foi recebida, mas não há outros administradores para aprová-la. A saidinha foi cancelada.');
            saidinhaState.splice(saidinhaState.findIndex(s => s.id === saidinhaId), 1);
            return;
        }

        // Constrói a mensagem para os adms
        const mentions = adms.map(p => p.id._serialized);
        const autorContact = await client.getContactById(autorId);

        let message = `
⚠️ Sugestão de Saidinha enviada por @${autorContact.id.user}! ⚠️
ID do Pedido: #${saidinhaId}

-----------------------------------
${quotedMsg.body}
-----------------------------------

Um administrador pode aprovar esta sugestão com \`!aprovarsaidinha ${saidinhaId}\` ou recusar com \`!recusarsaidinha ${saidinhaId}\`.
`;
        
        await chat.sendMessage(message, { mentions: [...mentions, autorContact.id._serialized] });
    }
};