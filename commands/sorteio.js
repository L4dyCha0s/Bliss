module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    // 1. Verifica se o comando foi usado em um grupo
    if (!chat.isGroup) {
        // Usa msg.reply com o ID da mensagem para citar mesmo em PV, para fins de erro
        await msg.reply('Este comando só funciona em grupos.', null, { quotedMessageId: msg.id._serialized });
        return;
    }

    // 2. Filtra os participantes do grupo (excluindo o próprio bot)
    const participantes = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized)
        .map(p => p.id); // Mapeia para o objeto ID (que contém _serialized e user)

    // 3. Verifica se há participantes suficientes para sortear
    if (participantes.length === 0) {
        // Responde à mensagem original se não houver participantes
        await msg.reply('Não há participantes para sortear neste grupo.', null, { quotedMessageId: msg.id._serialized });
        return;
    }

    // 4. Sorteia um participante aleatoriamente
    const sorteado = participantes[Math.floor(Math.random() * participantes.length)];

    // 5. Obtém o objeto de contato do sorteado para a menção
    let sorteadoContato;
    try {
        sorteadoContato = await client.getContactById(sorteado._serialized);
    } catch (error) {
        console.error(`Erro ao obter contato do sorteado ${sorteado._serialized}:`, error.message);
        // Fallback: se não conseguir obter o contato, envia sem menção ou com ID
        // IMPORTANTE: Aqui também usamos quotedMessageId
        await chat.sendMessage(
            `🎉 Sorteio! Parabéns ao usuário @${sorteado.user}! (Não foi possível marcar diretamente)`,
            { quotedMessageId: msg.id._serialized } // <<< Garante a resposta citando a mensagem
        );
        return;
    }

    // 6. Envia a mensagem de sorteio respondendo à mensagem original
    const textoResposta = `🎉 Sorteio! Parabéns @${sorteado.user}!`;

    await chat.sendMessage(textoResposta, {
        mentions: [sorteadoContato], // Lista de contatos para menção
        quotedMessageId: msg.id._serialized // <<< ESSA É A LINHA CRÍTICA PARA CITAR A MENSAGEM
    });
};