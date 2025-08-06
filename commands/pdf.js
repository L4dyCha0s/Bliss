const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'pdf',
    description: 'Transforma uma foto ou um texto em PDF. Use respondendo à mensagem com !pdf.',
    async execute(client, msg, args) {
        // Verifica se a mensagem é uma resposta
        if (!msg.hasQuotedMsg) {
            msg.reply('⚠️ Você precisa responder a uma foto ou a um texto para criar um PDF.');
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();

        // Variável para armazenar o arquivo PDF temporário
        const tempPdfPath = path.join(__dirname, '..', 'data', `temp_pdf_${msg.id.id}.pdf`);

        try {
            const doc = new PDFDocument();
            const writeStream = fs.createWriteStream(tempPdfPath);
            doc.pipe(writeStream);

            // Se for uma imagem
            if (quotedMsg.hasMedia) {
                const media = await quotedMsg.downloadMedia();
                if (media.mimetype.startsWith('image/')) {
                    // Adiciona a imagem ao PDF
                    const buffer = Buffer.from(media.data, 'base64');
                    doc.image(buffer, { fit: [500, 500], align: 'center', valign: 'center' });
                    msg.reply('✅ Convertendo a imagem em PDF...');
                } else {
                    msg.reply('⚠️ A mídia respondida não é uma imagem válida para conversão.');
                    doc.end();
                    return;
                }
            } 
            // Se for um texto
            else if (quotedMsg.body) {
                // Adiciona o texto ao PDF
                doc.fontSize(12).text(quotedMsg.body, { align: 'justify' });
                msg.reply('✅ Convertendo o texto em PDF...');
            } 
            // Se o conteúdo não for suportado
            else {
                msg.reply('⚠️ O conteúdo da mensagem respondida não pode ser convertido em PDF.');
                doc.end();
                return;
            }

            // Finaliza o documento PDF
            doc.end();

            // Aguarda o arquivo ser totalmente escrito antes de enviá-lo
            writeStream.on('finish', async () => {
                const media = MessageMedia.fromFilePath(tempPdfPath);
                await client.sendMessage(msg.from, media, { caption: 'Seu arquivo PDF está pronto!' });

                // Limpa o arquivo temporário
                fs.unlinkSync(tempPdfPath);
            });

        } catch (error) {
            console.error('Erro ao gerar ou enviar PDF:', error);
            msg.reply('❌ Ocorreu um erro ao tentar converter a mensagem em PDF.');
            if (fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath); // Garante que o arquivo temporário seja removido
            }
        }
    }
};