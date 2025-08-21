const { gerarConteudoComGemini } = require('../serviço-gemini');
const { markAsUsed, getUsed, resetMemory } = require('../utils/participantsMemory');

module.exports = {
    name: 'debate',
    description: 'Cria um debate polêmico entre 2 pessoas do grupo',
    async execute(client, message, args) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                return message.reply('Este comando só funciona em grupos!');
            }

            let mencionados = message.mentionedIds || [];
            let participantes = [];

            if (mencionados.length >= 2) {
                for (let id of mencionados.slice(0, 2)) {
                    participantes.push({ id: id });
                }
            } else {
                const usados = getUsed(chat.id._serialized);
                const todosParticipantes = chat.participants.filter(p => 
                    !p.isSuperAdmin && 
                    p.id._serialized !== message.author
                );
                
                const disponiveis = todosParticipantes.filter(p => !usados.includes(p.id._serialized));
                
                if (disponiveis.length < 2) {
                    resetMemory(chat.id._serialized);
                    participantes = [...todosParticipantes]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                } else {
                    participantes = [...disponiveis]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 2);
                }
            }

            if (participantes.length < 2) {
                return message.reply('Preciso de 2 pessoas para criar um debate!');
            }

            const pessoas = [];
            const mentions = [];
            
            for (let p of participantes) {
                try {
                    const contact = await client.getContactById(p.id._serialized || p.id);
                    const nome = contact.pushname || contact.name || contact.number || "Alguém";
                    pessoas.push({ 
                        nome: nome, 
                        mencao: `@${contact.id.user}`,
                        id: contact.id._serialized
                    });
                    mentions.push(contact.id._serialized);
                    markAsUsed(chat.id._serialized, contact.id._serialized);
                } catch (error) {
                    console.error("Erro ao obter contato:", error);
                }
            }

            if (pessoas.length < 2) {
                return message.reply('Não consegui obter informações dos participantes!');
            }

            const temas = [
                "se abacaxi combina com pizza",
                "quem é o mais fofoqueiro do grupo",
                "se é melhor cachorro ou gato",
                "se café é melhor que chá",
                "se emojis deveriam ser proibidos no trabalho",
                "quem dorme mais cedo",
                "se estudar de madrugada vale a pena",
                "se WhatsApp é melhor que Telegram"
            ];
            const tema = temas[Math.floor(Math.random() * temas.length)];

            const prompt = `
Você é um mediador de debates divertido e sarcástico.
Crie um debate engraçado e dramático entre ${pessoas[0].nome} e ${pessoas[1].nome}.
O tema do debate é: "${tema}".
Use humor, sarcasmo, exagero e drama. Faça cada participante defender seu lado com paixão.
O debate deve ter no máximo 4 trocas de argumentos (2 de cada lado).
Formate como:
[NARRADOR]: Introdução dramática
[${pessoas[0].nome}]: Argumento exagerado
[${pessoas[1].nome}]: Resposta dramática
[${pessoas[0].nome}]: Réplica engraçada
[${pessoas[1].nome}]: Resposta final
[NARRADOR]: Conclusão hilária

Responda apenas com o texto do debate, sem comentários adicionais.
`;

            try {
                // CORREÇÃO: usar gerarConteudoComGemini em vez de gerarTextoGemini
                const debate = await gerarConteudoComGemini(prompt);
                
                if (!debate || debate.trim() === '') {
                    throw new Error('Resposta vazia do Gemini');
                }

                let debateFormatado = debate;
                pessoas.forEach(p => {
                    const regex = new RegExp(`\\[${p.nome}\\]`, 'g');
                    debateFormatado = debateFormatado.replace(regex, p.mencao);
                });

                const resposta = `🎤 *DEBATE POLÊMICO!*\n*Tema:* ${tema}\n\n${debateFormatado.trim()}`;

                await client.sendMessage(
                    message.from, 
                    resposta,
                    { mentions: mentions }
                );

            } catch (err) {
                console.error("Erro ao gerar debate com Gemini:", err);
                
                const debatesFallback = [
                    `🎤 *DEBATE POLÊMICO!*\n*Tema:* ${tema}\n\n[NARRADOR]: E o debate começa com tensão no ar!\n${pessoas[0].mencao}: "Claro que sim, só quem não tem paladar discorda!"\n${pessoas[1].mencao}: "Absurdo! Isso é uma ofensa à culinária!"\n${pessoas[0].mencao}: "Você só diz isso porque nunca experimentou direito!"\n${pessoas[1].mencao}: "Experimentei sim, e foi traumatizante!"\n[NARRADOR]: E assim termina mais um debate inconclusivo!`,
                    
                    `🎤 *DEBATE POLÊMICO!*\n*Tema:* ${tema}\n\n[NARRADOR]: Dois titãs se enfrentam nesta noite!\n${pessoas[0].mencao}: "É a melhor invenção da humanidade, ponto final!"\n${pessoas[1].mencao}: "Blasfêmia! Isso vai contra todas as leis do universo!"\n${pessoas[0].mencao}: "Seu conservadorismo está te cegando!"\n${pessoas[1].mencao}: "E seu radicalismo está destruindo tradições!"\n[NARRADOR]: O público está dividido! E vocês, de qual time são?`
                ];
                
                let debateFallback = debatesFallback[Math.floor(Math.random() * debatesFallback.length)];
                debateFallback = debateFallback.replace(/\[NARRADOR\]/g, '🎤');
                
                await client.sendMessage(
                    message.from, 
                    debateFallback,
                    { mentions: mentions }
                );
            }
            
        } catch (err) {
            console.error("Erro geral no comando debate:", err);
            message.reply("❌ Erro ao criar o debate. Tente novamente!");
        }
    }
};
