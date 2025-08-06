const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const arquivoFrasesPersonalizadas = path.join(__dirname, '..', 'data', 'frasesPersonalizadas.json');

// --- Funções Auxiliares para JSON ---
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
// --- Fim das Funções Auxiliares ---

module.exports = async (client, msg) => {
    const userId = msg.author || msg.from; 
    let frasesData = carregarJson(arquivoFrasesPersonalizadas);
    const userContent = frasesData[userId];

    if (userContent) {
        // --- NOVO CÓDIGO AQUI: Lógica para identificar e enviar o conteúdo ---
        
        // --- Adiciona a lógica de menção a todas as mensagens de retorno ---
        const sendOptions = {};
        if (userContent.mentionedIds && userContent.mentionedIds.length > 0) {
            sendOptions.mentions = userContent.mentionedIds;
        }

        if (userContent.type === 'text') {
            // CORREÇÃO: Usando client.sendMessage para poder passar as menções
            await client.sendMessage(msg.from, userContent.content, sendOptions);
        } else if (userContent.type === 'image') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            // Adiciona a legenda e as menções, se existirem
            if (userContent.caption) {
                sendOptions.caption = userContent.caption;
            }
            await client.sendMessage(msg.from, media, sendOptions);
        } else if (userContent.type === 'sticker') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            sendOptions.sendMediaAsSticker = true;
            await client.sendMessage(msg.from, media, sendOptions);
        } else if (userContent.type === 'audio') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            sendOptions.sendMediaAsAudio = true;
            await client.sendMessage(msg.from, media, sendOptions);
        }
        // --- Fim da nova lógica ---
    } else {
        await msg.reply('Você ainda não configurou uma frase para o seu comando !comandosolo.\nUse *!editarcomandosolo sua frase personalizada aqui* para definir uma!');
    }
};