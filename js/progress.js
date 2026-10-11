// Progresso salvo neste navegador (localStorage). Sem conta: fica no aparelho.

const KEY = "trilha-xadrez-v1";
const vazio = () => ({ licoes: {}, puzzle: { rating: 800, resolvidos: 0, acertos: 0, vistos: [] }, dias: [], partidas: [], revisao: {} });

export function load() {
  try { return Object.assign(vazio(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch { return vazio(); }
}
export function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* modo privado: segue sem salvar */ } }

export function hoje(d = new Date()) {
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
    const k = hoje(d);
    if (!set.has(k)) break;
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- código de progresso (levar para outro aparelho) ----------
// "TX1." + JSON comprimido em base64url; "TX0." sem compressão (navegadores antigos)
const b64 = (bytes) => { let s = ""; bytes.forEach((b) => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const passar = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function exportar(p) {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  if (typeof CompressionStream === "function") return "TX1." + b64(await passar(bytes, new CompressionStream("deflate-raw")));
  return "TX0." + b64(bytes);
}

export async function importar(codigo) {
  const c = codigo.replace(/\s+/g, "");
  const [tipo, corpo] = [c.slice(0, 4), c.slice(4)];
  let bytes;
  if (tipo === "TX1.") {
    if (typeof DecompressionStream !== "function") throw new Error("Este navegador é antigo demais para ler o código. Atualize-o e tente de novo.");
    bytes = await passar(unb64(corpo), new DecompressionStream("deflate-raw"));
  } else if (tipo === "TX0.") bytes = unb64(corpo);
  else throw new Error("Esse não parece um código de progresso da Trilha do Xadrez.");
  const p = JSON.parse(new TextDecoder().decode(bytes));
  if (!p || typeof p !== "object" || !p.licoes) throw new Error("O código está incompleto.");
  return Object.assign(vazio(), p);
}

// junta o progresso de outro aparelho com o daqui, sem perder nada dos dois lados
export function mesclar(a, b) {
  for (const [id, v] of Object.entries(b.licoes || {})) if (!a.licoes[id] || v.em < a.licoes[id].em) a.licoes[id] = v;
  a.dias = [...new Set([...a.dias, ...(b.dias || [])])].sort().slice(-400);
  if ((b.puzzle?.resolvidos || 0) > a.puzzle.resolvidos) a.puzzle = { ...b.puzzle };
  a.puzzle.vistos = [...new Set([...(a.puzzle.vistos || []), ...(b.puzzle?.vistos || [])])].slice(-500);
  const partidas = new Map([...(a.partidas || []), ...(b.partidas || [])].map((x) => [x.em, x]));
  a.partidas = [...partidas.values()].sort((x, y) => x.em - y.em).slice(-100);
  a.revisao = a.revisao || {};
  for (const [k, r] of Object.entries(b.revisao || {})) if (!a.revisao[k] || r.etapa > a.revisao[k].etapa) a.revisao[k] = r;
  if (a.ultimoNivel == null && b.ultimoNivel != null) a.ultimoNivel = b.ultimoNivel;
  return a;
}
