const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'recusarsaidinha',
    description: 'Recusa uma saidinha pendente. Use como resposta à mensagem de sugestão.',
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
            msg.reply('Apenas administradores podem recusar uma saidinha.');
            return;
        }

        // Verifica se há uma saidinha para recusar
        if (!saidinhasState.isActive || !saidinhasState.proposalMessage) {
            msg.reply('Não há nenhuma sugestão de saidinha aguardando aprovação no momento.');
            return;
        }

        // Verifica se o comando está respondendo à mensagem correta
        const quotedMsg = await msg.getQuotedMessage();
        if (!msg.hasQuotedMsg || quotedMsg.id._serialized !== saidinhaState.proposalMessage.id._serialized) {
            msg.reply('⚠️ Você deve **responder** à mensagem de sugestão da saidinha para recusá-la.');
            return;
        }

        // Obtém o contato do proponente para a menção
        const proponenteContact = await client.getContactById(saidinhasState.authorId);
        const proponenteUser = proponenteContact ? proponenteContact.id.user : saidinhaState.authorId;

        // Envia a mensagem de recusa
        await msg.reply(`❌ A sugestão de saidinha de @${proponenteUser} foi recusada.`, null, {
            mentions: [proponenteContact]
        });
        
        // Limpa o estado da saidinha
        saidinhaState.isActive = false;
        saidinhaState.authorId = null;
        saidinhaState.proposalMessage = null;
    }
};