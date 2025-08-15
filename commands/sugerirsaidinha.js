const { saidinhaState } = require('../gameState');

module.exports = {
    name: 'sugerirsaidinha',
    description: 'Envia a ficha de saidinha para aprovação dos administradores. Use como resposta à sua ficha preenchida.',
    async execute(client, msg) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            msg.reply('Este comando só pode ser usado em grupos.');
            return;
        }

        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Para sugerir uma saidinha, você deve responder à sua ficha preenchida com `!sugerirsaidinha`.');
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();
        const autorId = msg.author || msg.from;
        
        // --- Extrair dados da ficha (lógica mantida) ---
        const fichaText = quotedMsg.body;
        const nomeMatch = fichaText.match(/Nome:\s*\[?(.*?)]?\n/);
        const dataMatch = fichaText.match(/Data:\s*(.*?)\n/);
        const horaMatch = fichaText.match(/Hora:\s*(.*?)\n/);
        const localMatch = fichaText.match(/Local:\s*\[?(.*?)]?\n/);
        const estiloMatch = fichaText.match(/Estilo:\s*\[?(.*?)]?\n/);
        const descricaoMatch = fichaText.match(/Descrição:\s*\[?(.*?)]?\n/);
        const pontoMatch = fichaText.match(/Ponto de Encontro:\s*\[?(.*?)]?/);

        if (!nomeMatch || !dataMatch || !localMatch || !descricaoMatch) {
            msg.reply('❌ Ficha de saidinha incompleta. Por favor, preencha todos os campos e tente novamente.');
            return;
        }

        const saidinhaId = Date.now().toString(); // NOVO: ID único para cada saidinha

        const proposal = {
            id: saidinhaId, // NOVO: Adiciona o ID único ao objeto
            nome: nomeMatch[1].trim(),
            data: dataMatch[1].trim(),
            hora: horaMatch[1].trim(),
            local: localMatch[1].trim(),
            estilo: estiloMatch ? estiloMatch[1].trim() : 'Não especificado',
            descricao: descricaoMatch[1].trim(),
            pontoDeEncontro: pontoMatch ? pontoMatch[1].trim() : 'Não especificado',
            authorId: autorId,
            groupId: chat.id._serialized,
            proposalMessageId: quotedMsg.id._serialized
        };

        saidinhaState.push(proposal); // ALTERAÇÃO: Adiciona a proposta ao array
        
        const allParticipants = await chat.getParticipants();
        const admins = allParticipants.filter(p => p.isAdmin);
        const adminIds = admins.map(admin => admin.id._serialized);
        
        let mensagemAdmins = `
📣 *NOVA SAIDINHA PROPOSTA!* 📣
*ID do Pedido:* #${saidinhasId}

*Proponente:* @${(await client.getContactById(autorId)).id.user}

*Ficha:*
*Nome:* ${proposal.nome}
*Data:* ${proposal.data} às ${proposal.hora}
*Local:* ${proposal.local}
*Descrição:* ${proposal.descricao}
*Estilo:* ${proposal.estilo}

Para aprovar, um admin deve usar o comando \`!aprovarsaidinha ${saidinhasId}\`.
Para recusar, use \`!recusarsaidinha ${saidinhasId}\`.
`;
        const sentMessage = await chat.sendMessage(mensagemAdmins, { 
            mentions: [...adminIds, autorId] 
        });

        const saidinhaIndex = saidinhaState.findIndex(s => s.id === saidinhaId);
        if (saidinhaIndex !== -1) {
            saidinhaState[saidinhaIndex].approvalMessageId = sentMessage.id._serialized;
        }

        msg.reply('✅ Sua sugestão foi enviada para os administradores. Aguarde a aprovação.');
    }
};