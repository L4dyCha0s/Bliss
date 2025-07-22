// commands/figurinha.js
const { MessageMedia } = require('whatsapp-web.js');

module.exports = async (client, msg) => {
    // Verifica se a mensagem original (ou uma citada) é uma imagem
    // Isso permite que o usuário responda a uma imagem existente com "!figurinha"
    let quotedMsg = await msg.getQuotedMessage();
    let messageToProcess = msg;

    if (quotedMsg && quotedMsg.hasMedia && quotedMsg.type === 'image') {
        messageToProcess = quotedMsg;
    } else if (!msg.hasMedia || msg.type !== 'image') {
        // Se a mensagem não é uma imagem e não está citando uma imagem
        msg.reply('❌ Por favor, envie uma imagem com o comando `!sticker` ou responda a uma imagem com este comando.');
        return;
    }

    try {
        msg.reply('⌛ Convertendo imagem em figurinha...');

        // Pega a mídia da mensagem (imagem)
        const media = await messageToProcess.downloadMedia();

        // Envia a mídia como figurinha (sticker)
        // O "sticker: true" é o que faz a mágica!
        await client.sendMessage(msg.from, media, {
            sendMediaAsSticker: true,
            // Opcional: Adicionar um nome para a figurinha (autor/pacote)
            stickerAuthor: 'Bliss Bot',
            stickerName: 'Minha Figurinha'
        });

        console.log(`Figurinha criada com sucesso para: ${msg.from}`);

    } catch (error) {
        console.error('Erro ao converter imagem em figurinha:', error);
        msg.reply('❌ Não foi possível transformar a imagem em figurinha. Tente novamente!');
    }
};