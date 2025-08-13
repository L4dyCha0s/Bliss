// commands/meusigno.js
const fs = require('fs');
const path = require('path');

const signosFilePath = path.join(__dirname, '..', 'data', 'signos.json');

const signosValidos = [
    'aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem',
    'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'
];

module.exports = {
    name: 'meusigno',
    description: 'Salva o seu signo para usar o comando !horoscopo sem precisar digitá-lo.',
    async execute(client, msg) {
        const userId = msg.author || msg.from;
        const args = msg.body.trim().toLowerCase().split(' ').slice(1);
        const signoInput = args[0];

        if (!signoInput || !signosValidos.includes(signoInput)) {
            msg.reply(
                'Por favor, digite um signo válido para salvar. Ex: `!meusigno touro`.\n' +
                'Signos válidos: aries, touro, gemeos, cancer, leao, virgem, libra, escorpiao, sagitario, capricornio, aquario, peixes.'
            );
            return;
        }

        let signosData = {};
        try {
            if (fs.existsSync(signosFilePath)) {
                const data = fs.readFileSync(signosFilePath, 'utf8');
                signosData = JSON.parse(data);
            }
        } catch (e) {
            console.error('Erro ao ler signos.json:', e);
        }

        signosData[userId] = signoInput;
        
        try {
            fs.writeFileSync(signosFilePath, JSON.stringify(signosData, null, 2), 'utf8');
            msg.reply(`✅ Seu signo '${signoInput}' foi salvo com sucesso! Agora você pode usar \`!horoscopo\` sem precisar digitar seu signo.`);
        } catch (e) {
            console.error('Erro ao salvar signos.json:', e);
            msg.reply('❌ Ocorreu um erro ao salvar seu signo. Tente novamente mais tarde.');
        }
    }
};