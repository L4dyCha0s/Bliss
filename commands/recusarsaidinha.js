const { saídas } = require('../gameState');

module.exports = {
    name: 'recusarsaidinha',
    description: 'Recusa um pedido de saidinha pendente.',
    async execute(client, msg) {
        const mentionedId = msg.mentionedIds[0];

        if (!mentionedId) {
            msg.reply('⚠️ Você deve mencionar a pessoa que pediu a saidinha. Ex: `!recusarsaidinha @membro`');
            return;
        }

        const chat = await msg.getChat();
        const groupId = chat.id._serialized;

        if (saídas[groupId] && saídas[groupId][mentionedId]) {
            delete saídas[groupId][mentionedId];
            msg.reply(`✅ O pedido de saidinha de @${mentionedId.split('@')[0]} foi recusado com sucesso.`, null, { mentions: [await client.getContactById(mentionedId)] });
        } else {
            msg.reply('❌ Não há nenhum pedido de saidinha pendente para esta pessoa.');
        }
    }
};