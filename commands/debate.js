// commands/debate.js
const fs = require('fs');
const path = require('path');
const { gerarConteudoComGemini } = require('../serviço-gemini');

const debatesPath = path.join(__dirname, '..', 'data', 'debates.json');

// Carregar dados dos debates
function carregarDebates() {
    try {
        if (fs.existsSync(debatesPath)) {
            return JSON.parse(fs.readFileSync(debatesPath, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao carregar debates.json:', e);
    }
    return { temasUsados: [], historicoDebates: [], estatisticas: {} };
}

// Salvar dados dos debates
function salvarDebates(dados) {
    try {
        fs.writeFileSync(debatesPath, JSON.stringify(dados, null, 2));
        return true;
    } catch (e) {
        console.error('Erro ao salvar debates.json:', e);
        return false;
    }
}

// Gerar tema único que não foi usado
async function gerarTemaUnico() {
    const debatesData = carregarDebates();
    const temasUsados = debatesData.temasUsados || [];

    const prompts = [
        "Gere um tema polêmico e interessante para debate (máximo 10 palavras). Exemplos: 'Inteligência artificial substituirá humanos', 'Redes sociais fazem mais mal than bem', 'Deveria haver limite de idade para políticos'",
        "Crie um tema controverso para debate rápido. Seja criativo e atual. Máximo 8 palavras.",
        "Sugira um assunto debatível que gere opiniões divergentes. Breve e impactante."
    ];

    let tentativas = 0;
    let temaGerado = '';

    while (tentativas < 5) {
        const prompt = prompts[Math.floor(Math.random() * prompts.length)];
        temaGerado = await gerarConteudoComGemini(prompt);
        
        if (temaGerado && !temasUsados.includes(temaGerado.trim())) {
            break;
        }
        tentativas++;
    }

    // Fallback se a IA falhar ou repetir temas
    const temasFallback = [
        "Vacinação deveria ser obrigatória?",
        "Home office é melhor que presencial?",
        "Redes sociais melhoram ou pioram a sociedade?",
        "Inteligência Artificial é uma ameaça?",
        "Deve haver limite de idade para políticos?",
        "Animais deveriam ter direitos humanos?",
        "Universidade ainda é necessária?",
        "Carros elétricos são o futuro?",
        "Trabalho 4 dias por semana é viável?",
        "Robôs devem pagar impostos?"
    ];

    if (!temaGerado || temasUsados.includes(temaGerado.trim())) {
        temaGerado = temasFallback.find(tema => !temasUsados.includes(tema)) || temasFallback[0];
    }

    return temaGerado.trim();
}

module.exports = {
    name: 'debate',
    description: 'Inicia um debate com tema aleatório, 2 debatedores e 3 jurados',
    async execute(client, msg) {
        try {
            const chat = await msg.getChat();
            
            if (!chat.isGroup) {
                return msg.reply('Este comando só funciona em grupos!');
            }

            // Verificar se já há debate ativo
            const debatesData = carregarDebates();
            const debateAtivo = debatesData.historicoDebates.find(d => d.ativo);
            
            if (debateAtivo) {
                return msg.reply(`🎤 Já há um debate ativo sobre: "${debateAtivo.tema}"`);
            }

            // Obter participantes válidos (excluindo bot)
            const participantes = chat.participants
                .filter(p => p.id._serialized !== client.info.wid._serialized)
                .map(p => ({ id: p.id._serialized, contact: p }));

            if (participantes.length < 5) {
                return msg.reply('❌ São necessários pelo menos 5 membros no grupo para um debate!');
            }

            // Embaralhar participantes
            const participantesEmbaralhados = [...participantes].sort(() => Math.random() - 0.5);

            // Escolher 2 debatedores
            const debatedores = participantesEmbaralhados.slice(0, 2);
            
            // Escolher 3 jurados (excluindo debatedores)
            const jurados = participantesEmbaralhados
                .filter(p => !debatedores.includes(p))
                .slice(0, 3);

            // Gerar tema único
            const tema = await gerarTemaUnico();

            // Criar objeto do debate
            const novoDebate = {
                id: Date.now().toString(),
                tema: tema,
                grupo: chat.id._serialized,
                debatedores: debatedores.map(d => ({
                    id: d.id,
                    nome: d.contact.name || d.contact.pushname,
                    posicao: debatedores.indexOf(d) === 0 ? 'Pró' : 'Contra',
                    votos: 0
                })),
                jurados: jurados.map(j => ({
                    id: j.id,
                    nome: j.contact.name || j.contact.pushname,
                    voto: null
                })),
                ativo: true,
                dataInicio: new Date().toISOString(),
                vencedor: null
            };

            // Salvar debate ativo
            debatesData.temasUsados.push(tema);
            debatesData.historicoDebates.push(novoDebate);
            salvarDebates(debatesData);

            // Mensagem de início do debate
            let mensagem = `🎤 *DEBATE INICIADO!* 🎤\n\n`;
            mensagem += `📝 *Tema:* "${tema}"\n\n`;
            mensagem += `⚔️ *DEBATEDORES:*\n`;
            mensagem += `• ${debatedores[0].contact.name || debatedores[0].contact.pushname} → *Pró* ✅\n`;
            mensagem += `• ${debatedores[1].contact.name || debatedores[1].contact.pushname} → *Contra* ❌\n\n`;
            mensagem += `⚖️ *JURADOS:*\n`;
            jurados.forEach((jurado, index) => {
                mensagem += `• ${jurado.contact.name || jurado.contact.pushname}\n`;
            });
            mensagem += `\n⏰ *Tempo:* 5 minutos\n`;
            mensagem += `🗳️ *Jurados:* Use !votar [1/2] para votar\n`;
            mensagem += `🎯 *Exemplo:* !votar 1 (vota no primeiro debatedor)`;

            await chat.sendMessage(mensagem, {
                mentions: [...debatedores.map(d => d.contact), ...jurados.map(j => j.contact)]
            });

            // Timer automático para encerrar debate
            setTimeout(async () => {
                const debatesAtualizados = carregarDebates();
                const debate = debatesAtualizados.historicoDebates.find(d => d.id === novoDebate.id);
                
                if (debate && debate.ativo) {
                    debate.ativo = false;
                    debate.vencedor = 'Tempo esgotado - Empate';
                    salvarDebates(debatesAtualizados);
                    
                    await chat.sendMessage(
                        `⏰ *TEMPO ESGOTADO!*\n\nDebate sobre "${tema}" encerrado.\n\nResultado: Empate!`,
                        { mentions: [...debatedores.map(d => d.contact), ...jurados.map(j => j.contact)] }
                    );
                }
            }, 5 * 60 * 1000); // 5 minutos

        } catch (error) {
            console.error('Erro no comando debate:', error);
            await msg.reply('❌ Ocorreu um erro ao iniciar o debate.');
        }
    }
};
