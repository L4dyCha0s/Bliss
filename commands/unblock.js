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
        msg.reply('⚠️ Você precisa mencionar a pessoa para desbloquear. Ex: `!unblock @pessoa`');
        return;
    }

    const idMencionado = msg.mentionedIds[0];
    const contatoMencionado = await client.getContactById(idMencionado);
    const nomeMencionado = contatoMencionado.pushname || contatoMencionado.verifiedName || contatoMencionado.name || contatoMencionado.id.user;

    let unlocked = false;

    // 1. Tenta desbloquear da lista de bloqueios temporários
    if (tempBlockedUsers[idMencionado]) {
        delete tempBlockedUsers[idMencionado];
        await chat.sendMessage(
            `✅ Usuário @${contatoMencionado.id.user} foi *desbloqueado (temporário)* com sucesso!`,
            { mentions: [contatoMencionado] }
        );
        console.log(`Admin ${autorId} desbloqueou temporariamente ${idMencionado}.`);
        unlocked = true;
    }

    // 2. Tenta desbloquear da lista de bloqueios permanentes
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

    const index = blockedUsers.indexOf(idMencionado);
    if (index > -1) {
        blockedUsers.splice(index, 1);
        salvarBlockedUsers(blockedUsers);
        await chat.sendMessage(
            `✅ Usuário @${contatoMencionado.id.user} pagou a fiança de uma Pepsi Black para a Stella e pode usar o Bliss novamente! 😍`,
            { mentions: [contatoMencionado] }
        );
        console.log(`Admin ${autorId} desbloqueou permanentemente ${idMencionado}.`);
        unlocked = true;
    }

    if (!unlocked) {
        msg.reply(`⚠️ Usuário ${nomeMencionado} não está na lista de bloqueados (nem temporário, nem permanente).`);
    }
};