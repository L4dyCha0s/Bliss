const fs = require('fs');
const path = require('path');
const { tempBlockedUsers } = require('../gameState'); // Importa o rastreador de bloqueios temporários

const arquivoBlockedUsers = path.join(__dirname, '..', 'data', 'blockedUsers.json');

// Função para salvar a lista de bloqueados permanentes
function salvarBlockedUsers(lista) {
    fs.writeFileSync(arquivoBlockedUsers, JSON.stringify(lista, null, 2), 'utf8');
}

module.exports = async (client, msg, args, ownerId) => {
    const chat = await msg.getChat();
    const autorId = msg.author || msg.from;

    // Apenas o dono do bot pode usar este comando
    if (autorId !== ownerId) {
        msg.reply('❌ Apenas o administrador pode usar este comando.');
        return;
    }

    // O comando precisa de uma menção
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
            blockedUsers = JSON.parse(fs.readFileSync(arquivoBlockedUsers, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao carregar blockedUsers.json para o comando:', e);
    }

    const index = blockedUsers.indexOf(idMencionado);
    if (index > -1) {
        blockedUsers.splice(index, 1);
        salvarBlockedUsers(blockedUsers);
        await chat.sendMessage(
            `✅ Usuário @${contatoMencionado.id.user} foi *desbloqueado (permanente)* com sucesso!`,
            { mentions: [contatoMencionado] }
        );
        console.log(`Admin ${autorId} desbloqueou permanentemente ${idMencionado}.`);
        unlocked = true;
    }

    if (!unlocked) {
        msg.reply(`⚠️ Usuário ${nomeMencionado} não está na lista de bloqueados (nem temporário, nem permanente).`);
    }
};