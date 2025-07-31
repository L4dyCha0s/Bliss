module.exports = {
    name: 'mute',
    description: 'Silencia um membro do grupo por um período de tempo (em horas). Tempo padrão: 1h. Ex: !mute @membro 3',
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
            msg.reply('⚠️ Você precisa marcar o membro que deseja silenciar. Ex: `!mute @membro 1`');
            return;
        }

        const memberToMuteId = mentionedIds[0];
        const memberToMute = await client.getContactById(memberToMuteId);
        
        if (memberToMuteId === client.info.wid._serialized) {
            msg.reply('Eu não posso me silenciar!');
            return;
        }
        
        // --- ALTERAÇÃO AQUI: TEMPO PADRÃO MUDOU PARA 1 HORA ---
        let durationHours = 1;
        if (args[1]) {
            const parsedDuration = parseInt(args[1], 10);
            if (!isNaN(parsedDuration) && parsedDuration > 0) {
                durationHours = parsedDuration;
            }
        }
        
        const muteDurationMs = durationHours * 60 * 60 * 1000;
        
        try {
            // --- CORREÇÃO FINAL AQUI ---
            // Passa a duração em milisegundos (um número)
            await chat.mute(muteDurationMs);
            msg.reply(`✅ @${memberToMute.id.user} foi silenciado(a) no grupo por ${durationHours} horas.`);
            console.log(`Membro ${memberToMute.id.user} silenciado por ${durationHours} horas.`);
        } catch (error) {
            console.error('Erro ao silenciar membro:', error);
            msg.reply('❌ Ocorreu um erro ao tentar silenciar o membro.');
        }
    }
};