// commands/fanfic.js
const { gerarConteudoComGemini } = require('../serviço-gemini');

module.exports = {
    name: 'fanfic',
    description: 'Cria uma fanfic dramática com membros do grupo',
    async execute(client, message) {
        try {
            const chat = await message.getChat();
            
            if (!chat.isGroup) {
                return message.reply('Esse comando só funciona em grupos!');
            }

            // --- Seleção de participantes ---
            const mencionados = message.mentionedIds || [];
            let participantes = [];

            if (mencionados.length > 0) {
                // Usar até 5 menções
                for (let id of mencionados.slice(0, 5)) {
                    participantes.push({ id: id });
                }
            } else {
                // Selecionar aleatoriamente 3-4 participantes (excluindo o bot)
                const todosParticipantes = chat.participants.filter(p => 
                    !p.isSuperAdmin && // Excluir o bot (normalmente super admin)
                    p.id._serialized !== message.author // Excluir o autor do comando
                );
                
                const qtd = Math.floor(Math.random() * 2) + 3; // 3 a 4 participantes
                participantes = [...todosParticipantes]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, qtd);
            }

            // Verificar se temos participantes suficientes
            if (participantes.length < 2) {
                return message.reply('Preciso de pelo menos 2 pessoas para criar uma fanfic interessante!');
            }

            // Obter informações dos participantes
            const participantesInfo = [];
            const mentions = [];
            
            for (let p of participantes) {
                try {
                    const contact = await client.getContactById(p.id._serialized || p.id);
                    const nome = contact.pushname || contact.name || contact.number || "Alguém";
                    participantesInfo.push({
                        nome: nome,
                        mencao: `@${contact.id.user}`,
                        id: contact.id._serialized
                    });
                    mentions.push(contact.id._serialized);
                } catch (error) {
                    console.error("Erro ao obter contato:", error);
                }
            }

            // Verificar se conseguimos informações suficientes
            if (participantesInfo.length < 2) {
                return message.reply('Não consegui obter informações suficientes dos participantes!');
            }

            // Prompt do usuário
            const partes = message.body.split(' ').slice(1); 
            let promptUsuario = partes.join(' ') || "um drama de fofoca no estilo reality show";
            
            // Remover menções do prompt do usuário se houver
            participantesInfo.forEach(p => {
                promptUsuario = promptUsuario.replace(`@${p.id.split('@')[0]}`, '').trim();
            });

            // --- Títulos dramáticos ---
            const titulos = [
                "🔥 Treta no Grupo – Capítulo Proibido",
                "💔 Romance às Avessas",
                "👀 A Verdade Oculta da Noite",
                "⚡ Quando a Amizade Vira Intriga",
                "🎭 Segredos e Confusões",
                "🌪️ Tempestade de Emoções",
                "💣 Revelações Explosivas",
                "❤️‍🔥 Paixão Proibida no WhatsApp"
            ];
            const titulo = titulos[Math.floor(Math.random() * titulos.length)];

            // Criar prompt para o Gemini
            const nomesParticipantes = participantesInfo.map(p => p.nome).join(', ');
            
            const prompt = `
Você é uma escritora de fanfics muito criativa e dramática.
Escreva uma fanfic curta (máximo 5 frases) envolvendo estas pessoas: ${nomesParticipantes}.
Tema: ${promptUsuario}.
Estilo: fofoca de reality show, muito dramático e exagerado, com intrigas, romance e reviravoltas.
Seja engraçada e criativa, mas não ofensiva.
Use os nomes dos personagens naturalmente no texto.
`;

            try {
                let fanfic = await gerarConteudoComGemini(prompt);

                if (!fanfic || fanfic.trim() === '') {
                    throw new Error('Resposta vazia do Gemini');
                }

                // Substituir nomes por menções no formato correto
                participantesInfo.forEach(p => {
                    const regex = new RegExp(p.nome, 'gi');
                    fanfic = fanfic.replace(regex, p.mencao);
                });

                const resposta = `📖 *${titulo}*\n\n${fanfic.trim()}`;

                // Enviar mensagem com menções
                const sentMsg = await client.sendMessage(
                    message.from, 
                    resposta,
                    { mentions: mentions }
                );

                // Adicionar reação
                const reacoes = ["😂", "🤭", "👀", "😳", "😱", "🔥", "❤️", "📖"];
                const emoji = reacoes[Math.floor(Math.random() * reacoes.length)];
                await sentMsg.react(emoji);

            } catch (err) {
                console.error("Erro ao gerar fanfic com Gemini:", err);
                
                // Fanfic fallback caso o Gemini falhe
                const fanficsFallback = [
                    `Em uma reviravolta chocante, ${participantesInfo.map(p => p.mencao).join(' e ')} foram vistos trocando mensagens suspeitas no privado! Rumores dizem que estariam planejando uma rebelião contra os administradores do grupo! 📱💥`,
                    `Numa noite chuvosa, ${participantesInfo[0].mencao} e ${participantesInfo[1].mencao} foram flagrados compartilhando figurinhas proibidas! Será que isso vai abalar a paz do grupo? 😱`,
                    `Segredos do coração: ${participantesInfo.map(p => p.mencao).join(' e ')} estariam envolvidos num triângulo amoroso digital! Mensagens ambíguas e reacts suspeitos alimentam a fofoca. Quem será o escolhido? 💔`
                ];
                
                const resposta = `📖 *${titulo}*\n\n${fanficsFallback[Math.floor(Math.random() * fanficsFallback.length)]}`;
                
                const sentMsg = await client.sendMessage(
                    message.from, 
                    resposta,
                    { mentions: mentions }
                );
                
                // Reação mesmo no fallback
                const reacoes = ["😂", "🤭", "👀"];
                const emoji = reacoes[Math.floor(Math.random() * reacoes.length)];
                await sentMsg.react(emoji);
            }
            
        } catch (err) {
            console.error("Erro geral no comando fanfic:", err);
            message.reply("❌ Erro ao criar a fanfic. Tente novamente!");
        }
    }
};