module.exports = async (client, msg) => {
  const resultado = Math.floor(Math.random() * 6) + 1;
  await msg.reply(`🎲 Você rolou um D6 e caiu: ${resultado}`);
};
