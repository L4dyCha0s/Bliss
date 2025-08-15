const { saidinhaState } = require('../gameState');
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de saidinhas aprovadas
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

// Função auxiliar para salvar JSON
function salvarJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    name: 'aprovarsaidinha',
    description: 'Aprova uma saidinha e a envia para o grupo.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;
        
        // Verifica se a mensagem foi enviada em um grupo
        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        // Verifica se o autor é um administrador
        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('Apenas administradores podem aprovar uma saidinha.');
            return;
        }

        // Verifica se há uma saidinha para aprovar
        if (!saidinhaState.isActive || !saidinhaState.proposalMessage) {
            msg.reply('Não há nenhuma sugestão de saidinha aguardando aprovação no momento.');
            return;
        }

        // Verifica se o comando está respondendo à mensagem correta
        if (!msg.hasQuotedMsg || msg.getQuotedMessage()._data.id._serialized !== saidinhaState.proposalMessage.id._serialized) {
            msg.reply('⚠️ Você deve **responder** à mensagem de sugestão da saidinha para aprová-la.');
            return;
        }

        // Obtém todos os participantes do grupo para marcar
        const allParticipants = chat.participants.filter(p => p.id._serialized !== client.info.wid._serialized);
        const allMentions = allParticipants.map(p => p.id._serialized);

        const saidinhaMessage = `
🎉🎉 **SAIDINHA APROVADA!** 🎉🎉
A sugestão de saidinha foi aprovada e está confirmada!

${saidinhaState.proposalMessage.body}

*Atenção:* Um administrador deve fixar esta mensagem por 48h para manter todos informados.
`;
        
        // Envia a mensagem marcando todos os participantes e limpa o estado
        await chat.sendMessage(saidinhasMessage, { mentions: allMentions });
        
        // ============ INÍCIO DA LÓGICA DE SALVAR NO ARQUIVO ============
        const saidinhasData = carregarJson(saidinhasFilePath);
        const groupId = chat.id._serialized;

        if (!saidinhasData[groupId]) {
            saidinhasData[groupId] = [];
        }

        // Prepara os dados para salvar
        const saidinhaSalva = {
            id: saidinhaState.proposalMessage.id._serialized, // Usando o ID da mensagem como ID da saidinha
            authorId: saidinhaState.authorId,
            proposalMessage: saidinhaState.proposalMessage.body,
            approvedDate: new Date().toISOString()
        };
        
        saidinhasData[groupId].push(saidinhasSalva);
        salvarJson(saidinhasFilePath, saidinhasData);
        // ============ FIM DA LÓGICA DE SALVAR NO ARQUIVO ============

        saidinhaState.isActive = false;
        saidinhaState.authorId = null;
        saidinhaState.proposalMessage = null;
    }
};