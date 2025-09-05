
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, PORT as CONFIG_PORT } from "./config.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let genAI;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log("✅ Gemini client configured with API key");
} catch (error) {
  console.warn("⚠️  Gemini API key not configured. Chat functionality will be disabled.");
  console.warn("💡 Configure GEMINI_API_KEY in config.js file to enable AI features");
  genAI = null;
}

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
  if (!genAI) {
    return res.status(503).json({ 
      ok: false, 
      error: "Serviço de IA não disponível. Configure GEMINI_API_KEY no arquivo config.js" 
    });
  }
  const { message, context } = req.body || {};
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Include context in the prompt for better response
    const prompt = `${SYSTEM_PROMPT}\nContexto do usuário: ${JSON.stringify(context)}\n\nUsuário: ${message || "Me dê uma dica de estilo rápida."}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text() || "Não consegui gerar a resposta agora.";
    res.json({ ok: true, text: content });
  } catch (err) {
    console.error("Erro no /consultor:", err); // Log detalhado do erro
    res.status(500).json({ ok: false, error: "Falha ao consultar IA." });
  }
});

// rota de healthcheck
app.get("/ping", (_, res) => res.json({ ok: true, pong: true }));

const PORT = CONFIG_PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
  
