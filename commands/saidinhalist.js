// commands/saidinhalist.js
const fs = require('fs');
const path = require('path');

const saidinhasFilePath = path.join(__dirname, '..', 'data', 'saidinhasAprovadas.json');

// Função auxiliar para carregar JSON
function carregarJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content ? JSON.parse(content) : {}; 
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return {}; 
        }
    }
    return {}; 
}

module.exports = {
    name: 'saidinhalist',
    description: 'Visualiza um resumo das saidinhas aprovadas, organizadas por data e com os responsáveis.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const groupId = chat.id._serialized;

        const saidinhasData = carregarJson(saidinhasFilePath);
        const saidinhasDoGrupo = saidinhasData[groupId] || [];

        if (saidinhasDoGrupo.length === 0) {
            msg.reply('Não há nenhuma saidinha aprovada para este grupo ainda. Que tal propor uma com `!sugerirsaidinha`?');
            return;
        }

        // 1. Organizar as saidinhas por data cronológica
        saidinhasDoGrupo.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 2. Formatar a lista para a mensagem de resposta
        let mensagem = '📅 *Saidinhas Aprovadas* 📅\n\n';

        saidinhasDoGrupo.forEach(saidinha => {
            const dataFormatada = new Date(saidinha.date).toLocaleDateString('pt-BR');
            mensagem += `🗓️ **Data:** ${dataFormatada}\n`;
            mensagem += `📍 **Local:** ${saidinha.location}\n`;
            mensagem += `🙋 **Responsável(eis):** @${saidinha.authorUser}\n`;
            mensagem += `📝 **Descrição:** ${saidinha.description}\n\n`;
        });

        // 3. Enviar a mensagem para o grupo
        // RECOMENDAÇÃO: A lista de menções agora busca os contatos de forma assíncrona e segura
        const mentionsPromises = saidinhasDoGrupo.map(s => client.getContactById(s.authorId));
        const mentions = await Promise.all(mentionsPromises);

        await msg.reply(mensagem, null, { mentions: mentions });
    }
};