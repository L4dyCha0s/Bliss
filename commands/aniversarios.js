const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'aniversarios.json');

function carregarAniversarios() {
    if (fs.existsSync(filePath)) {
        try {
            // A frase está armazenada como uma string em JSON
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return "O arquivo de aniversários não foi encontrado ou está com erro. Por favor, crie-o na pasta data/aniversarios.json.";
        }
    }
    return "O arquivo de aniversários não foi encontrado. Por favor, crie-o na pasta data/aniversarios.json.";
}

module.exports = {
    name: 'aniversarios',
    description: 'Envia a lista de aniversários do grupo.',
    async execute(client, msg) {
        const aniversarios = carregarAniversarios();
        msg.reply(aniversarios);
    }
};