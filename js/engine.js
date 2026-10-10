// Stockfish 19 (versão leve, um processo) num Web Worker. Um pedido por vez:
// cada "analisar" espera o anterior terminar.

let worker = null, ready = null, fila = Promise.resolve();

function boot() {
  if (ready) return ready;
  worker = new Worker("vendor/stockfish/stockfish-19-lite-single.js");
  ready = new Promise((resolve) => {
    const onMsg = (e) => {
      if (e.data === "uciok") { worker.postMessage("isready"); }
      else if (e.data === "readyok") { worker.removeEventListener("message", onMsg); resolve(); }
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage("uci");
  });
  return ready;
}

// { fen, depth | movetime, skill (0-20), multipv } -> { best, ponder, score: {cp|mate}, pv }
export function analyze({ fen, depth, movetime, skill = 20, multipv = 1 }) {
  const job = fila.then(() => boot()).then(() => new Promise((resolve) => {
    let last = {};
    const lines = {};
    const onMsg = (e) => {
      const l = String(e.data);
      if (l.startsWith("info") && l.includes(" pv ")) {
        const m = l.match(/ multipv (\d+)/), k = m ? Number(m[1]) : 1;
        const cp = l.match(/ score cp (-?\d+)/), mate = l.match(/ score mate (-?\d+)/), pv = l.split(" pv ")[1];
        lines[k] = { score: mate ? { mate: Number(mate[1]) } : { cp: Number(cp ? cp[1] : 0) }, pv: pv.split(" ") };
        if (k === 1) last = lines[1];
      } else if (l.startsWith("bestmove")) {
        worker.removeEventListener("message", onMsg);
        const [, best, , ponder] = l.split(" ");
        resolve({ best: best === "(none)" ? null : best, ponder, score: last.score, pv: last.pv, lines });
      }
    };
    worker.addEventListener("message", onMsg);
    worker.postMessage("ucinewgame");
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage(`setoption name MultiPV value ${multipv}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(movetime ? `go movetime ${movetime}` : `go depth ${depth || 12}`);
  }));
  fila = job.catch(() => {});
  return job;
}

// avaliação do ponto de vista das brancas, em centipeões (mate vira ±10000)
export function whiteCp(score, fen) {
  if (!score) return 0;
  const turnWhite = fen.split(" ")[1] === "w";
  const v = score.mate != null ? Math.sign(score.mate) * (10000 - Math.abs(score.mate) * 10) : score.cp;
  return turnWhite ? v : -v;
}
