const fs = require('fs');
const path = require('path');
const { tempBlockedUsers } = require('../gameState');

const arquivoBlockedUsers = path.join(__dirname, '..', 'data', 'blockedUsers.json');

function salvarBlockedUsers(lista) {
    fs.writeFileSync(arquivoBlockedUsers, JSON.stringify(lista, null, 2), 'utf8');
}

// CORRIGIDO: Recebendo ownerId (apenas um admin)
module.exports = async (client, msg, args, ownerId) => {
    const chat = await msg.getChat();
    const autorId = msg.author || msg.from;

    // VERIFICADO: Usa ownerId para verificar permissão
    if (autorId !== ownerId) {
        msg.reply('❌ Apenas o administrador pode usar este comando.');
        return;
    }

    if (msg.mentionedIds.length === 0) {
        msg.reply('⚠️ Você precisa mencionar a pessoa para bloquear. Ex: `!block @pessoa` (permanente) ou `!block @pessoa 15m` (temporário).');
        return;
    }

    const idMencionado = msg.mentionedIds[0];
    const contatoMencionado = await client.getContactById(idMencionado);
    const nomeMencionado = contatoMencionado.pushname || contatoMencionado.verifiedName || contatoMencionado.name || contatoMencionado.id.user;

    // Não bloquear o próprio bot
    if (idMencionado === client.info.wid._serialized) {
        msg.reply('Eu não posso me bloquear!');
        return;
    }

    // Não bloquear o próprio admin (ownerId)
    if (idMencionado === ownerId) {
        msg.reply('Você não pode se bloquear!');
        return;
    }

    const duracaoArg = args[1];
    let isTemporaryBlock = false;
    let blockDurationMs = 0;

    if (duracaoArg) {
        const match = duracaoArg.match(/^(\d+)([mh])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === 'm') {
                blockDurationMs = value * 60 * 1000;
            } else if (unit === 'h') {
                blockDurationMs = value * 60 * 60 * 1000;
            }
            isTemporaryBlock = true;
        }
    }

    if (isTemporaryBlock) {
        const blockedUntil = Date.now() + blockDurationMs;
        tempBlockedUsers[idMencionado] = blockedUntil;

        const duracaoFormatada = blockDurationMs >= 3600000 ? `${blockDurationMs / 3600000} horas` : `${blockDurationMs / 60000} minutos`;

        await chat.sendMessage(
            `✅ Usuário @${contatoMencionado.id.user} foi *bloqueado temporariamente* por ${duracaoFormatada}.`,
            { mentions: [contatoMencionado] }
        );
        console.log(`Admin ${autorId} bloqueou temporariamente ${contatoMencionado.id.user} por ${duracaoFormatada}.`);

    } else {
        let blockedUsers = [];
        try {
            if (fs.existsSync(arquivoBlockedUsers)) {
                // Garante que blockedUsers seja um array
                const content = fs.readFileSync(arquivoBlockedUsers, 'utf8');
                blockedUsers = content ? JSON.parse(content) : []; 
            }
        } catch (e) {
            console.error('Erro ao carregar blockedUsers.json para o comando:', e);
            blockedUsers = [];
        }
        
        if (!blockedUsers.includes(idMencionado)) {
            blockedUsers.push(idMencionado);
            salvarBlockedUsers(blockedUsers);
            msg.reply(`✅ Usuário @${contatoMencionado.id.user} foi *bloqueado permanentemente* de usar e Bliss. Vai achando que é fácil viver sem a tecnologia! 😝 `);
        } else {
            msg.reply(`⚠️ Usuário @${contatoMencionado.id.user} já está na lista de bloqueados permanentes.`);
        }
    }
};