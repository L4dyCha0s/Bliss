module.exports = async (client, msg, args = []) => {
    const chat = await msg.getChat();

    // Verifica se está em um grupo
    if (!chat.isGroup) {
        await msg.reply('❌ Este comando só pode ser usado em grupos.');
        return;
    }

    // Verifica se quem enviou é admin //
    const isAdmin = chat.participants.some(p =>
        (msg.author || msg.from) === p.id._serialized && p.isAdmin
    );

    if (!isAdmin) {
        await msg.reply('❌ Apenas administradores podem usar este comando.');
        return;
    }

    // Coleta todos os membros (exceto o próprio bot)
    const mentions = [];
    for (const participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        if (contact.id._serialized === client.info.wid._serialized) continue; // Pula o próprio bot
        mentions.push(contact);
    }

    if (mentions.length === 0) {
        await msg.reply('❌ Não há membros para mencionar.');
        return;
    }

    let mensagemFinal = '';
    let idMensagemCitada = null;

    // NOVO: Lógica ajustada para a mensagem padrão
    if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        mensagemFinal = `${quotedMsg.body}\n\n🔔 *@everyone*`;
        idMensagemCitada = quotedMsg.id._serialized; // Pega o ID da mensagem citada para responder a ela
    } else if (args.length > 0) {
        // Se não citou, mas passou argumentos, usa os argumentos
        mensagemFinal = `${args.join(' ')}\n\n🔔 *@everyone*`;
        idMensagemCitada = null; // Não há mensagem citada para responder
    } else {
        // Se não citou e não passou argumentos, usa a nova mensagem padrão
        mensagemFinal = '❇️*@everyone* ❇️';
        idMensagemCitada = null; // Não há mensagem citada para responder
    }

    // Envia mencionando todos e respondendo à mensagem original (se houver)
    await chat.sendMessage(mensagemFinal, {
        mentions: mentions,
        quotedMessageId: idMensagemCitada // Reenvia citando a mensagem original
    });
};

