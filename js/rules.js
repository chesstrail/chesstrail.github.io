// Ponte entre o chess.js (regras) e o tabuleiro.
import { Chess } from "../vendor/chess.js";
import * as sons from "./sons.js";

export { Chess };

// lances legais de uma casa, no formato que o tabuleiro usa
export function legalDests(game, sq) {
  return game.moves({ square: sq, verbose: true }).map((m) => ({ to: m.to, capture: !!m.captured }));
}

// tenta o lance; devolve o lance do chess.js ou null se for ilegal
export function tryMove(game, from, to, promotion) {
  try { return game.move({ from, to, promotion: promotion || "q" }); }
  catch { return null; }
}

// casa do rei em xeque (para destacar), ou null
export function checkSquare(game) {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  for (const row of game.board()) for (const p of row) if (p && p.type === "k" && p.color === turn) return p.square;
  return null;
}

export const uci = (m) => m.from + m.to + (m.promotion || "");
export const parseUci = (s) => ({ from: s.slice(0, 2), to: s.slice(2, 4), promotion: s[4] });

// sincroniza tabuleiro com a partida: peças, último lance e xeque
export function sync(board, game) {
  board.setFen(game.fen());
  const hist = game.history({ verbose: true }), last = hist[hist.length - 1];
  // som só quando a partida avançou um lance (não ao abrir uma posição nem ao desfazer)
  if (board._somJogo === game && hist.length === board._somN + 1 && last) sons.doLance(last, game.inCheck());
  board._somJogo = game;
  board._somN = hist.length;
  board.setLastMove(last ? last.from : null, last ? last.to : null);
  board.setCheck(checkSquare(game));
}

const PT = { K: "R", Q: "D", R: "T", B: "B", N: "C" };
// notação em português (R, D, T, B, C) a partir da SAN inglesa do chess.js
export function sanPt(san) { return san.replace(/[KQRBN]/g, (c) => PT[c]); }
