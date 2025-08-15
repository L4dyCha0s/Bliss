const { saidinhaState } = require('../gameState');
const fs = require('fs');
const path = require('path');

const saidinhasFilePath = path.join(__dirname, '..', 'data', 'saidinhasAprovadas.json');

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

function salvarJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    name: 'aprovarsaidinha',
    description: 'Aprova uma saidinha e a envia para o grupo.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;

        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('Apenas administradores podem aprovar uma saidinha.');
            return;
        }
        
        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Você deve **responder** à mensagem de sugestão da saidinha para aprová-la.');
            return;
        }
        
        const saidinhaMessageId = (await msg.getQuotedMessage()).id._serialized;
        
        // Verifica se a saidinha que está sendo respondida é a que está pendente no estado
        if (!saidinhasState.isActive || saidinhaMessageId !== saidinhaState.proposalMessageId) {
            msg.reply('Não há nenhuma sugestão de saidinha aguardando aprovação no momento ou você não está respondendo à mensagem correta.');
            return;
        }

        const saidinhaAprovada = saidinhaState.proposal;

        // CORREÇÃO AQUI: Bloco try-catch para lidar com erros ao obter participantes
        let allParticipants = [];
        try {
            allParticipants = await chat.getParticipants();
        } catch (e) {
            console.error('Erro ao obter participantes do grupo:', e);
            msg.reply('❌ Ocorreu um erro ao buscar os participantes do grupo. A saidinha não pode ser aprovada.');
            return;
        }

        // Filtra e mapeia os participantes de forma segura
        const allMentions = allParticipants.filter(p => p && p.id && p.id._serialized).map(p => p.id._serialized);

        const saidinhaMessage = `
🎉🎉 **SAIDINHA APROVADA!** 🎉🎉
A sugestão de saidinha foi aprovada e está confirmada!

${saidinhasAprovada.proposalMessage.body}

*Atenção:* Um administrador deve fixar esta mensagem por 48h para manter todos informados.
`;
        
        await chat.sendMessage(saidinhasMessage, { mentions: allMentions });

        const saidinhasData = carregarJson(saidinhasFilePath);
        const groupId = chat.id._serialized;

        if (!saidinhasData[groupId]) {
            saidinhasData[groupId] = [];
        }
        
        const ficha = saidinhaAprovada.proposal; // Já temos a ficha no estado
        
        const saidinhaSalva = {
            id: saidinhaMessageId,
            authorId: saidinhaState.authorId,
            authorUser: saidinhaState.proposal.authorUser,
            date: ficha.data,
            time: ficha.hora,
            location: ficha.local,
            description: ficha.descricao,
            approvedDate: new Date().toISOString()
        };

        saidinhasData[groupId].push(saidinhasSalva);
        salvarJson(saidinhasFilePath, saidinhasData);

        saidinhaState.isActive = false;
        saidinhaState.authorId = null;
        saidinhasState.proposal = null;
        saidinhasState.proposalMessageId = null;

        msg.reply('✅ Saidinha aprovada com sucesso e enviada ao grupo.');
    }
};