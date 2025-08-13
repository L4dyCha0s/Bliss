const { tempMutedUsers } = require('../gameState');

module.exports = {
    name: 'mute',
    description: 'Silencia um membro do grupo por um período. Mensagens enviadas serão apagadas. Tempo padrão: 5min. Ex: !mute @membro 10 (10 minutos)',
    async execute(client, msg, args) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;

        if (!chat.isGroup) {
            msg.reply('❌ Este comando só pode ser usado em grupos.');
            return;
        }

        const participant = chat.participants.find(p => p.id._serialized === autorId);
        
        if (!participant || !participant.isAdmin) {
            msg.reply('❌ Apenas administradores do grupo podem usar este comando.');
            return;
        }

        const mentionedIds = msg.mentionedIds;
        if (mentionedIds.length === 0) {
            msg.reply('⚠️ Você precisa marcar o membro que deseja silenciar. Ex: `!mute @membro 5`');
            return;
        }

        const memberToMuteId = mentionedIds[0];
        const memberToMute = await client.getContactById(memberToMuteId);
        
        if (memberToMuteId === client.info.wid._serialized) {
            msg.reply('Eu não posso me silenciar!');
            return;
        }

        // Tempo padrão de 5 minutos
        let durationMinutes = 5;
        if (args[1]) {
            const parsedDuration = parseInt(args[1], 10);
            if (!isNaN(parsedDuration) && parsedDuration > 0) {
                durationMinutes = parsedDuration;
            }
        }
        
        // Define a data/hora de expiração do mute
        const unmuteTime = Date.now() + (durationMinutes * 60 * 1000);
        
        // Registra o usuário no estado do bot
        tempMutedUsers[memberToMuteId] = unmuteTime;

        msg.reply(`✅ @${memberToMute.id.user} foi silenciado(a)`);
        console.log(`Membro ${memberToMute.id.user} silenciado até ${new Date(unmuteTime)}.`);
    }
};