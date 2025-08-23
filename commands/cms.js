const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const arquivoFrasesPersonalizadas = path.join(__dirname, '..', 'data', 'frasesPersonalizadas.json');

function carregarJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return {};
        }
    }
    return {};
}

module.exports = async (client, msg) => {
    try {
        const userId = msg.author || msg.from; 
        let frasesData = carregarJson(arquivoFrasesPersonalizadas);
        const userContent = frasesData[userId];

        if (userContent && userContent.content) {
            const sendOptions = {};
            
            // Configurar como resposta à mensagem original
            sendOptions.quotedMessageId = msg.id._serialized;
            
            if (userContent.mentionedIds && Array.isArray(userContent.mentionedIds) && userContent.mentionedIds.length > 0) {
                sendOptions.mentions = userContent.mentionedIds;
            }

            if (userContent.type === 'text') {
                await msg.reply(userContent.content, sendOptions);
            } else if (userContent.type === 'image') {
                const media = new MessageMedia(userContent.mimetype, userContent.content, userContent.filename);
                if (userContent.caption) {
                    sendOptions.caption = userContent.caption;
                }
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'video') {
                const media = new MessageMedia(userContent.mimetype, userContent.content, userContent.filename);
                if (userContent.caption) {
                    sendOptions.caption = userContent.caption;
                }
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'audio') {
                const media = new MessageMedia(userContent.mimetype, userContent.content, userContent.filename);
                sendOptions.sendMediaAsAudio = true;
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'sticker') {
                const media = new MessageMedia(userContent.mimetype, userContent.content, userContent.filename);
                sendOptions.sendMediaAsSticker = true;
                await client.sendMessage(msg.from, media, sendOptions);
            }

        } else {
            // Mensagem apenas se não tiver comando definido
            await msg.reply('❌ Você ainda não definiu um comando solo. Use *!edcms* respondendo a uma mensagem para criar o seu.');
        }

    } catch (error) {
        console.error('Erro no comando cms:', error);
        // Não envia mensagem de erro para manter discreto
    }
};