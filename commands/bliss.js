const { gerarConteudoComGemini } = require('../serviço-gemini');

module.exports = {
    name: 'bliss',
    description: 'Converse com a IA Bliss (via Gemini)',
    async execute(client, message, args) {
        try {
            const pergunta = args.join(' ');
            if (!pergunta) {
                return await message.reply('💬 Use: *!bliss [sua pergunta ou mensagem]*');
            }

            const prompt = `
Você é uma IA chamada Bliss, divertida e muito inteligente. Sua personalidade é de um cientista bem calculista.
Responda à pergunta abaixo de forma clara, útil e com leveza. Use emojis quando fizer sentido, e mantenha o tom semi-amigável:
Tente não falar muito, mande a mensagem de forma clara e resumida. Tente não ultrapassar 8 linhas de texto para não criar um texto enorme na mensagem.


Usuário: ${pergunta}
            `;

            const resposta = await gerarConteudoComGemini(prompt);
            await message.reply(resposta);
        } catch (err) {
            console.error('[ERRO BLISS]', err);
            await message.reply('❌ Ocorreu um erro ao tentar conversar com a IA Bliss.');
        }
    }
};



