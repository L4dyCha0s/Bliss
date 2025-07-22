const fs = require('fs');
const path = require('path');

const { maisProvavelState, TIMEOUT_DURATION_MAIS_PROVAVEL } = require('../gameState');
const { gerarConteudoComGemini } = require('../serviço-gemini'); // Ajuste o caminho

// Caminho do arquivo para salvar as perguntas já usadas
const perguntasUsadasPath = path.join(__dirname, '..', 'data', 'perguntas_usadas_maisprovavel.json');

// Função para carregar as perguntas salvas do arquivo
function carregarPerguntasUsadas() {
    try {
        if (fs.existsSync(perguntasUsadasPath)) {
            const data = fs.readFileSync(perguntasUsadasPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Erro ao carregar perguntas salvas:', e);
    }
    return [];
}

// Função para salvar uma nova pergunta no arquivo
function salvarNovaPergunta(novaPergunta) {
    let perguntasUsadas = carregarPerguntasUsadas();
    
    // Adiciona a nova pergunta ao início da lista
    perguntasUsadas.unshift(novaPergunta);
    
    // Limita o número de perguntas salvas para evitar que o arquivo fique muito grande
    const maxPerguntas = 50;
    if (perguntasUsadas.length > maxPerguntas) {
        perguntasUsadas = perguntasUsadas.slice(0, maxPerguntas);
    }

    try {
        fs.writeFileSync(perguntasUsadasPath, JSON.stringify(perguntasUsadas, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar nova pergunta:', e);
    }
}

// Função para resetar o estado do jogo "Mais Provável de...?"
function resetMaisProvavelState() {
    maisProvavelState.isActive = false;
    maisProvavelState.currentQuestion = null;
    maisProvavelState.votes = {};
    clearTimeout(maisProvavelState.voteTimeout); // Limpa qualquer timeout ativo
    maisProvavelState.voteTimeout = null;
    maisProvavelState.groupId = null; // Limpa o ID do grupo onde o jogo está ativo
}

module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    const autorId = msg.author || msg.from;
    const todosParticipantesIds = chat.participants
        .filter(p => p.id._serialized !== client.info.wid._serialized) // Exclui o bot
        .map(p => p.id._serialized);

    if (todosParticipantesIds.length < 2) {
        msg.reply('Precisamos de pelo menos 2 participantes no grupo (além do bot) para jogar "Quem é o Mais Provável de...?".');
        return;
    }

    if (maisProvavelState.isActive) {
        if (maisProvavelState.groupId && maisProvavelState.groupId !== chat.id._serialized) {
            msg.reply('Já existe um jogo "Quem é o Mais Provável de...?" ativo em outro grupo. Aguarde o término.');
            return;
        } else {
            msg.reply(`Um jogo "Quem é o Mais Provável de...?" já está em andamento com a pergunta: "${maisProvavelState.currentQuestion}". Mencione a pessoa que você acha que mais se encaixa!`);
            return;
        }
    }

    await msg.reply('🎉 *Quem é o Mais Provável de...?* está começando! 🎉\n\nPreparando uma pergunta com a energia do grupo...');

    // --- Lógica de geração de pergunta com base no histórico ---
    let perguntasUsadas = carregarPerguntasUsadas();
    let prompt;

    // Constrói o prompt com base nas perguntas já usadas
    if (perguntasUsadas.length > 0) {
        const perguntasFormatadas = perguntasUsadas.map(p => `"${p.replace(/"/g, '')}"`).join(', ');
        prompt = `Gere uma única e nova pergunta no formato "Quem é o mais provável de...?" para um jogo de grupo. A pergunta deve ser criativa, divertida, ter uma energia adulta e um toque "ousado" sem ser vulgar. **Não repita as seguintes perguntas:** ${perguntasFormatadas}. Pense em situações variadas como:
- Relacionamentos (crushes, ex, dates)
- Comportamentos sociais (festas, viagens, interações online)
- Segredos ou histórias engraçadas
- Desafios inusitados
A pergunta deve ser concisa, focada em uma única situação ou característica, e idealmente, algo que estimule a conversa no grupo.`;
    } else {
        // Prompt original se não houver perguntas no histórico
        prompt = `Gere uma única e nova pergunta no formato "Quem é o mais provável de...?" para um jogo de grupo. A pergunta deve ser criativa, divertida, ter uma energia adulta e um toque "ousado" sem ser vulgar. Pense em situações variadas como:
- Relacionamentos (crushes, ex, dates)
- Comportamentos sociais (festas, viagens, interações online)
- Segredos ou histórias engraçadas
- Desafios inusitados
A pergunta deve ser concisa, focada em uma única situação ou característica, e idealmente, algo que estimule a conversa no grupo.`;
    }

    let perguntaGerada;
    try {
        perguntaGerada = await gerarConteudoComGemini(prompt);
        
        if (!perguntaGerada || perguntaGerada.trim() === '') {
            perguntaGerada = 'Não foi possível gerar uma pergunta para você neste momento. Tente novamente!';
        }
    } catch (error) {
        console.error('Erro ao gerar conteúdo com Gemini para Mais Provável de...:', error);
        perguntaGerada = 'Houve um erro ao gerar a pergunta com a IA. Por favor, tente novamente mais tarde.';
    }

    // Atualiza o estado do jogo
    maisProvavelState.isActive = true;
    maisProvavelState.currentQuestion = perguntaGerada.trim();
    maisProvavelState.votes = {};
    maisProvavelState.groupId = chat.id._serialized;
    
    // Salva a nova pergunta no arquivo para uso futuro
    salvarNovaPergunta(perguntaGerada.trim());

    await chat.sendMessage(
        `*Pergunta:* ${maisProvavelState.currentQuestion}\n\n` +
        `Vote em quem você acha que mais se encaixa, **mencionando a pessoa**! Você tem ${TIMEOUT_DURATION_MAIS_PROVAVEL / 1000 / 60} minutos para votar.`
    );

    maisProvavelState.voteTimeout = setTimeout(async () => {
        if (maisProvavelState.isActive && maisProvavelState.groupId === chat.id._serialized) {
            let resultado = 'Ninguém votou nesta rodada. Que pena!';
            let vencedorId = null;
            let maxVotos = 0;

            for (const [votedId, count] of Object.entries(maisProvavelState.votes)) {
                if (count > maxVotos) {
                    maxVotos = count;
                    vencedorId = votedId;
                } else if (count === maxVotos && maxVotos > 0) {
                    vencedorId = 'EMPATE';
                }
            }

            if (vencedorId) {
                if (vencedorId === 'EMPATE') {
                    let empatados = [];
                    for (const [votedId, count] of Object.entries(maisProvavelState.votes)) {
                        if (count === maxVotos) {
                            empatados.push(await client.getContactById(votedId));
                        }
                    }
                    const mentions = empatados.map(c => c.id._serialized);
                    const nomes = empatados.map(c => `@${c.id.user}`).join(', ');
                    resultado = `Temos um *EMPATE*! As pessoas mais votadas foram: ${nomes} com ${maxVotos} voto(s) cada.`;
                    await chat.sendMessage(resultado, { mentions: mentions });

                } else {
                    const vencedorContact = await client.getContactById(vencedorId);
                    resultado = `De acordo com a maioria, o mais provável de ${maisProvavelState.currentQuestion.replace('Quem é o mais provável de', '').trim()} é... *${maxVotos} voto(s) para @${vencedorContact.id.user}!*`;
                    await chat.sendMessage(resultado, { mentions: [vencedorContact] });
                }
            } else {
                await chat.sendMessage(resultado);
            }

            await chat.sendMessage('Obrigado por jogar! Envie `!maisprovavel` novamente para uma nova rodada.');
            resetMaisProvavelState();
        }
    }, TIMEOUT_DURATION_MAIS_PROVAVEL);
};