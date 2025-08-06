const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js'); // Adicionado para enviar mídias

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
        if (userContent.type === 'text') {
            await msg.reply(userContent.content);
        } else if (userContent.type === 'image') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            await client.sendMessage(msg.from, media);
        } else if (userContent.type === 'sticker') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });
        } else if (userContent.type === 'audio') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
            await client.sendMessage(msg.from, media, { sendMediaAsAudio: true });
        }
        // --- Fim da nova lógica ---
    } else {
        await msg.reply('Você ainda não configurou uma frase para o seu comando !comandosolo.\nUse *!editarcomandosolo sua frase personalizada aqui* para definir uma!');
    }
};