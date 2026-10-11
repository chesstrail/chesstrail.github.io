// Sons gerados na hora (Web Audio), sem arquivos: lance, captura, xeque, acerto, erro e fim.
// No iPhone, respeitam a chave de silencioso.
let ctx = null, ligado = true;

export function ligar(v) { ligado = v; }
export const estaLigado = () => ligado;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch {}
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
// o navegador só libera o áudio depois de um toque: prepara no primeiro
if (typeof window !== "undefined") addEventListener("pointerdown", () => { if (ligado) audio(); }, { once: true, capture: true });

// batida de madeira: ruído curto filtrado
function batida(freq, vol, dur = 0.07) {
  const a = audio(); if (!a) return;
  const t = a.currentTime, n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
  g.gain.setValueAtTime(vol, t);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}
// notas curtas (acerto, erro, fim)
function notas(lista, tipo = "sine", vol = 0.12) {
  const a = audio(); if (!a) return;
  let t = a.currentTime;
  for (const [freq, dur] of lista) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
    t += dur * 0.8;
  }
}

const tocar = (fn) => (...args) => { if (!ligado) return; try { fn(...args); } catch {} };
export const lance = tocar(() => batida(1800, 0.9));
export const captura = tocar(() => { batida(1100, 1.2, 0.09); setTimeout(() => batida(2200, 0.5, 0.05), 35); });
export const xeque = tocar(() => { batida(1500, 0.9); notas([[880, 0.12]], "triangle", 0.08); });
export const acerto = tocar(() => notas([[660, 0.12], [990, 0.22]]));
export const erro = tocar(() => notas([[220, 0.18]], "square", 0.05));
export const vitoria = tocar(() => notas([[523, 0.14], [659, 0.14], [784, 0.14], [1047, 0.35]]));
export const fim = tocar(() => notas([[392, 0.2], [330, 0.35]], "triangle", 0.1));

// som certo para um lance do chess.js
export function doLance(m, emXeque) {
  if (emXeque) xeque();
  else if (m.captured) captura();
  else lance();
}
