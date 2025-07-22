// Ajuste o caminho conforme a localização de gameState.js em relação à pasta 'commands'
// Se gameState.js está na raiz e 'commands' está na raiz, use '../gameState'
const { jogoDoMatchState, TIMEOUT_DURATION_MATCH } = require('../gameState'); // <-- AQUI: Importado TIMEOUT_DURATION_MATCH

// Função para resetar o estado do Jogo do Match
function resetJogoDoMatchState() {
    if (jogoDoMatchState.chooserTimeout) {
        clearTimeout(jogoDoMatchState.chooserTimeout);
    }
    jogoDoMatchState.isActive = false;
    jogoDoMatchState.currentChooserId = null;
    jogoDoMatchState.currentChooserContact = null;
    jogoDoMatchState.chooserTimeout = null;
}

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    const autorId = msg.author || msg.from;
    const autorContact = await client.getContactById(autorId);

    // --- Lógica para quando o jogo já está ativo ---
    if (jogoDoMatchState.isActive) {
        // Se outra pessoa tentar iniciar o jogo
        if (autorId !== jogoDoMatchState.currentChooserId) {
            await msg.reply(
                `Já temos alguém sorteado para o Jogo do Match! Aguarde a vez de @${jogoDoMatchState.currentChooserContact.id.user} para ele(a) revelar seu match!`,
                null,
                { mentions: [jogoDoMatchState.currentChooserContact] }
            );
            return;
        } else {
            // Se a própria pessoa sorteada tentar iniciar o jogo novamente
            // Isso significa que ela quer "passar a vez" ou reiniciar sua escolha.
            await msg.reply('Você desistiu da sua vez no Jogo do Match! Iniciaremos uma nova rodada.');
            resetJogoDoMatchState(); // <-- AQUI: Chama a função de reset
        }
    }

    // --- Lógica para iniciar uma nova partida ---

    // Obtém os participantes do grupo para o sorteio (exclui o bot)
    const participantesDisponiveis = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized) // Exclui o bot
        .map(p => p.id._serialized);

    // Adicionado o autor do comando na lista de participantes disponíveis, caso ele não esteja no filtro acima
    // Isso garante que o autor do comando possa ser sorteado, se for um participante válido do grupo.
    if (!participantesDisponiveis.includes(autorId) && chat.participants.some(p => p.id._serialized === autorId)) {
        participantesDisponiveis.push(autorId);
    }

    // Apenas para garantir que não há duplicatas, embora o filter e map já ajudem
    const uniqueParticipantes = [...new Set(participantesDisponiveis)];


    if (uniqueParticipantes.length < 2) { // <-- AQUI: Mudei para 2, pois precisamos de pelo menos 2 pessoas para o match
        msg.reply('Precisamos de pelo menos 2 participantes (além do bot) no grupo para iniciar o Jogo do Match.');
        return;
    }

    // Sortear uma pessoa aleatória entre os participantes disponíveis
    const sorteadoId = uniqueParticipantes[Math.floor(Math.random() * uniqueParticipantes.length)];
    const sorteadoContato = await client.getContactById(sorteadoId);

    // Atualiza o estado do jogo
    jogoDoMatchState.isActive = true;
    jogoDoMatchState.currentChooserId = sorteadoId;
    jogoDoMatchState.currentChooserContact = sorteadoContato;

    // Define um timeout para a pessoa sorteada fazer a sua escolha
    jogoDoMatchState.chooserTimeout = setTimeout(async () => {
        // Verifica se o jogo ainda está ativo e se a pessoa sorteada é a mesma
        // (para evitar que um timeout antigo afete um novo jogo)
        if (jogoDoMatchState.isActive && jogoDoMatchState.currentChooserId === sorteadoId) {
            await chat.sendMessage(
                `⏰ Tempo esgotado para o @${sorteadoContato.id.user} no Jogo do Match! O match não foi revelado. Que pena! 💔\n\nEnvie \`!jogodomatch\` novamente para começar uma nova rodada.`,
                { mentions: [sorteadoContato] }
            );
            resetJogoDoMatchState(); // <-- AQUI: Chama a função de reset
        }
    }, TIMEOUT_DURATION_MATCH); // <-- AQUI: Usando TIMEOUT_DURATION_MATCH

    // Explica a dinâmica do jogo e anuncia a pessoa sorteada
    const explicacao =
        `🎉 *Bem-vindos ao Jogo do Match!* 🎉\n\n` +
        `Eu vou sortear uma pessoa do grupo. Essa pessoa terá a missão de revelar quem ela quer neste grupo usando o comando \`!match @[nome da pessoa que ela quer]\`. Vamos ver quem será o sortudo(a) a ter seu match revelado! Você tem *${TIMEOUT_DURATION_MATCH / 1000 / 60} minutos* para fazer sua escolha!`; // <-- AQUI: Adicionei a duração no texto

    await chat.sendMessage(explicacao);
    await chat.sendMessage(`\nE a pessoa sorteada para o Jogo do Match é... @${sorteadoContato.id.user}!`, { mentions: [sorteadoContato] });
    await chat.sendMessage(
        `\nAgora, @${sorteadoContato.id.user}, use \`!match @[nome da pessoa que você quer]\` para revelar seu match!`,
        { mentions: [sorteadoContato] }
    );
};