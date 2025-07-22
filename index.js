// --- Importações de Módulos ---
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// ALTERAÇÃO AQUI: ADIÇÃO de maisProvavelState ao import do gameState
const { jogoDoMatchState, verdadeOuDesafioState, maisProvavelState } = require('./gameState'); // Ajuste o caminho se gameState.js não estiver na raiz

// --- Fim das Importações de Módulos ---

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

    if (msg.id.remote.endsWith('@g.us')) { // Apenas processa mensagens de grupos
        const chat = await msg.getChat();
        const groupId = chat.id._serialized;
        const userId = msg.author || msg.from; // Quem enviou a mensagem

        let tempoData = carregarJson(arquivoTempo);
        if (!tempoData[groupId]) {
            tempoData[groupId] = {};
        }
        tempoData[groupId][userId] = Date.now();
        salvarJson(arquivoTempo, tempoData);

        // Somente mensagens de 'chat' contribuem para o ranking de mensagens
        if (msg.type === 'chat') {
            let rankingData = carregarJson(arquivoRanking);
            if (!rankingData[groupId]) {
                rankingData[groupId] = {};
            }
            rankingData[groupId][userId] = (rankingData[groupId][userId] || 0) + 1;
            salvarJson(arquivoRanking, rankingData);
        }

        // --- INÍCIO DA LÓGICA DO !MAISPROVAVEL (ADICIONADA AQUI) ---
        // Esta lógica captura menções para votação em qualquer mensagem,
        // desde que o jogo !maisprovavel esteja ativo no grupo.
        if (maisProvavelState.isActive && maisProvavelState.groupId === groupId && msg.mentionedIds && msg.mentionedIds.length > 0) {
            const idMencionado = msg.mentionedIds[0]; // Pega a primeira pessoa mencionada

            // Obtém todos os IDs dos participantes do grupo (excluindo o bot)
            const todosParticipantesIds = chat.participants
                .filter(p => p.id._serialized !== client.info.wid._serialized)
                .map(p => p.id._serialized);

            // Verifica se a menção é de um participante válido do grupo e não é o próprio votante
            if (todosParticipantesIds.includes(idMencionado) && idMencionado !== userId) {
                maisProvavelState.votes[idMencionado] = (maisProvavelState.votes[idMencionado] || 0) + 1;
                console.log(`[MAIS PROVÁVEL - Voto] ${userId} votou em ${idMencionado}. Votos atuais:`, maisProvavelState.votes);
                // Opcional: Reagir à mensagem para confirmar o voto (pode gerar muito tráfego em grupos grandes)
                // await msg.react('✅');
            } else if (idMencionado === userId) {
                // Mensagem de erro para votação em si mesmo (pode ser omitida para não poluir o chat)
                console.log(`[MAIS PROVÁVEL - Erro] ${userId} tentou votar em si mesmo.`);
            } else {
                // Mensagem de erro para menção inválida (pode ser omitida)
                console.log(`[MAIS PROVÁVEL - Erro] ${userId} mencionou um ID inválido para voto.`);
            }
        }
        // --- FIM DA LÓGICA DO !MAISPROVAVEL ---
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
                await comandoObj(client, msg); // Passa 'msg' que contém body, mentionedIds, etc.
            } else if (typeof comandoObj.execute === 'function') {
                // Comando novo: possui método execute()
                await comandoObj.execute(client, msg, args); // Mantém a passagem de args caso algum comando execute precise
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