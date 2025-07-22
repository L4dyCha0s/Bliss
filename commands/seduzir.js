// commands/seduzir.js
module.exports = async (client, msg) => {
    // Categorias de frases de flerte
    const frasesPorCategoria = {
        romantica: [
            "Você é a estrela mais linda do meu céu. ✨🌌",
            "Meu coração sorri toda vez que te vê. 😊❤️",
            "Ao seu lado, qualquer lugar vira paraíso. 💖",
            "Seu olhar me faz sonhar acordado(a). 💭😍",
            "Eu te daria o mundo, se você aceitasse meu coração. 🌎❤️",
            "Você me faz acreditar no amor novamente. 💘",
            "Meu passatempo favorito é te admirar. 👀✨",
            "Seu amor é o meu norte, minha direção. 🧭",
            "E se a gente construísse um mundo só nosso? 🏡💑",
            "Você é a canção mais linda que eu já ouvi. 🎶"
        ],
        engracada: [
            "Você não é café, mas me tira o sono. ☕🌃",
            "Será que a gente combina? Tipo pizza e Netflix. 🍕📺",
            "Meu amor por você é igual obra: nunca acaba. 😂🚧",
            "Desculpa, mas você deixou cair uma coisa... meu queixo! 🤤",
            "Perdi meu número de telefone. Posso ter o seu? 😉 (É pra ver se não perco mais nada!)",
            "Gato(a), me chama de cupido e me diz onde você mora. 💘🏠 (É pra eu saber onde te deixar flores).",
            "Poderia estar roubando, mas estou aqui roubando seu coração. 💔😉 (Com consentimento, claro!).",
            "Você não é Wi-Fi, mas estou sentindo uma conexão forte. ✨ (Será que é banda larga?).",
            "Seu nome é Google? Porque você tem tudo o que eu procuro. 🔎",
            "Você não é pesadelo, mas me tira o sono de um jeito bom. 😴😊"
        ],
        ousada: [ // Mais sugestivas, mas nunca explícitas.
            "Você é mais gostose que pizza no domingo. 🍕😋",
            "Seu corpo é um templo, e eu sou o devoto. 🙏🔥",
            "Acho me perdi... poderia me mostrar o caminho para sua boca? 😉",
            "Sabe o que combina com você? Eu! 💑 (E um pouquinho de ousadia).",
            "Com um sorriso desses, não tem como não querer mais. 😏",
            "Devia ter um aviso: 'Cuidado, beleza em excesso'. ⚠️ (E um pouco perigosa, hein!).",
            "A gente tem tanta coisa em comum, principalmente o interesse um no outro. 😉 (E algo mais...)",
            "Se eu te conto o que imaginei contigo hoje, você não dorme essa noite... 😈",
            "Você tem cara de problema, e eu sou péssimo em resistir a tentações... 😏",
            "Só de pensar na sua voz baixinha perto do meu ouvido... arrepia tudo. 😮‍💨",
            "Te olhar me deixa com pensamentos que não dá nem pra confessar em voz alta... 🍷",
            "Se teu beijo for metade do que eu imagino, tô perdido... e adorando. 🔥",
            "Queria ser o motivo da sua bagunça hoje... e amanhã também. 😉",
            "Você tem um jeito que dá vontade de cometer pecados em câmera lenta... 😵‍💫",
            "Fala que me quer, só pra eu poder te mostrar como se faz direito... 😏",
            "Se eu te encostar, não garanto que consigo parar. Só aviso. 🫦",
            "Imagina a gente, sem roupa, sem pressa e com más intenções... 💭",
            "Você é meu tipo de perigo favorito: irresistível. 🖤",
            "Me manda uma mensagem, ou um convite indecente. Os dois servem. 😋",
            "Você é o tipo de desejo que eu não quero controlar. 😶‍🌫️",
            "Entre a gente não tem química... tem combustão. 🚒",
            "Só queria te provar. Uma vez. Ou várias. Você decide. 😈",
            "Me provoca mais um pouco que eu te mostro o que é perder o controle. 👀",
            "Se você vier com essa boca, eu vou com más intenções. 🤐",
            "Você me dá sede de toque, fome de beijo, e uma vontade danada de pecar... 💦",
            "Com esse olhar, você praticamente já me despiu. 😵",
            "Me responde logo, antes que eu perca o juízo... e a roupa. 🫣",
            "Tô com saudade daquilo que a gente nem fez ainda. 💌",
            "Você tem noção do que esse jeitinho faz com minha imaginação? 😳",
            "Se a sua intenção era me deixar louco, parabéns: conseguiu. Agora assume. 😤",
            "Só de pensar em você do meu lado... ou em cima, já fico sem ar. 💭",
            "Não sei se te beijo ou se te jogo na parede e deixo acontecer. 🤤",
            "Você me dá vontade de ser imprudente com classe. 🥀",
            "Tô pronto pra te ouvir gemer meu nome... mesmo que seja só em pensamento. 🎧",
            "Você é meu pecado favorito disfarçado de notificação. 📲",
            "Se o assunto for tentação, eu sou todo seu. Sem perguntas. Sem limites. 🫢",
            "Vem. Traz essa boca. E a malícia no olhar. O resto eu resolvo. 🕯️"
        ]
    };

    // Pega as partes da mensagem: comando, categoria (opcional), menção
    const partes = msg.body.trim().toLowerCase().split(' ');
    const comando = partes[0]; // !seduzir
    let categoria = null;
    let mensagemSemComando = msg.body.trim();

    // Remove o comando para analisar o restante
    if (mensagemSemComando.startsWith(comando)) {
        mensagemSemComando = mensagemSemComando.substring(comando.length).trim();
    }

    // Verifica se uma categoria foi especificada (ex: !seduzir romantico @alguem)
    // A categoria virá depois do comando, mas antes da menção.
    // Usamos regex para encontrar a menção no final para isolar a categoria.
    const regexMencao = /@\d{10,12}/; // Padrão para @número (pode ser ajustado se o formato de menção mudar)
    const matchMencao = mensagemSemComando.match(regexMencao);
    let textoAntesMencao = mensagemSemComando;

    if (matchMencao) {
        const indexMencao = mensagemSemComando.indexOf(matchMencao[0]);
        textoAntesMencao = mensagemSemComando.substring(0, indexMencao).trim();
    }

    // Tenta identificar a categoria
    for (const cat of Object.keys(frasesPorCategoria)) {
        if (textoAntesMencao.includes(cat)) {
            categoria = cat;
            break;
        }
    }

    // Pega as menções na mensagem
    const mentions = await msg.getMentions();

    // Verifica se alguma pessoa foi mencionada
    if (mentions.length > 0) {
        const pessoaMencionada = mentions[0]; // Pega a primeira pessoa mencionada

        let fraseAleatoria;
        let categoriaUsada = categoria;

        if (categoria && frasesPorCategoria[categoria]) {
            // Se a categoria foi especificada e existe, usa apenas frases dessa categoria
            const frasesDaCategoria = frasesPorCategoria[categoria];
            fraseAleatoria = frasesDaCategoria[Math.floor(Math.random() * frasesDaCategoria.length)];
        } else {
            // Se nenhuma categoria válida foi especificada, escolhe uma categoria aleatoriamente
            const todasCategorias = Object.keys(frasesPorCategoria);
            categoriaUsada = todasCategorias[Math.floor(Math.random() * todasCategorias.length)];
            const frasesDaCategoriaAleatoria = frasesPorCategoria[categoriaUsada];
            fraseAleatoria = frasesDaCategoriaAleatoria[Math.floor(Math.random() * frasesDaCategoriaAleatoria.length)];
        }

        // Envia a mensagem com a menção e a frase
        await client.sendMessage(msg.from, `@${pessoaMencionada.id.user} ${fraseAleatoria}`, {
            mentions: [pessoaMencionada] // Isso é crucial para o WhatsApp reconhecer a menção
        });

        console.log(`Comando !seduzir executado para ${pessoaMencionada.id.user} (Categoria: ${categoriaUsada || 'Aleatória'})`);

    } else {
        // Se ninguém foi mencionado, avisa o usuário
        msg.reply('Para seduzir alguém, você precisa me dizer quem! Use `!seduzir @nome_da_pessoa` ou `!seduzir categoria @nome_da_pessoa`.');
    }
};







