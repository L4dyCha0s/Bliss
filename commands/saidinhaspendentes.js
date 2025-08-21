// commands/saidinhaspendentes.js
const fs = require('fs');
const path = require('path');

const pendentesPath = path.join(__dirname, '..', 'data', 'saidinhas_pendentes.json');

module.exports = {
    name: 'saidinhaspendentes',
    description: 'Lista saidinhas pendentes de aprovação (apenas ADMs)',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            // Verificar se é administrador
            const sender = await msg.getContact();
            const isAdmin = chat.participants.find(p => 
                p.id._serialized === sender.id._serialized && p.isAdmin
            );

            if (!isAdmin) {
                return msg.reply('❌ Apenas administradores podem ver saidinhas pendentes!');
            }

            if (!fs.existsSync(pendentesPath)) {
                return msg.reply('📭 Nenhuma saidinha pendente!');
            }

            const pendentes = JSON.parse(fs.readFileSync(pendentesPath, 'utf8'));
            const groupId = chat.id._serialized;
            const pendentesGrupo = pendentes[groupId];

            if (!pendentesGrupo || Object.keys(pendentesGrupo).length === 0) {
                return msg.reply('📭 Nenhuma saidinha pendente para este grupo!');
            }

            let resposta = '⏳ *SAIDINHAS PENDENTES DE APROVAÇÃO*\n\n';
            
            Object.values(pendentesGrupo).forEach(saidinha => {
                const titulo = saidinha.texto.split('*NOME DO ROLE:*')[1]?.split('\n')[0]?.trim() || 'Sem título';
                const data = new Date(saidinha.dataSugestao).toLocaleDateString('pt-BR');
                
                resposta += `📛 ${titulo}\n`;
                resposta += `👤 Por: @${saidinha.autor.name}\n`;
                resposta += `📅 ${data}\n`;
                resposta += `🆔 ID: ${saidinha.id}\n`;
                resposta += `━━━━━━━━━━━━━━━━━━━━\n`;
            });

            resposta += `\n💡 Use !apvsaidinha <ID> para aprovar ou !repsaidinha <ID> para reprovar`;

            await msg.reply(resposta);

        } catch (error) {
            console.error('Erro no comando saidinhaspendentes:', error);
            await msg.reply('❌ Ocorreu um erro ao listar saidinhas pendentes.');
        }
    }
};