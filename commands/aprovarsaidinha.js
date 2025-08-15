const { saidinhaState } = require('../gameState');
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de saidinhas aprovadas
const saidinhasFilePath = path.join(__dirname, '..', 'data', 'saidinhasAprovadas.json');

// Funções auxiliares para carregar e salvar JSON
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

// NOVO: Função para extrair dados da ficha (adapte se necessário)
function parseSaidinhaData(messageBody) {
    const data = {};
    const lines = messageBody.split('\n');
    lines.forEach(line => {
        const [key, ...value] = line.split(':');
        if (key && value.length > 0) {
            data[key.trim().toLowerCase().replace(/ /g, '')] = value.join(':').trim();
        }
    });
    return data;
}

module.exports = {
    name: 'aprovarsaidinha',
    description: 'Aprova uma saidinha pendente. Use: `!aprovarsaidinha <id>`',
    async execute(client, msg, args) {
        // ... (o código de verificação de admin, ID, etc. que já temos) ...

        const saidinhaId = args[0];
        const autorId = msg.author || msg.from;

        const chat = await msg.getChat();
        
        // ... (resto das verificações) ...

        const saidinhaIndex = saidinhaState.findIndex(s => s.id === saidinhaId);

        if (saidinhaIndex === -1) {
            msg.reply(`❌ Não há nenhuma sugestão de saidinha com o ID #${saidinhaId} aguardando aprovação.`);
            return;
        }

        const saidinhaAprovada = saidinhaState[saidinhaIndex];

        // Obtém todos os participantes do grupo para marcar
        const allParticipants = await chat.getParticipants();
        const allMentions = allParticipants.map(p => p.id._serialized);

        const saidinhaMessage = `🎉 **SAIDINHA APROVADA!** 🎉
A sugestão de saidinha foi aprovada e está confirmada!

-----------------------------------
${saidinhaAprovada.proposalMessage}
-----------------------------------

*Atenção:* Um administrador deve fixar esta mensagem por 48h para manter todos informados.
`;
        
        // Envia a mensagem marcando todos os participantes
        await chat.sendMessage(saidinhaMessage, { mentions: allMentions });

        // === LÓGICA DE SALVAR NO ARQUIVO ===
        const saidinhasData = carregarJson(saidinhasFilePath);
        const groupId = saidinhaAprovada.groupId;

        if (!saidinhasData[groupId]) {
            saidinhasData[groupId] = [];
        }
        
        const ficha = parseSaidinhaData(saidinhaAprovada.proposalMessage);
        
        const saidinhaSalva = {
            id: saidinhaAprovada.id,
            authorId: saidinhaAprovada.authorId,
            authorUser: (await client.getContactById(saidinhaAprovada.authorId)).pushname, // Nome do responsável
            date: ficha.data,
            time: ficha.hora,
            location: ficha.local,
            description: ficha.descrição,
            // ... adicione outros campos da ficha aqui ...
        };

        saidinhasData[groupId].push(saidinhaSalva);
        salvarJson(saidinhasFilePath, saidinhasData);
        // === FIM DA LÓGICA DE SALVAR ===

        // Remove a saidinha aprovada do array
        saidinhaState.splice(saidinhaIndex, 1); 

        // Mensagem de confirmação para o admin
        msg.reply(`✅ Saidinha #${saidinhaId} aprovada com sucesso e enviada ao grupo.`);
    }
};