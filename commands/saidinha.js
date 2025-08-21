// commands/saidinha.js
module.exports = {
    name: 'saidinha',
    description: 'Envia um modelo para sugerir um role para o grupo.',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            // Ficha de saidinha simplificada
            const ficha = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📛 *NOME DO ROLE:* 

📅 *DATA:* 

⏰ *HORA:* 

📍 *LOCAL:* 

🏷️ *ESTILO:* 

📝 *DESCRIÇÃO:* 

🚩 *PONTO DE ENCONTRO:* 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `.trim();

            // Instruções separadas
            const instrucoes = `
*COMO SUGERIR UMA SAIDINHA:*

1. *PREECHER A FICHA:* 
   • Copie a ficha acima
   • Preencha TODOS os campos
   • Envie no grupo

2. *SUGERIR PARA APROVAÇÃO:*
   • *Responda* à sua mensagem com a ficha preenchida
   • Use o comando: !sugsaidinha
   • Os ADMs serão marcados automaticamente

3. *CONSULTAR:*
   • !saidinhalist - Ver saidinhas aprovadas
   • !saidinhaspendentes - Ver pendentes (apenas ADMs)

💡 *DICA:* Seja claro e objetivo no preenchimento!
            `.trim();

            // Enviar a ficha primeiro
            await msg.reply(ficha);
            
            // Enviar instruções em mensagem separada
            await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno delay
            await msg.reply(instrucoes);

        } catch (error) {
            console.error('Erro no comando saidinha:', error);
            await msg.reply('❌ Ocorreu um erro ao gerar o formulário de saidinha.');
        }
    }
};