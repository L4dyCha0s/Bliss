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

function salvarJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`Erro ao salvar ${filePath}:`, e);
    }
}
// --- Fim das Funções Auxiliares ---

module.exports = async (client, msg) => {
    if (!msg.hasQuotedMsg) {
        // Se o usuário apenas digitou o comando sem responder a nada
        let frasesData = carregarJson(arquivoFrasesPersonalizadas);
        const userId = msg.author || msg.from;
        
        if (frasesData[userId]) {
            return msg.reply(`⚠️ Você deve **responder** à mensagem que deseja salvar.\nSua frase atual é: "${frasesData[userId].content}"`);
        } else {
            return msg.reply('⚠️ Você ainda não configurou um comando solo. Por favor, **responda** à mensagem que deseja salvar para configurá-la.');
        }
        return;
    }

    const quotedMsg = await msg.getQuotedMessage();
    const userId = msg.author || msg.from;
    
    let frasesData = carregarJson(arquivoFrasesPersonalizadas);
    let contentToSave;

    try {
        if (quotedMsg.type === 'sticker') {
            const media = await quotedMsg.downloadMedia();
            contentToSave = { type: 'sticker', content: media.data, mimetype: media.mimetype };
            await msg.reply('✅ Sua figurinha foi salva com sucesso para o comando !comandosolo.');

        } else if (quotedMsg.type === 'image') {
            const media = await quotedMsg.downloadMedia();
            contentToSave = { type: 'image', content: media.data, mimetype: media.mimetype };
            await msg.reply('✅ Sua foto foi salva com sucesso para o comando !comandosolo.');

        } else if (quotedMsg.type === 'audio' || quotedMsg.type === 'ptt') {
            const media = await quotedMsg.downloadMedia();
            contentToSave = { type: 'audio', content: media.data, mimetype: media.mimetype };
            await msg.reply('✅ Seu áudio foi salvo com sucesso para o comando !comandosolo.');

        } else if (quotedMsg.body) {
            contentToSave = { type: 'text', content: quotedMsg.body };
            await msg.reply('✅ Seu texto foi salvo com sucesso para o comando !comandosolo.');

        } else {
            await msg.reply('⚠️ O tipo de conteúdo da mensagem respondida não pode ser salvo.');
            return;
        }
        
        frasesData[userId] = contentToSave;
        salvarJson(arquivoFrasesPersonalizadas, frasesData);

    } catch (error) {
        console.error('Erro ao editar comando solo:', error);
        await msg.reply('❌ Ocorreu um erro ao tentar salvar o conteúdo.');
    }
};