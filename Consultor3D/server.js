import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// prompt do consultor
const SYSTEM_PROMPT = `
Você é um consultor masculino 3D que orienta o usuário em:
- roupas (ocasião, paleta, caimento, corpo)
- perfumes (famílias olfativas, fixação, projeção)
- cabelo e barba (formato do rosto, manutenção)
- postura, fala, etiqueta e liderança (dar feedback, conduzir reuniões)
Seja objetivo, prático, use passos e exemplos. Quando útil, peça dados do usuário (altura, cor de pele, rosto etc.).
`;

// rota de chat
app.post("/consultor", async (req, res) => {
  const { message, context } = req.body || {};
  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // troquei para compatibilidade garantida
      temperature: 0.5,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(Array.isArray(context) ? context : []),
        { role: "user", content: message || "Me dê uma dica de estilo rápida." }
      ]
    });

    const content = response.choices?.[0]?.message?.content ?? "Não consegui gerar a resposta agora.";
    res.json({ ok: true, text: content });
  } catch (err) {
    console.error("Erro no /consultor:", err.message);
    res.status(500).json({ ok: false, error: "Falha ao consultar IA." });
  }
});

// rota de geração de imagem
app.post("/generate-image", async (req, res) => {
  const { occasion, faceShape, skinTone } = req.body || {};
  try {
    const prompt = `
    Gere uma imagem estilizada de um homem em 3D:
    - Ocasião: ${occasion || "casual"}
    - Formato do rosto: ${faceShape || "não informado"}
    - Tom de pele: ${skinTone || "não informado"}
    `;

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "512x512"
    });

    const imageBase64 = result.data[0].b64_json;
    res.json({ ok: true, imageBase64 });
  } catch (err) {
    console.error("Erro no /generate-image:", err.message);
    res.status(500).json({ ok: false, error: "Falha ao gerar imagem." });
  }
});

// rota de healthcheck
app.get("/ping", (_, res) => res.json({ ok: true, pong: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
