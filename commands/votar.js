// commands/votar.js
const fs = require('fs');
const path = require('path');

const debatesPath = path.join(__dirname, '..', 'data', 'debates.json');

function carregarDebates() {
    try {
        if (fs.existsSync(debatesPath)) {
            return JSON.parse(fs.readFileSync(debatesPath, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao carregar debates.json:', e);
    }
    return { temasUsados: [], historicoDebates: [], estatisticas: {} };
}

function salvarDebates(dados) {
    try {
        fs.writeFileSync(debatesPath, JSON.stringify(dados, null, 2));
        return true;
    } catch (e) {
        console.error('Erro ao salvar debates.json:', e);
        return false;
    }
}

module.exports = {
    name: 'votar',
    description: 'Vota em um debatedor (apenas para jurados)',
    async execute(client, msg) {
        try {
            const userId = msg.author || msg.from;
            const args = msg.body.split(' ');
            const voto = parseInt(args[1]);

            if (!voto || (voto !== 1 && voto !== 2)) {
                return msg.reply('❌ Use: !votar [1/2]\n• 1 = Primeiro debatedor (Pró)\n• 2 = Segundo debatedor (Contra)');
            }

            const debatesData = carregarDebates();
            const debateAtivo = debatesData.historicoDebates.find(d => d.ativo && d.grupo === msg.from);

            if (!debateAtivo) {
                return msg.reply('❌ Não há debate ativo neste grupo!');
            }

            // Verificar se é jurado
            const jurado = debateAtivo.jurados.find(j => j.id === userId);
            if (!jurado) {
                return msg.reply('❌ Apenas jurados podem votar!');
            }

            // Verificar se já votou
            if (jurado.voto !== null) {
                return msg.reply('❌ Você já votou neste debate!');
            }

            // Registrar voto
            jurado.voto = voto;
            debateAtivo.debatedores[voto - 1].votos++;

            // Verificar se todos votaram
            const todosVotaram = debateAtivo.jurados.every(j => j.voto !== null);
            
            if (todosVotaram) {
                // Encerrar debate
                debateAtivo.ativo = false;
                
                // Determinar vencedor
                const votos1 = debateAtivo.debatedores[0].votos;
                const votos2 = debateAtivo.debatedores[1].votos;
                
                if (votos1 > votos2) {
                    debateAtivo.vencedor = debateAtivo.debatedores[0].nome;
                } else if (votos2 > votos1) {
                    debateAtivo.vencedor = debateAtivo.debatedores[1].nome;
                } else {
                    debateAtivo.vencedor = 'Empate';
                }

                // Atualizar estatísticas
                if (!debatesData.estatisticas[debateAtivo.vencedor]) {
                    debatesData.estatisticas[debateAtivo.vencedor] = 0;
                }
                debatesData.estatisticas[debateAtivo.vencedor]++;

                // Mensagem de resultado
                let resultadoMsg = `🏆 *DEBATE ENCERRADO!* 🏆\n\n`;
                resultadoMsg += `📝 *Tema:* "${debateAtivo.tema}"\n\n`;
                resultadoMsg += `📊 *Resultado:*\n`;
                resultadoMsg += `• ${debateAtivo.debatedores[0].nome}: ${votos1} votos ✅\n`;
                resultadoMsg += `• ${debateAtivo.debatedores[1].nome}: ${votos2} votos ❌\n\n`;
                resultadoMsg += `🎉 *Vencedor:* ${debateAtivo.vencedor}\n\n`;
                resultadoMsg += `👑 *Estatísticas:* ${debatesData.estatisticas[debateAtivo.vencedor]} vitórias`;

                const chat = await msg.getChat();
                await chat.sendMessage(resultadoMsg, {
                    mentions: debateAtivo.debatedores.map(d => d.id).concat(debateAtivo.jurados.map(j => j.id))
                });
            } else {
                // Apenas confirmar voto
                await msg.reply(`✅ Voto registrado para o debatedor ${voto}!`);
            }

            salvarDebates(debatesData); //kjkj

        } catch (error) {
            console.error('Erro no comando votar:', error);
            await msg.reply('❌ Ocorreu um erro ao processar seu voto.');
        }
    }
};