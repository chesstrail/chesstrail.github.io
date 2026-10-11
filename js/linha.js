// Uma abertura lance a lance: você joga os lances da sua cor e o "livro" responde.
// Usado nas lições e na revisão.
import { Chess, legalDests, tryMove, sync, sanPt } from "./rules.js";

// passo: { cor, lances: [san | [san, comentário]], sozinho }
// el: { linha, notas } elementos onde vão a lista de lances e os comentários
// cb: { onWrong(html), onOk(), onDone({ erros }) }
export function runLinha(board, passo, el, cb = {}) {
  const cor = passo.cor || "w", lista = passo.lances.map((x) => (Array.isArray(x) ? x : [x, null]));
  const game = new Chess();
  board.setOrientation(cor);
  board.setArrows([]);
  board.setHint(null);
  board.opts.onSquareClick = null;
  let i = 0, errosSeguidos = 0, erros = 0, timer = null, fim = false;

  const mostrar = () => {
    const hist = game.history();
    el.linha.innerHTML = hist.map((x, k) => (k % 2 === 0 ? `<span class="n">${k / 2 + 1}.</span>` : "") + `<span>${sanPt(x)}</span> `).join("") || "&nbsp;";
    // comentários dos dois últimos lances (o seu e a resposta)
    if (el.notas) el.notas.innerHTML = passo.sozinho ? "" : [i - 2, i - 1].filter((k) => k >= 0 && lista[k][1])
      .map((k) => `<p><strong class="notation">${k % 2 === 0 ? k / 2 + 1 + "." : (k - 1) / 2 + 1 + "..."}${sanPt(lista[k][0])}</strong> ${lista[k][1]}</p>`).join("");
  };
  const vezDoLivro = () => {
    if (fim) return;
    if (i >= lista.length) { fim = true; cb.onDone?.({ erros }); return; }
    if (game.turn() !== cor) timer = setTimeout(() => { game.move(lista[i][0]); i++; sync(board, game); mostrar(); vezDoLivro(); }, i === 0 ? 450 : 650);
  };
  board.opts.getDests = (sq) => (!fim && game.turn() === cor ? legalDests(game, sq) : []);
  board.opts.onMove = (from, to, promo) => {
    const m = tryMove(game, from, to, promo);
    if (!m) return false;
    if (m.san !== lista[i][0]) {
      game.undo();
      errosSeguidos++;
      erros++;
      board.flash(to, "bad");
      const certo = new Chess(game.fen()).move(lista[i][0]);
      if (errosSeguidos >= 2) board.setArrows([{ from: certo.from, to: certo.to }]);
      cb.onWrong?.(errosSeguidos >= 2 ? `Nesta linha, o lance é <span class="notation">${sanPt(certo.san)}</span> (veja a seta).` : "Não é o lance desta linha. Pense no plano da abertura e tente de novo.");
      return false;
    }
    errosSeguidos = 0;
    i++;
    board.setArrows([]);
    cb.onOk?.();
    sync(board, game);
    mostrar();
    vezDoLivro();
    return true;
  };
  sync(board, game);
  mostrar();
  vezDoLivro();
  return { destroy() { fim = true; clearTimeout(timer); } };
}
