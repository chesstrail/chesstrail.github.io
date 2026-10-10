import { Board, fenToPieces, freeDests } from "./board.js";
import { Chess, legalDests, tryMove, sync, uci, parseUci, sanPt } from "./rules.js";
import { NIVEIS, LICOES, licao } from "./lessons.js";
import { runPuzzle, TEMAS_PT } from "./puzzle.js";
import { analyze, whiteCp } from "./engine.js";
import * as progresso from "./progress.js";

const app = document.getElementById("app");
const P = progresso.load();
let atual = null; // limpeza da tela anterior (timers, partida)
let puzzlesData = null;

const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const salvar = () => { progresso.save(P); topo(); };
const proximaLicao = () => LICOES.find((l) => !P.licoes[l.id]) || null;
async function puzzles() {
  if (!puzzlesData) puzzlesData = await fetch("data/puzzles.json").then((r) => r.json());
  return puzzlesData;
}

function topo() {
  const st = document.getElementById("streak"), dias = progresso.sequencia(P);
  st.innerHTML = `<b>${dias}</b> ${dias === 1 ? "dia seguido" : "dias seguidos"}`;
  st.title = `Treinou ${dias} ${dias === 1 ? "dia seguido" : "dias seguidos"}`;
  const rota = location.hash.split("/")[1] || "";
  document.querySelectorAll(".nav a").forEach((a) => {
    const alvo = a.getAttribute("href").split("/")[1] || "";
    a.toggleAttribute("aria-current", alvo === rota || (alvo === "" && rota === "licao"));
    if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
  });
}

function novoTabuleiro(slot, opts) {
  const el = document.createElement("div");
  slot.appendChild(el);
  return new Board(el, opts);
}

// ======================= início: a trilha =======================
function telaInicio() {
  const prox = proximaLicao(), feitas = LICOES.filter((l) => P.licoes[l.id]).length;
  app.innerHTML = "";
  const hero = h(`<section class="hero">
    <div>
      <p class="eyebrow">Trilha do Xadrez</p>
      <h1>Aprenda xadrez do zero, no seu ritmo.</h1>
      <p class="lead">Lições curtas com exercícios no tabuleiro, puzzles de partidas reais que acompanham o seu nível e partidas contra o computador com revisão dos erros.</p>
      <div class="btn-row" style="margin-top:20px">
        ${prox ? `<a class="btn primary" href="#/licao/${prox.id}">${feitas ? "Continuar" : "Começar"}: ${prox.titulo}</a>` : `<a class="btn primary" href="#/puzzles">Trilha concluída — treinar puzzles</a>`}
        <a class="btn" href="#/puzzles">Puzzles</a>
        <a class="btn" href="#/jogar">Jogar</a>
      </div>
      <dl class="stats">
        <div class="stat"><dt>Lições concluídas</dt><dd>${feitas}<small style="font-size:16px;color:var(--muted)"> de ${LICOES.length}</small></dd></div>
        <div class="stat"><dt>Nível nos puzzles</dt><dd>${Math.round(P.puzzle.rating)}</dd></div>
        <div class="stat"><dt>Dias seguidos</dt><dd>${progresso.sequencia(P)}</dd></div>
      </dl>
    </div>
    <div class="hero-board"></div>
  </section>`);
  app.appendChild(hero);
  // tabuleiro decorativo: um garfo de cavalo, o assunto de uma das lições
  const b = novoTabuleiro(hero.querySelector(".hero-board"), { interactive: false, coords: false });
  b.setFen("r3k3/2N2ppp/8/8/8/8/5PPP/6K1 b - - 0 1");
  b.setArrows([{ from: "c7", to: "e8" }, { from: "c7", to: "a8" }]);

  NIVEIS.forEach((nv) => {
    const ls = LICOES.filter((l) => l.nivel === nv.n), ok = ls.filter((l) => P.licoes[l.id]).length;
    const sec = h(`<section class="level" aria-labelledby="nv${nv.n}">
      <div class="level-head"><div><p class="eyebrow">Nível ${nv.n}</p><h2 id="nv${nv.n}">${nv.titulo}</h2><p>${nv.resumo}</p></div>
      <span class="level-count">${ok}/${ls.length}</span></div>
      <div class="lessons"></div></section>`);
    ls.forEach((l) => {
      const n = LICOES.indexOf(l) + 1, done = !!P.licoes[l.id];
      sec.querySelector(".lessons").appendChild(h(`<a class="lesson-card${done ? " done" : ""}${prox && prox.id === l.id ? " next" : ""}" href="#/licao/${l.id}">
        <span class="num">${done ? "✓" : n}</span><span class="t">${l.titulo}</span><span class="d">${l.resumo}</span></a>`));
    });
    app.appendChild(sec);
  });
}

