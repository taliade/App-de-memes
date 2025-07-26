const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3001;

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configurar multer para manejar imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Ruta POST para generar meme
app.post('/generar-meme', upload.single('imagen'), async (req, res) => {
  try {
    const imagenBase64 = req.file.buffer.toString('base64');

    const prompt = `Analiza esta imagen y crea un meme divertido. Devuelve SOLO este JSON:
{
  "topText": "texto de arriba",
  "bottomText": "texto de abajo"
}`;

    const respuesta = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${req.file.mimetype};base64,${imagenBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    // Extraer solo el JSON del contenido generado
    const texto = respuesta.choices[0].message.content;
    const json = JSON.parse(texto.match(/\{[^}]+\}/s)[0]);

    res.json(json);
  } catch (error) {
    console.error('❌ Error al generar el meme:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Hubo un error generando el meme con IA' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🧠 Servidor de memes con IA activo en http://localhost:${port}`);
});
