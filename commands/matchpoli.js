module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    // 1. Verificar se o comando foi usado em um grupo
    if (!chat.isGroup) {
        return msg.reply('Este comando só funciona em grupos. Utilize-o dentro de um chat em grupo para fazer um match poli!');
    }

    const autorId = msg.author || msg.from;
    const mentions = msg.mentionedIds; // IDs das pessoas mencionadas na mensagem

    // 2. Validar o número de menções
    // O comando espera o autor + 2 ou 3 menções (total de 3 ou 4 pessoas)
    if (mentions.length < 2 || mentions.length > 3) {
        return msg.reply('Para usar o !matchpoli, você deve mencionar entre 2 e 3 pessoas (você + 2 ou 3 menções).\nExemplo: !matchpoli @pessoa1 @pessoa2 ou !matchpoli @pessoa1 @pessoa2 @pessoa3');
    }

    // 3. Coletar todos os participantes do match (incluindo o autor)
    // Usamos um Set para garantir IDs únicos
    const matchParticipantsIds = new Set();
    matchParticipantsIds.add(autorId); // Adiciona o autor do comando

    // Adiciona as pessoas mencionadas, filtrando o próprio bot e IDs inválidos
    for (const mentionId of mentions) {
        if (mentionId !== client.info.wid._serialized) { // Evita adicionar o próprio bot
            matchParticipantsIds.add(mentionId);
        }
    }

    // Converter o Set de volta para um Array para facilitar o uso
    const finalParticipantsIds = Array.from(matchParticipantsIds);

    // 4. Verificar se há participantes suficientes após a filtragem
    if (finalParticipantsIds.length < 3 || finalParticipantsIds.length > 4) {
        return msg.reply('O match poli requer um mínimo de 3 e um máximo de 4 participantes (você incluído). Verifique as menções.');
    }

    // 5. Obter os objetos de contato para todos os participantes
    const participantContacts = [];
    for (const pId of finalParticipantsIds) {
        try {
            const contact = await client.getContactById(pId);
            participantContacts.push(contact);
        } catch (error) {
            console.error(`Erro ao obter contato ${pId}:`, error.message);
            // Se não conseguir obter o contato, ainda tenta continuar, mas informa
            return msg.reply(`Não foi possível encontrar um dos participantes (${pId.split('@')[0]}). Por favor, tente novamente com menções válidas.`);
        }
    }

    // 6. Gerar a porcentagem de compatibilidade para o grupo
    // Para um grupo, podemos usar uma média ou uma única porcentagem representativa
    const compatibilidade = Math.floor(Math.random() * 91) + 10; // entre 10% e 100%

    // 7. Definir a frase com base na porcentagem de compatibilidade
    let sugestaoFrase = '';
    if (compatibilidade >= 10 && compatibilidade <= 29) { // 10-29%
        sugestaoFrase = "Vocês formam uma combinação... singular! Preparem-se para muitas surpresas. 😉";
    } else if (compatibilidade >= 30 && compatibilidade <= 49) { // 30-49%
        sugestaoFrase = "Há potencial, mas algumas peças ainda precisam se encaixar. Que tal uma atividade em grupo? 🤔";
    } else if (compatibilidade >= 50 && compatibilidade <= 69) { // 50-69%
        sugestaoFrase = "Uma boa química! Vocês têm tudo para se dar bem em grupo. ✨";
    } else if (compatibilidade >= 70 && compatibilidade <= 89) { // 70-89%
        sugestaoFrase = "Harmonia em grupo! Vocês parecem ter encontrado um ritmo perfeito juntos. Já dá pra rachar um apê na liberdade juntos 😍";
    } else if (compatibilidade >= 90 && compatibilidade <= 100) { // 90-100%
        sugestaoFrase = "Conexão de outro nível! Vocês nasceram para ser um time (ou mais!). Que maravilha é a Poligamia! 💖";
    }

    // 8. Construir a mensagem de resposta
    let textoParticipantes = finalParticipantsIds.map(id => `@${id.split('@')[0]}`).join(' + ');
    const texto = `💘 *Match Poli Gerado!* 💘\n${textoParticipantes}\n\nCompatibilidade do Grupo: ${compatibilidade}%\n\n${sugestaoFrase}`;

    // 9. Enviar a mensagem com as menções
    await chat.sendMessage(texto, { mentions: participantContacts });
};