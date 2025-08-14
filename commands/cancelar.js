// commands/cancelar.js
const { gerarConteudoComGemini } = require('../serviço-gemini');

module.exports = {
    name: 'cancelar',
    description: 'Cancela humoristicamente uma pessoa com base em uma mensagem. Apenas para entretenimento.',
    async execute(client, msg) {
        // Verifica se o comando foi usado respondendo a uma mensagem
        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Para cancelar alguém, você precisa responder à mensagem da pessoa com `!cancelar`!');
            return;
        }

        // Obtém a mensagem respondida
        const quotedMsg = await msg.getQuotedMessage();
        const originalMessageText = quotedMsg.body;

        // Gera o prompt para a IA
        const promptParaIA = `
Você é um usuário ávido do twitter e usa gírias jovens tendências do momento. Quero que problematize a seguinte fala: "${originalMessageText}". Responda com no máximo 2 frases.
`;

        // Chama a IA para gerar o conteúdo
        let cancelamentoTexto;
        try {
            cancelamentoTexto = await gerarConteudoComGemini(promptParaIA);
        } catch (error) {
            console.error('Erro ao gerar conteúdo de cancelamento com a IA:', error);
            cancelamentoTexto = `Ops, o cancelamento falhou! A IA se recusou a cooperar.`;
        }

        // A mensagem final é apenas o emoji + o texto gerado
        const mensagemFinal = `❌ ${cancelamentoTexto.trim()}`;
        
        // CORREÇÃO: Responde diretamente à mensagem original em vez de enviar uma nova no chat
        await quotedMsg.reply(mensagemFinal);
    }
};