module.exports = async (client, msg) => {
  const chat = await msg.getChat();
  if (!chat.isGroup) {
    msg.reply('Este comando só funciona em grupos.');
    return;
  }

  const autorId = msg.author || msg.from;

  const participantes = chat.participants
    .filter(p => p.id._serialized !== client.info.wid._serialized && p.id._serialized !== autorId)
    .map(p => p.id._serialized);

  if (participantes.length < 2) {
    msg.reply('Não há participantes suficientes para um match duplo.');
    return;
  }

  const embaralhados = participantes.sort(() => Math.random() - 0.5);
  const [p1Id, p2Id] = [embaralhados[0], embaralhados[1]];

  const autorContato = await client.getContactById(autorId);
  const p1 = await client.getContactById(p1Id);
  const p2 = await client.getContactById(p2Id);

  const compatibilidade = Math.floor(Math.random() * 51) + 50;

  const frases = [
    "Esse trio pode render boas histórias... 🍷",
    "Acho que vocês deviam conversar mais no PV... 💌",
    "Que tal maratonar algo juntes e ver onde vai dar? 🍿",
    "Vocês combinam mais que pão e manteiga. 🧈",
    "Uma noite de karaokê juntos? Eu apoio! 🎤"
  ];

  const sugestao = frases[Math.floor(Math.random() * frases.length)];

  const texto = `💘 Match triplo gerado! @${autorContato.id.user} + @${p1.id.user} + @${p2.id.user}\nCompatibilidade do trio: ${compatibilidade}%\n${sugestao}`;

  await chat.sendMessage(texto, { mentions: [autorContato, p1, p2] });
};
