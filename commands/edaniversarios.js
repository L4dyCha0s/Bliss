const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'aniversarios.json');

function salvarAniversarios(aniversarios) {
    // Salva a string como um JSON válido
    fs.writeFileSync(filePath, JSON.stringify(aniversarios, null, 2), 'utf8');
}

module.exports = {
    name: 'edaniversarios',
    description: 'Edita a lista universal de aniversários.',
    async execute(client, msg, args) {
        const novaFrase = args.join(' ');

        if (!novaFrase) {
            msg.reply('⚠️ Por favor, forneça o texto para a nova lista de aniversários. Ex: `!edaniversarios Aniversários:\n - João: 01/01`');
            return;
        }
        
        salvarAniversarios(novaFrase);
        
        msg.reply('✅ Lista de aniversários atualizada com sucesso!');
    }
};