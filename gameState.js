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


const TIMEOUT_DURATION_MATCH = 5 * 60 * 1000; // 5 minutos para o Jogo do Match
// --- ALTERAÇÃO AQUI: Duração do timeout para Verdade ou Desafio foi mudada para 5 minutos ---
const TIMEOUT_DURATION_VOD = 5 * 60 * 1000;
const TIMEOUT_DURATION_MAIS_PROVAVEL = 2 * 60 * 1000; // 2 minutos para votar no Mais Provável de...?

module.exports = {
    jogoDoMatchState,
    verdadeOuDesafioState,
    maisProvavelState, // Exporta o novo estado
    TIMEOUT_DURATION_MATCH,
    TIMEOUT_DURATION_VOD,
    TIMEOUT_DURATION_MAIS_PROVAVEL, // Exporta o novo timeout

    // NOVO: Exporta as variáveis do sistema de bloqueio e anti-spam
    tempBlockedUsers,
    spamTracker,
    SPAM_MAX_COMMANDS,
    SPAM_TIME_WINDOW,
    SPAM_BLOCK_DURATION,
};