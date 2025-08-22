// ---------- DOM ----------
const els = {
  occasion: document.getElementById("occasion"),
  faceShape: document.getElementById("faceShape"),
  skinTone: document.getElementById("skinTone"),
  hairStyle: document.getElementById("hairStyle"),
  beard: document.getElementById("beard"),
  shirtColor: document.getElementById("shirtColor"),
  pantsColor: document.getElementById("pantsColor"),
  notes: document.getElementById("notes"),

  btnGenerate: document.getElementById("btnGenerate"),
  messages: document.getElementById("messages"),
  prompt: document.getElementById("prompt"),
  send: document.getElementById("send"),
  quick: document.querySelector(".quick"),
  imgWrap: document.getElementById("imgWrap"),
  promptUsed: document.getElementById("promptUsed"),
  resetCam: document.getElementById("resetCam"),
};

// ---------- Preview 3D (Three.js) ----------
let scene, camera, renderer, controls;
let head, body, pants, hairMesh, beardMesh, light;

init3D();
updateAvatar();

function init3D() {
  const canvas = document.getElementById("avatarCanvas");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101521);

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(1.8, 2.2, 4);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(w, h);

  controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 1.5, 0);

  // iluminação
  light = new THREE.DirectionalLight(0xffffff, 1.1);
  light.position.set(2, 4, 3);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // chão
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x0f1320, metalness: 0.2, roughness: 0.9 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  scene.add(plane);

  // boneco simples
  head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8b39a, roughness: 0.7 })
  );
  head.position.set(0, 2, 0);
  scene.add(head);

  body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.6, 1.1, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.6 })
  );
  body.position.set(0, 1.1, 0);
  scene.add(body);

  pants = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 0.6, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 })
  );
  pants.position.set(0, 0.3, 0);
  scene.add(pants);

  hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.47, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 })
  );
  hairMesh.position.copy(head.position);
  scene.add(hairMesh);

  beardMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.47, 24, 24, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 })
  );
  beardMesh.position.copy(head.position);
  scene.add(beardMesh);

  window.addEventListener("resize", onResize);
  animate();

  els.resetCam.addEventListener("click", () => {
    camera.position.set(1.8, 2.2, 4);
    controls.target.set(0, 1.5, 0);
    controls.update();
  });
}

function onResize() {
  const canvas = document.getElementById("avatarCanvas");
  const w = canvas.clientWidth, h = canvas.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function hexToThreeColor(hex) {
  return new THREE.Color(hex || "#ffffff");
}

function updateAvatar() {
  // tons de pele simples
  const skin = (els.skinTone.value || "médio").toLowerCase();
  const skinMap = {
    "claro": "#f1d2c5",
    "médio": "#d8b39a",
    "moreno": "#b18166",
    "escuro": "#7a5038"
  };
  head.material.color = hexToThreeColor(skinMap[skin] || "#d8b39a");

  // camisa e calça
  body.material.color = hexToThreeColor(els.shirtColor.value);
  pants.material.color = hexToThreeColor(els.pantsColor.value);

  // cabelo e barba
  const hair = (els.hairStyle.value || "").toLowerCase();
  hairMesh.visible = hair !== "careca";
  beardMesh.visible = !!els.beard.checked;
}

// Reagir às mudanças
["occasion","faceShape","skinTone","hairStyle","beard","shirtColor","pantsColor","notes"]
  .forEach(id => {
    const el = els[id];
    el.addEventListener(el.type === "checkbox" ? "change" : "input", updateAvatar);
  });

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

  const context = collectContext();
  try {
    const res = await fetch("/consultor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, context })
    });
    const data = await res.json();
    if (data.ok) addMsg(data.text, "ai");
    else addMsg("Falha ao obter resposta.", "ai");
  } catch {
    addMsg("Erro de conexão com o servidor.", "ai");
  }
}

// ---------- Image Generation ----------
els.btnGenerate.addEventListener("click", generateImage);

function collectContext() {
  return {
    occasion: els.occasion.value,
    faceShape: els.faceShape.value,
    skinTone: els.skinTone.value,
    hairStyle: els.hairStyle.value,
    beard: els.beard.checked,
    shirtColor: els.shirtColor.value,
    pantsColor: els.pantsColor.value,
    notes: els.notes.value
  };
}

async function generateImage() {
  const payload = collectContext();

  setImagePlaceholder("Gerando imagem...");
  els.promptUsed.textContent = "";

  try {
    const res = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Falha ao gerar.");

    const url = "data:image/png;base64," + data.imageBase64;
    const img = new Image();
    img.src = url;
    img.alt = "Imagem gerada por IA";
    img.onload = () => {
      els.imgWrap.innerHTML = "";
      els.imgWrap.appendChild(img);
    };
    els.promptUsed.textContent = data.promptUsed || "";
  } catch (e) {
    console.error(e);
    setImagePlaceholder("Erro ao gerar imagem.");
  }
}

function setImagePlaceholder(text) {
  els.imgWrap.innerHTML = `<div class="placeholder">${text}</div>`;
}
setImagePlaceholder("Clique em Gerar para criar a imagem.");