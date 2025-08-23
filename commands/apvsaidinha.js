// commands/apvsaidinha.js
const fs = require('fs');
const path = require('path');

const pendentesPath = path.join(__dirname, '..', 'data', 'saidinhas_pendentes.json');
const saidinhasPath = path.join(__dirname, '..', 'data', 'saidinhas.json');

module.exports = {
    name: 'apvsaidinha',
    description: 'Aprova uma saidinha pendente',
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
                return msg.reply('❌ Apenas administradores podem aprovar saidinhas!');
            }

            if (!args[0]) {
                return msg.reply('❌ Use: !apvsaidinha <ID_DA_SAIDINHA>');
            }

            const saidinhaId = args[0];

            // Carregar dados
            let pendentes = {};
            let saidinhas = {};
            
            if (fs.existsSync(pendentesPath)) {
                pendentes = JSON.parse(fs.readFileSync(pendentesPath, 'utf8'));
            }
            if (fs.existsSync(saidinhasPath)) {
                saidinhas = JSON.parse(fs.readFileSync(saidinhasPath, 'utf8'));
            }

            const groupId = chat.id._serialized;
            const saidinha = pendentes[groupId] && pendentes[groupId][saidinhaId];

            if (!saidinha) {
                return msg.reply('❌ Saidinha não encontrada!');
            }

            // Mover para aprovadas
            if (!saidinhas[groupId]) {
                saidinhas[groupId] = {};
            }

            saidinha.status = 'aprovada';
            saidinha.dataAprovacao = new Date().toISOString();
            saidinha.aprovador = {
                id: sender.id._serialized,
                name: sender.name || sender.pushname || sender.number
            };

            saidinhas[groupId][saidinhaId] = saidinha;

            // Remover das pendentes
            delete pendentes[groupId][saidinhaId];

            // Salvar alterações
            fs.writeFileSync(pendentesPath, JSON.stringify(pendentes, null, 2));
            fs.writeFileSync(saidinhasPath, JSON.stringify(saidinhas, null, 2));

            // Anunciar para o grupo todo
            const participantes = chat.participants.map(p => p.id._serialized);
            const titulo = saidinha.texto.split('*NOME DO ROLE:*')[1]?.split('\n')[0]?.trim() || 'Saída em Grupo';

            await client.sendMessage(
                msg.from,
                `🎉 *SAIDINHA APROVADA!* 🎉\n\n` +
                `📛 ${titulo}\n` +
                `👤 Organizador: @${saidinha.autor.name}\n` +
                `✅ Aprovado por: @${saidinha.aprovador.name}\n\n` +
                `${saidinha.texto}\n\n` +
                `🗓️ *Data da aprovação:* ${new Date().toLocaleDateString('pt-BR')}\n` +
                `💚 *Divirta-se galera!*`,
                { mentions: participantes }
            );

        } catch (error) {
            console.error('Erro no comando apvsaidinha:', error);
            await msg.reply('❌ Ocorreu um erro ao aprovar a saidinha.');
        }
    }
};