// ======================= lição =======================
function telaLicao(id) {
  const L = licao(id);
  if (!L) { location.hash = "#/"; return; }
  const n = LICOES.indexOf(L) + 1;
  app.innerHTML = "";
  const tela = h(`<div class="trainer">
    <div><div class="board-wrap"></div></div>
    <div class="side">
      <div class="panel">
        <p class="eyebrow">Nível ${L.nivel} · Lição ${n} de ${LICOES.length}</p>
        <h2>${L.titulo}</h2>
        <div class="steps" style="margin-top:14px">${L.passos.map(() => "<i></i>").join("")}</div>
      </div>
      <div class="panel prose" id="passo" aria-live="polite"></div>
      <div id="fb" aria-live="polite"></div>
      <div class="btn-row" id="acoes"></div>
    </div></div>`);
  app.appendChild(tela);
  const board = novoTabuleiro(tela.querySelector(".board-wrap"), {});
  const box = tela.querySelector("#passo"), fb = tela.querySelector("#fb"), acoes = tela.querySelector("#acoes");
  let k = 0, limpeza = null;
  const feedback = (tipo, txt) => { fb.innerHTML = txt ? `<div class="feedback ${tipo}">${txt}</div>` : ""; };
  const botoes = (list) => { acoes.innerHTML = ""; list.forEach((b) => acoes.appendChild(b)); };
  const botao = (txt, cls, fn) => { const b = h(`<button type="button" class="btn ${cls}">${txt}</button>`); b.addEventListener("click", fn); return b; };
  const marcarPassos = () => tela.querySelectorAll(".steps i").forEach((el, i) => el.className = i < k ? "done" : i === k ? "now" : "");
  const concluirPasso = (msg) => {
    if (msg) feedback("ok", msg);
    botoes([botao(k + 1 < L.passos.length ? "Continuar" : "Concluir lição", "primary", () => { k++; passo(); })]);
    acoes.querySelector("button").focus({ preventScroll: true });
  };
  const resetBoard = (fen, opts = {}) => {
    board.opts.getDests = null; board.opts.onMove = null; board.opts.onSquareClick = null;
    board.opts.interactive = opts.interactive !== false;
    board.setOrientation(opts.cor || L.cor || "w");
    board.setArrows([]); board.setTargets([]); board.setHint(null); board.setLastMove(null); board.setCheck(null);
    board.setFen(fen || "8/8/8/8/8/8/8/8 w - - 0 1");
  };

  function passo() {
    if (limpeza) { limpeza(); limpeza = null; }
    feedback();
    marcarPassos();
    if (k >= L.passos.length) return concluirLicao();
    const s = L.passos[k];
    box.innerHTML = "";
    acoes.innerHTML = "";

    if (s.t === "texto") {
      resetBoard(s.fen, { interactive: false });
      board.setArrows((s.setas || []).map(([from, to]) => ({ from, to })));
      box.innerHTML = s.html;
      concluirPasso();
    }

    if (s.t === "casa") {
      resetBoard(s.fen);
      box.innerHTML = `<p>${s.instrucao}</p>`;
      board.opts.onSquareClick = (sq) => {
        if (sq === s.casa) { board.flash(sq, "ok", 900); board.opts.onSquareClick = () => true; concluirPasso(`Certo: essa é a <span class="notation">${sq}</span>.`); }
        else { board.flash(sq, "bad"); feedback("bad", `Essa é a <span class="notation">${sq}</span>. Procure a coluna ${s.casa[0]} e a fileira ${s.casa[1]}.`); }
        return true;
      };
    }

    if (s.t === "alvos") {
      resetBoard(s.fen);
      let pecas = fenToPieces(s.fen), lances = 0;
      let alvos = s.capturar ? Object.keys(pecas).filter((q) => pecas[q][0] === "b") : s.alvos.slice();
      box.innerHTML = `<p>${s.instrucao}</p><p class="notation" id="conta" style="display:inline-block">${alvos.length} restante(s) · 0 lances</p>`;
      if (!s.capturar) board.setTargets(alvos);
      board.opts.getDests = (sq) => (pecas[sq] === "w" + s.mover && alvos.length ? freeDests(pecas, sq) : []);
      board.opts.onMove = (from, to) => {
        const p = pecas[from];
        delete pecas[from];
        pecas[to] = p;
        lances++;
        alvos = alvos.filter((a) => a !== to);
        board.setPieces(pecas);
        board.setLastMove(from, to);
        if (!s.capturar) board.setTargets(alvos);
        box.querySelector("#conta").textContent = `${alvos.length} restante(s) · ${lances} ${lances === 1 ? "lance" : "lances"}`;
        if (!alvos.length) concluirPasso(`Feito em ${lances} ${lances === 1 ? "lance" : "lances"}!`);
        return true;
      };
    }

    if (s.t === "lance") {
      const game = new Chess(s.fen);
      resetBoard(s.fen, { cor: game.turn() });
      sync(board, game);
      box.innerHTML = `<p>${s.instrucao}</p>`;
      let resolvido = false;
      board.opts.getDests = (sq) => (resolvido ? [] : legalDests(game, sq));
      board.opts.onMove = (from, to, promo) => {
        const m = tryMove(game, from, to, promo);
        if (!m) return false;
        const u = uci(m);
        let ok = false, msg = "";
        if (s.aceitar) ok = s.aceitar.some((a) => u.startsWith(a));
        else if (s.objetivo === "mate") ok = game.isCheckmate();
        else if (s.objetivo === "xeque") ok = game.inCheck();
        if (!ok) {
          if (s.objetivo === "mate" && game.isStalemate()) msg = "Afogou! O rei preto não tem lances, mas também não está em xeque: isso é empate. Tente outro lance.";
          else if (s.objetivo === "mate" && game.inCheck()) msg = "É xeque, mas o rei ainda tem saída. Procure o lance que não deixa nenhuma fuga.";
          else msg = s.errado || "Não é esse. Tente de novo.";
          game.undo();
          board.flash(to, "bad");
          feedback("bad", msg);
          return false;
        }
        resolvido = true;
        sync(board, game);
        concluirPasso(s.ok || (s.objetivo === "mate" ? "Xeque-mate!" : "Isso!"));
        return true;
      };
    }

    if (s.t === "escolha") {
      resetBoard(s.fen, { interactive: false });
      box.innerHTML = `<p><strong>${s.pergunta}</strong></p><div class="choices"></div>`;
      s.opcoes.forEach((o) => {
        const b = h(`<button type="button" class="choice">${o.texto}</button>`);
        b.addEventListener("click", () => {
          if (o.certo) {
            box.querySelectorAll(".choice").forEach((x) => x.disabled = true);
            b.classList.add("right");
            concluirPasso(o.explica);
          } else { b.classList.add("wrong"); feedback("bad", o.explica); }
        });
        box.querySelector(".choices").appendChild(b);
      });
    }

    if (s.t === "puzzle") {
      box.innerHTML = `<p>Carregando os exercícios…</p>`;
      resetBoard();
      puzzles().then((data) => {
        const lista = data.temas[s.tema].slice(0, s.qtd);
        let j = 0, ctl = null;
        const um = () => {
          if (ctl) ctl.destroy();
          feedback();
          if (j >= lista.length) { concluirPasso(`Você resolveu os ${lista.length} exercícios.`); return; }
          box.innerHTML = `<p><strong>Exercício ${j + 1} de ${lista.length}</strong> · ${TEMAS_PT[s.tema]}</p><p id="vez"></p>`;
          board.opts.interactive = true;
          ctl = runPuzzle(board, lista[j], {
            onTurn: () => {},
            onWrong: () => feedback("bad", "Não é esse lance. Olhe de novo: o que está atacado, o que está sem defesa?"),
            onProgress: () => feedback("info", "Boa! Continue: ainda há lances na sequência."),
            onSolved: ({ mostrado }) => {
              feedback(mostrado ? "info" : "ok", mostrado ? "Essa era a solução." : "Resolvido!");
              botoes([botao(j + 1 < lista.length ? "Próximo exercício" : "Continuar", "primary", () => { j++; um(); })]);
            },
          });
          box.querySelector("#vez").textContent = `Você joga com as ${ctl.jogador === "w" ? "brancas" : "pretas"}. Espere o lance do adversário e encontre a resposta.`;
          botoes([botao("Dica", "", () => ctl.dica()), botao("Ver solução", "", () => ctl.solucao())]);
        };
        um();
        limpeza = () => ctl && ctl.destroy();
      });
    }

    if (s.t === "vencer") {
      const game = new Chess(s.fen);
      const cor = game.turn(), outro = cor === "w" ? "b" : "w";
      resetBoard(s.fen, { cor });
      sync(board, game);
      let lances = 0, pensando = false, acabou = false;
      box.innerHTML = `<p>${s.instrucao}</p><p class="notation" id="conta" style="display:inline-block">0 de ${s.limite} lances</p>`;
      botoes([botao("Recomeçar", "", () => passo())]);
      const pecas = (c) => game.board().flat().filter((x) => x && x.color === c).map((x) => x.type);
      // "antes": logo depois do seu lance; "depois": depois da resposta do computador
      const avaliar = (fase) => {
        if (game.isCheckmate()) return game.turn() === cor ? "perdeu" : "ok";
        if (game.isGameOver()) return s.objetivo === "segurar" ? "ok" : game.isStalemate() ? "afogou" : "empate";
        if (fase === "antes") return null;
        const meu = pecas(cor), dele = pecas(outro);
        if (s.objetivo === "segurar") {
          if (dele.includes("q") || !meu.includes("r")) return "perdeu";
          return lances >= s.limite ? "ok" : null;
        }
        if (s.objetivo === "promover" && game.history({ verbose: true }).some((m) => m.promotion && m.color === cor)) {
          const VAL = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 }, soma = (l) => l.reduce((t, x) => t + VAL[x], 0);
          if (soma(meu) - soma(dele) >= 5) return "ok"; // a peça nova sobreviveu: vantagem decisiva
          // o adversário entregou a peça para tirar a dama: se dá para recapturar, a vitória continua
          const ult = game.history({ verbose: true }).at(-1);
          const promo = game.history({ verbose: true }).filter((m) => m.promotion && m.color === cor).at(-1);
          const recaptura = ult.to === promo.to && ult.piece !== "k" && game.isAttacked(ult.to, cor);
          return recaptura && soma(meu) - (soma(dele) - VAL[ult.piece]) >= 5 ? "ok-troca" : "perdeu-dama";
        }
        if (s.objetivo === "capturar") {
          if (dele.includes("q")) return "perdeu";
          if (dele.length === 1) return meu.includes("q") ? "ok" : "perdeu-dama";
        }
        return lances >= s.limite ? "limite" : null;
      };
      const OK = {
        mate: () => `Xeque-mate em ${lances} lances!`,
        promover: () => "Coroou, e a peça nova está a salva!",
        capturar: () => "O peão caiu! Com dama contra rei, o mate é só técnica.",
        segurar: () => (game.isGameOver() ? "Empate garantido!" : `Você segurou ${s.limite} lances. Com essa defesa, o empate está garantido.`),
      };
      const FALHA = {
        perdeu: s.objetivo === "segurar" ? "A defesa caiu desta vez. Lembre: torre na sexta, e xeques por trás quando o peão avançar." : "Não deu desta vez.",
        "perdeu-dama": "A peça nova foi capturada. Tente de novo, com cuidado na hora de coroar.",
        afogou: "Afogamento: o rei adversário ficou sem lances e sem xeque. É empate.",
        empate: "A partida empatou.",
        limite: `Passou de ${s.limite} lances.`,
      };
      board.opts.getDests = (sq) => (acabou || pensando || game.turn() !== cor ? [] : legalDests(game, sq));
      board.opts.onMove = async (from, to, promo) => {
        const m = tryMove(game, from, to, promo);
        if (!m) return false;
        lances++;
        sync(board, game);
        box.querySelector("#conta").textContent = `${lances} de ${s.limite} lances`;
        let r = avaliar("antes");
        if (!r) {
          pensando = true;
          const { best } = await analyze({ fen: game.fen(), depth: 10 });
          pensando = false;
          if (acabou) return true;
          if (best) { const b = parseUci(best); game.move({ from: b.from, to: b.to, promotion: b.promotion }); sync(board, game); }
          r = avaliar("depois");
        }
        if (r === "ok-troca") { acabou = true; board.setArrows([]); concluirPasso("Coroou! O adversário capturou a peça nova, mas é só recapturar: você fica com vantagem decisiva."); }
        else if (r === "ok") { acabou = true; concluirPasso(OK[s.objetivo]()); }
        else if (r) {
          acabou = true;
          feedback("bad", FALHA[r]);
          botoes([botao("Tentar de novo", "primary", () => passo())]);
        }
        return true;
      };
      limpeza = () => { acabou = true; };
    }

    if (s.t === "linha") {
      const cor = s.cor || "w", lista = s.lances.map((x) => (Array.isArray(x) ? x : [x, null]));
      const game = new Chess();
      resetBoard(game.fen(), { cor });
      let i = 0, erros = 0, timer = null, fim = false;
      box.innerHTML = `<p>${s.instrucao}</p><div class="moves" id="linha"></div><div class="notas" id="notas"></div>`;
      const linhaEl = box.querySelector("#linha"), notasEl = box.querySelector("#notas");
      const mostrar = () => {
        const hist = game.history();
        linhaEl.innerHTML = hist.map((x, k) => (k % 2 === 0 ? `<span class="n">${k / 2 + 1}.</span>` : "") + `<span>${sanPt(x)}</span> `).join("") || "&nbsp;";
        // comentários dos dois últimos lances (o seu e a resposta)
        notasEl.innerHTML = s.sozinho ? "" : [i - 2, i - 1].filter((k) => k >= 0 && lista[k][1])
          .map((k) => `<p><strong class="notation">${k % 2 === 0 ? k / 2 + 1 + "." : (k - 1) / 2 + 1 + "..."}${sanPt(lista[k][0])}</strong> ${lista[k][1]}</p>`).join("");
      };
      const vezDoLivro = () => {
        if (fim) return;
        if (i >= lista.length) { fim = true; concluirPasso(s.sozinho ? "Linha completa, de memória!" : "Linha completa!"); return; }
        if (game.turn() !== cor) timer = setTimeout(() => { game.move(lista[i][0]); i++; sync(board, game); mostrar(); vezDoLivro(); }, i === 0 ? 450 : 650);
      };
      board.opts.getDests = (sq) => (!fim && game.turn() === cor ? legalDests(game, sq) : []);
      board.opts.onMove = (from, to, promo) => {
        const m = tryMove(game, from, to, promo);
        if (!m) return false;
        if (m.san !== lista[i][0]) {
          game.undo();
          erros++;
          board.flash(to, "bad");
          const certo = new Chess(game.fen()).move(lista[i][0]);
          if (erros >= 2) board.setArrows([{ from: certo.from, to: certo.to }]);
          feedback("bad", erros >= 2 ? `Nesta linha, o lance é <span class="notation">${sanPt(certo.san)}</span> (veja a seta).` : "Não é o lance desta linha. Pense no plano da abertura e tente de novo.");
          return false;
        }
        erros = 0;
        i++;
        board.setArrows([]);
        feedback();
        sync(board, game);
        mostrar();
        vezDoLivro();
        return true;
      };
      sync(board, game);
      mostrar();
      vezDoLivro();
      limpeza = () => { fim = true; clearTimeout(timer); };
    }
  }

  function concluirLicao() {
    P.licoes[L.id] = { em: Date.now() };
    progresso.treinou(P);
    salvar();
    const prox = LICOES[n] || null;
    box.innerHTML = `<p class="eyebrow">Lição concluída</p><h3>${L.titulo} ✓</h3><p style="margin-top:8px">${prox ? `Próxima: <strong>${prox.titulo}</strong> — ${prox.resumo}` : "Você completou a trilha inteira! Continue treinando nos puzzles e nas partidas."}</p>`;
    feedback();
    botoes([
      prox ? h(`<a class="btn primary" href="#/licao/${prox.id}">Próxima lição</a>`) : h(`<a class="btn primary" href="#/puzzles">Treinar puzzles</a>`),
      h(`<a class="btn" href="#/">Voltar à trilha</a>`),
    ]);
  }

  passo();
  atual = () => { if (limpeza) limpeza(); };
}

