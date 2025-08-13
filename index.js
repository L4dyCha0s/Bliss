// --- Importações de Módulos ---
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { 
    jogoDoMatchState, 
    verdadeOuDesafioState, 
    maisProvavelState,
    spamTracker,
    SPAM_MAX_COMMANDS,
    SPAM_TIME_WINDOW,
    SPAM_BLOCK_DURATION,
    tempBlockedUsers,
    // NOVO: Importa os estados para mute e ban
    tempMutedUsers,
    banVote
} = require('./gameState'); 

// --- Fim das Importações de Módulos ---

// --- Definição do ID do Administrador do Bot (UM ÚNICO ADMIN) ---
// **Seu user ID para o bot reconhecer como admin**
const ownerId = '5518997572004@c.us'; 
// --- Fim da Definição do ID do Administrador ---

// --- NOVO: ID do Grupo Específico para a mensagem de boas-vindas ---
const TARGET_GROUP_ID = '120363336898986670@g.us'; 
// Substitua 'SEU_ID_DE_GRUPO_AQUI@g.us' pelo ID real do seu grupo.

// --- Funções Auxiliares para JSON (EXISTENTES) ---
function carregarJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            // Garante que para arquivos como blockedUsers.json ou admins.json, retorne array vazio
            // Se for para arquivos de ranking/tempo que esperam um objeto, retorne objeto vazio
            const content = fs.readFileSync(filePath, 'utf8');
            return content ? JSON.parse(content) : {}; 
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return {}; 
        }
    }
    return {}; 
}

function salvarJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
// --- Fim das Funções Auxiliares ---

// --- Caminhos dos Arquivos de Dados ---
const arquivoTempo = path.join(__dirname, 'data', 'tempo.json');
const arquivoRanking = path.join(__dirname, 'data', 'ranking.json');
const arquivoFrasesPersonalizadas = path.join(__dirname, 'data', 'frasesPersonalizadas.json');
const arquivoBlockedUsers = path.join(__dirname, 'data', 'blockedUsers.json');
// Se você está usando ownerId fixo e não admins.json, pode remover esta linha:
// const arquivoAdmins = path.join(__dirname, 'data', 'admins.json');
// --- Fim dos Caminhos dos Arquivos de Dados ---

// Cria o cliente do bot com autenticação local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, 
        args: ['--no-sandbox']
    }
});

// Carrega comandos da pasta /commands
const comandos = new Map();
const comandosPath = path.join(__dirname, 'commands');

fs.readdirSync(comandosPath).forEach(file => {
    if (file.endsWith('.js')) {
        const comando = require(path.join(comandosPath, file));
        const nome = '!' + file.replace('.js', '');
        comandos.set(nome, comando);
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Escaneie o QR code com o WhatsApp do número do bot.');
});

client.on('ready', () => {
    console.log('🤖 Bliss está online e pronta!');
});

client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const participant = await client.getContactById(notification.recipientIds[0]);

    // CORREÇÃO AQUI: Verifica se é o grupo alvo
    if (chat.isGroup && chat.id._serialized === TARGET_GROUP_ID) {
        const welcomeMessage = `
Bem-vindo(a) ao grupo, @${participant.id.user}! 🎉

Para uma melhor experiência e para que todos se conheçam, pedimos que faça sua apresentação preenchendo o modelo abaixo (sem visualização unica):

🏳‍🌈 APRESENTAÇÃO 🏳‍🌈

❖ Foto:
❖ Nome:
❖ Pronome:
❖ Sexualidade:
❖ Idade:
❖ Região de SP:
❖ Uma curiosidade sobre você:
❖ Instagram:

Digite !regras para ver as regras do grupo
Aproveite o grupo! 😉
        `;
        await chat.sendMessage(welcomeMessage, {
            mentions: [participant]
        });
        console.log(`Mensagem de boas-vindas enviada para ${participant.id.user} no grupo ${chat.name}`);
    }
});

