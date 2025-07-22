module.exports = async (client, msg, args = []) => {
  const chat = await msg.getChat();

  // Verifica se está em um grupo
  if (!chat.isGroup) {
    await msg.reply('❌ Este comando só pode ser usado em grupos.');
    return;
  }

  // Verifica se quem enviou é admin
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
    if (contact.id._serialized === client.info.wid._serialized) continue;
    mentions.push(contact);
  }

  if (mentions.length === 0) {
    await msg.reply('❌ Não há membros para mencionar.');
    return;
  }

  // Texto personalizado do usuário
  const textoPersonalizado = args.length > 0
    ? args.join(' ')
    : '🎉🎉🎉 *ATENÇÃO* 🎉🎉🎉 \n\nVocê acaba de *GANHAR* um reluzente *Fiat Uno 2005* com *ESCADA!* no nosso sorteio exclusivo! \nParabéns! 🚗💨 \nFique ligado para mais novidades e sorteios incríveis! \n\nÉ mentira, ganhou nada, sou mitomaniaca e precisava chamar a atenção de todos. Agora vejam a mensagem que eu respondi acima.';

  // Mensagem final, estilo @everyone
  const mensagemFinal = `${textoPersonalizado}\n\n🔔 *@everyone*`;

  // Envia mencionando todos, mas sem mostrar os @
  await chat.sendMessage(mensagemFinal, {
    mentions,
    quotedMessageId: msg.id._serialized
  });
};

