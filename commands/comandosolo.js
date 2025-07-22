// commands/comandosolo.js
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
// --- Fim das Funções Auxiliares ---

module.exports = async (client, msg) => {
    // CORREÇÃO AQUI: Usa msg.author para grupos e msg.from para PV
    const userId = msg.author || msg.from; 

    let frasesData = carregarJson(arquivoFrasesPersonalizadas);

    if (frasesData[userId]) {
        await msg.reply(frasesData[userId]);
    } else {
        await msg.reply('Você ainda não configurou uma frase para o seu comando !comandosolo.\nUse *!editarcomandosolo sua frase personalizada aqui* para definir uma!');
    }
};