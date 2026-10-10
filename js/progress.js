// Progresso salvo neste navegador (localStorage). Sem conta: fica no aparelho.

const KEY = "trilha-xadrez-v1";
const vazio = () => ({ licoes: {}, puzzle: { rating: 800, resolvidos: 0, acertos: 0, vistos: [] }, dias: [], partidas: [] });

export function load() {
  try { return Object.assign(vazio(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { return vazio(); }
}
export function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* modo privado: segue sem salvar */ } }

function hoje() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// marca o dia como "treinou" (para a sequência de dias)
export function treinou(p) {
  const h = hoje();
  if (!p.dias.includes(h)) { p.dias.push(h); p.dias = p.dias.slice(-400); }
}
export function sequencia(p) {
  const set = new Set(p.dias), d = new Date();
  let n = 0;
  if (!set.has(hoje())) d.setDate(d.getDate() - 1); // ainda não treinou hoje: conta até ontem
  for (;;) {
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    if (!set.has(k)) break;
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}
