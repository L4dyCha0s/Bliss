const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'recusarsaidinha',
    description: 'Recusa uma saidinha pendente. Use: !recusarsaidinha <id>',
    async execute(client, msg, args) {
        const saidinhaId = args[0];
        const autorId = msg.author || msg.from;
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('Apenas administradores podem recusar uma saidinha.');
            return;
        }

        if (!saidinhasId) {
            msg.reply('⚠️ Você deve fornecer o ID da saidinha que deseja recusar.');
            return;
        }

        const saidinhaIndex = saidinhaState.findIndex(s => s.id === saidinhaId);

        if (saidinhasIndex === -1) {
            msg.reply(`❌ Não há nenhuma sugestão de saidinha com o ID #${saidinhasId} aguardando aprovação.`);
            return;
        }

        const saidinhaRecusada = saidinhaState[saidinhasIndex];

        saidinhaState.splice(saidinhasIndex, 1);

        msg.reply(`✅ A sugestão de saidinha #${saidinhasId} de ${saidinhasRecusada.authorId} foi recusada.`, null, {
            mentions: [saidinhasRecusada.authorId]
        });
    }
};