const fs = require('fs');
const path = require('path');
const { gerarConteudoComGemini } = require('../serviço-gemini'); // Certifique-se do caminho correto

// Caminho do arquivo para salvar os conselhos já usados
const conselhosUsadosPath = path.join(__dirname, '..', 'data', 'conselhos_usados.json');

// Função para carregar os conselhos salvos do arquivo
function carregarConselhosUsados() {
    try {
        if (fs.existsSync(conselhosUsadosPath)) {
            const data = fs.readFileSync(conselhosUsadosPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Erro ao carregar conselhos salvos:', e);
    }
    return []; //0
}

// Função para salvar um novo conselho no arquivo
function salvarNovoConselho(novoConselho) {
    let conselhosUsados = carregarConselhosUsados();

    // Adiciona o novo conselho ao início da lista
    conselhosUsados.unshift(novoConselho);

    // Limita o número de conselhos salvos (ex: últimas 50)
    const maxConselhos = 50; 
    if (conselhosUsados.length > maxConselhos) {
        conselhosUsados = conselhosUsados.slice(0, maxConselhos);
    }

    try {
        fs.writeFileSync(conselhosUsadosPath, JSON.stringify(conselhosUsados, null, 2), 'utf8');
    } catch (e) {
        console.error('Erro ao salvar novo conselho:', e);
    }
}

module.exports = async (client, msg) => {
    const chat = await msg.getChat();
    await msg.reply('🤔 Pensando em um conselho profundo...');

    let conselhoGerado;
    try {
        // Carrega os conselhos usados anteriormente
        const conselhosAnteriores = carregarConselhosUsados();
        let prompt;

        if (conselhosAnteriores.length > 0) {
            // Formata os conselhos anteriores para incluir no prompt
            const conselhosFormatados = conselhosAnteriores.map(c => `"${c.replace(/"/g, '')}"`).join(', ');
            prompt = `Gere um conselho aleatório, sábio e com um toque de humor ou sarcasmo. O conselho deve ser conciso (uma ou duas frases). **Não repita nenhum dos seguintes conselhos:** ${conselhosFormatados}.`;
        } else {
            // Prompt inicial se não houver histórico
            prompt = `Gere um conselho aleatório, sábio e com um toque de humor ou sarcasmo. O conselho deve ser conciso (uma ou duas frases).`;
        }

        conselhoGerado = await gerarConteudoComGemini(prompt);

        if (!conselhoGerado || conselhoGerado.trim() === '') {
            conselhoGerado = 'Não foi possível gerar um conselho agora. Tente novamente!';
        }
    } catch (error) {
        console.error('Erro ao gerar conselho com Gemini:', error);
        conselhoGerado = 'Houve um erro ao gerar o conselho com a IA. Por favor, tente novamente mais tarde.';
    }

    await chat.sendMessage(`💡 *Conselho do dia:*\n\n"${conselhoGerado.trim()}"`);

    // Salva o conselho gerado para evitar repetição futura
    salvarNovoConselho(conselhoGerado.trim());
};