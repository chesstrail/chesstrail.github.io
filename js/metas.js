// Meta do dia (pontos) e conquistas. Tudo calculado a partir do progresso salvo.
import { hoje, sequencia } from "./progress.js";
import { NIVEIS, LICOES } from "./lessons.js";

export const METAS = { leve: { pontos: 5, nome: "Leve" }, media: { pontos: 10, nome: "Média" }, intensa: { pontos: 20, nome: "Intensa" } };
export const PONTOS = { licao: 3, puzzle: 1, revisao: 1, partida: 2, analise: 2 };

export const metaDoDia = (P) => METAS[P.meta] ? METAS[P.meta].pontos : METAS.leve.pontos;
export const pontosHoje = (P) => P.pontos?.[hoje()] || 0;

// soma pontos de hoje; devolve true se esta ação bateu a meta do dia
export function pontuar(P, tipo) {
  P.pontos = P.pontos || {};
  P.contagem = P.contagem || {};
  P.metasBatidas = P.metasBatidas || [];
  const d = hoje(), antes = P.pontos[d] || 0;
  P.pontos[d] = antes + PONTOS[tipo];
  P.contagem[tipo] = (P.contagem[tipo] || 0) + 1;
  // guarda só os últimos 90 dias
  const dias = Object.keys(P.pontos).sort();
  for (const x of dias.slice(0, Math.max(0, dias.length - 90))) delete P.pontos[x];
  const bateu = antes < metaDoDia(P) && P.pontos[d] >= metaDoDia(P);
  if (bateu && !P.metasBatidas.includes(d)) P.metasBatidas = P.metasBatidas.concat(d).slice(-400);
  return bateu;
}

const feitas = (P, nivel) => LICOES.filter((l) => (nivel == null || l.nivel === nivel) && P.licoes[l.id]).length;
const vitorias = (P, min = 1) => (P.partidas || []).filter((x) => x.resultado === "vitoria" && x.nivel >= min).length;

export const CONQUISTAS = [
  { id: "primeira-licao", icone: "♙", titulo: "Primeiro passo", desc: "Concluir a primeira lição.", ok: (P) => feitas(P) >= 1 },
  ...NIVEIS.map((nv) => ({ id: "nivel-" + nv.n, icone: "♙♘♗♖♕♔"[nv.n - 1] || "♔", titulo: nv.titulo, desc: `Concluir todas as lições do nível ${nv.n}.`, ok: (P) => feitas(P, nv.n) === LICOES.filter((l) => l.nivel === nv.n).length })),
  { id: "trilha", icone: "🏆", titulo: "Trilha completa", desc: "Concluir todas as lições.", ok: (P) => feitas(P) === LICOES.length },
  { id: "puzzles-10", icone: "🧩", titulo: "Caçador de táticas", desc: "Resolver 10 puzzles sem ajuda.", ok: (P) => P.puzzle.acertos >= 10 },
  { id: "puzzles-100", icone: "🧩", titulo: "Cem na conta", desc: "Resolver 100 puzzles sem ajuda.", ok: (P) => P.puzzle.acertos >= 100 },
  { id: "rating-1000", icone: "📈", titulo: "Nível 1000", desc: "Chegar a 1000 nos puzzles.", ok: (P) => P.puzzle.rating >= 1000 },
  { id: "rating-1200", icone: "📈", titulo: "Nível 1200", desc: "Chegar a 1200 nos puzzles.", ok: (P) => P.puzzle.rating >= 1200 },
  { id: "rating-1500", icone: "📈", titulo: "Nível 1500", desc: "Chegar a 1500 nos puzzles.", ok: (P) => P.puzzle.rating >= 1500 },
  { id: "vitoria-1", icone: "⚔️", titulo: "Primeira vitória", desc: "Vencer o computador em qualquer nível.", ok: (P) => vitorias(P) >= 1 },
  { id: "vitoria-4", icone: "⚔️", titulo: "Jogador cuidadoso", desc: "Vencer o computador no nível 4 ou acima.", ok: (P) => vitorias(P, 4) >= 1 },
  { id: "vitoria-6", icone: "⚔️", titulo: "Jogador forte", desc: "Vencer o computador no nível 6 ou acima.", ok: (P) => vitorias(P, 6) >= 1 },
  { id: "vitoria-8", icone: "👑", titulo: "Contra a força máxima", desc: "Vencer o computador no nível 8.", ok: (P) => vitorias(P, 8) >= 1 },
  { id: "sequencia-3", icone: "🔥", titulo: "Três dias seguidos", desc: "Treinar 3 dias seguidos.", ok: (P) => sequencia(P) >= 3 },
  { id: "sequencia-7", icone: "🔥", titulo: "Uma semana", desc: "Treinar 7 dias seguidos.", ok: (P) => sequencia(P) >= 7 },
  { id: "sequencia-30", icone: "🔥", titulo: "Um mês", desc: "Treinar 30 dias seguidos.", ok: (P) => sequencia(P) >= 30 },
  { id: "meta-1", icone: "🎯", titulo: "Meta batida", desc: "Bater a meta do dia pela primeira vez.", ok: (P) => (P.metasBatidas || []).length >= 1 },
  { id: "meta-7", icone: "🎯", titulo: "Sete metas", desc: "Bater a meta do dia 7 vezes.", ok: (P) => (P.metasBatidas || []).length >= 7 },
  { id: "revisao-10", icone: "🔁", titulo: "Memória boa", desc: "Fazer 10 revisões.", ok: (P) => (P.contagem?.revisao || 0) >= 10 },
  { id: "analise-1", icone: "🔍", titulo: "Analista", desc: "Analisar uma partida sua.", ok: (P) => (P.contagem?.analise || 0) >= 1 },
];

// marca as conquistas novas; devolve as que acabaram de ser desbloqueadas
export function verificar(P) {
  P.conquistas = P.conquistas || {};
  const novas = [];
  for (const c of CONQUISTAS) if (!P.conquistas[c.id] && c.ok(P)) { P.conquistas[c.id] = hoje(); novas.push(c); }
  return novas;
}