client.on('message', async (msg) => {
    if (msg.fromMe) return;

    // CORRIGIDO: userId definido no escopo mais amplo
    const userId = msg.author || msg.from; 
    const autorId = userId; // autorId é o mesmo que userId neste contexto

    let autorContact;
    try {
        autorContact = await client.getContactById(autorId);
    } catch (e) {
        console.error('Erro ao obter contato do autor:', e);
        autorContact = { pushname: 'Usuário', verifiedName: 'Usuário', name: 'Usuário', id: { user: autorId.split('@')[0] } };
    }

    const now = Date.now();

    // --- NOVO: Verificação de Mute Temporário que apaga mensagens ---
    if (tempMutedUsers[autorId] && tempMutedUsers[autorId] > now) {
        console.log(`Usuário ${autorId} está silenciado. Apagando mensagem.`);
        
        try {
            await msg.delete(true); 
        } catch (e) {
            console.error('Erro ao apagar mensagem de usuário silenciado:', e);
        }
        return; // Interrompe a execução para não processar comandos
    } else if (tempMutedUsers[autorId] && tempMutedUsers[autorId] <= now) {
        // Remove o usuário da lista se o tempo de mute expirou
        delete tempMutedUsers[autorId];
        console.log(`Mute de ${autorId} expirou.`);
    }

    // --- 1. Verificação de Bloqueio Manual Temporário ---
    if (tempBlockedUsers[autorId] && tempBlockedUsers[autorId] > now) {
        console.log(`Usuário ${autorId} está bloqueado manualmente temporariamente.`);
        await msg.reply(`⚠️ ${autorContact.pushname || autorContact.verifiedName || autorContact.name}, você está temporariamente bloqueado(a) de usar o bot por decisão de um administrador. Por favor, aguarde.`, null, { mentions: [autorContact] });
        return; 
    } else if (tempBlockedUsers[autorId] && tempBlockedUsers[autorId] <= now) {
        delete tempBlockedUsers[autorId];
        console.log(`Bloqueio temporário de ${autorId} expirou.`);
    }

    // --- 2. Verificação de Bloqueio Permanente ---
    let blockedUsers = [];
    try {
        if (fs.existsSync(arquivoBlockedUsers)) {
            // Garante que blockedUsers seja um array, mesmo se o arquivo estiver vazio ou corrompido para JSON
            const content = fs.readFileSync(arquivoBlockedUsers, 'utf8');
            blockedUsers = content ? JSON.parse(content) : []; 
        }
    } catch (e) {
        console.error('Erro ao carregar blockedUsers.json para verificação:', e);
        blockedUsers = []; 
    }

    if (blockedUsers.includes(autorId)) {
        console.log(`Usuário ${autorId} está bloqueado permanentemente. Ignorando.`);
        return; 
    }

    // --- 3. Verificação de SPAM (Automática) ---
    const isCommand = msg.body.trim().startsWith('!');
    
    if (!spamTracker[autorId]) {
        spamTracker[autorId] = {
            lastCommandTime: now,
            commandCount: 0,
            blockedUntil: 0,
            spamWarningSent: false
        };
    }
    const userData = spamTracker[autorId];

    if (userData.blockedUntil > now) {
        console.log(`Usuário ${autorId} está temporariamente bloqueado por spam.`);
        if (!userData.spamWarningSent) {
             await msg.reply(`⚠️ ${autorContact.pushname || autorContact.verifiedName || autorContact.name}, por favor, não flode! Você está temporariamente bloqueado(a) por ${SPAM_BLOCK_DURATION / 1000} segundos.`, null, { mentions: [autorContact] });
             userData.spamWarningSent = true;
        }
        return;
    } else {
        userData.spamWarningSent = false;
    }

    if (isCommand) {
        if (now - userData.lastCommandTime > SPAM_TIME_WINDOW) {
            userData.commandCount = 1;
            userData.lastCommandTime = now;
        } else {
            userData.commandCount++;
        }

        if (userData.commandCount > SPAM_MAX_COMMANDS) {
            userData.blockedUntil = now + SPAM_BLOCK_DURATION;
            userData.commandCount = 0;
            userData.lastCommandTime = now;
            userData.spamWarningSent = true;
            console.log(`Usuário ${autorId} flodou e foi bloqueado por ${SPAM_BLOCK_DURATION / 1000} segundos.`);
            await msg.reply(`⚠️ ${autorContact.pushname || autorContact.verifiedName || autorContact.name}, por favor, não flode! Você está temporariamente bloqueado(a) por ${SPAM_BLOCK_DURATION / 1000} segundos.`, null, { mentions: [autorContact] });
            return;
        }
    }

    if (msg.id.remote.endsWith('@g.us')) { 
        const chat = await msg.getChat();
        const groupId = chat.id._serialized;
        
        let tempoData = carregarJson(arquivoTempo);
        if (!tempoData[groupId]) {
            tempoData[groupId] = {};
        }
        tempoData[groupId][userId] = Date.now();
        salvarJson(arquivoTempo, tempoData);

        if (msg.type === 'chat') {
            let rankingData = carregarJson(arquivoRanking);
            if (!rankingData[groupId]) {
                rankingData[groupId] = {};
            }
            rankingData[groupId][userId] = (rankingData[groupId][userId] || 0) + 1;
            salvarJson(arquivoRanking, rankingData);
        }

        if (maisProvavelState.isActive && maisProvavelState.groupId === groupId && msg.mentionedIds && msg.mentionedIds.length > 0) {
            const idMencionado = msg.mentionedIds[0];
            const todosParticipantesIds = chat.participants
                .filter(p => p.id._serialized !== client.info.wid._serialized)
                .map(p => p.id._serialized);

            if (todosParticipantesIds.includes(idMencionado) && idMencionado !== userId) {
                maisProvavelState.votes[idMencionado] = (maisProvavelState.votes[idMencionado] || 0) + 1;
                console.log(`[MAIS PROVÁVEL - Voto] ${userId} votou em ${idMencionado}. Votos atuais:`, maisProvavelState.votes);
            } else if (idMencionado === userId) {
                console.log(`[MAIS PROVÁVEL - Erro] ${userId} tentou votar em si mesmo.`);
            } else {
                console.log(`[MAIS PROVÁVEL - Erro] ${userId} mencionou um ID inválido para voto.`);
            }
        }
    }
    
    // --- NOVO: Bloco para processar a votação de banimento ---
    const chat = await msg.getChat();
    const groupId = chat.id._serialized;
    const comandoVoto = msg.body.trim().toLowerCase();

    if (comandoVoto === '!votarbanir' && banVote.isActive && banVote.groupId === groupId) {
        // Verifica se a mensagem de votação está respondendo à mensagem correta
        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Para votar, você deve responder à mensagem de votação com `!votarbanir`.');
            return;
        }
        
        const quotedMsg = await msg.getQuotedMessage();
        const voteMessageContent = `O membro @${banVote.targetUserName} foi indicado para ser expulso.`;
        if (!quotedMsg.body.includes(voteMessageContent)) {
            return; // Ignora se não está respondendo à mensagem correta
        }

        // Verifica se a pessoa já votou
        if (banVote.votes.includes(autorId)) {
            msg.reply('⚠️ Você já votou nesta rodada.');
            return;
        }
        
        // A pessoa não pode votar em si mesma (se for o alvo) ou no voto que ela mesma iniciou
        if (autorId === banVote.targetUserId || autorId === banVote.proposerId) {
            msg.reply('⚠️ Você não pode votar nesta rodada.');
            return;
        }

        // Adiciona o voto
        banVote.votes.push(autorId);
        const votosAtuais = banVote.votes.length;
        const votosNecessarios = 10;

        if (votosAtuais >= votosNecessarios) {
            // Votação aprovada, expulsa o membro
            try {
                await chat.removeParticipants([banVote.targetUserId]);
                msg.reply(`✅ Votação concluída! Com ${votosAtuais} votos, @${banVote.targetUserName} foi expulso(a) do grupo.`);
            } catch (error) {
                console.error('Erro ao expulsar membro por votação:', error);
                msg.reply('❌ Ocorreu um erro ao expulsar o membro. O bot pode não ter permissão de administrador.');
            } finally {
                // Reseta o estado da votação
                banVote.isActive = false;
                banVote.groupId = null;
                banVote.proposerId = null;
                banVote.targetUserId = null;
                banVote.votes = [];
            }
        } else {
            msg.reply(`🗳️ Voto registrado! Faltam ${votosNecessarios - votosAtuais} votos para o banimento.`);
        }
    }

    const partes = msg.body.trim().toLowerCase().split(' ');
    const comando = partes[0];
    const args = partes.slice(1);

    if (comandos.has(comando)) {
        const comandoObj = comandos.get(comando);

        try {
            if (typeof comandoObj === 'function') {
                // Passando ownerId para comandos que precisam de permissão de admin
                await comandoObj(client, msg, args, ownerId); 
            } else if (typeof comandoObj.execute === 'function') {
                // Passando ownerId para comandos que precisam de permissão de admin
                await comandoObj.execute(client, msg, args, ownerId); 
            } else {
                await msg.reply('⚠️ Este comando não está corretamente formatado.');
            }
        } catch (err) {
            console.error('Erro ao executar comando', comando, err);
            msg.reply('❌ Ocorreu um erro ao executar o comando.');
        }
    }
});

client.initialize();