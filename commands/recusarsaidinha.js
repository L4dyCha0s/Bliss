const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'recusarsaidinha',
    description: 'Recusa uma saidinha pendente. Use: `!recusarsaidinha <id>`',
    async execute(client, msg, args) {
        const saidinhaId = args[0];
        const autorId = msg.author || msg.from;

        const chat = await msg.getChat();
        
        // Verifica se a mensagem foi enviada em um grupo
        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        // Verifica se o autor é um administrador
        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('❌ Apenas administradores podem recusar saidinhas.');
            return;
        }

        // Verifica se o ID foi fornecido
        if (!saidinhaId) {
            msg.reply('⚠️ Você deve fornecer o ID da saidinha que deseja recusar. Use `!saidinhalist` para ver a lista.');
            return;
        }

        // Busca a saidinha pelo ID no array de pendentes
        const saidinhaIndex = saidinhaState.findIndex(s => s.id === saidinhaId);

        if (saidinhaIndex === -1) {
            msg.reply(`❌ Não há nenhuma sugestão de saidinha com o ID #${saidinhaId} aguardando aprovação.`);
            return;
        }

        const saidinhaRecusada = saidinhaState[saidinhaIndex];

        // Remove a saidinha do array
        saidinhaState.splice(saidinhaIndex, 1);

        // Mensagem de confirmação simplificada
        const authorContact = await client.getContactById(saidinhaRecusada.authorId);
        msg.reply(`✅ A saidinha #${saidinhaId} sugerida por @${authorContact.id.user} foi recusada.`, null, { 
            mentions: [authorContact] 
        });
    }
};