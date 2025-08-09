// commands/sugerirsaidinha.js
const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'sugerirsaidinha',
    description: 'Sugere uma saidinha respondendo à ficha preenchida.',
    async execute(client, msg) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Para sugerir uma saidinha, você deve **responder** à mensagem que contém a ficha preenchida com este comando.');
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();
        const autorId = msg.author || msg.from;

        // Verifica se já há uma saidinha em aprovação
        if (saidinhaState.isActive) {
            msg.reply('Já existe uma saidinha aguardando aprovação dos administradores. Por favor, aguarde.');
            return;
        }
        
        // Armazena a sugestão no estado global
        saidinhaState.isActive = true;
        saidinhaState.authorId = autorId;
        saidinhaState.proposalMessage = quotedMsg;

        // Filtra e pega o ID dos administradores
        const adms = chat.participants.filter(p => p.isAdmin && p.id._serialized !== client.info.wid._serialized);
        
        if (adms.length === 0) {
            await msg.reply('Sua sugestão foi recebida, mas não há outros administradores para aprová-la. A saidinha foi cancelada.');
            saidinhaState.isActive = false;
            return;
        }

        // Constrói a mensagem para os adms
        const mentions = adms.map(p => p.id._serialized);
        let message = `⚠️ Sugestão de Saidinha enviada por @${autorId.split('@')[0]}! ⚠️\n\n`;
        message += 'Um administrador pode aprovar esta sugestão respondendo à mensagem original com `!aprovarsaidinha`.\n\n';
        message += quotedMsg.body;
        
        await chat.sendMessage(message, { mentions: [...mentions, autorId] });
    }
};