// --- Importações de Módulos ---
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// ALTERAÇÃO AQUI: ADIÇÃO de maisProvavelState ao import do gameState
const { 
    jogoDoMatchState, 
    verdadeOuDesafioState, 
    maisProvavelState,
    // NOVO: Adições para bloqueio e spam
    spamTracker,
    SPAM_MAX_COMMANDS,
    SPAM_TIME_WINDOW,
    SPAM_BLOCK_DURATION,
    tempBlockedUsers // Importa o rastreador de bloqueios temporários
} = require('./gameState'); // Ajuste o caminho se gameState.js não estiver na raiz

// --- Fim das Importações de Módulos ---

// --- NOVO: Definição do ID do Administrador do Bot ---
// *** ATENÇÃO: SUBSTITUA 'SEU_NUMERO_DE_WHATSAPP@c.us' PELO SEU PRÓPRIO ID ***
// Exemplo: '5511999999999@c.us'
const ownerId = '5518997572004@c.us'; 
// --- Fim da Definição do ID do Administrador ---


// --- Funções Auxiliares para JSON (EXISTENTES) ---
function carregarJson(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Erro ao ler/parsear ${filePath}:`, e);
            return {}; // Retorna um objeto vazio em caso de erro
        }
    }
    return {}; // Se o arquivo não existe, retorna um objeto vazio
}

function salvarJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
// --- Fim das Funções Auxiliares ---

// --- Caminhos dos Arquivos de Dados ---
const arquivoTempo = path.join(__dirname, 'data', 'tempo.json');
const arquivoRanking = path.join(__dirname, 'data', 'ranking.json');
const arquivoFrasesPersonalizadas = path.join(__dirname, 'data', 'frasesPersonalizadas.json');
// NOVO: Caminho para o arquivo de usuários bloqueados permanentemente
const arquivoBlockedUsers = path.join(__dirname, 'data', 'blockedUsers.json');
// --- Fim dos Caminhos dos Arquivos de Dados ---

// Cria o cliente do bot com autenticação local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Certifique-se de que headless está como você deseja (true para rodar em background)
        args: ['--no-sandbox']
    }
});

// Carrega comandos da pasta /commands
const comandos = new Map();
const comandosPath = path.join(__dirname, 'commands');

fs.readdirSync(comandosPath).forEach(file => {
    if (file.endsWith('.js')) {
        const comando = require(path.join(comandosPath, file));
        // O nome do comando será !maisprovavel (já que o arquivo será maisprovavel.js)
        const nome = '!' + file.replace('.js', '');
        comandos.set(nome, comando);
    }
});

// Exibe o QR Code no terminal
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Escaneie o QR code com o WhatsApp do número do bot.');
});

// Confirma quando o bot está pronto
client.on('ready', () => {
    console.log('🤖 Bliss está online e pronta!');
});

// --- Mensagem de Boas-Vindas para Novos Participantes (EXISTENTE) ---
client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const participant = await client.getContactById(notification.recipientIds[0]);

    if (chat.isGroup) {
        const welcomeMessage = `
Bem-vindo(a) ao grupo, @${participant.id.user}! 🎉

Para uma melhor experiência e para que todos se conheçam, pedimos que faça sua apresentação preenchendo o modelo abaixo:

🏳‍🌈 APRESENTAÇÃO 🏳‍🌈

❖ Foto:
❖ Nome:
❖ Pronome:
❖ Sexualidade:
❖ Idade:
❖ Região de SP:
❖ Uma curiosidade sobre você:
❖ Instagram:

Aproveite o grupo! 😉
        `;
        await chat.sendMessage(welcomeMessage, {
            mentions: [participant]
        });
        console.log(`Mensagem de boas-vindas enviada para ${participant.id.user} no grupo ${chat.name}`);
    }
});
// --- Fim da Mensagem de Boas-Vindas ---

// Escuta mensagens recebidas
client.on('message', async (msg) => {
    // --- Lógica de Atualização para tempo.json e ranking.json (EXISTENTE) ---
    // Apenas ignora mensagens do próprio bot
    if (msg.fromMe) return;

    const autorId = msg.author || msg.from;
    let autorContact;
    try {
        autorContact = await client.getContactById(autorId);
    } catch (e) {
        console.error('Erro ao obter contato do autor:', e);
        autorContact = { pushname: 'Usuário', verifiedName: 'Usuário', name: 'Usuário', id: { user: autorId.split('@')[0] } };
    }

    const now = Date.now(); // Tempo atual em milissegundos

    // --- NOVO: 1. Verificação de Bloqueio Manual Temporário (PRIORIDADE ALTA) ---
    if (tempBlockedUsers[autorId] && tempBlockedUsers[autorId] > now) {
        console.log(`Usuário ${autorId} está bloqueado manualmente temporariamente.`);
        // Opcional: pode adicionar uma flag para enviar o aviso apenas uma vez a cada bloqueio
        await msg.reply(`⚠️ ${autorContact.pushname || autorContact.verifiedName || autorContact.name}, você está temporariamente bloqueado(a) de usar o bot por decisão de um administrador. Por favor, aguarde.`, null, { mentions: [autorContact] });
        return; // Ignora a mensagem
    } else if (tempBlockedUsers[autorId] && tempBlockedUsers[autorId] <= now) {
        // Se o tempo de bloqueio expirou, remove o usuário da lista
        delete tempBlockedUsers[autorId];
        console.log(`Bloqueio temporário de ${autorId} expirou.`);
    }
    // --- FIM DA VERIFICAÇÃO DE BLOQUEIO MANUAL TEMPORÁRIO ---

    // --- NOVO: 2. Verificação de Bloqueio Permanente (ALTA PRIORIDADE) ---
    let blockedUsers = [];
    try {
        if (fs.existsSync(arquivoBlockedUsers)) {
            blockedUsers = JSON.parse(fs.readFileSync(arquivoBlockedUsers, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao carregar blockedUsers.json para verificação:', e);
        // Em caso de erro, assume lista vazia para não bloquear indevidamente
        blockedUsers = []; 
    }

    if (blockedUsers.includes(autorId)) {
        console.log(`Usuário ${autorId} está bloqueado permanentemente. Ignorando.`);
        return; // Ignora a mensagem
    }
    // --- FIM DA VERIFICAÇÃO DE BLOQUEIO PERMANENTE ---

    // --- NOVO: 3. Verificação de SPAM (Automática) ---
    // Apenas rastrear mensagens que parecem ser comandos (começam com '!')
    const isCommand = msg.body.trim().startsWith('!');
    
    // Inicializa o rastreador para o usuário se não existir
    if (!spamTracker[autorId]) {
        spamTracker[autorId] = {
            lastCommandTime: now,
            commandCount: 0,
            blockedUntil: 0,
            spamWarningSent: false
        };
    }
    const userData = spamTracker[autorId];

    // Verifica se o usuário já está automaticamente bloqueado por spam
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
    // --- FIM DA VERIFICAÇÃO DE SPAM ---


    if (msg.id.remote.endsWith('@g.us')) { // Apenas processa mensagens de grupos
        const chat = await msg.getChat();
        const groupId = chat.id._serialized;
        // ... (o resto da lógica de tempo.json, ranking.json, !maisprovavel) ...
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
    // --- Fim da Lógica de Atualização para grupos ---

    // Processamento de comandos (apenas se a mensagem começar com '!')
    const partes = msg.body.trim().toLowerCase().split(' ');
    const comando = partes[0];
    const args = partes.slice(1);

    // Verifica se o comando existe e executa
    if (comandos.has(comando)) {
        const comandoObj = comandos.get(comando);

        try {
            if (typeof comandoObj === 'function') {
                // Comando antigo: função simples (ex: !match, !jogodomatch ou !vod ou !maisprovavel)
                // NOVO: Passando ownerId para comandos que podem precisar
                await comandoObj(client, msg, args, ownerId); 
            } else if (typeof comandoObj.execute === 'function') {
                // Comando novo: possui método execute()
                // NOVO: Passando ownerId para comandos que podem precisar
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

// Inicia o cliente
client.initialize();