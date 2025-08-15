// commands/saidinhalist.js
const fs = require('fs');
const path = require('path');

// Caminho do arquivo de dados das saidinhas aprovadas
const arquivoSaidinhasAprovadas = path.join(__dirname, '../data', 'saidinhasAprovadas.json');

module.exports = {
    name: 'saidinhalist',
    description: 'Lista todas as saidinhas aprovadas.',
    async execute(client, msg) {
        try {
            if (!fs.existsSync(arquivoSaidinhasAprovadas)) {
                msg.reply('❌ Nenhuma saidinha aprovada foi encontrada ainda. O arquivo de dados não existe.');
                return;
            }

            const saidinhasData = JSON.parse(fs.readFileSync(arquivoSaidinhasAprovadas, 'utf8'));

            if (saidinhasData.length === 0) {
                msg.reply('📝 Nenhuma saidinha aprovada encontrada ainda.');
                return;
            }

            // Inverte o array para mostrar da mais recente para a mais antiga
            const saidinhasOrdenadas = saidinhasData.reverse();

            let response = `📝 *Histórico de Saidinha Aprovadas (${saidinhasOrdenadas.length} no total):*\n\n`;

            // Itera sobre TODAS as saidinhas para formatar a mensagem
            for (const saidinha of saidinhasOrdenadas) {
                const dataFormatada = new Date(saidinha.dataHoraAprovacao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                // Limita o conteúdo para evitar mensagens gigantes
                const conteudoResumo = saidinha.conteudo.length > 80 ? saidinha.conteudo.substring(0, 80) + '...' : saidinha.conteudo;

                response += `
*Data:* ${dataFormatada}
*Sugestão:* ${saidinha.sugestaoPor.nome}
*Aprovação:* ${saidinha.aprovadoPor.nome}
*Resumo:* "${conteudoResumo}"
---
`;
            }

            await msg.reply(response);

        } catch (error) {
            console.error('❌ Erro ao listar saidinhas aprovadas:', error);
            msg.reply('❌ Ocorreu um erro ao tentar listar as saidinhas aprovadas. Verifique o console.');
        }
    }
};