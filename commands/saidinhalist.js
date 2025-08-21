// commands/saidinhalist.js
const fs = require('fs');
const path = require('path');

const saidinhasPath = path.join(__dirname, '..', 'data', 'saidinhas.json');

module.exports = {
    name: 'saidinhalist',
    description: 'Lista todas as saidinhas aprovadas',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            if (!fs.existsSync(saidinhasPath)) {
                return msg.reply('📭 Nenhuma saidinha aprovada ainda!');
            }

            const saidinhas = JSON.parse(fs.readFileSync(saidinhasPath, 'utf8'));
            const groupId = chat.id._serialized;
            const saidinhasGrupo = saidinhas[groupId];

            if (!saidinhasGrupo || Object.keys(saidinhasGrupo).length === 0) {
                return msg.reply('📭 Nenhuma saidinha aprovada para este grupo!');
            }

            // Agrupar por data de aprovação
            const saidinhasPorData = {};
            Object.values(saidinhasGrupo).forEach(saidinha => {
                const data = new Date(saidinha.dataAprovacao).toLocaleDateString('pt-BR');
                if (!saidinhasPorData[data]) {
                    saidinhasPorData[data] = [];
                }
                saidinhasPorData[data].push(saidinha);
            });

            // Criar resposta
            let resposta = '📅 *SAIDINHAS APROVADAS - RESUMO POR DATA*\n\n';
            
            Object.entries(saidinhasPorData).forEach(([data, saidinhasData]) => {
                resposta += `📅 *${data}:*\n`;
                saidinhasData.forEach(saidinha => {
                    const titulo = saidinha.texto.split('*NOME DO ROLE:*')[1]?.split('\n')[0]?.trim() || 'Saída sem nome';
                    resposta += `• ${titulo} (por @${saidinha.autor.name})\n`;
                });
                resposta += '\n';
            });

            resposta += `📊 Total: ${Object.keys(saidinhasGrupo).length} saidinha(s) aprovada(s)`;

            await msg.reply(resposta);

        } catch (error) {
            console.error('Erro no comando saidinhalist:', error);
            await msg.reply('❌ Ocorreu um erro ao listar as saidinhas.');
        }
    }
};