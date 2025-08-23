// commands/cms.js
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
            const sendOptions = { quotedMessageId: msg.id._serialized };
            
            // CORREÇÃO: Tratamento seguro de menções
            if (userContent.mentionedIds && Array.isArray(userContent.mentionedIds) && userContent.mentionedIds.length > 0) {
                // Filtrar IDs válidos e converter para o formato correto
                const validMentions = userContent.mentionedIds
                    .filter(id => id && typeof id === 'string' && id.includes('@'))
                    .map(id => id.trim());
                
                if (validMentions.length > 0) {
                    sendOptions.mentions = validMentions;
                }
            }

            // CORREÇÃO: Envio seguro por tipo de conteúdo
            if (userContent.type === 'text') {
                await msg.reply(userContent.content, sendOptions);
            } else if (userContent.type === 'image') {
                const media = new MessageMedia(
                    userContent.mimetype, 
                    userContent.content, 
                    userContent.filename || 'image.jpg'
                );
                if (userContent.caption) {
                    sendOptions.caption = userContent.caption;
                }
                // CORREÇÃO: Remover menções problemáticas para mídia
                delete sendOptions.mentions;
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'video') {
                const media = new MessageMedia(
                    userContent.mimetype, 
                    userContent.content, 
                    userContent.filename || 'video.mp4'
                );
                if (userContent.caption) {
                    sendOptions.caption = userContent.caption;
                }
                delete sendOptions.mentions;
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'audio') {
                const media = new MessageMedia(
                    userContent.mimetype, 
                    userContent.content, 
                    userContent.filename || 'audio.ogg'
                );
                sendOptions.sendMediaAsAudio = true;
                delete sendOptions.mentions;
                await client.sendMessage(msg.from, media, sendOptions);
            } else if (userContent.type === 'sticker') {
                const media = new MessageMedia(
                    userContent.mimetype, 
                    userContent.content, 
                    userContent.filename || 'sticker.webp'
                );
                sendOptions.sendMediaAsSticker = true;
                delete sendOptions.mentions;
                await client.sendMessage(msg.from, media, sendOptions);
            }

        } else {
            await msg.reply('❌ Você ainda não definiu um comando solo. Use *!edcms* respondendo a uma mensagem para criar o seu.');
        }

    } catch (error) {
        console.error('Erro no comando cms:', error);
        // Não envia mensagem de erro para manter discreto
    }
};