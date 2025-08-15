const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'sugerirsaidinha',
    description: 'Sugere uma saidinha respondendo à ficha preenchida.',
    async execute(client, msg) {
        const chat = await msg.getChat();

        // 1. CORREÇÃO: Verifica se a mensagem foi enviada em um grupo
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

        // 2. CORREÇÃO: Gera um ID único e adiciona ao array 'saidinhaState' (nome correto)
        const saidinhaId = Date.now().toString();

        const novaSaidinha = {
            id: saidinhaId,
            authorId: autorId,
            proposalMessage: quotedMsg.body,
            groupId: chat.id._serialized
        };
        saidinhaState.push(novaSaidinha); // Erro de digitação 'saidinhasState' corrigido

        // 3. CORREÇÃO: Usa try-catch para buscar os participantes de forma segura
        let allParticipants = [];
        try {
            allParticipants = await chat.getParticipants();
        } catch (e) {
            console.error('Erro ao obter participantes do grupo:', e);
            msg.reply('❌ Ocorreu um erro ao buscar os participantes do grupo. A saidinha foi cancelada.');
            // Remove a saidinha que foi adicionada
            saidinhaState.splice(saidinhaState.findIndex(s => s.id === saidinhaId), 1);
            return;
        }
        
        const adms = allParticipants.filter(p => p.isAdmin && p.id._serialized !== client.info.wid._serialized);
        
        if (adms.length === 0) {
            await msg.reply('Sua sugestão foi recebida, mas não há outros administradores para aprová-la. A saidinha foi cancelada.');
            saidinhaState.splice(saidinhaState.findIndex(s => s.id === saidinhaId), 1);
            return;
        }

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