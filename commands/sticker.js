const { MessageMedia } = require('whatsapp-web.js');

module.exports = async (client, msg) => {
    let messageToProcess = msg;

    // Verificar se está respondendo a uma mensagem com mídia
    if (msg.hasQuotedMsg) {
        try {
            const quotedMsg = await msg.getQuotedMessage();
            if (quotedMsg.hasMedia) {
                messageToProcess = quotedMsg;
            } else {
                await msg.reply('❌ A mensagem citada não contém uma mídia (foto, GIF ou vídeo).');
                return;
            }
        } catch (error) {
            console.error('Erro ao obter mensagem citada:', error);
            await msg.reply('❌ Erro ao processar a mensagem citada.');
            return;
        }
    } else if (!msg.hasMedia) {
        await msg.reply('❌ Por favor, envie uma foto, GIF ou vídeo com o comando `!sticker` ou responda a uma mensagem que contenha mídia.');
        return;
    }

    try {
        // Verificar o tipo de mídia
        const mediaType = messageToProcess.type;
        
        if (mediaType !== 'image' && mediaType !== 'video' && mediaType !== 'gif') {
            await msg.reply('❌ Tipo de mídia não suportado. Use apenas fotos, GIFs ou vídeos.');
            return;
        }

        // Verificar tamanho para vídeos (limite de ~5MB para stickers)
        if (mediaType === 'video' || mediaType === 'gif') {
            const media = await messageToProcess.downloadMedia();
            
            // WhatsApp tem limite de ~500KB para stickers, mas aumentamos para vídeos curtos
            if (media.data.length > 5 * 1024 * 1024) { // 5MB
                await msg.reply('❌ O vídeo/GIF é muito grande para se tornar figurinha. Use vídeos mais curtos (até 5 segundos).');
                return;
            }
            
            // Verificar duração aproximada (se for um vídeo)
            if (mediaType === 'video') {
                await msg.reply('⏳ Convertendo vídeo em figurinha animada...');
            } else {
                await msg.reply('⏳ Convertendo GIF em figurinha animada...');
            }
        }

        // Fazer o download da mídia
        const media = await messageToProcess.downloadMedia();
        
        // Configurações da figurinha
        const stickerOptions = {
            sendMediaAsSticker: true,
            stickerAuthor: 'WhatsApp Bot',
            stickerName: 'Figurinha Criada',
            stickerCategories: ['🤩', '😊'] // Categorias opcionais
        };

        // Enviar como figurinha
        await client.sendMessage(msg.from, media, stickerOptions);

        // Feedback de sucesso
        const successMessages = [
            '✅ Figurinha criada com sucesso!',
            '🎉 Sua figurinha está pronta!',
            '✨ Figurinha criada!',
            '😍 Figurinha feita com sucesso!'
        ];
        
        const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        await msg.reply(randomMessage);

    } catch (error) {
        console.error('Erro ao converter mídia em figurinha:', error);
        
        // Mensagens de erro específicas
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
            await msg.reply('❌ Tempo limite excedido. O vídeo pode ser muito longo ou complexo.');
        } else if (error.message.includes('size') || error.message.includes('large')) {
            await msg.reply('❌ Arquivo muito grande. Tente com uma mídia menor.');
        } else {
            await msg.reply('❌ Não foi possível transformar a mídia em figurinha. Tente novamente com outra mídia!');
        }
    }
};