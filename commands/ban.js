const { banVote } = require('../gameState');

module.exports = {
    name: 'ban',
    description: 'Expulsa um membro do grupo. Se um admin usar, é instantâneo. Se for um membro, inicia uma votação de 10 pessoas.',
    async execute(client, msg) {
        const chat = await msg.getChat();
        const autorId = msg.author || msg.from;

        if (!chat.isGroup) {
            msg.reply('❌ Este comando só pode ser usado em grupos.');
            return;
        }

        const mentionedIds = msg.mentionedIds;
        let targetId;

        if (mentionedIds && mentionedIds.length > 0) {
            targetId = mentionedIds[0];
        } else {
            msg.reply('⚠️ Você deve marcar o membro que deseja expulsar. Ex: `!ban @membro`');
            return;
        }

        const targetUser = chat.participants.find(p => p.id._serialized === targetId);

        if (!targetUser) {
            msg.reply('❌ Membro não encontrado no grupo.');
            return;
        }

        // Não permite banir o próprio bot
        if (targetId === client.info.wid._serialized) {
            msg.reply('🤖 Eu não posso me expulsar!');
            return;
        }

        // Lógica para verificar se o usuário que executou o comando é admin
        const autorParticipant = chat.participants.find(p => p.id._serialized === autorId);
        const isAdmin = autorParticipant && autorParticipant.isAdmin;

        // VERIFICAÇÃO INSTANTÂNEA PARA ADMINS
        if (isAdmin) {
            // Verifica se o alvo não é um admin também
            if (targetUser.isAdmin) {
                msg.reply('❌ Não é possível expulsar outro administrador.');
                return;
            }

            try {
                await chat.removeParticipants([targetId]);
                const targetContact = await client.getContactById(targetId);
                const replyMessage = `⚡ *BANIMENTO INSTANTÂNEO*\n\n✅ ${targetContact.pushname || targetContact.verifiedName} foi expulso(a) do grupo por um administrador.`;
                await msg.reply(replyMessage, null, { mentions: [targetContact] });
            } catch (error) {
                console.error('Erro ao expulsar membro:', error);
                msg.reply('❌ Ocorreu um erro ao tentar expulsar o membro. O bot pode não ter permissão de administrador.');
            }
            return;
        }

        // LÓGICA DE VOTAÇÃO PARA USUÁRIOS COMUNS
        if (banVote.isActive && banVote.groupId === chat.id._serialized) {
            msg.reply('⚠️ Já existe uma votação de banimento em andamento. Por favor, aguarde o resultado.');
            return;
        }

        if (targetUser.isAdmin) {
            msg.reply('❌ Não é possível iniciar uma votação para expulsar um administrador.');
            return;
        }

        // Verificar se o alvo não é o próprio autor
        if (targetId === autorId) {
            msg.reply('❌ Você não pode iniciar uma votação para se banir!');
            return;
        }

        // Inicializar votação
        banVote.isActive = true;
        banVote.groupId = chat.id._serialized;
        banVote.proposerId = autorId;
        banVote.targetUserId = targetId;
        banVote.targetUserContact = targetUser;
        banVote.votes = [autorId]; // Autor vota automaticamente
        banVote.startTime = Date.now();
        banVote.timeoutDuration = 10 * 60 * 1000; // 10 minutos

        const autorContact = await client.getContactById(autorId);
        const targetContact = await client.getContactById(targetId);

        const mensagemVotacao = `⚖️ *VOTAÇÃO DE BANIMENTO INICIADA!*\n\n` +
            `👤 *Acusador:* ${autorContact.pushname || autorContact.verifiedName}\n` +
            `🎯 *Acusado:* ${targetContact.pushname || targetContact.verifiedName}\n\n` +
            `🗳️ *Para votar a favor do banimento, responda esta mensagem com:*\n` +
            `**\`!votarbanir\`**\n\n` +
            `📊 *Votos atuais:* 1/10 necessários\n` +
            `⏰ *Tempo restante:* 10 minutos\n\n` 

        const sentMessage = await chat.sendMessage(mensagemVotacao, {
            mentions: [targetContact]
        });
        
        banVote.voteMessageId = sentMessage.id._serialized;

        // Timer para expirar a votação
        banVote.timeout = setTimeout(async () => {
            if (banVote.isActive && banVote.groupId === chat.id._serialized) {
                banVote.isActive = false;
                
                if (banVote.votes.length >= 10) {
                    try {
                        await chat.removeParticipants([targetId]);
                        await chat.sendMessage(
                            `⏰ *VOTAÇÃO ENCERRADA - BANIMENTO APROVADO!*\n\n` +
                            `✅ ${targetContact.pushname || targetContact.verifiedName} foi expulso(a) do grupo por votação popular.\n` +
                            `📊 Resultado: ${banVote.votes.length}/10 votos`,
                            { mentions: [targetContact] }
                        );
                    } catch (error) {
                        console.error('Erro ao expulsar por votação:', error);
                        await chat.sendMessage('❌ Erro ao executar o banimento. O bot pode não ter permissões.');
                    }
                } else {
                    await chat.sendMessage(
                        `⏰ *VOTAÇÃO ENCERRADA - BANIMENTO REPROVADO!*\n\n` +
                        `❌ Votação de banimento de ${targetContact.pushname || targetContact.verifiedName} fracassou.\n` +
                        `📊 Resultado: ${banVote.votes.length}/10 votos (necessário 10)`,
                        { mentions: [targetContact] }
                    );
                }
                
                // Resetar estado da votação
                banVote.isActive = false;
                banVote.groupId = null;
                banVote.votes = [];
            }
        }, banVote.timeoutDuration);
    }
};