const { gerarConteudoComGemini } = require('../serviço-gemini');

module.exports = {
    name: 'resumo',
    description: 'Faz um resumo engraçado das últimas mensagens do grupo usando o Gemini',

    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            const mensagens = await chat.fetchMessages({ limit: 200 });

            const textos = mensagens
                .filter(msg => msg.body && !msg.body.startsWith('!'))
                .map(msg => `${msg._data.notifyName || msg._data.pushname || 'Usuário'}: ${msg.body}`)
                .reverse()
                .join('\n');

            if (textos.trim().length < 10) {
                return await message.reply('❌ Não há mensagens suficientes para resumir.');
            }

            const prompt = `
Você é um narrador engraçado de grupo de WhatsApp.

Sua missão: resumir o caos das mensagens abaixo em até 10 tópicos engraçados, no estilo de uma retrospectiva cômica. Pode usar emojis, piadinhas, ironia leve e gírias. Não precisa formalidade. Não use cabeçalhos, apenas os tópicos com marcadores tipo 🔸 ou 🤔.

Ignore comandos como !shipp ou !resumo e mensagens genéricas como "bom dia", "kkk", etc.

Mensagens do grupo:
${textos}
            `;

            const resposta = await gerarConteudoComGemini(prompt);
            await message.reply(`🧃 *Fofoca das últimas 200 mensagens resumida:*\n\n${resposta}`);
        } catch (err) {
            console.error('[ERRO RESUMO]', err);
            await message.reply('❌ Ocorreu um erro ao tentar resumir a conversa.');
        }
    }
};







