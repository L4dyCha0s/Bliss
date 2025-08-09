// commands/saidinha.js
module.exports = {
    name: 'saidinha',
    description: 'Envia um modelo para sugerir um role para o grupo.',
    async execute(client, msg) {
        const helpMessage = `
🎉 *Sugerir uma Saidinha* 🎉

Para sugerir um role, siga os passos:

1.  *Preencha a ficha de saidinha:* Copie, preencha e envie a ficha abaixo no grupo.

    -----------------------------------
    *Nome:* [Dê um nome criativo para o role!]
    *Data:* 
    *Hora:* 
    *Local:* [Onde vamos?]
    *Estilo:* [Ex: Barzinho, Festa, Jantar, Cinema, etc.]
    *Descrição:* [Comente o role em si, anuncie a idéia]
    *Ponto de Encontro:* 
    -----------------------------------

2.  *Sugira a saidinha:* **Responda** à sua própria mensagem com a ficha preenchida e use o comando \`!sugerirsaidinha\`. O bot marcará todos os administradores para aprovação.
`;

        await msg.reply(helpMessage);
    }
};