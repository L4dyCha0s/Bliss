// commands/sugsaidinha.js
const fs = require('fs');
const path = require('path');

const pendentesPath = path.join(__dirname, '..', 'data', 'saidinhas_pendentes.json');

module.exports = {
    name: 'sugsaidinha',
    description: 'Sugere uma saidinha para aprovação dos ADMs',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            // Verificar se é resposta a uma mensagem
            if (!msg.hasQuotedMsg) {
                return msg.reply('❌ Você precisa responder à mensagem com a ficha preenchida!');
            }

            const quotedMsg = await msg.getQuotedMessage();
            
            // Verificar se a mensagem respondida é do mesmo usuário
            if (quotedMsg.author !== msg.author) {
                return msg.reply('❌ Você só pode sugerir saidinhas com suas próprias fichas!');
            }

            const fichaTexto = quotedMsg.body;
            
            if (!fichaTexto || fichaTexto.length < 100) {
                return msg.reply('❌ A ficha parece incompleta! Preencha todos os campos.');
            }

            // Carregar saidinhas pendentes
            let pendentes = {};
            if (fs.existsSync(pendentesPath)) {
                pendentes = JSON.parse(fs.readFileSync(pendentesPath, 'utf8'));
            }

            const groupId = chat.id._serialized;
            const saidinhaId = Date.now().toString();

            // Obter informações do autor
            const autor = await msg.getContact();
            const autorInfo = {
                id: autor.id._serialized,
                name: autor.name || autor.pushname || autor.number
            };

            // Salvar sugestão pendente
            if (!pendentes[groupId]) {
                pendentes[groupId] = {};
            }

            pendentes[groupId][saidinhaId] = {
                id: saidinhaId,
                texto: fichaTexto,
                autor: autorInfo,
                dataSugestao: new Date().toISOString(),
                status: 'pendente',
                mensagemId: quotedMsg.id._serialized
            };

            fs.writeFileSync(pendentesPath, JSON.stringify(pendentes, null, 2));

            // Marcar administradores
            const admins = chat.participants.filter(p => p.isAdmin);
            const mentions = admins.map(admin => `@${admin.id.user}`).join(' ');

            await msg.reply(
                `✅ *SUGESTÃO DE SAIDINHA ENVIADA!* ${mentions}\n\n` +
                `📋 *Sugerido por:* @${autorInfo.name}\n` +
                `🆔 *ID:* ${saidinhaId}\n\n` +
                `*FICHA:*\n${fichaTexto}\n\n` +
                `👮 *ADMs:* Use !apvsaidinha ${saidinhaId} para aprovar\n` +
                `❌ Ou !repsaidinha ${saidinhaId} [motivo] para reprovar`,
                { mentions: admins.map(admin => admin.id._serialized) }
            );

        } catch (error) {
            console.error('Erro no comando sugsaidinha:', error);
            await msg.reply('❌ Ocorreu um erro ao sugerir a saidinha.');
        }
    }
};