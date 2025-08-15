// commands/aprovarsaidinha.js
const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'aprovarsaidinha',
    description: 'Aprova uma saidinha e a envia para o grupo.',
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
            msg.reply('Apenas administradores podem aprovar uma saidinha.');
            return;
        }

        // Verifica se há uma saidinha para aprovar
        if (!saidinhaState.isActive || !saidinhaState.proposalMessage) {
            msg.reply('Não há nenhuma sugestão de saidinha aguardando aprovação no momento.');
            return;
        }

        // CORREÇÃO AQUI: Obter a mensagem respondida de forma assíncrona
        const quotedMsg = await msg.getQuotedMessage();

        // Verifica se o comando está respondendo à mensagem correta
        if (!msg.hasQuotedMsg || !quotedMsg || quotedMsg.id._serialized !== saidinhaState.proposalMessage.id._serialized) {
            msg.reply('⚠️ Você deve **responder** à mensagem de sugestão da saidinha para aprová-la.');
            return;
        }

        // Obtém todos os participantes do grupo para marcar
        const allParticipants = chat.participants.filter(p => p.id._serialized !== client.info.wid._serialized);
        const allMentions = allParticipants.map(p => p.id._serialized);

        const saidinhaMessage = `🎉 **SAIDINHA APROVADA!** 🎉
A sugestão de saidinha foi aprovada e está confirmada!

${saidinhaState.proposalMessage.body}

*Atenção:* Um administrador deve fixar esta mensagem por 48h para manter todos informados.
`;
        
        // Envia a mensagem marcando todos os participantes e limpa o estado
        await chat.sendMessage(saidinhaMessage, { mentions: allMentions });
        saidinhaState.isActive = false;
        saidinhaState.authorId = null;
        saidinhaState.proposalMessage = null;
    }
};