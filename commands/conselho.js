const { gerarConteudoComGemini } = require('../serviço-gemini'); // Ajuste o caminho para seu módulo Gemini

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    await msg.reply('🤔 Pensando em um conselho... aguarde um instante!');

    let conselhoGerado;
    try {
        // Prompt para a IA Gemini com o tom desejado
        const prompt = `Gere um conselho curto, divertido e com uma pitada de ousadia ou sarcasmo para um grupo de jovens adultos (20-28 anos). Pense em situações de relacionamentos, vida social, festas, ou dilemas cotidianos com um toque de "fogo adolescente". Não seja vulgar, mas seja direto e com um tom de "amigo dando um toque". Use emojis se quiser.
Exemplos de tom:
- "Se o crush não te responde em 24h, ele não está ocupado, ele está te ignorando. Bola pra frente!"
- "A vida é muito curta pra não mandar aquela indireta bem direta no status."
- "Se a balada tá fraca, seja a balada! 🔥"
- "Nunca confie em quem diz que vai sair 'só uma rapidinha' e volta às 6h da manhã."
- "Se for pra ter arrependimentos, que sejam dos bons e com ótimas histórias pra contar."
O conselho deve ter no máximo 2 frases.`;
            
        conselhoGerado = await gerarConteudoComGemini(prompt);
        
        if (!conselhoGerado || conselhoGerado.trim() === '') {
            conselhoGerado = 'Não foi possível gerar um conselho para você neste momento. Tente novamente!';
        }
    } catch (error) {
        console.error('Erro ao gerar conteúdo com Gemini para !conselho:', error);
        conselhoGerado = 'Houve um erro ao gerar o conselho com a IA. Por favor, tente novamente mais tarde.';
    }

    await chat.sendMessage(`✨ *Conselho do Dia (ou da Noite):*\n\n"${conselhoGerado}"`);
};