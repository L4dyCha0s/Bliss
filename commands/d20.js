module.exports = async (client, msg) => {
  const resultado = Math.floor(Math.random() * 20) + 1;
  await msg.reply(`🎲 Você rolou um D20 e caiu: ${resultado}`);
};
