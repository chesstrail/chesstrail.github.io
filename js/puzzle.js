// Executa um puzzle do Lichess no tabuleiro.
// Formato: [id, fen, lances, rating, temas]. O primeiro lance é do adversário (jogado
// sozinho); depois alternam você e ele. Um mate diferente do gabarito também vale.
import { Chess, legalDests, tryMove, sync, parseUci, uci } from "./rules.js";

export const TEMAS_PT = {
  mate: "mate", mateIn1: "mate em 1", mateIn2: "mate em 2", backRankMate: "mate na última fileira",
  hangingPiece: "peça solta", fork: "garfo", pin: "cravada", skewer: "espeto", discoveredAttack: "ataque descoberto",
  doubleCheck: "xeque duplo", promotion: "promoção", pawnEndgame: "final de peões", rookEndgame: "final de torres", queenEndgame: "final de damas", defensiveMove: "lance defensivo", endgame: "final",
  middlegame: "meio-jogo", opening: "abertura", short: "curto", long: "longo",
};

export function runPuzzle(board, puzzle, cb = {}) {
  const [, fen, lances] = puzzle;
  const linha = lances.split(" ");
  const game = new Chess(fen);
  let i = 0, done = false, errou = false, timer = null;
  const jogador = game.turn() === "w" ? "b" : "w"; // quem resolve é o lado que joga depois do 1º lance
  board.setOrientation(jogador);
  board.setArrows([]);
  board.setHint(null);
  sync(board, game);
  board.opts.getDests = (sq) => (!done && game.turn() === jogador ? legalDests(game, sq) : []);
  board.opts.onSquareClick = null;

  const adversario = () => {
    if (i >= linha.length) return fim();
    const m = parseUci(linha[i]);
    game.move({ from: m.from, to: m.to, promotion: m.promotion });
    i++;
    sync(board, game);
    if (i >= linha.length) fim();
    else cb.onTurn?.();
  };
  const fim = () => {
    done = true;
    board.deselect();
    cb.onSolved?.({ limpo: !errou });
  };

  board.opts.onMove = (from, to, promo) => {
    if (done || game.turn() !== jogador) return false;
    const esperado = linha[i];
    const m = tryMove(game, from, to, promo);
    if (!m) return false;
    const certo = uci(m) === esperado || (m.from + m.to === esperado.slice(0, 4) && !esperado[4]) || game.isCheckmate();
    if (!certo) {
      game.undo();
      errou = true;
      board.flash(to, "bad");
      cb.onWrong?.();
      return false;
    }
    i++;
    board.setHint(null);
    board.setArrows([]);
    sync(board, game);
    board.flash(to, "ok", 500);
    if (game.isCheckmate() || i >= linha.length) { fim(); return true; }
    cb.onProgress?.();
    timer = setTimeout(adversario, 450);
    return true;
  };

  timer = setTimeout(adversario, 650); // o lance do adversário que cria o puzzle

  return {
    jogador,
    dica() {
      if (done || game.turn() !== jogador) return;
      errou = true;
      board.setHint(parseUci(linha[i]).from);
    },
    solucao() {
      if (done) return;
      clearTimeout(timer); // cancela o lance do adversário que estava para sair: a solução segue daqui
      errou = true;
      done = true;
      const passo = () => {
        if (i >= linha.length) { cb.onSolved?.({ limpo: false, mostrado: true }); return; }
        const m = parseUci(linha[i]);
        board.setArrows([{ from: m.from, to: m.to }]);
        game.move({ from: m.from, to: m.to, promotion: m.promotion });
        i++;
        sync(board, game);
        timer = setTimeout(passo, 900);
      };
      passo();
    },
    destroy() { clearTimeout(timer); done = true; },
  };
}
