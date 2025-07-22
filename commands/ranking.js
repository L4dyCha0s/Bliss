const fs = require('fs');
const path = require('path');

const arquivoRanking = path.join(__dirname, '..', 'data', 'ranking.json');

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        return msg.reply('Este comando só funciona em grupos. Utilize-o dentro de um chat em grupo para ver o ranking!');
    }

    const groupId = chat.id._serialized;

    if (!fs.existsSync(arquivoRanking)) {
        return msg.reply('🏆 O ranking ainda não está disponível para nenhum grupo. Ninguém interagiu o suficiente!');
    }

    let allRankingData;
    try {
        allRankingData = JSON.parse(fs.readFileSync(arquivoRanking, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler ou parsear ranking.json:', error);
        return msg.reply('❌ Ocorreu um erro ao carregar os dados do ranking. O arquivo pode estar corrompido.');
    }

    const groupRanking = allRankingData[groupId];

    if (!groupRanking || Object.keys(groupRanking).length === 0) {
        return msg.reply('🏆 Ainda não há dados de ranking para este grupo. Comece a interagir!');
    }

    const top = Object.entries(groupRanking)
        .filter(([id, count]) => id && typeof id === 'string' && id.includes('@c.us') && typeof count === 'number' && count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (top.length === 0) {
        return msg.reply('🏆 Não há dados suficientes para gerar o ranking ainda neste grupo ou todos os usuários têm 0 mensagens.');
    }

    let resposta = `🏆 *RANKING DOS MAIS ATIVOS NESTE GRUPO:*\n\n`;
    
    // Não precisamos mais de 'contatosParaMencionar'

    for (let i = 0; i < top.length; i++) {
        const [id, count] = top[i];
        try {
            const contato = await client.getContactById(id);
            // Aqui usamos o nome ou pushname (nome de exibição), sem o '@' antes
            const nomeExibicao = contato.name || contato.pushname || id.split('@')[0];
            resposta += `${i + 1}º - ${nomeExibicao}: ${count} mensagens\n`;
        } catch (error) {
            console.error(`[!ranking] Erro ao obter contato ${id}:`, error.message);
            // Se não conseguir o contato, exibe o ID ou uma parte dele
            resposta += `${i + 1}º - Usuário Desconhecido (${id.split('@')[0]}): ${count} mensagens\n`;
        }
    }

    // Enviamos a mensagem diretamente, sem o parâmetro 'mentions'
    await msg.reply(resposta);
};