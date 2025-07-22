// Este arquivo gerencia o estado global dos jogos.
// Se o seu bot for reiniciado, este estado será perdido.
// Para persistência, você precisaria de um banco de dados ou salvar em um arquivo.

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


const TIMEOUT_DURATION_MATCH = 5 * 60 * 1000; // 5 minutos para o Jogo do Match
const TIMEOUT_DURATION_VOD = 3 * 60 * 1000; // 3 minutos para Verdade ou Desafio
const TIMEOUT_DURATION_MAIS_PROVAVEL = 2 * 60 * 1000; // 2 minutos para votar no Mais Provável de...?

module.exports = {
    jogoDoMatchState,
    verdadeOuDesafioState,
    maisProvavelState, // Exporta o novo estado
    TIMEOUT_DURATION_MATCH,
    TIMEOUT_DURATION_VOD,
    TIMEOUT_DURATION_MAIS_PROVAVEL, // Exporta o novo timeout
};