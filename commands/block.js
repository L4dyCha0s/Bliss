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

    // O comando precisa de pelo menos uma menção
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

    // Não bloquear o próprio admin
    if (idMencionado === ownerId) {
        msg.reply('Você não pode se bloquear!');
        return;
    }

    // Verifica se há um argumento de duração (ex: "15m", "1h")
    const duracaoArg = args[1]; // O primeiro argumento é a menção, o segundo seria a duração
    let isTemporaryBlock = false;
    let blockDurationMs = 0; // Duração em milissegundos

    if (duracaoArg) {
        const match = duracaoArg.match(/^(\d+)([mh])$/); // Captura número e unidade (m para minutos, h para horas)
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            if (unit === 'm') {
                blockDurationMs = value * 60 * 1000; // Minutos para milissegundos
            } else if (unit === 'h') {
                blockDurationMs = value * 60 * 60 * 1000; // Horas para milissegundos
            }
            isTemporaryBlock = true;
        }
    }

    if (isTemporaryBlock) {
        // --- BLOQUEIO TEMPORÁRIO ---
        const blockedUntil = Date.now() + blockDurationMs;
        tempBlockedUsers[idMencionado] = blockedUntil;

        const duracaoFormatada = blockDurationMs >= 3600000 ? `${blockDurationMs / 3600000} horas` : `${blockDurationMs / 60000} minutos`;

        await chat.sendMessage(
            `✅ Usuário @${contatoMencionado.id.user} foi *bloqueado temporariamente* por ${duracaoFormatada}.`,
            { mentions: [contatoMencionado] }
        );
        console.log(`Admin ${autorId} bloqueou temporariamente ${idMencionado} por ${duracaoFormatada}.`);

    } else {
        // --- BLOQUEIO PERMANENTE ---
        let blockedUsers = [];
        try {
            if (fs.existsSync(arquivoBlockedUsers)) {
                blockedUsers = JSON.parse(fs.readFileSync(arquivoBlockedUsers, 'utf8'));
            }
        } catch (e) {
            console.error('Erro ao carregar blockedUsers.json para o comando:', e);
        }
        
        if (!blockedUsers.includes(idMencionado)) {
            blockedUsers.push(idMencionado);
            salvarBlockedUsers(blockedUsers);
            msg.reply(`✅ Usuário ${nomeMencionado} (@${contatoMencionado.id.user}) foi *bloqueado permanentemente* com sucesso!`);
        } else {
            msg.reply(`⚠️ Usuário ${nomeMencionado} já está na lista de bloqueados permanentes.`);
        }
    }
};