// ======================= puzzles =======================
function telaPuzzles() {
  app.innerHTML = "";
  const tela = h(`<div class="trainer">
    <div><div class="board-wrap"></div></div>
    <div class="side">
      <div class="panel">
        <p class="eyebrow">Puzzles</p>
        <h2>Seu nível: <span id="rating">${Math.round(P.puzzle.rating)}</span> <small id="delta" style="font-size:16px"></small></h2>
        <p class="lead" style="font-size:16px;margin-top:6px">Posições de partidas reais. Acertou sem dica, o nível sobe; errou, desce, e o próximo puzzle se ajusta.</p>
      </div>
      <div class="panel prose" id="info" aria-live="polite"></div>
      <div id="fb" aria-live="polite"></div>
      <div class="btn-row" id="acoes"></div>
    </div></div>`);
  app.appendChild(tela);
  const board = novoTabuleiro(tela.querySelector(".board-wrap"), {});
  const info = tela.querySelector("#info"), fb = tela.querySelector("#fb"), acoes = tela.querySelector("#acoes");
  const feedback = (tipo, txt) => { fb.innerHTML = txt ? `<div class="feedback ${tipo}">${txt}</div>` : ""; };
  let ctl = null;

  const escolher = (data) => {
    const r = P.puzzle.rating, vistos = new Set(P.puzzle.vistos);
    let faixa = 100, opcoes = [];
    while (!opcoes.length && faixa < 2000) {
      opcoes = data.adaptativo.filter((p) => Math.abs(p[3] - r) <= faixa && !vistos.has(p[0]));
      faixa += 100;
    }
    if (!opcoes.length) { P.puzzle.vistos = []; opcoes = data.adaptativo; }
    return opcoes[Math.floor(Math.random() * opcoes.length)];
  };

  const novo = async () => {
    const data = await puzzles();
    if (ctl) ctl.destroy();
    feedback();
    const pz = escolher(data);
    info.innerHTML = `<p id="vez">Preparando…</p>`;
    let resolvido = false;
    ctl = runPuzzle(board, pz, {
      onWrong: () => { feedback("bad", "Esse não é o melhor lance. Tente de novo."); },
      onProgress: () => feedback("info", "Boa! A sequência continua."),
      onSolved: ({ limpo, mostrado }) => {
        if (resolvido) return;
        resolvido = true;
        // nível ao estilo Elo: ganhar de um puzzle difícil vale mais
        const esperado = 1 / (1 + 10 ** ((pz[3] - P.puzzle.rating) / 400));
        const kf = P.puzzle.resolvidos < 20 ? 48 : 28;
        const delta = Math.round(kf * ((limpo ? 1 : 0) - esperado));
        P.puzzle.rating = Math.max(300, P.puzzle.rating + delta);
        P.puzzle.resolvidos++;
        if (limpo) P.puzzle.acertos++;
        P.puzzle.vistos = P.puzzle.vistos.concat(pz[0]).slice(-500);
        progresso.treinou(P);
        salvar();
        tela.querySelector("#rating").textContent = Math.round(P.puzzle.rating);
        const d = tela.querySelector("#delta");
        d.textContent = (delta >= 0 ? "+" : "") + delta;
        d.style.color = delta >= 0 ? "var(--ok)" : "var(--bad)";
        const temas = pz[4].split(" ").filter((t) => TEMAS_PT[t] && !["short", "long", "middlegame", "endgame", "opening"].includes(t)).map((t) => TEMAS_PT[t]);
        feedback(limpo ? "ok" : "info", (limpo ? "Resolvido!" : mostrado ? "Essa era a solução." : "Resolvido, com ajuda.") +
          ` <span>Dificuldade ${pz[3]}${temas.length ? " · " + temas.join(", ") : ""}.</span>`);
        info.innerHTML = `<p>Puzzle <a href="https://lichess.org/training/${pz[0]}" target="_blank" rel="noopener">${pz[0]}</a> do banco aberto do Lichess.</p>`;
        acoes.innerHTML = "";
        const prox = h(`<button type="button" class="btn primary">Próximo puzzle</button>`);
        prox.addEventListener("click", novo);
        acoes.appendChild(prox);
        prox.focus({ preventScroll: true });
      },
    });
    info.innerHTML = `<p><strong>Você joga com as ${ctl.jogador === "w" ? "brancas" : "pretas"}.</strong> O adversário faz o primeiro lance; encontre a melhor resposta.</p>`;
    acoes.innerHTML = "";
    [["Dica", () => { ctl.dica(); feedback("info", "A peça que deve se mover está destacada."); }], ["Ver solução", () => ctl.solucao()], ["Pular", novo]].forEach(([t, fn]) => {
      const b = h(`<button type="button" class="btn">${t}</button>`);
      b.addEventListener("click", fn);
      acoes.appendChild(b);
    });
  };
  novo();
  atual = () => ctl && ctl.destroy();
}

