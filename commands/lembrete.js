// commands/lembrete.js
const ms = require('ms'); // Biblioteca para facilitar a conversão de tempo

module.exports = {
    name: 'lembrete',
    description: 'Cria um lembrete para um horário específico. Ex: !lembrete 1h Fazer compras.',
    async execute(client, msg, args) {
        if (args.length < 2) {
            msg.reply('⚠️ Formato incorreto. Use: !lembrete [tempo] [mensagem].\nEx: !lembrete 10m Ligar para o cliente.');
            return;
        }

        const timeString = args[0];
        const reminderMessage = args.slice(1).join(' ');

        // Converte a string de tempo (ex: '1h', '30m') para milissegundos
        const timeInMs = ms(timeString);

        if (!timeInMs) {
            msg.reply('⚠️ Tempo inválido. Formatos aceitos: 10s, 5m, 1h, etc.');
            return;
        }

        const scheduledTime = new Date(Date.now() + timeInMs);
        const user = msg.from;

        // Confirma para o usuário que o lembrete foi agendado
        msg.reply(`✅ Lembrete agendado para o dia ${scheduledTime.toLocaleDateString()} às ${scheduledTime.toLocaleTimeString()}.\n\nLembrete: "${reminderMessage}"`);

        // Agendamento do lembrete
        setTimeout(async () => {
            // Envia a mensagem de lembrete para o chat original
            await client.sendMessage(user, `⏰ Lembrete:\n"${reminderMessage}"`);
        }, timeInMs);
    }
};