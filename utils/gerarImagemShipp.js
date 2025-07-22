const { createCanvas, loadImage, } = require('canvas');
const path = require('path');
const axios = require('axios');

// Fontes opcionais personalizadas (adicione fontes .ttf se quiser)
// registerFont(path.join(__dirname, '../assets/Arial.ttf'), { family: 'Arial' });

async function carregarImagemUrl(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return await loadImage(response.data);
}

async function gerarImagemShipp(fotos, nomes, porcentagem, frase) {
    const largura = 800;
    const altura = 400;
    const canvas = createCanvas(largura, altura);
    const ctx = canvas.getContext('2d');

    // Fundo
    const fundo = await loadImage(path.join(__dirname, '../assets/fundo_match.png'));
    ctx.drawImage(fundo, 0, 0, largura, altura);

    // Cores e sombras
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;

    // Fotos
    const img1 = await carregarImagemUrl(fotos[0]);
    const img2 = await carregarImagemUrl(fotos[1]);

    // Foto 1
    ctx.save();
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img1, 100, 100, 200, 200);
    ctx.restore();

    // Foto 2
    ctx.save();
    ctx.beginPath();
    ctx.arc(600, 200, 100, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img2, 500, 100, 200, 200);
    ctx.restore();

    // Coração entre as fotos
    const coracao = await loadImage(path.join(__dirname, '../assets/coracao.png'));
    ctx.drawImage(coracao, 350, 150, 100, 100);

    // Nome 1
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(nomes[0], 200, 330);

    // Nome 2
    ctx.fillText(nomes[1], 600, 330);

    // Porcentagem no centro
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ff69b4';
    ctx.fillText(`${porcentagem}%`, 400, 90);

    // Frase abaixo
    ctx.font = 'italic 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(frase, 400, 370);

    return canvas.toBuffer();
}

module.exports = gerarImagemShipp;
