// commands/votarbanir.js
const { banVote } = require('../gameState');

module.exports = {
    name: 'votarbanir',
    description: 'Vota a favor do banimento em votação ativa',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            const voterId = msg.author || msg.from;

            if (!chat.isGroup) {
                return msg.reply('❌ Este comando só funciona em grupos!');
            }

            // Verificar se há votação ativa
            if (!banVote.isActive || banVote.groupId !== chat.id._serialized) {
                return msg.reply('❌ Não há votação de banimento ativa neste grupo!');
            }

            // Verificar se não é o alvo tentando votar
            if (voterId === banVote.targetUserId) {
                return msg.reply('❌ Você não pode votar no próprio banimento!');
            }

            // Verificar se já votou
            if (banVote.votes.includes(voterId)) {
                return msg.reply('❌ Você já votou nesta votação!');
            }

            // Verificar se é participante válido do grupo
            const voterParticipant = chat.participants.find(p => p.id._serialized === voterId);
            if (!voterParticipant) {
                return msg.reply('❌ Apenas membros do grupo podem votar!');
            }

            // Registrar voto
            banVote.votes.push(voterId);
            const voterContact = await client.getContactById(voterId);
            const targetContact = await client.getContactById(banVote.targetUserId);

            // Atualizar mensagem de votação
            const votesCount = banVote.votes.length;
            const timeElapsed = Math.floor((Date.now() - banVote.startTime) / 60000);
            const timeLeft = 10 - timeElapsed;

            const updateMessage = `⚖️ *VOTAÇÃO DE BANIMENTO - ATUALIZADA!*\n\n` +
                `👤 *Acusador:* ${(await client.getContactById(banVote.proposerId)).pushname}\n` +
                `🎯 *Acusado:* ${targetContact.pushname || targetContact.verifiedName}\n\n` +
                `🗳️ *Para votar a favor do banimento, responda esta mensagem com:*\n` +
                `**\`!votarbanir\`**\n\n` +
                `📊 *Votos atuais:* ${votesCount}/10 necessários\n` +
                `⏰ *Tempo restante:* ${timeLeft} minutos\n\n` +
                `✅ *Último voto:* ${voterContact.pushname || voterContact.verifiedName}\n\n` +
                `⚠️ *Atenção:* Cada pessoa só pode votar uma vez!`;

            try {
                // Tentar editar a mensagem original
                const originalMessage = await chat.fetchMessage(banVote.voteMessageId);
                await originalMessage.edit(updateMessage);
            } catch (error) {
                console.error('Erro ao editar mensagem:', error);
                // Se não conseguir editar, enviar nova mensagem
                const newMessage = await chat.sendMessage(updateMessage, {
                    mentions: [targetContact]
                });
                banVote.voteMessageId = newMessage.id._serialized;
            }

            await msg.reply(`✅ Seu voto foi registrado! ${votesCount}/10 votos.`);

            // Verificar se atingiu 10 votos
            if (votesCount >= 10) {
                clearTimeout(banVote.timeout);
                
                try {
                    await chat.removeParticipants([banVote.targetUserId]);
                    await chat.sendMessage(
                        `🏆 *VOTAÇÃO CONCLUÍDA - BANIMENTO APROVADO!*\n\n` +
                        `✅ ${targetContact.pushname || targetContact.verifiedName} foi expulso(a) do grupo por votação popular.\n` +
                        `📊 Resultado: ${votesCount}/10 votos\n\n` +
                        `⚖️ *Democracia em ação!*`,
                        { mentions: [targetContact] }
                    );
                } catch (error) {
                    console.error('Erro ao expulsar por votação:', error);
                    await chat.sendMessage(
                        `❌ *Erro ao executar banimento!*\n\n` +
                        `A votação atingiu ${votesCount}/10 votos, mas ocorreu um erro ao remover o membro.`,
                        { mentions: [targetContact] }
                    );
                }
                
                // Resetar votação
                banVote.isActive = false;
                banVote.groupId = null;
                banVote.votes = [];
            }

        } catch (error) {
            console.error('Erro no comando votarbanir:', error);
            await msg.reply('❌ Ocorreu um erro ao processar seu voto.');
        }
    }
};