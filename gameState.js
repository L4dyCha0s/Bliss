// Este arquivo gerencia o estado global dos jogos e de outras funcionalidades.
// Se o seu bot for reiniciado, este estado será perdido, a menos que seja salvo em algum lugar.

let jogoDoMatchState = {
    isActive: false, // Indica se uma rodada do Jogo do Match está ativa
    currentChooserId: null, // ID serializado do contato que foi sorteado para escolher
    currentChooserContact: null, // Objeto de contato do sorteado (para facilitar menções)
    chooserTimeout: null, // ID do timeout para limpar se a pessoa fizer a escolha
};

let verdadeOuDesafioState = {
    isActive: false, // Indica se uma rodada de Verdade ou Desafio está ativa
    currentPlayerId: null, // ID do jogador atual que precisa responder/realizar
    currentPlayerContact: null, // Objeto de contato do jogador atual
    choice: null, // 'verdade' ou 'desafio'
    level: 0, // Nível de "pesado" da pergunta/desafio (1 a 5)
    gameTimeout: null, // Timeout para a resposta do jogador
    nextChooserId: null, // ID da pessoa que tem o direito de iniciar a próxima rodada
};

// NOVO ESTADO PARA "QUEM É O MAIS PROVÁVEL DE...?" (Com nome da variável ajustado)
let maisProvavelState = {
    isActive: false, // Indica se uma rodada está ativa
    currentQuestion: null, // A pergunta gerada pela IA
    votes: {}, // Objeto para armazenar os votos: { 'idDoUsuarioVotado': contagem }
    voteTimeout: null, // Timeout para o período de votação
};

// --- NOVOS ESTADOS E CONSTANTES PARA O SISTEMA DE BLOQUEIO E ANTI-SPAM ---

// Objeto para rastrear usuários bloqueados manualmente temporariamente
// Formato: { userId: timestamp_até_o_bloqueio_expirar }
const tempBlockedUsers = {}; 

// Objeto para rastrear o uso de comandos por usuário (para anti-spam automático)
// Formato: { userId: { lastCommandTime: timestamp, commandCount: number, blockedUntil: timestamp, spamWarningSent: boolean } }
const spamTracker = {}; 

// Constantes para controle de SPAM automático
const SPAM_MAX_COMMANDS = 5; // Número máximo de comandos permitidos
const SPAM_TIME_WINDOW = 10 * 1000; // Dentro de 10 segundos (em milissegundos)
const SPAM_BLOCK_DURATION = 60 * 1000; // Bloquear por 60 segundos (em milissegundos) se o limite for atingido

// --- FIM DOS NOVOS ESTADOS E CONSTANTES ---

// --- NOVO ESTADO para "Saidinha" ---
let saidinhaState = {
    isActive: false, // Indica se uma sugestão de saidinha está aguardando aprovação
    authorId: null, // O ID do membro que fez a sugestão
    proposalMessage: null, // O objeto da mensagem original com a ficha preenchida
};

// --- NOVO ESTADO para o sistema de MUTE que apaga mensagens ---
// Formato: { userId: timestamp_até_o_bloqueio_expirar }
let tempMutedUsers = {};

// --- NOVO ESTADO PARA O SISTEMA DE VOTAÇÃO DE BANIMENTO (ATUALIZADO) ---
let banVote = {
    isActive: false, // Indica se há uma votação de banimento ativa
    groupId: null, // ID do grupo onde a votação está ocorrendo
    proposerId: null, // ID do usuário que propôs o banimento
    targetUserId: null, // ID do usuário alvo do banimento
    targetUserContact: null, // Objeto de contato do usuário alvo
    votes: [], // Array com os IDs dos usuários que votaram
    voteMessageId: null, // ID da mensagem de votação para edição
    startTime: null, // Timestamp de quando a votação começou
    timeoutDuration: 10 * 60 * 1000, // 10 minutos de duração da votação
    timeout: null // Referência do timeout para limpar
};

// --- NOVO ESTADO para usuários que não querem ser notificados ---
let silentUsers = {}; // Formato: { userId: true/false }

// --- CONSTANTES DE TIMEOUT ---
const TIMEOUT_DURATION_MATCH = 5 * 60 * 1000; // 5 minutos para o Jogo do Match
const TIMEOUT_DURATION_VOD = 5 * 60 * 1000; // 5 minutos para Verdade ou Desafio
const TIMEOUT_DURATION_MAIS_PROVAVEL = 2 * 60 * 1000; // 2 minutos para votar no Mais Provável de...?

// --- FUNÇÕES ÚTEIS PARA GERENCIAMENTO DE ESTADO ---

// Função para resetar todos os jogos
function resetAllGames() {
    jogoDoMatchState.isActive = false;
    jogoDoMatchState.currentChooserId = null;
    jogoDoMatchState.currentChooserContact = null;
    clearTimeout(jogoDoMatchState.chooserTimeout);
    jogoDoMatchState.chooserTimeout = null;

    verdadeOuDesafioState.isActive = false;
    verdadeOuDesafioState.currentPlayerId = null;
    verdadeOuDesafioState.currentPlayerContact = null;
    verdadeOuDesafioState.choice = null;
    verdadeOuDesafioState.level = 0;
    clearTimeout(verdadeOuDesafioState.gameTimeout);
    verdadeOuDesafioState.gameTimeout = null;
    verdadeOuDesafioState.nextChooserId = null;

    maisProvavelState.isActive = false;
    maisProvavelState.currentQuestion = null;
    maisProvavelState.votes = {};
    clearTimeout(maisProvavelState.voteTimeout);
    maisProvavelState.voteTimeout = null;

    saidinhaState.isActive = false;
    saidinhaState.authorId = null;
    saidinhaState.proposalMessage = null;

    // Não resetar tempMutedUsers, banVote e silentUsers pois são preferências
}

// Função para verificar se algum jogo está ativo
function isAnyGameActive() {
    return jogoDoMatchState.isActive || 
           verdadeOuDesafioState.isActive || 
           maisProvavelState.isActive ||
           saidinhaState.isActive;
}

// Função para resetar votação de banimento
function resetBanVote() {
    banVote.isActive = false;
    banVote.groupId = null;
    banVote.proposerId = null;
    banVote.targetUserId = null;
    banVote.targetUserContact = null;
    banVote.votes = [];
    banVote.voteMessageId = null;
    banVote.startTime = null;
    if (banVote.timeout) {
        clearTimeout(banVote.timeout);
        banVote.timeout = null;
    }
}

module.exports = {
    jogoDoMatchState,
    verdadeOuDesafioState,
    maisProvavelState,
    saidinhaState,
    tempMutedUsers,
    banVote, // ✅ Estado atualizado para votação de banimento
    silentUsers, // ✅ Novo estado para usuários silenciados
    tempBlockedUsers,
    spamTracker,
    SPAM_MAX_COMMANDS,
    SPAM_TIME_WINDOW,
    SPAM_BLOCK_DURATION,
    TIMEOUT_DURATION_MATCH,
    TIMEOUT_DURATION_VOD,
    TIMEOUT_DURATION_MAIS_PROVAVEL,

    // Funções de utilidade
    resetAllGames,
    isAnyGameActive,
    resetBanVote
};