module.exports = {
    name: 'unmute',
    description: 'Remove o silêncio de um membro do grupo. Ex: !unmute @membro',
    async execute(client, msg, args) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;

        if (!chat.isGroup) {
            msg.reply('❌ Este comando só pode ser usado em grupos.');
            return;
        }

        // --- CORREÇÃO FINAL AQUI ---
        // Acessa a propriedade 'participants' do objeto chat para encontrar o autor
        const participants = chat.participants;
        const participant = participants.find(p => p.id._serialized === autorId);
        
        if (!participant || !participant.isAdmin) {
            msg.reply('❌ Apenas administradores do grupo podem usar este comando.');
            return;
        }
        // --- FIM DA CORREÇÃO ---

        const mentionedIds = msg.mentionedIds;
        if (mentionedIds.length === 0) {
            msg.reply('⚠️ Você precisa marcar o membro que deseja remover o silêncio. Ex: `!unmute @membro`');
            return;
        }

        const memberToUnmuteId = mentionedIds[0];
        const memberToUnmute = await client.getContactById(memberToUnmuteId);
        
        try {
            await chat.unmute(memberToUnmuteId);
            msg.reply(`✅ O silêncio de @${memberToUnmute.id.user} foi removido.`);
            console.log(`Silêncio de ${memberToUnmute.id.user} removido.`);
        } catch (error) {
            console.error('Erro ao remover o silêncio do membro:', error);
            msg.reply('❌ Ocorreu um erro ao tentar remover o silêncio do membro.');
        }
    }
};