module.exports = {
    name: 'mute',
    description: 'Silencia um membro do grupo por um período de tempo (em horas). Ex: !mute @membro 8',
    async execute(client, msg, args) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;

        if (!chat.isGroup) {
            msg.reply('❌ Este comando só pode ser usado em grupos.');
            return;
        }

        const participant = await chat.getParticipantById(autorId);
        
        if (!participant.isAdmin) {
            msg.reply('❌ Apenas administradores do grupo podem usar este comando.');
            return;
        }

        const mentionedIds = msg.mentionedIds;
        if (mentionedIds.length === 0) {
            msg.reply('⚠️ Você precisa marcar o membro que deseja silenciar. Ex: `!mute @membro 8`');
            return;
        }

        const memberToMuteId = mentionedIds[0];
        const memberToMute = await client.getContactById(memberToMuteId);
        
        if (memberToMuteId === client.info.wid._serialized) {
            msg.reply('Eu não posso me silenciar!');
            return;
        }
        
        let durationHours = 8;
        if (args[1]) {
            const parsedDuration = parseInt(args[1], 10);
            if (!isNaN(parsedDuration) && parsedDuration > 0) {
                durationHours = parsedDuration;
            }
        }
        
        const muteDurationMs = durationHours * 60 * 60 * 1000;
        
        try {
            await chat.mute(muteDurationMs);
            msg.reply(`✅ @${memberToMute.id.user} foi silenciado(a) no grupo por ${durationHours} horas.`);
            console.log(`Membro ${memberToMute.id.user} silenciado por ${durationHours} horas.`);
        } catch (error) {
            console.error('Erro ao silenciar membro:', error);
            msg.reply('❌ Ocorreu um erro ao tentar silenciar o membro.');
        }
    }
};