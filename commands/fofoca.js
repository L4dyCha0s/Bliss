const { gerarTextoGemini } = require('../serviço-gemini');
const { markAsUsed, getUsed, resetMemory } = require('../utils/participantsMemory');

module.exports = {
    name: 'fofoca',
    description: 'Inventa uma fofoca engraçada com pessoas do grupo',
    async execute(client, message) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                return message.reply('Esse comando só funciona em grupos!');
            }

            // Obter menções da mensagem
            let mencionados = message.mentionedIds || [];
            let participantes = [];

            // Se há menções, usar até 5 delas
            if (mencionados.length > 0) {
                for (let id of mencionados.slice(0, 5)) {
                    participantes.push({ id: id });
                }
            } else {
                // Se não há menções, selecionar aleatoriamente
                const usados = getUsed(chat.id._serialized);
                const todosParticipantes = chat.participants;
                
                // Filtrar participantes não usados recentemente
                const disponiveis = todosParticipantes.filter(p => 
                    !usados.includes(p.id._serialized) && 
                    !p.isSuperAdmin // Normalmente o bot é super admin
                );
                
                if (disponiveis.length < 2) {
                    resetMemory(chat.id._serialized);
                    // Selecionar 3 participantes aleatórios
                    participantes = [...todosParticipantes]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3)
                        .filter(p => !p.isSuperAdmin); // Evitar incluir o bot
                } else {
                    const qtd = Math.floor(Math.random() * 3) + 2; // 2 a 4 participantes
                    participantes = [...disponiveis]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, qtd);
                }
            }

            // Se não há participantes suficientes
            if (participantes.length < 2) {
                return message.reply('Preciso de pelo menos 2 pessoas para criar uma fofoca interessante!');
            }

            // Obter informações dos participantes
            const pessoas = [];
            for (let p of participantes) {
                try {
                    const contact = await client.getContactById(p.id._serialized || p.id);
                    const nome = contact.pushname || contact.name || contact.number || "Alguém";
                    pessoas.push({
                        nome: nome,
                        mencao: `@${contact.id.user}`,
                        id: contact.id._serialized
                    });
                    markAsUsed(chat.id._serialized, contact.id._serialized);
                } catch (error) {
                    console.error("Erro ao obter contato:", error);
                }
            }

            // Se não conseguiu obter informações suficientes
            if (pessoas.length < 2) {
                return message.reply('Não consegui obter informações suficientes dos participantes para criar a fofoca!');
            }

            const nomes = pessoas.map(p => p.nome).join(', ');

            const prompt = `
Você é uma blogueira fofoqueira muito dramática.
Crie uma fofoca divertida, exagerada e dramática envolvendo estas pessoas: ${nomes}.
A fofoca deve ser no estilo de reality show, com muito suspense, ironia e exagero.
Seja criativa e engraçada, mas não ofensiva.
A fofoca deve ter no máximo 3 frases.
`;

            try {
                const fofoca = await gerarTextoGemini(prompt);
                
                if (!fofoca || fofoca.trim() === '') {
                    throw new Error('Resposta vazia do Gemini');
                }
                
                const resposta = `👀 *FOFOCA QUENTE DO GRUPO* 🔥\n\n${pessoas.map(p => p.mencao).join(' ')}\n\n${fofoca.trim()}`;
                
                // Enviar a mensagem com as menções
                await client.sendMessage(
                    message.from, 
                    resposta,
                    { mentions: pessoas.map(p => p.id) }
                );
                
            } catch (err) {
                console.error("Erro ao gerar fofoca com Gemini:", err);
                // Fofoca fallback caso o Gemini falhe
                const fofocaFallback = [
                    `Rumor tem it que ${nomes} foram vistos saindo juntos de um restaurante chique! Será que temos um novo casal no grupo? 💑`,
                    `Última hora: ${nomes} estariam planejando uma revolução no grupo! Dizem que querem derrubar a administração atual! 👀`,
                    `Escândalo: ${nomes} foram flagrados num esquema secreto de roubo de figurinhas! A polícia virtual já foi acionada! 🚨`
                ];
                
                const resposta = `👀 *FOFOCA QUENTE DO GRUPO* 🔥\n\n${pessoas.map(p => p.mencao).join(' ')}\n\n${fofocaFallback[Math.floor(Math.random() * fofocaFallback.length)]}`;
                
                await client.sendMessage(
                    message.from, 
                    resposta,
                    { mentions: pessoas.map(p => p.id) }
                );
            }
            
        } catch (err) {
            console.error("Erro geral no comando fofoca:", err);
            message.reply("❌ Erro ao criar a fofoca. Tente novamente!");
        }
    }
};
