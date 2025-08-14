const { MessageMedia } = require('whatsapp-web.js');

module.exports = async (client, msg) => {
    let messageToProcess = msg;

    if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            messageToProcess = quotedMsg;
        } else {
            msg.reply('❌ A mensagem citada não contém uma mídia (foto, GIF ou vídeo).');
            return;
        }
    } else if (!msg.hasMedia) {
        msg.reply('❌ Por favor, envie uma foto, GIF ou vídeo com o comando `!figurinha` ou responda a um.');
        return;
    }

    if (messageToProcess.type !== 'image' && messageToProcess.type !== 'video') {
         msg.reply('❌ A mídia deve ser uma foto, GIF ou vídeo.');
         return;
    }

    try {
        const media = await messageToProcess.downloadMedia();
        
        const stickerOptions = {
            sendMediaAsSticker: true,
            stickerAuthor: 'Bliss Bot',
            stickerName: 'Minha Figurinha'
        };

        await client.sendMessage(msg.from, media, stickerOptions);

        // Mensagens de sucesso removidas conforme solicitado
        // console.log(`Figurinha criada com sucesso para: ${msg.from}`);

    } catch (error) {
        console.error('Erro ao converter mídia em figurinha:', error);
        msg.reply('❌ Não foi possível transformar a mídia em figurinha. Tente novamente! (Verifique o tamanho do arquivo)');
    }
};