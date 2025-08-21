const fs = require('fs');
const path = require('path');

const arquivoRanking = path.join(__dirname, '..', 'data', 'ranking.json');

module.exports = async (client, msg) => {
    try {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            return msg.reply('Este comando só funciona em grupos. Utilize-o dentro de um chat em grupo para ver o ranking!');
        }

        const groupId = chat.id._serialized;

        // Verificar parâmetro primeiro para evitar leitura desnecessária do arquivo
        const args = msg.body.split(' ');
        let topCount = 10; // Valor padrão
        
        if (args.length > 1) {
            const num = parseInt(args[1]);
            if (!isNaN(num) && num > 0) {
                topCount = Math.min(num, 50); // Limitar a 50 no máximo
            }
        }

        // Verificar se o arquivo existe apenas uma vez
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

        // Processamento mais eficiente dos dados
        const validEntries = [];
        
        for (const [id, count] of Object.entries(groupRanking)) {
            if (id && typeof id === 'string' && id.includes('@c.us') && 
                typeof count === 'number' && count > 0) {
                validEntries.push({ id, count });
            }
        }

        if (validEntries.length === 0) {
            return msg.reply('🏆 Não há dados suficientes para gerar o ranking ainda neste grupo ou todos os usuários têm 0 mensagens.');
        }

        // Ordenar e limitar
        validEntries.sort((a, b) => b.count - a.count);
        const top = validEntries.slice(0, topCount);

        // Preparar resposta de forma mais eficiente
        let resposta = `🏆 *RANKING DOS ${topCount} MAIS ATIVOS NESTE GRUPO:*\n\n`;
        
        // Buscar informações de contato em paralelo para melhor performance
        const rankingPromises = top.map(async (entry, index) => {
            try {
                const contato = await client.getContactById(entry.id);
                const nomeExibicao = contato.name || contato.pushname || entry.id.split('@')[0];
                
                let emoji = '';
                if (index === 0) emoji = '🥇 ';
                else if (index === 1) emoji = '🥈 ';
                else if (index === 2) emoji = '🥉 ';
                else emoji = `${index + 1}º - `;
                
                return `${emoji}${nomeExibicao}: ${entry.count} mensagens`;
            } catch (error) {
                console.error(`[!ranking] Erro ao obter contato ${entry.id}:`, error.message);
                
                let emoji = '';
                if (index === 0) emoji = '🥇 ';
                else if (index === 1) emoji = '🥈 ';
                else if (index === 2) emoji = '🥉 ';
                else emoji = `${index + 1}º - `;
                
                return `${emoji}Usuário Desconhecido (${entry.id.split('@')[0]}): ${entry.count} mensagens`;
            }
        });

        // Esperar todas as promises resolverem
        const rankingLines = await Promise.all(rankingPromises);
        resposta += rankingLines.join('\n');

        // Adicionar estatísticas extras
        const totalMensagens = validEntries.reduce((sum, entry) => sum + entry.count, 0);
        const mediaMensagens = totalMensagens / validEntries.length;
        
        resposta += `\n\n📊 *Estatísticas do Grupo:*`;
        resposta += `\n• Total de mensagens: ${totalMensagens}`;
        resposta += `\n• Média por usuário: ${Math.round(mediaMensagens)}`;
        resposta += `\n• Usuários ativos: ${validEntries.length}`;
        
        // Adicionar instrução de uso no final
        resposta += `\n\n💡 Use *!ranking N* para ver os N primeiros (ex: !ranking ${Math.min(topCount + 5, 50)})`;

        // Enviar a mensagem
        await msg.reply(resposta);

    } catch (error) {
        console.error('Erro inesperado no comando ranking:', error);
        await msg.reply('❌ Ocorreu um erro inesperado ao processar o ranking. Tente novamente.');
    }
}; 