module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    // 1. Rolar o dado de 20 faces (d20)
    const d20Roll = Math.floor(Math.random() * 20) + 1;

    // 2. Definir a Dificuldade do Teste (DT) aleatória
    // O DT será um número entre 5 e 20 para ter uma dificuldade razoável.
    const dificuldadeDoTeste = Math.floor(Math.random() * 16) + 5;

    // 3. Determinar o resultado
    const sucesso = d20Roll >= dificuldadeDoTeste;

    // 4. Montar a mensagem de resposta
    let mensagemResultado;

    if (d20Roll === 20) {
        // Crítico: um 20 sempre é um sucesso, não importa a dificuldade
        mensagemResultado = `🎲 *ROLANDO D20...* Você tirou ${d20Roll}!\n\n` +
                          `🔥 *SUCESSO CRÍTICO!* O teste com Dificuldade ${dificuldadeDoTeste} foi superado de forma espetacular. O destino está ao seu lado!`;
    } else if (d20Roll === 1) {
        // Falha Crítica: um 1 sempre é uma falha, não importa a dificuldade
        mensagemResultado = `🎲 *ROLANDO D20...* Você tirou ${d20Roll}!\n\n` +
                          `💀 *FALHA CRÍTICA!* A Dificuldade do Teste era ${dificuldadeDoTeste}. A tarefa falhou miseravelmente.`;
    } else if (sucesso) {
        // Sucesso normal
        mensagemResultado = `🎲 *ROLANDO D20...* Você tirou ${d20Roll}!\n\n` +
                          `✅ *SUCESSO!* A Dificuldade do Teste era ${dificuldadeDoTeste}. Sua habilidade foi suficiente!`;
    } else {
        // Falha normal
        mensagemResultado = `🎲 *ROLANDO D20...* Você tirou ${d20Roll}!\n\n` +
                          `❌ *FALHA!* A Dificuldade do Teste era ${dificuldadeDoTeste}. Você não conseguiu superar o desafio.`;
    }

    await chat.sendMessage(mensagemResultado);
};