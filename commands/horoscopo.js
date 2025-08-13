// commands/horoscopo.js
const fs = require('fs');
const path = require('path');
const { gerarConteudoComGemini } = require('../serviço-gemini');

const signosFilePath = path.join(__dirname, '..', 'data', 'signos.json');

const signosValidos = [
    'aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem',
    'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes'
];

function getSignoSalvo(userId) {
    try {
        if (fs.existsSync(signosFilePath)) {
            const data = fs.readFileSync(signosFilePath, 'utf8');
            const signosData = JSON.parse(data);
            return signosData[userId];
        }
    } catch (e) {
        console.error('Erro ao ler signos.json:', e);
    }
    return null;
}

module.exports = {
    name: 'horoscopo',
    description: 'Gera um horóscopo diário para o seu signo ou para um signo específico.',
    async execute(client, msg) {
        const userId = msg.author || msg.from;
        const args = msg.body.trim().toLowerCase().split(' ').slice(1);
        let signo = args[0];

        // Se o usuário não especificou um signo, verifica se ele tem um salvo
        if (!signo) {
            signo = getSignoSalvo(userId);
            if (!signo) {
                msg.reply(
                    'Por favor, especifique um signo (`!horoscopo leao`) ou salve o seu com `!meusigno [seu_signo]`.'
                );
                return;
            }
        }

        // Verifica se o signo é válido
        if (!signosValidos.includes(signo)) {
            msg.reply(
                `'${signo}' não é um signo válido. Por favor, use um destes: ${signosValidos.join(', ')}.`
            );
            return;
        }

        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        const promptParaIA = `
Gere um horóscopo diário para o signo de ${signo}, para a data de hoje (${dataAtual}).

A previsão deve ser otimista, divertida e descontraída, com um tom de "conselho de amigo". Fale sobre temas como amizade, sorte, amor, trabalho ou vida social, de uma forma que seja apropriada para um grupo de amigos. Não use termos técnicos de astrologia.

A resposta deve ser apenas a previsão, sem introduções como "O horóscopo para ${signo} é...".
`;

        try {
            const horoscopoGerado = await gerarConteudoComGemini(promptParaIA);
            
            const mensagemFinal = `
✨ *HORÓSCOPO DO DIA* ✨

*Signo:* ${signo.charAt(0).toUpperCase() + signo.slice(1)}
*Data:* ${dataAtual}

🔮 ${horoscopoGerado.trim()}
`;

            await msg.reply(mensagemFinal);
        } catch (error) {
            console.error('Erro ao gerar horóscopo com a IA:', error);
            msg.reply('❌ Ocorreu um erro ao gerar o horóscopo. Tente novamente mais tarde.');
        }
    }
};