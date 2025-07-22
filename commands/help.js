module.exports = async (client, msg) => {
  const nome = msg._data.notifyName || msg._data.notifyFormattedName || 'amigue';

  const helpText = `Olá ${nome}, eu sou e Bliss, bot do grupo! 🤖✨

Para falar comigo use !bliss. (Sou uma IA para interações leves)

💘Match's:

*!match (+@)* 
*!matchduplo*
*!matchpoli (se inclui)* 
*!shipp + (até 4)@*
*!seduzir + @* 

🎮Jogos:

*!vod*
*!jogodomatch*
*!maisprovavel*

🪄Utilitários:

*!d6*
*!d20*
*!d20dt*
*!sorteio* 
*!comandosolo* 
*!ficha*  
*!ranking* 
*!resumo* 
*!citações*
*!conselho* 
*!sticker* 
*!sorteio* 
*!seduzir* 

Para mais informações ou sugestões, fale com os adms ou com a Stella.💬

(o uso do Bliss em grupos que não o SAIDINHA é livre por apenas R$15,00)

By Stella BOTs LTDA 💜`;

  msg.reply(helpText);
};
