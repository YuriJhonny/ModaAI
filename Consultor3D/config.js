// Configuração do projeto Consultor3D
// Use o arquivo .env para configurar as chaves API

import 'dotenv/config';

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const PORT = process.env.PORT || 3000;

console.log("✅ Configuração carregada - Chave API do Gemini configurada");