// ======================= jogar contra o computador =======================
const NIVEIS_SF = [
  { skill: 0, depth: 1, d: "aprendendo as regras" },
  { skill: 2, depth: 2, d: "erra bastante" },
  { skill: 4, depth: 3, d: "deixa peças soltas às vezes" },
  { skill: 7, depth: 5, d: "joga com cuidado" },
  { skill: 10, depth: 7, d: "jogador de clube" },
  { skill: 13, depth: 9, d: "forte" },
  { skill: 16, depth: 11, d: "muito forte" },
  { skill: 20, movetime: 800, d: "força máxima" },
];

function telaJogar() {
  app.innerHTML = "";
  let nivel = P.ultimoNivel ?? 1, corEscolha = "w";
  const tela = h(`<div class="trainer">
    <div><div class="board-wrap"></div>
      <div class="board-tools"><span id="status"></span><button type="button" class="icon-btn" id="girar" aria-label="Girar tabuleiro" title="Girar tabuleiro">⇅</button></div>
    </div>
    <div class="side" id="lado"></div></div>`);
  app.appendChild(tela);
  const board = novoTabuleiro(tela.querySelector(".board-wrap"), {});
  const lado = tela.querySelector("#lado"), status = tela.querySelector("#status");
  tela.querySelector("#girar").addEventListener("click", () => board.flip());
  let game = null, cor = "w", pensando = false, fimTxt = null, vivo = true;
  board.setFen(new Chess().fen());

  function configurar() {
    game = null;
    board.opts.getDests = null;
    board.setArrows([]);
    status.textContent = "";
    lado.innerHTML = "";
    const p = h(`<div class="panel">
      <p class="eyebrow">Jogar</p><h2>Contra o computador</h2>
      <p style="margin:14px 0 6px;font-weight:700">Nível</p>
      <div class="seg" id="niveis">${NIVEIS_SF.map((_, i) => `<button type="button" data-n="${i}" aria-pressed="${i === nivel}">${i + 1}</button>`).join("")}</div>
      <p id="desc" style="margin:6px 0 0;color:var(--muted)"></p>
      <p style="margin:16px 0 6px;font-weight:700">Suas peças</p>
      <div class="seg" id="cores"><button type="button" data-c="w" aria-pressed="true">Brancas</button><button type="button" data-c="b" aria-pressed="false">Pretas</button><button type="button" data-c="r" aria-pressed="false">Sorteio</button></div>
      <div class="btn-row" style="margin-top:20px"><button type="button" class="btn primary" id="comecar">Começar partida</button></div>
    </div>`);
    lado.appendChild(p);
    const desc = () => p.querySelector("#desc").textContent = `Nível ${nivel + 1}: ${NIVEIS_SF[nivel].d}.`;
    desc();
    p.querySelectorAll("#niveis button").forEach((b) => b.addEventListener("click", () => {
      nivel = Number(b.dataset.n);
      p.querySelectorAll("#niveis button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      desc();
    }));
    p.querySelectorAll("#cores button").forEach((b) => b.addEventListener("click", () => {
      corEscolha = b.dataset.c;
      p.querySelectorAll("#cores button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
    p.querySelector("#comecar").addEventListener("click", comecar);
  }

  function comecar() {
    P.ultimoNivel = nivel; salvar();
    cor = corEscolha === "r" ? (Math.random() < 0.5 ? "w" : "b") : corEscolha;
    game = new Chess();
    fimTxt = null;
    board.setOrientation(cor);
    board.setArrows([]);
    sync(board, game);
    lado.innerHTML = "";
    lado.appendChild(h(`<div class="panel">
      <p class="eyebrow">Nível ${nivel + 1} · você joga com as ${cor === "w" ? "brancas" : "pretas"}</p>
      <h2 id="titulo">Sua vez</h2>
      <div class="moves" id="lances" style="margin-top:12px"></div>
    </div>`));
    lado.appendChild(h(`<div id="fb" aria-live="polite"></div>`));
    const acoes = h(`<div class="btn-row"></div>`);
    [["Dica", dica], ["Desfazer", desfazer], ["Desistir", () => terminar("Você desistiu.", "derrota")], ["Nova partida", configurar]].forEach(([t, fn]) => {
      const b = h(`<button type="button" class="btn">${t}</button>`); b.addEventListener("click", fn); acoes.appendChild(b);
    });
    lado.appendChild(acoes);
    board.opts.getDests = (sq) => (!fimTxt && !pensando && game.turn() === cor ? legalDests(game, sq) : []);
    board.opts.onMove = (from, to, promo) => {
      const m = tryMove(game, from, to, promo);
      if (!m) return false;
      board.setArrows([]);
      depois();
      return true;
    };
    atualizar();
    if (cor === "b") jogaComputador();
  }

  const fb = (tipo, txt) => { const el = lado.querySelector("#fb"); if (el) el.innerHTML = txt ? `<div class="feedback ${tipo}">${txt}</div>` : ""; };
  function atualizar() {
    sync(board, game);
    const hist = game.history();
    lado.querySelector("#lances").innerHTML = hist.map((s, i) => (i % 2 === 0 ? `<span class="n">${i / 2 + 1}.</span>` : "") + `<span>${sanPt(s)}</span> `).join("");
    const t = lado.querySelector("#titulo");
    if (t && !fimTxt) t.textContent = game.turn() === cor ? (game.inCheck() ? "Você está em xeque!" : "Sua vez") : "O computador está pensando…";
    status.textContent = game.inCheck() && !fimTxt ? "Xeque" : "";
  }
  function depois() {
    atualizar();
    if (verificarFim()) return;
    if (game.turn() !== cor) jogaComputador();
  }
  async function jogaComputador() {
    pensando = true;
    atualizar();
    const cfg = NIVEIS_SF[nivel], fen = game.fen();
    const [res] = await Promise.all([analyze({ fen, skill: cfg.skill, depth: cfg.depth, movetime: cfg.movetime }), new Promise((r) => setTimeout(r, 450))]);
    if (!vivo || !game || game.fen() !== fen || fimTxt) { pensando = false; return; }
    if (res.best) { const b = parseUci(res.best); game.move({ from: b.from, to: b.to, promotion: b.promotion }); }
    pensando = false;
    depois();
  }
  function verificarFim() {
    if (!game.isGameOver()) return false;
    if (game.isCheckmate()) terminar(game.turn() === cor ? "Xeque-mate. O computador venceu." : "Xeque-mate! Você venceu.", game.turn() === cor ? "derrota" : "vitoria");
    else terminar(game.isStalemate() ? "Empate por afogamento." : game.isThreefoldRepetition() ? "Empate por repetição." : game.isInsufficientMaterial() ? "Empate: material insuficiente para dar mate." : "Empate.", "empate");
    return true;
  }
  function terminar(txt, resultado) {
    fimTxt = txt;
    const t = lado.querySelector("#titulo");
    if (t) t.textContent = resultado === "vitoria" ? "Vitória!" : resultado === "empate" ? "Empate" : "Fim de partida";
    fb(resultado === "vitoria" ? "ok" : "info", txt);
    P.partidas = (P.partidas || []).concat({ em: Date.now(), nivel: nivel + 1, cor, resultado, lances: game.history().length }).slice(-100);
    progresso.treinou(P);
    salvar();
    const acoes = lado.querySelector(".btn-row");
    acoes.innerHTML = "";
    const rev = h(`<button type="button" class="btn primary">Revisar a partida</button>`); rev.addEventListener("click", revisar);
    const nova = h(`<button type="button" class="btn">Nova partida</button>`); nova.addEventListener("click", configurar);
    if (game.history().length >= 2) acoes.appendChild(rev);
    acoes.appendChild(nova);
  }
  async function dica() {
    if (fimTxt || pensando || game.turn() !== cor) return;
    fb("info", "Pensando na melhor jogada…");
    const { best } = await analyze({ fen: game.fen(), depth: 12 });
    if (!best || fimTxt) return;
    const b = parseUci(best);
    board.setArrows([{ from: b.from, to: b.to }]);
    fb("info", "A seta mostra o lance que o computador faria.");
  }
  function desfazer() {
    if (pensando || fimTxt) return;
    game.undo();
    if (game.turn() !== cor) game.undo();
    board.setArrows([]);
    fb();
    atualizar();
  }

  // revisão: compara cada lance seu com o melhor lance, pela perda de avaliação
  async function revisar() {
    const hist = game.history({ verbose: true }), meus = [];
    const replay = new Chess();
    hist.forEach((m, i) => { if (m.color === cor) meus.push({ i, antes: replay.fen(), m }); replay.move(m.san); });
    const acoes = lado.querySelector(".btn-row");
    acoes.innerHTML = "";
    fb("info", `Analisando os seus ${meus.length} lances… <span id="prog">0%</span>`);
    const achados = [];
    for (let k = 0; k < meus.length && vivo; k++) {
      const x = meus[k];
      const a = await analyze({ fen: x.antes, depth: 10 });
      const g2 = new Chess(x.antes); g2.move(x.m.san);
      const d = await analyze({ fen: g2.fen(), depth: 10 });
      const sinal = cor === "w" ? 1 : -1;
      const clamp = (v) => Math.max(-1500, Math.min(1500, v));
      const perda = a.best === uci(x.m) ? 0 : sinal * (clamp(whiteCp(a.score, x.antes)) - clamp(whiteCp(d.score, g2.fen())));
      if (perda >= 110) {
        const bm = parseUci(a.best), g3 = new Chess(x.antes);
        const melhor = g3.move({ from: bm.from, to: bm.to, promotion: bm.promotion });
        achados.push({ ...x, perda, melhor: melhor.san, bm });
      }
      const pr = document.getElementById("prog"); if (pr) pr.textContent = Math.round((k + 1) / meus.length * 100) + "%";
    }
    if (!vivo) return;
    const graves = achados.filter((x) => x.perda >= 250).length;
    fb(achados.length ? "info" : "ok", achados.length ? `${graves} erro(s) grave(s) e ${achados.length - graves} imprecisão(ões). Toque num lance para ver a posição.` : "Nenhum erro grave! Seus lances foram próximos do melhor.");
    const lista = h(`<ul class="review-list"></ul>`);
    achados.forEach((x) => {
      const li = h(`<li><button type="button"><span class="tag ${x.perda >= 250 ? "blunder" : "mistake"}">${x.perda >= 250 ? "erro grave" : "imprecisão"}</span>
        Lance ${Math.floor(x.i / 2) + 1}: você jogou <strong class="notation">${sanPt(x.m.san)}</strong>; melhor era <strong class="notation">${sanPt(x.melhor)}</strong>
        <span style="color:var(--muted)">(cerca de ${(x.perda / 100).toFixed(1).replace(".", ",")} peão${x.perda >= 150 ? "s" : ""} a menos)</span></button></li>`);
      li.querySelector("button").addEventListener("click", () => {
        board.opts.getDests = null;
        board.setFen(x.antes);
        board.setLastMove(x.m.from, x.m.to);
        board.setCheck(null);
        board.setArrows([{ from: x.bm.from, to: x.bm.to }]);
        status.textContent = "Destacado: o seu lance. Seta: o melhor lance.";
      });
      lista.appendChild(li);
    });
    acoes.before(lista);
    const nova = h(`<button type="button" class="btn primary">Nova partida</button>`); nova.addEventListener("click", configurar);
    acoes.appendChild(nova);
  }

  configurar();
  atual = () => { vivo = false; };
}

// ======================= rotas =======================
function rota() {
  if (atual) { atual(); atual = null; }
  const [, pagina, arg] = location.hash.split("/");
  window.scrollTo(0, 0);
  if (pagina === "licao") telaLicao(arg);
  else if (pagina === "puzzles") telaPuzzles();
  else if (pagina === "jogar") telaJogar();
  else telaInicio();
  topo();
  document.title = (pagina === "licao" && licao(arg) ? licao(arg).titulo + " · " : pagina === "puzzles" ? "Puzzles · " : pagina === "jogar" ? "Jogar · " : "") + "Trilha do Xadrez";
}
window.addEventListener("hashchange", rota);
rota();
