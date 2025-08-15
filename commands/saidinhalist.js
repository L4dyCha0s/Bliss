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
    description: 'Visualiza as saidinhas aprovadas para este grupo.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const groupId = chat.id._serialized;

        const saidinhasData = carregarJson(saidinhasFilePath);
        const saidinhasDoGrupo = saidinhasData[groupId] || [];

        if (saidinhasDoGrupo.length === 0) {
            msg.reply('Não há nenhuma saidinha aprovada para este grupo ainda.');
            return;
        }

        // Ordena as saidinhas por data de aprovação (da mais antiga para a mais nova)
        saidinhasDoGrupo.sort((a, b) => new Date(a.approvedDate) - new Date(b.approvedDate));

        let mensagem = '📅 *Saidinhas Aprovadas* 📅\n\n';
        const mentions = [];

        for (const saidinha of saidinhasDoGrupo) {
            const dataAprovacao = new Date(saidinha.approvedDate).toLocaleDateString('pt-BR');
            const autorContact = await client.getContactById(saidinha.authorId);
            const autorPushname = autorContact ? autorContact.pushname : 'Desconhecido';
            
            mensagem += `✅ *Aprovada em:* ${dataAprovacao}\n`;
            mensagem += `🙋 *Proponente:* @${autorContact.id.user} (${autorPushname})\n`;
            mensagem += `📝 *Proposta:* ${saidinha.proposalMessage}\n\n`;

            if (autorContact) {
                mentions.push(autorContact);
            }
        }
        
        await msg.reply(mensagem, null, { mentions: mentions });
    }
};