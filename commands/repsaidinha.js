// commands/repsaidinha.js
const fs = require('fs');
const path = require('path');

const pendentesPath = path.join(__dirname, '..', 'data', 'saidinhas_pendentes.json');

module.exports = {
    name: 'repsaidinha',
    description: 'Reprova uma saidinha pendente',
    async execute(client, msg, args) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            // Verificar se é administrador
            const sender = await msg.getContact();
            const isAdmin = chat.participants.find(p => 
                p.id._serialized === sender.id._serialized && p.isAdmin
            );

            if (!isAdmin) {
                return msg.reply('❌ Apenas administradores podem reprovar saidinhas!');
            }

            if (!args[0]) {
                return msg.reply('❌ Use: !repsaidinha <ID_DA_SAIDINHA> [motivo]');
            }

            const saidinhaId = args[0];
            const motivo = args.slice(1).join(' ') || 'Motivo não especificado';

            // Carregar pendentes
            let pendentes = {};
            if (fs.existsSync(pendentesPath)) {
                pendentes = JSON.parse(fs.readFileSync(pendentesPath, 'utf8'));
            }

            const groupId = chat.id._serialized;
            const saidinha = pendentes[groupId] && pendentes[groupId][saidinhaId];

            if (!saidinha) {
                return msg.reply('❌ Saidinha não encontrada!');
            }

            // Notificar o autor
            try {
                await client.sendMessage(
                    saidinha.autor.id,
                    `❌ *SAIDINHA REPROVADA*\n\n` +
                    `Sua saidinha foi reprovada pelos administradores.\n` +
                    `📛 Título: ${saidinha.texto.split('*NOME DO ROLE:*')[1]?.split('\n')[0]?.trim() || 'Não especificado'}\n` +
                    `📅 Data de envio: ${new Date(saidinha.dataSugestao).toLocaleDateString('pt-BR')}\n` +
                    `❌ Motivo: ${motivo}\n\n` +
                    `💡 Dica: Verifique se preencheu todos os campos corretamente e tente novamente!`
                );
            } catch (error) {
                console.error('Erro ao notificar autor:', error);
            }

            // Remover das pendentes
            delete pendentes[groupId][saidinhaId];
            fs.writeFileSync(pendentesPath, JSON.stringify(pendentes, null, 2));

            await msg.reply(`✅ Saidinha reprovada e autor notificado!`);

        } catch (error) {
            console.error('Erro no comando repsaidinha:', error);
            await msg.reply('❌ Ocorreu um erro ao reprovar a saidinha.');
        }
    }
};