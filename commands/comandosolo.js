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
        // --- Lógica para identificar e enviar o conteúdo ---
        const sendOptions = {};
        if (userContent.mentionedIds && userContent.mentionedIds.length > 0) {
            sendOptions.mentions = userContent.mentionedIds;
        }

        if (userContent.type === 'text') {
            await client.sendMessage(msg.from, userContent.content, sendOptions);
        } else if (userContent.type === 'image') {
            const media = new MessageMedia(userContent.mimetype, userContent.content);
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
    } else {
        // --- ALTERAÇÃO AQUI: Mensagem mais detalhada ---
        const helpMessage = `
*O que é o Comando Solo?*
É um comando pessoal e único! Ele salva uma mensagem (texto, foto, vídeo, áudio ou figurinha) por pessoa. Quando você usa *!comandosolo*, o bot reenvia sua mídia salva.

*Como definir o seu?*
Use o comando *!editarcomandosolo* respondendo à mensagem que você quer salvar.

_Exemplo:_ Responda a uma foto e use o comando \`!editarcomandosolo\`. A foto será sua mídia solo!`;
        await msg.reply(helpMessage);
    }
};