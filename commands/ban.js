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

        if (mentionedIds.length > 0) {
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
            msg.reply('Eu não posso me expulsar!');
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
                const replyMessage = `✅ ${targetContact.pushname || targetContact.verifiedName} foi expulso(a) do grupo por um administrador.`;
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

        banVote.isActive = true;
        banVote.groupId = chat.id._serialized;
        banVote.proposerId = autorId;
        banVote.targetUserId = targetId;
        banVote.targetUserName = targetUser.id.user;
        banVote.votes = [autorId];

        const autorContact = await client.getContactById(autorId);
        const targetContact = await client.getContactById(targetId);

        const mensagemVotacao = `${autorContact.pushname || autorContact.verifiedName} condena: ${targetContact.pushname || targetContact.verifiedName} ao *EXÍLIO*!

Para votar a favor, responda a esta mensagem com **\`!votarbanir\`**.
(1/10 votos necessários para o banimento)`;
        
        const sentMessage = await chat.sendMessage(mensagemVotacao, {
            mentions: [autorContact, targetContact]
        });
        banVote.voteMessageId = sentMessage.id._serialized;
    }
};