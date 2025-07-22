// commands/editarcomandosolo.js
const fs = require('fs');
const path = require('path');

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
    // CORREÇÃO AQUI: Usa msg.author para grupos e msg.from para PV
    const userId = msg.author || msg.from; 
    
    const novaFrase = msg.body.trim().substring('!editarcomandosolo'.length).trim();

    let frasesData = carregarJson(arquivoFrasesPersonalizadas);

    if (!novaFrase) {
        if (frasesData[userId]) {
            return msg.reply(`Sua frase atual para o comando !comandosolo é:\n"${frasesData[userId]}"\n\nPara alterar, use: *!editarcomandosolo sua nova frase aqui*`);
        } else {
            return msg.reply('Você ainda não configurou uma frase para o seu comando !comandosolo.\nUse: *!editarcomandosolo sua frase personalizada aqui*');
        }
    }

    frasesData[userId] = novaFrase;
    salvarJson(arquivoFrasesPersonalizadas, frasesData);

    await msg.reply(`✅ Sua frase personalizada para o comando *!comandosolo* foi atualizada com sucesso para:\n"${novaFrase}"`);
};