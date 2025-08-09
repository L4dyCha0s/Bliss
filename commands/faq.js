// commands/faq.js
module.exports = {
    name: 'faq',
    description: 'Responde às perguntas mais frequentes sobre o grupo.',
    async execute(client, msg) {
        const faqMessage = `
*Perguntas Frequentes (FAQ)*

*Qual a média de idade de vocês?*
A idade varia de 19 a 30 anos.

*Por onde os rolês costumam acontecer?*
Geralmente nas regiões de Centro, Pinheiros, Augusta e Paulista.

*Com que frequência?*
Toda semana, ou na frequência que vocês sugerirem os roles.

*Como mandaram a ficha tão rápido?*
Temos um bot chamado Bliss! Para ver a lista de comandos, digite \`!help\`.

*Vocês todos se conhecem?*
A maioria se conhece, mas como está sempre entrando gente nova, ainda não deu tempo de conhecermos todos.

*Qual a vibe dos roles?*
Geralmente tomamos uma, conversamos, rimos, alguns beijam na boca e por aí vai.
`;
        
        await msg.reply(faqMessage);
    }
};