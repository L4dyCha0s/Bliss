// commands/regras.js
module.exports = {
    name: 'regras',
    description: 'Envia as regras e a estrutura dos grupos da comunidade Saidinha.',
    async execute(client, msg) {
        const autorId = msg.author || msg.from;

        const regrasMessage = `
Bem-vindo(a) @${autorId.split('@')[0]} ao Saidinha!

Somos um grupo de amizades e roles por SP. O grupo em si não tem regras, mas tente não infringir o código penal. 😉

Mesmo que possam ser conversados aqui, na comunidade temos subgrupos com temas específicos:

- *Jogos:* Para falar de jogos em geral.
- *Dopamina:* O nosso grupo para enviar fotos de pets fofinhos.
- *Arte e Mídias:* Para conversas sobre arte, moda, cinema, séries e quaisquer outras mídias.
- *Academia:* Para assuntos relacionados a treinos e vida fitness.
- *Comunidade:* O nosso grupo principal para avisos gerais.

Para comandos do bot digite *!help*.
Para mais informações digite *!faq*.
`;
        
        await msg.reply(regrasMessage, null, { mentions: [autorId] });
    }
};