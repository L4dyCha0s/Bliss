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

function salvarJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Erro ao salvar ${filePath}:`, e);
        return false;
    }
}

module.exports = async (client, msg) => {
    try {
        const userId = msg.author || msg.from;
        
        // Verificar se é resposta a uma mensagem
        if (!msg.hasQuotedMsg) {
            return await msg.reply('❌ *Responda* a uma mensagem (texto, imagem, vídeo, áudio ou figurinha) para definir seu comando solo!');
        }

        const quotedMsg = await msg.getQuotedMessage();
        const contact = await msg.getContact();
        const userName = contact.name || contact.pushname || 'Usuário';

        let frasesData = carregarJson(arquivoFrasesPersonalizadas);
        let contentData = {};

        // Processar mensagem de texto
        if (quotedMsg.type === 'chat') {
            contentData = {
                type: 'text',
                content: quotedMsg.body,
                mentionedIds: quotedMsg.mentionedIds || [],
                dataCriacao: new Date().toISOString(),
                autor: userName
            };

        // Processar mensagem de imagem
        } else if (quotedMsg.type === 'image') {
            const media = await quotedMsg.downloadMedia();
            contentData = {
                type: 'image',
                content: media.data,
                mimetype: media.mimetype,
                filename: quotedMsg.filename || 'image.jpg',
                caption: quotedMsg.caption || '',
                dataCriacao: new Date().toISOString(),
                autor: userName
            };

        // Processar mensagem de vídeo
        } else if (quotedMsg.type === 'video') {
            const media = await quotedMsg.downloadMedia();
            contentData = {
                type: 'video',
                content: media.data,
                mimetype: media.mimetype,
                filename: quotedMsg.filename || 'video.mp4',
                caption: quotedMsg.caption || '',
                dataCriacao: new Date().toISOString(),
                autor: userName
            };

        // Processar mensagem de áudio
        } else if (quotedMsg.type === 'audio' || quotedMsg.type === 'ptt') {
            const media = await quotedMsg.downloadMedia();
            contentData = {
                type: 'audio',
                content: media.data,
                mimetype: media.mimetype,
                filename: quotedMsg.filename || 'audio.ogg',
                dataCriacao: new Date().toISOString(),
                autor: userName
            };

        // Processar mensagem de figurinha
        } else if (quotedMsg.type === 'sticker') {
            const media = await quotedMsg.downloadMedia();
            contentData = {
                type: 'sticker',
                content: media.data,
                mimetype: media.mimetype,
                filename: quotedMsg.filename || 'sticker.webp',
                dataCriacao: new Date().toISOString(),
                autor: userName
            };

        } else {
            return await msg.reply('❌ Tipo de mensagem não suportado! Use texto, imagem, vídeo, áudio ou figurinha.');
        }

        // Salvar dados do usuário
        frasesData[userId] = contentData;
        
        if (salvarJson(arquivoFrasesPersonalizadas, frasesData)) {
            await msg.reply(`✅ *Comando solo definido com sucesso!*

📦 *Tipo:* ${contentData.type.toUpperCase()}
👤 *Por:* ${userName}
📅 *Data:* ${new Date().toLocaleString('pt-BR')}

Agora use *!cms* para executar seu comando solo personalizado!`);
        } else {
            await msg.reply('❌ Erro ao salvar seu comando solo. Tente novamente!');
        }

    } catch (error) {
        console.error('Erro no comando edcms:', error);
        await msg.reply('❌ Ocorreu um erro ao definir seu comando solo. Tente novamente!');
    }
};