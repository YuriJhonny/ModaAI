// ---------- DOM ----------
const els = {
  messages: document.getElementById("messages"),
  prompt: document.getElementById("prompt"),
  send: document.getElementById("send"),
  quick: document.querySelector(".quick"),
};

// ---------- Chat ----------
function addMsg(text, who = "ai") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
}

els.quick.addEventListener("click", (e) => {
  if (e.target.classList.contains("chip")) {
    els.prompt.value = e.target.textContent;
    els.prompt.focus();
  }
});

els.send.addEventListener("click", sendMessage);
els.prompt.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

async function sendMessage() {
  const text = els.prompt.value.trim();
  if (!text) return;
  els.prompt.value = "";
  addMsg(text, "user");

  try {
    const res = await fetch("/consultor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    if (data.ok) addMsg(data.text, "ai");
    else addMsg("Falha ao obter resposta.", "ai");
  } catch {
    addMsg("Erro de conexão com o servidor.", "ai");
  }
}

// Adicionar mensagem de boas-vindas ao carregar a página
window.addEventListener('load', () => {
  addMsg("Bem-vindo ao Consultor 3D! Sou seu assistente de estilo pessoal com IA. Como posso ajudar com roupas, perfumes, cabelo ou etiqueta hoje?", "ai");
});
