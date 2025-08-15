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

// Função para extrair dados da ficha
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
        const saidinhaId = args[0];
        const autorId = msg.author || msg.from;

        const chat = await msg.getChat();
        
        // 1. Verificação: Mensagem em grupo
        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        // 2. Verificação: Autor é administrador
        const participant = chat.participants.find(p => p.id._serialized === autorId);
        if (!participant || !participant.isAdmin) {
            msg.reply('❌ Apenas administradores podem aprovar saidinhas.');
            return;
        }

        // 3. Verificação: ID foi fornecido
        if (!saidinhaId) {
            msg.reply('⚠️ Você deve fornecer o ID da saidinha que deseja aprovar. Use `!saidinhaspendentes` para ver a lista.');
            return;
        }

        const saidinhaIndex = saidinhaState.findIndex(s => s.id === saidinhaId);

        // 4. Verificação: Saidinha com o ID existe
        if (saidinhaIndex === -1) {
            msg.reply(`❌ Não há nenhuma sugestão de saidinha com o ID #${saidinhaId} aguardando aprovação.`);
            return;
        }

        const saidinhaAprovada = saidinhaState[saidinhasIndex];

        // 5. Verificação robusta para obter os participantes
        let allParticipants = [];
        try {
            allParticipants = await chat.getParticipants();
        } catch (e) {
            console.error('Erro ao obter participantes do grupo:', e);
            msg.reply('❌ Ocorreu um erro ao buscar os participantes do grupo. A saidinha não pode ser aprovada.');
            return;
        }
        const allMentions = allParticipants.map(p => p.id._serialized);

        const saidinhaMessage = `🎉 **SAIDINHA APROVADA!** 🎉
A sugestão de saidinha foi aprovada e está confirmada!

-----------------------------------
${saidinhaAprovada.proposalMessage}
-----------------------------------

*Atenção:* Um administrador deve fixar esta mensagem para manter todos informados.
`;
        
        await chat.sendMessage(saidinhasMessage, { mentions: allMentions });

        // === LÓGICA DE SALVAR NO ARQUIVO ===
        const saidinhasData = carregarJson(saidinhasFilePath);
        const groupId = saidinhaAprovada.groupId;

        if (!saidinhasData[groupId]) {
            saidinhasData[groupId] = [];
        }
        
        const ficha = parseSaidinhaData(saidinhasAprovada.proposalMessage);
        
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

        saidinhasData[groupId].push(saidinhasSalva);
        salvarJson(saidinhasFilePath, saidinhasData);
        // === FIM DA LÓGICA DE SALVAR ===

        // Remove a saidinha aprovada do array
        saidinhaState.splice(saidinhasIndex, 1); 

        // Mensagem de confirmação para o admin
        msg.reply(`✅ Saidinha #${saidinhaId} aprovada com sucesso e enviada ao grupo.`);
    }
};