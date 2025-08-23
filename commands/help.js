module.exports = async (client, msg) => {
  const nome = msg._data.notifyName || msg._data.notifyFormattedName || 'amigue';

  const helpText = `Olá ${nome}, eu sou e Bliss, bot do grupo! 🤖✨

Para falar comigo use !bliss. (Sou uma IA para interações leves)

💘Match's:

*!match (+@)* - *!matchduplo*
*!matchpoli (se inclui)*
*!seduzir + @* 
*!shipp + (até 4)@*

🎮Jogos:

*!jogodomatch*
*!maisprovavel*
*!vod*

🍹Saidinhas:

*!saidinha*
*!saidinhalist*

🪄Utilitários (funciona no pv):

*!aniversarios*
*!cancelar*
*!citações*
*!cms* (comandosolo)
*!conselho* 
*!d20* - *!d20dt* - *!d6*
*!duolingo*
*!faq*
*!fanfic* (até 5 @)
*!ficha*
*!fofoca*
*!horoscopo*
*!lembrete*
*!meusigno*
*!ranking* 
*!resumo* 
*!sorteio* 
*!sticker* 

Para mais informações ou sugestões, fale com os adms ou com a Stella.💬

By Stella BOTs LTDA 💜`;

  msg.reply(helpText);
};
