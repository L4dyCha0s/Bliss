const ms = require('ms');

module.exports = {
    name: 'lembrete',
    description: 'Cria um lembrete para um horário específico. Ex: !lembrete 1h Ligar para o cliente.',
    async execute(client, msg, args) {
        if (args.length < 2) {
            msg.reply('⚠️ Formato incorreto. Use: !lembrete [tempo] [mensagem].\nEx: !lembrete 10m Ligar para o cliente.');
            return;
        }

        const timeString = args[0];
        const reminderMessage = args.slice(1).join(' ');

        // --- ALTERAÇÃO AQUI: Captura os IDs das pessoas mencionadas ---
        const mentionedIds = msg.mentionedIds;

        const timeInMs = ms(timeString);

        if (!timeInMs) {
            msg.reply('⚠️ Tempo inválido. Formatos aceitos: 10s, 5m, 1h, etc.');
            return;
        }

        const scheduledTime = new Date(Date.now() + timeInMs);
        const user = msg.from;

        // --- ALTERAÇÃO AQUI: Confirmação com menção se houver ---
        // Cria um objeto de opções para o envio da mensagem
        const confirmationOptions = {};
        if (mentionedIds && mentionedIds.length > 0) {
            confirmationOptions.mentions = mentionedIds;
        }
        await msg.reply(`✅ Lembrete agendado para o dia ${scheduledTime.toLocaleDateString()} às ${scheduledTime.toLocaleTimeString()}.\n\nLembrete: "${reminderMessage}"`, null, confirmationOptions);

        // Agendamento do lembrete
        setTimeout(async () => {
            // Cria um novo objeto de opções para a mensagem do lembrete
            const reminderOptions = {
                // Passa os IDs dos contatos mencionados
                mentions: mentionedIds
            };
            
            // --- ALTERAÇÃO AQUI: Passa as opções para a função sendMessage ---
            await client.sendMessage(user, `⏰ Lembrete:\n"${reminderMessage}"`, reminderOptions);
        }, timeInMs);
    }
};