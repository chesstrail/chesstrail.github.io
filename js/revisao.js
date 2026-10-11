// Revisão espaçada: cada item volta depois de 1, 3, 7, 14, 30 e 60 dias se você acertar,
// e volta para amanhã se errar. Itens: linhas de abertura (de memória) e puzzles errados.
import { hoje } from "./progress.js";

const INTERVALOS = [1, 3, 7, 14, 30, 60];

const somarDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return hoje(d); };

// item: { tipo: "linha", licao, passo } ou { tipo: "puzzle", puzzle: [id, fen, lances, rating, temas] }
export function chave(item) { return item.tipo === "linha" ? `linha:${item.licao}:${item.passo}` : `puzzle:${item.puzzle[0]}`; }

// coloca na revisão (se ainda não estiver)
export function adicionar(P, item) {
  P.revisao = P.revisao || {};
  const k = chave(item);
  if (!P.revisao[k]) P.revisao[k] = { ...item, etapa: 0, proxima: somarDias(1) };
}

// resultado de uma revisão
export function registrar(P, k, acertou) {
  const r = P.revisao?.[k];
  if (!r) return;
  r.etapa = acertou ? Math.min(r.etapa + 1, INTERVALOS.length - 1) : 0;
  r.proxima = somarDias(acertou ? INTERVALOS[r.etapa] : 1);
  // puzzle acertado na última etapa sai da revisão: já está aprendido
  if (acertou && r.tipo === "puzzle" && r.etapa === INTERVALOS.length - 1) delete P.revisao[k];
}

export function pendentes(P) {
  const d = hoje();
  return Object.entries(P.revisao || {}).filter(([, r]) => r.proxima <= d).map(([k, r]) => ({ k, ...r }))
    .sort((a, b) => (a.proxima < b.proxima ? -1 : 1));
}

export function proximaData(P) {
  const datas = Object.values(P.revisao || {}).map((r) => r.proxima).sort();
  return datas[0] || null;
}
