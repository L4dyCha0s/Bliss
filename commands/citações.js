module.exports = async (client, msg) => {
    const chat = await msg.getChat();

    if (!chat.isGroup) {
        msg.reply('Este comando só funciona em grupos.');
        return;
    }

    // Lista de citações famosas/conhecidas
    const citacoesFamosas = [
        "A persistência realiza o impossível. – Provérbio Chinês",
        "Só se vê bem com o coração; o essencial é invisível aos olhos. – Antoine de Saint-Exupéry",
        "Viver é a coisa mais rara do mundo. A maioria das pessoas apenas existe. – Oscar Wilde",
        "A imaginação é mais importante que o conhecimento. – Albert Einstein",
        "Ser ou não ser, eis a questão. – William Shakespeare",
        "Penso, logo existo. – René Descartes",
        "A única forma de fazer um grande trabalho é amar o que você faz. – Steve Jobs",
        "Seja a mudança que você deseja ver no mundo. – Mahatma Gandhi",
        "Tente mover o mundo – o primeiro passo será mover a si mesmo. – Platão",
        "A vida é o que acontece enquanto você está ocupado fazendo outros planos. – John Lennon",
        "Eu sei que nada sei. – Sócrates",
        "A alegria de fazer o bem é a única felicidade verdadeira. – Leon Tolstói",
        "O homem é lobo do homem. – Thomas Hobbes",
        "A medida do amor é amar sem medida. – Santo Agostinho",
        "Tudo o que um sonho precisa para ser realizado é alguém que acredite nele. – Roberto Shinyashiki",
        "Não tentes ser bem-sucedido, tenta antes ser um homem de valor. – Albert Einstein",
        "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original. – Albert Einstein",
        "A arte de ser feliz reside na capacidade de extrair felicidade de coisas simples. – Confúcio",
        "A vida é uma peça de teatro que não permite ensaios. Por isso, cante, chore, dance, ria e viva intensamente, antes que a cortina se feche e a peça termine sem aplausos. – Charles Chaplin",
        "Na plenitude da felicidade, cada dia é uma nova vida. – Johann Goethe",
        "A vida é 10% do que acontece com você e 90% de como você reage a isso. – Charles R. Swindoll",
        "Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta às mudanças. – Charles Darwin",
        "Faça o que for necessário para ser feliz. Mas não espere a felicidade, faça-a. – Voltaire",
        "A felicidade não é um destino, é uma jornada. – Autor Desconhecido",
        "Que a força esteja com você. – Star Wars",
        "Ao infinito e além! – Toy Story",
        "Hakuna Matata. – O Rei Leão",
        "Eu sou seu pai. – Star Wars",
        "Para o alto e avante! – Superman",
        "Nunca desista dos seus sonhos. – Autor Desconhecido",
        "A vida é bela. – Filme 'A Vida é Bela'",
        "Seja a mudança. – Autor Desconhecido",
        "O impossível é apenas uma opinião. – Paulo Coelho",
        "Carpe Diem. Aproveitem o dia, meninos. Façam de suas vidas algo extraordinário. – Sociedade dos Poetas Mortos",
        "Eles não sabiam que era impossível, então foram lá e fizeram. – Mark Twain",
        "Um pequeno passo para o homem, um salto gigantesco para a humanidade. – Neil Armstrong",
        "A única coisa que devemos temer é o próprio medo. – Franklin D. Roosevelt",
        "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo. – Salmos 23:4",
        "Amar é o que se faz. – Autor Desconhecido",
        "Você é mais corajoso do que pensa, mais forte do que parece e mais inteligente do que acredita. – Christopher Robin (Ursinho Pooh)",
        "Tudo o que precisamos é amor. – The Beatles",
        "É em nossos momentos mais sombrios que devemos focar para ver a luz. – Aristóteles Onassis"
    ];

    // Escolhe uma citação aleatoriamente da lista
    const randomIndex = Math.floor(Math.random() * citacoesFamosas.length);
    const citacaoSelecionada = citacoesFamosas[randomIndex];

    await chat.sendMessage(`✨ *Citação Famosa do Dia:* ✨\n\n"${citacaoSelecionada}"`);
};
