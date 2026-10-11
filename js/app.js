import { Board, fenToPieces, freeDests } from "./board.js";
import { Chess, legalDests, tryMove, sync, uci, parseUci, sanPt } from "./rules.js";
import { NIVEIS, LICOES, licao } from "./lessons.js";
import { runPuzzle, TEMAS_PT } from "./puzzle.js";
import { analyze, whiteCp } from "./engine.js";
import * as progresso from "./progress.js";
import { runLinha } from "./linha.js";
import * as revisao from "./revisao.js";
import * as sons from "./sons.js";
import * as metas from "./metas.js";

const app = document.getElementById("app");
const P = progresso.load();
sons.ligar(P.sons !== false);
let atual = null; // limpeza da tela anterior (timers, partida)
let puzzlesData = null;

const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const salvar = () => {
  const novas = metas.verificar(P);
  progresso.save(P);
  topo();
  if (novas.length === 1) aviso(`${novas[0].icone} Conquista: <strong>${novas[0].titulo}</strong>`);
  else if (novas.length > 1) aviso(`🏅 ${novas.length} conquistas novas! Veja na página inicial.`);
};
// pontos da meta do dia; avisa quando a meta é batida
const pontuar = (tipo) => {
  if (metas.pontuar(P, tipo)) { sons.vitoria(); aviso(`🎯 Meta do dia batida! ${metas.pontosHoje(P)} pontos hoje.`); }
};
// aviso que aparece embaixo da tela por alguns segundos
function aviso(html) {
  let box = document.getElementById("avisos");
  if (!box) { box = h(`<div id="avisos" class="avisos" role="status" aria-live="polite"></div>`); document.body.appendChild(box); }
  const el = h(`<div class="aviso">${html}</div>`);
  box.appendChild(el);
  setTimeout(() => { el.classList.add("sai"); setTimeout(() => el.remove(), 400); }, 3800);
}
const proximaLicao = () => LICOES.find((l) => !P.licoes[l.id]) || null;
async function puzzles() {
  if (!puzzlesData) puzzlesData = await fetch("data/puzzles.json").then((r) => r.json());
  return puzzlesData;
}

function topo() {
  const st = document.getElementById("streak"), dias = progresso.sequencia(P);
  const pts = metas.pontosHoje(P), meta = metas.metaDoDia(P);
  st.innerHTML = `<b>${dias}</b> ${dias === 1 ? "dia seguido" : "dias seguidos"}`;
  st.classList.toggle("meta-ok", pts >= meta);
  st.title = `Treinou ${dias} ${dias === 1 ? "dia seguido" : "dias seguidos"} · meta do dia: ${Math.min(pts, meta)} de ${meta} pontos`;
  const n = revisao.pendentes(P).length, badge = document.getElementById("rev-badge");
  badge.textContent = n;
  badge.hidden = !n;
  const rota = location.hash.split("/")[1] || "";
  document.querySelectorAll(".nav a").forEach((a) => {
    const alvo = a.getAttribute("href").split("/")[1] || "";
    a.toggleAttribute("aria-current", alvo === rota || (alvo === "" && rota === "licao") || (alvo === "jogar" && rota === "analisar"));
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
      <p class="eyebrow">Chess Trail</p>
      <h1>Aprenda xadrez do zero, no seu ritmo.</h1>
      <p class="lead">Lições curtas com exercícios no tabuleiro, puzzles de partidas reais que acompanham o seu nível e partidas contra o computador com revisão dos erros.</p>
      <div class="btn-row" style="margin-top:20px">
        ${prox ? `<a class="btn primary" href="#/licao/${prox.id}">${feitas ? "Continuar" : "Começar"}: ${prox.titulo}</a>` : `<a class="btn primary" href="#/puzzles">Trilha concluída — treinar puzzles</a>`}
        ${revisao.pendentes(P).length ? `<a class="btn gold" href="#/revisar">Revisar (${revisao.pendentes(P).length})</a>` : ""}
        <a class="btn" href="#/puzzles">Puzzles</a>
        <a class="btn" href="#/jogar">Jogar</a>
        <a class="btn" href="#/analisar">Analisar partida</a>
      </div>
      <dl class="stats">
        <div class="stat"><dt>Lições concluídas</dt><dd>${feitas}<small style="font-size:16px;color:var(--muted)"> de ${LICOES.length}</small></dd></div>
        <div class="stat"><dt>Nível nos puzzles</dt><dd>${Math.round(P.puzzle.rating)}</dd></div>
        <div class="stat"><dt>Dias seguidos</dt><dd>${progresso.sequencia(P)}</dd></div>
      </dl>
      ${cartaoMeta()}
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
  app.appendChild(secaoConquistas());
  app.appendChild(secaoPreferencias());
  app.appendChild(secaoCodigo());
}

function cartaoMeta() {
  const pts = metas.pontosHoje(P), meta = metas.metaDoDia(P), pct = Math.min(100, Math.round(pts / meta * 100));
  const P_ = metas.PONTOS;
  return `<div class="meta-dia${pts >= meta ? " ok" : ""}">
    <div class="meta-topo"><strong>🎯 Meta do dia</strong><span>${Math.min(pts, meta)} de ${meta} pontos${pts >= meta ? " · batida!" : ""}</span></div>
    <div class="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="${meta}" aria-valuenow="${Math.min(pts, meta)}" aria-label="Meta do dia"><i style="width:${pct}%"></i></div>
    <p>Lição ${P_.licao} pts · partida ${P_.partida} · análise ${P_.analise} · puzzle ${P_.puzzle} · revisão ${P_.revisao}</p>
  </div>`;
}

function secaoConquistas() {
  const ganhas = metas.CONQUISTAS.filter((c) => P.conquistas?.[c.id]).length;
  const sec = h(`<section class="level" aria-labelledby="conq">
    <div class="level-head"><div><p class="eyebrow">Conquistas</p><h2 id="conq">Suas medalhas</h2></div><span class="level-count">${ganhas}/${metas.CONQUISTAS.length}</span></div>
    <ul class="conquistas"></ul></section>`);
  for (const c of metas.CONQUISTAS) {
    const em = P.conquistas?.[c.id];
    sec.querySelector(".conquistas").appendChild(h(`<li class="conquista${em ? " ganha" : ""}" title="${c.desc}">
      <span class="ic" aria-hidden="true">${c.icone}</span><span class="t">${c.titulo}</span><span class="d">${em ? "Desde " + new Date(em + "T12:00").toLocaleDateString("pt-BR") : c.desc}</span></li>`));
  }
  return sec;
}

function secaoPreferencias() {
  const atual = P.meta || "leve";
  const sec = h(`<section class="level prefs" aria-labelledby="prefs">
    <div class="level-head"><div><p class="eyebrow">Preferências</p><h2 id="prefs">Do seu jeito</h2></div></div>
    <p style="margin:0 0 6px;font-weight:700">Meta do dia</p>
    <div class="seg" id="metas">${Object.entries(metas.METAS).map(([k, m]) => `<button type="button" data-m="${k}" aria-pressed="${k === atual}">${m.nome} (${m.pontos})</button>`).join("")}</div>
    <p style="margin:16px 0 6px;font-weight:700">Sons</p>
    <div class="seg" id="sons"><button type="button" data-s="1" aria-pressed="${sons.estaLigado()}">Ligados</button><button type="button" data-s="0" aria-pressed="${!sons.estaLigado()}">Desligados</button></div>
  </section>`);
  sec.querySelectorAll("#metas button").forEach((b) => b.addEventListener("click", () => {
    P.meta = b.dataset.m;
    salvar();
    sec.querySelectorAll("#metas button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const c = app.querySelector(".meta-dia"); if (c) c.outerHTML = cartaoMeta();
  }));
  sec.querySelectorAll("#sons button").forEach((b) => b.addEventListener("click", () => {
    P.sons = b.dataset.s === "1";
    sons.ligar(P.sons);
    salvar();
    sec.querySelectorAll("#sons button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    sons.acerto();
  }));
  return sec;
}

// levar o progresso para outro aparelho, sem conta: um código para copiar e colar
function secaoCodigo() {
  const sec = h(`<section class="level codigo" aria-labelledby="cod">
    <div class="level-head"><div><p class="eyebrow">Seu progresso</p><h2 id="cod">Levar para outro aparelho</h2>
    <p>O progresso fica salvo só neste navegador. Para continuar em outro celular ou computador, copie o código aqui e cole lá. Nada se perde: os dois progressos se juntam.</p></div></div>
    <div class="btn-row"><button type="button" class="btn" id="copiar">Copiar meu código</button><button type="button" class="btn" id="abrir-colar">Colar um código</button></div>
    <div id="colar" hidden><textarea id="cod-txt" rows="3" spellcheck="false" autocomplete="off" aria-label="Código de progresso" placeholder="Cole aqui o código que começa com TX"></textarea>
    <div class="btn-row"><button type="button" class="btn primary" id="restaurar">Juntar ao meu progresso</button></div></div>
    <div id="cod-fb" aria-live="polite"></div>
  </section>`);
  const fb = (tipo, txt) => sec.querySelector("#cod-fb").innerHTML = `<div class="feedback ${tipo}">${txt}</div>`;
  sec.querySelector("#copiar").addEventListener("click", async () => {
    const codigo = await progresso.exportar(P);
    try { await navigator.clipboard.writeText(codigo); fb("ok", "Código copiado! Abra o site no outro aparelho e use <strong>Colar um código</strong>."); }
    catch {
      // sem acesso à área de transferência: mostra o código para copiar à mão
      sec.querySelector("#colar").hidden = false;
      const t = sec.querySelector("#cod-txt"); t.value = codigo; t.select();
      fb("info", "Copie o código selecionado acima.");
    }
  });
  sec.querySelector("#abrir-colar").addEventListener("click", () => { sec.querySelector("#colar").hidden = false; sec.querySelector("#cod-txt").focus(); });
  sec.querySelector("#restaurar").addEventListener("click", async () => {
    try {
      const outro = await progresso.importar(sec.querySelector("#cod-txt").value);
      progresso.mesclar(P, outro);
      salvar();
      telaInicio();
      const nova = app.querySelector(".codigo");
      const nl = Object.keys(P.licoes).length;
      nova.querySelector("#cod-fb").innerHTML = `<div class="feedback ok">Progresso juntado: ${nl} ${nl === 1 ? "lição concluída" : "lições concluídas"}, nível ${Math.round(P.puzzle.rating)} nos puzzles.</div>`;
      nova.scrollIntoView({ block: "center" });
    } catch (e) { fb("bad", e.message.startsWith("Esse") || e.message.startsWith("Este") || e.message.startsWith("O código") ? e.message : "Não consegui ler esse código. Confira se ele foi copiado inteiro."); }
  });
  return sec;
}

// ======================= lição =======================
function telaLicao(id) {
  const L = licao(id);
  if (!L) { location.hash = "#/"; return; }
  const n = LICOES.indexOf(L) + 1;
  app.innerHTML = "";
  const tela = h(`<div class="trainer licao">
    <div class="panel lesson-head">
      <p class="eyebrow">Nível ${L.nivel} · Lição ${n} de ${LICOES.length}</p>
      <h2>${L.titulo}</h2>
      <div class="steps">${L.passos.map(() => "<i></i>").join("")}</div>
    </div>
    <div class="lesson-board"><div class="board-wrap"></div></div>
    <div class="side">
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
    if (msg) { feedback("ok", msg); sons.acerto(); }
    const prox = LICOES[n] || null;
    if (k + 1 < L.passos.length) botoes([botao("Continuar", "primary", () => { k++; passo(); })]);
    else if (prox) botoes([
      // último passo: dá para pular direto para a próxima lição, sem a tela de resumo
      botao(`Próxima lição: ${prox.titulo} →`, "primary", () => { marcarConcluida(); location.hash = `#/licao/${prox.id}`; }),
      botao("Concluir lição", "", () => { k++; passo(); }),
    ]);
    else botoes([botao("Concluir lição", "primary", () => { k++; passo(); })]);
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
        if (pecas[to]) sons.captura(); else sons.lance();
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
            onSolved: ({ limpo, mostrado }) => {
              if (!limpo) { revisao.adicionar(P, { tipo: "puzzle", puzzle: lista[j] }); salvar(); }
              feedback(mostrado ? "info" : "ok", mostrado ? "Essa era a solução. Este exercício vai voltar na revisão." : limpo ? "Resolvido!" : "Resolvido, com ajuda. Ele vai voltar na revisão.");
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
      resetBoard(new Chess().fen(), { cor: s.cor });
      box.innerHTML = `<p>${s.instrucao}</p><div class="moves" id="linha"></div><div class="notas" id="notas"></div>`;
      const ctl = runLinha(board, s, { linha: box.querySelector("#linha"), notas: box.querySelector("#notas") }, {
        onWrong: (msg) => feedback("bad", msg),
        onOk: () => feedback(),
        onDone: () => {
          // a linha de memória entra na revisão espaçada
          if (s.sozinho) { revisao.adicionar(P, { tipo: "linha", licao: L.id, passo: k }); salvar(); }
          concluirPasso(s.sozinho ? "Linha completa, de memória! Ela vai voltar na revisão daqui a alguns dias." : "Linha completa!");
        },
      });
      limpeza = () => ctl.destroy();
    }
  }

  function marcarConcluida() {
    P.licoes[L.id] = { em: Date.now() };
    progresso.treinou(P);
    pontuar("licao");
    salvar();
  }
  function concluirLicao() {
    marcarConcluida();
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
        if (!limpo) revisao.adicionar(P, { tipo: "puzzle", puzzle: pz });
        if (limpo) sons.acerto();
        pontuar("puzzle");
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

// ======================= análise de partidas (usada no Jogar e no Analisar) =======================
// Avalia cada posição uma vez e mede quanto cada lance perdeu em relação ao melhor lance.
async function analisarLances(lances, fens, cores, onProgresso, vivo) {
  const precisa = new Set();
  lances.forEach((m, i) => { if (cores.includes(m.color)) { precisa.add(i); precisa.add(i + 1); } });
  const ordem = [...precisa].sort((a, b) => a - b), av = {};
  for (let k = 0; k < ordem.length; k++) {
    if (!vivo()) return null;
    const i = ordem[k], g = new Chess(fens[i]);
    if (g.isGameOver()) av[i] = { best: null, cp: g.isCheckmate() ? (g.turn() === "w" ? -10000 : 10000) : 0 };
    else { const r = await analyze({ fen: fens[i], depth: 10 }); av[i] = { best: r.best, cp: whiteCp(r.score, fens[i]) }; }
    onProgresso((k + 1) / ordem.length);
  }
  const clamp = (v) => Math.max(-1500, Math.min(1500, v)), achados = [];
  lances.forEach((m, i) => {
    if (!cores.includes(m.color) || !av[i].best) return;
    const perda = av[i].best === uci(m) ? 0 : (m.color === "w" ? 1 : -1) * (clamp(av[i].cp) - clamp(av[i + 1].cp));
    if (perda < 110) return;
    const bm = parseUci(av[i].best), melhor = new Chess(fens[i]).move({ from: bm.from, to: bm.to, promotion: bm.promotion });
    achados.push({ i, m, antes: fens[i], perda, melhor: melhor.san, bm });
  });
  return achados;
}

// lista de erros: tocar num item mostra a posição antes do lance, com a seta do melhor lance
function listaDeErros(achados, board, status, quem) {
  const lista = h(`<ul class="review-list"></ul>`);
  achados.forEach((x) => {
    const n = Math.floor(x.i / 2) + 1, grave = x.perda >= 250;
    const li = h(`<li><button type="button"><span class="tag ${grave ? "blunder" : "mistake"}">${grave ? "erro grave" : "imprecisão"}</span>
      ${n}${x.m.color === "w" ? "." : "..."} ${quem(x.m.color)} <strong class="notation">${sanPt(x.m.san)}</strong>; melhor era <strong class="notation">${sanPt(x.melhor)}</strong>
      <span style="color:var(--muted)">(${x.perda >= 1000 ? "entregou a partida" : `cerca de ${(x.perda / 100).toFixed(1).replace(".", ",")} ${x.perda >= 150 ? "peões" : "peão"} a menos`})</span></button></li>`);
    li.querySelector("button").addEventListener("click", () => {
      board.opts.getDests = null;
      board.setFen(x.antes);
      board.setLastMove(x.m.from, x.m.to);
      board.setCheck(null);
      board.setArrows([{ from: x.bm.from, to: x.bm.to }]);
      if (status) status.textContent = "Destacado: o lance jogado. Seta: o melhor lance.";
      board.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    lista.appendChild(li);
  });
  return lista;
}
const resumoErros = (achados) => {
  const graves = achados.filter((x) => x.perda >= 250).length, leves = achados.length - graves;
  return `${graves} ${graves === 1 ? "erro grave" : "erros graves"} e ${leves} ${leves === 1 ? "imprecisão" : "imprecisões"}. Toque num lance para ver a posição.`;
};
const fensDe = (lances) => { const g = new Chess(), f = [g.fen()]; lances.forEach((m) => { g.move(m.san); f.push(g.fen()); }); return f; };

async function copiarTexto(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch { return false; }
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
  let game = null, cor = "w", pensando = false, fimTxt = null, resultado = null, vivo = true;
  board.setFen(new Chess().fen());

  // a partida em andamento fica salva a cada lance: dá para sair e voltar
  const guardar = () => {
    if (!game || fimTxt) return;
    P.partidaAtual = { nivel, cor, lances: game.history(), em: Date.now() };
    progresso.save(P);
  };
  const descartar = () => { delete P.partidaAtual; progresso.save(P); };

  function configurar() {
    game = null;
    board.opts.getDests = null;
    board.setArrows([]);
    board.setFen(new Chess().fen());
    board.setLastMove(null); board.setCheck(null);
    status.textContent = "";
    lado.innerHTML = "";
    const salva = P.partidaAtual;
    if (salva) {
      const c = h(`<div class="panel destaque">
        <p class="eyebrow">Partida em andamento</p>
        <h2>Continuar de onde parou?</h2>
        <p style="margin:6px 0 0">Nível ${salva.nivel + 1}, você de ${salva.cor === "w" ? "brancas" : "pretas"}, ${Math.ceil(salva.lances.length / 2)} ${Math.ceil(salva.lances.length / 2) === 1 ? "lance" : "lances"}. Começar uma nova partida apaga esta.</p>
        <div class="btn-row" style="margin-top:14px"><button type="button" class="btn primary" id="continuar">Continuar partida</button></div>
      </div>`);
      c.querySelector("#continuar").addEventListener("click", () => comecar(salva));
      lado.appendChild(c);
      // mostra a posição salva no tabuleiro
      try { const g = new Chess(); salva.lances.forEach((x) => g.move(x)); board.setOrientation(salva.cor); board.setFen(g.fen()); } catch {}
    }
    const p = h(`<div class="panel">
      <p class="eyebrow">Jogar</p><h2>${salva ? "Ou comece outra" : "Contra o computador"}</h2>
      <p style="margin:14px 0 6px;font-weight:700">Nível</p>
      <div class="seg" id="niveis">${NIVEIS_SF.map((_, i) => `<button type="button" data-n="${i}" aria-pressed="${i === nivel}">${i + 1}</button>`).join("")}</div>
      <p id="desc" style="margin:6px 0 0;color:var(--muted)"></p>
      <p style="margin:16px 0 6px;font-weight:700">Suas peças</p>
      <div class="seg" id="cores"><button type="button" data-c="w" aria-pressed="true">Brancas</button><button type="button" data-c="b" aria-pressed="false">Pretas</button><button type="button" data-c="r" aria-pressed="false">Sorteio</button></div>
      <div class="btn-row" style="margin-top:20px"><button type="button" class="btn ${salva ? "" : "primary"}" id="comecar">${salva ? "Começar nova partida" : "Começar partida"}</button></div>
    </div>`);
    lado.appendChild(p);
    lado.appendChild(h(`<p class="dica-analisar">Jogou uma partida no Lichess, no Chess.com ou num torneio? <a href="#/analisar">Analise a sua partida</a> e veja onde errou.</p>`));
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
    p.querySelector("#comecar").addEventListener("click", () => comecar(null));
  }

  function comecar(salva) {
    game = new Chess();
    if (salva) {
      nivel = salva.nivel; cor = salva.cor;
      try { salva.lances.forEach((x) => game.move(x)); } catch { game = new Chess(); }
    } else cor = corEscolha === "r" ? (Math.random() < 0.5 ? "w" : "b") : corEscolha;
    P.ultimoNivel = nivel; salvar();
    fimTxt = null; resultado = null;
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
    [["Dica", dica], ["Desfazer", desfazer], ["Desistir", () => terminar("Você desistiu.", "derrota")], ["Nova partida", () => { descartar(); configurar(); }]].forEach(([t, fn]) => {
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
    guardar();
    atualizar();
    if (!verificarFim() && game.turn() !== cor) jogaComputador();
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
    guardar();
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
  function terminar(txt, res) {
    fimTxt = txt; resultado = res;
    descartar();
    const t = lado.querySelector("#titulo");
    if (t) t.textContent = res === "vitoria" ? "Vitória!" : res === "empate" ? "Empate" : "Fim de partida";
    fb(res === "vitoria" ? "ok" : "info", txt);
    if (res === "vitoria") sons.vitoria(); else sons.fim();
    P.partidas = (P.partidas || []).concat({ em: Date.now(), nivel: nivel + 1, cor, resultado: res, lances: game.history().length }).slice(-100);
    progresso.treinou(P);
    if (game.history().length >= 10) pontuar("partida");
    salvar();
    botoesFim();
  }
  function botoesFim() {
    const acoes = lado.querySelector(".btn-row");
    acoes.innerHTML = "";
    const rev = h(`<button type="button" class="btn primary">Revisar a partida</button>`); rev.addEventListener("click", revisar);
    const pgnB = h(`<button type="button" class="btn">Copiar PGN</button>`); pgnB.addEventListener("click", copiarPgn);
    const nova = h(`<button type="button" class="btn">Nova partida</button>`); nova.addEventListener("click", configurar);
    if (game.history().length >= 2) acoes.append(rev, pgnB);
    acoes.appendChild(nova);
  }
  // PGN: o formato que o Lichess, o Chess.com e qualquer programa de xadrez aceitam
  function pgn() {
    const g = new Chess();
    game.history().forEach((x) => g.move(x));
    const d = new Date(), comp = `Stockfish (nível ${nivel + 1})`;
    const r = resultado === "empate" ? "1/2-1/2" : resultado === "vitoria" ? (cor === "w" ? "1-0" : "0-1") : resultado === "derrota" ? (cor === "w" ? "0-1" : "1-0") : "*";
    g.setHeader("Event", "Chess Trail");
    g.setHeader("Site", "https://chesstrail.github.io");
    g.setHeader("Date", `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`);
    g.setHeader("White", cor === "w" ? "Você" : comp);
    g.setHeader("Black", cor === "b" ? "Você" : comp);
    g.setHeader("Result", r);
    return g.pgn();
  }
  async function copiarPgn() {
    const txt = pgn();
    if (await copiarTexto(txt)) fb("ok", "PGN copiado! Cole no Lichess (Ferramentas → Importar partida) ou no Chess.com para guardar a partida.");
    else {
      const t = h(`<textarea class="pgn-txt" rows="6" readonly aria-label="PGN da partida"></textarea>`);
      t.value = txt;
      lado.querySelector(".btn-row").before(t);
      t.select();
      fb("info", "Copie o PGN selecionado.");
    }
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
    guardar();
    atualizar();
  }

  async function revisar() {
    const lances = game.history({ verbose: true }), fens = fensDe(lances);
    const acoes = lado.querySelector(".btn-row");
    acoes.innerHTML = "";
    const meus = lances.filter((m) => m.color === cor).length;
    fb("info", `Analisando os seus ${meus} lances… <span id="prog">0%</span>`);
    const achados = await analisarLances(lances, fens, [cor], (f) => { const pr = document.getElementById("prog"); if (pr) pr.textContent = Math.round(f * 100) + "%"; }, () => vivo);
    if (!achados) return;
    fb(achados.length ? "info" : "ok", achados.length ? resumoErros(achados) : "Nenhum erro grave! Seus lances foram próximos do melhor.");
    acoes.before(listaDeErros(achados, board, status, () => "você jogou"));
    const pgnB = h(`<button type="button" class="btn">Copiar PGN</button>`); pgnB.addEventListener("click", copiarPgn);
    const nova = h(`<button type="button" class="btn primary">Nova partida</button>`); nova.addEventListener("click", configurar);
    acoes.append(nova, pgnB);
  }

  configurar();
  atual = () => { vivo = false; };
}

// ======================= analisar uma partida sua (PGN) =======================
function lerPgn(texto) {
  const tentativas = [texto, texto.replace(/\{[^}]*\}/g, " ").replace(/\$\d+/g, " ")];
  // remove variações entre parênteses (podem estar aninhadas)
  let sem = tentativas[1];
  for (let k = 0; k < 10 && /\([^()]*\)/.test(sem); k++) sem = sem.replace(/\([^()]*\)/g, " ");
  tentativas.push(sem);
  for (const t of tentativas) {
    const g = new Chess();
    try { g.loadPgn(t.trim()); if (g.history().length) return g; } catch {}
  }
  return null;
}

function telaAnalisar() {
  app.innerHTML = "";
  const tela = h(`<div class="trainer">
    <div><div class="board-wrap"></div>
      <div class="board-tools nav-lances" hidden>
        <button type="button" class="icon-btn" id="ini" aria-label="Início">⏮</button>
        <button type="button" class="icon-btn" id="ant" aria-label="Lance anterior">◀</button>
        <span id="status"></span>
        <button type="button" class="icon-btn" id="prox" aria-label="Próximo lance">▶</button>
        <button type="button" class="icon-btn" id="fim" aria-label="Último lance">⏭</button>
        <button type="button" class="icon-btn" id="girar" aria-label="Girar tabuleiro">⇅</button>
      </div>
    </div>
    <div class="side" id="lado"></div></div>`);
  app.appendChild(tela);
  const board = novoTabuleiro(tela.querySelector(".board-wrap"), { interactive: false });
  const lado = tela.querySelector("#lado"), status = tela.querySelector("#status"), nav = tela.querySelector(".nav-lances");
  board.setFen(new Chess().fen());
  let vivo = true, lances = [], fens = [], pos = 0, marcas = {};
  tela.querySelector("#girar").addEventListener("click", () => board.flip());

  // navegação: pos = quantos lances já foram jogados
  const ir = (n) => {
    pos = Math.max(0, Math.min(lances.length, n));
    board.setFen(fens[pos]);
    board.setArrows([]);
    const m = lances[pos - 1];
    board.setLastMove(m ? m.from : null, m ? m.to : null);
    const g = new Chess(fens[pos]);
    board.setCheck(g.inCheck() ? (g.board().flat().find((x) => x && x.type === "k" && x.color === g.turn()) || {}).square : null);
    status.textContent = pos ? `${Math.ceil(pos / 2)}${pos % 2 ? "." : "..."} ${sanPt(m.san)}${marcas[pos - 1] ? " · " + (marcas[pos - 1].perda >= 250 ? "erro grave" : "imprecisão") : ""}` : "Posição inicial";
    lado.querySelectorAll("#lances [data-i]").forEach((el) => el.classList.toggle("atual", Number(el.dataset.i) === pos - 1));
  };
  tela.querySelector("#ini").addEventListener("click", () => ir(0));
  tela.querySelector("#ant").addEventListener("click", () => ir(pos - 1));
  tela.querySelector("#prox").addEventListener("click", () => ir(pos + 1));
  tela.querySelector("#fim").addEventListener("click", () => ir(lances.length));
  const teclas = (e) => {
    if (!lances.length || /input|textarea/i.test(document.activeElement?.tagName)) return;
    if (e.key === "ArrowLeft") ir(pos - 1); else if (e.key === "ArrowRight") ir(pos + 1);
  };
  addEventListener("keydown", teclas);

  function entrada(msgErro) {
    nav.hidden = true;
    lances = []; marcas = {};
    board.setFen(new Chess().fen()); board.setArrows([]); board.setLastMove(null); board.setCheck(null);
    lado.innerHTML = "";
    const p = h(`<div class="panel">
      <p class="eyebrow">Analisar</p><h2>Analise uma partida sua</h2>
      <p style="margin:8px 0 0">Cole o <strong>PGN</strong> da partida. No Lichess: Compartilhar e exportar → PGN. No Chess.com: Compartilhar → PGN. Um lance por vez também serve, como <span class="notation">1. e4 e5 2. Nf3</span>.</p>
      <textarea id="pgn" class="pgn-txt" rows="7" spellcheck="false" autocomplete="off" aria-label="PGN da partida" placeholder="[Event &quot;...&quot;]&#10;1. e4 e5 2. Nf3 Nc6 ..."></textarea>
      <p style="margin:14px 0 6px;font-weight:700">Analisar os lances de</p>
      <div class="seg" id="lado-an"><button type="button" data-c="w" aria-pressed="true">Brancas</button><button type="button" data-c="b" aria-pressed="false">Pretas</button><button type="button" data-c="wb" aria-pressed="false">Os dois</button></div>
      <div class="btn-row" style="margin-top:18px"><button type="button" class="btn primary" id="analisar">Analisar partida</button></div>
    </div>`);
    lado.appendChild(p);
    const fbEl = h(`<div id="fb" aria-live="polite">${msgErro ? `<div class="feedback bad">${msgErro}</div>` : ""}</div>`);
    lado.appendChild(fbEl);
    let cores = "w";
    p.querySelectorAll("#lado-an button").forEach((b) => b.addEventListener("click", () => {
      cores = b.dataset.c;
      p.querySelectorAll("#lado-an button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
    // ao colar, tenta descobrir de que lado a pessoa jogou pelo nome repetido entre partidas
    p.querySelector("#pgn").addEventListener("input", (e) => {
      const nomeB = e.target.value.match(/\[White "([^"]+)"\]/)?.[1], nomeP = e.target.value.match(/\[Black "([^"]+)"\]/)?.[1];
      const eu = P.meuNome;
      if (eu && (nomeB === eu || nomeP === eu)) p.querySelector(`#lado-an [data-c="${nomeB === eu ? "w" : "b"}"]`).click();
    });
    p.querySelector("#analisar").addEventListener("click", () => {
      const texto = p.querySelector("#pgn").value;
      const g = lerPgn(texto);
      if (!g) { fbEl.innerHTML = `<div class="feedback bad">Não consegui ler essa partida. Confira se o PGN foi copiado inteiro.</div>`; return; }
      const hd = g.getHeaders();
      if (cores !== "wb") { const nome = hd[cores === "w" ? "White" : "Black"]; if (nome && nome !== "?") { P.meuNome = nome; progresso.save(P); } }
      analisar(g, cores.split(""), hd);
    });
  }

  async function analisar(g, cores, hd) {
    lances = g.history({ verbose: true });
    fens = fensDe(lances);
    marcas = {};
    board.setOrientation(cores.length === 1 ? cores[0] : "w");
    nav.hidden = false;
    lado.innerHTML = "";
    const titulo = hd.White && hd.Black && hd.White !== "?" ? `${hd.White} × ${hd.Black}` : "Sua partida";
    lado.appendChild(h(`<div class="panel">
      <p class="eyebrow">Análise${hd.Result && hd.Result !== "*" ? " · resultado " + hd.Result : ""}</p>
      <h2>${titulo.replace(/</g, "&lt;")}</h2>
      <div class="moves" id="lances" style="margin-top:12px"></div>
    </div>`));
    const lancesEl = lado.querySelector("#lances");
    const desenhar = () => {
      lancesEl.innerHTML = lances.map((m, i) => (i % 2 === 0 ? `<span class="n">${i / 2 + 1}.</span>` : "") +
        `<button type="button" data-i="${i}" class="lance${marcas[i] ? (marcas[i].perda >= 250 ? " grave" : " leve") : ""}">${sanPt(m.san)}</button> `).join("");
      lancesEl.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => ir(Number(b.dataset.i) + 1)));
    };
    desenhar();
    ir(lances.length);
    const fbEl = h(`<div id="fb" aria-live="polite"></div>`);
    lado.appendChild(fbEl);
    const n = lances.filter((m) => cores.includes(m.color)).length;
    fbEl.innerHTML = `<div class="feedback info">Analisando ${n} lances com o Stockfish… <span id="prog">0%</span></div>`;
    const achados = await analisarLances(lances, fens, cores, (f) => { const pr = document.getElementById("prog"); if (pr) pr.textContent = Math.round(f * 100) + "%"; }, () => vivo);
    if (!achados) return;
    achados.forEach((x) => marcas[x.i] = x);
    desenhar();
    ir(pos);
    fbEl.innerHTML = `<div class="feedback ${achados.length ? "info" : "ok"}">${achados.length ? resumoErros(achados) : "Nenhum erro grave nos lances analisados!"}</div>`;
    const nomes = { w: "as brancas jogaram", b: "as pretas jogaram" };
    if (achados.length) lado.appendChild(listaDeErros(achados, board, status, (c) => (cores.length === 1 ? "você jogou" : nomes[c])));
    const acoes = h(`<div class="btn-row"></div>`);
    const outra = h(`<button type="button" class="btn">Analisar outra partida</button>`); outra.addEventListener("click", () => entrada());
    acoes.appendChild(outra);
    lado.appendChild(acoes);
    pontuar("analise");
    progresso.treinou(P);
    salvar();
  }

  entrada();
  atual = () => { vivo = false; removeEventListener("keydown", teclas); };
}

// ======================= revisão espaçada =======================
function telaRevisar() {
  app.innerHTML = "";
  const fila = revisao.pendentes(P).filter((r) => r.tipo === "puzzle" || licao(r.licao)?.passos[r.passo]?.t === "linha");
  const tela = h(`<div class="trainer">
    <div><div class="board-wrap"></div></div>
    <div class="side">
      <div class="panel">
        <p class="eyebrow">Revisão</p>
        <h2 id="rev-titulo"></h2>
        <p class="lead" style="font-size:16px;margin-top:6px">O que você aprendeu volta aos poucos: acertou, ele demora mais para voltar (1, 3, 7, 14, 30 dias…); errou, volta amanhã.</p>
      </div>
      <div class="panel prose" id="passo" aria-live="polite"></div>
      <div id="fb" aria-live="polite"></div>
      <div class="btn-row" id="acoes"></div>
    </div></div>`);
  app.appendChild(tela);
  const board = novoTabuleiro(tela.querySelector(".board-wrap"), {});
  const box = tela.querySelector("#passo"), fb = tela.querySelector("#fb"), acoes = tela.querySelector("#acoes"), titulo = tela.querySelector("#rev-titulo");
  const feedback = (tipo, txt) => { fb.innerHTML = txt ? `<div class="feedback ${tipo}">${txt}</div>` : ""; };
  const botao = (txt, cls, fn) => { const b = h(`<button type="button" class="btn ${cls}">${txt}</button>`); b.addEventListener("click", fn); return b; };
  let j = 0, ctl = null, acertos = 0;
  board.setFen(new Chess().fen());

  const fimDaFila = () => {
    const total = Object.keys(P.revisao || {}).length, prox = revisao.proximaData(P);
    titulo.textContent = fila.length ? "Revisão do dia feita!" : "Nada para revisar hoje";
    const quando = prox ? new Date(prox + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : null;
    box.innerHTML = (fila.length ? `<p>Você acertou <strong>${acertos} de ${fila.length}</strong>.</p>` : "") +
      (total ? `<p>${total} ${total === 1 ? "item está" : "itens estão"} na sua revisão. O próximo volta ${prox <= progresso.hoje() ? "hoje" : "na <strong>" + quando + "</strong>"}.</p>`
        : `<p>A revisão se enche sozinha: as aberturas que você joga de memória nas lições e os puzzles que você errou ou resolveu com ajuda.</p>`);
    feedback();
    acoes.innerHTML = "";
    acoes.appendChild(h(`<a class="btn primary" href="#/">Voltar à trilha</a>`));
    acoes.appendChild(h(`<a class="btn" href="#/puzzles">Puzzles</a>`));
  };

  const proximo = () => {
    if (ctl) ctl.destroy();
    ctl = null;
    feedback();
    acoes.innerHTML = "";
    if (j >= fila.length) return fimDaFila();
    const r = fila[j];
    titulo.textContent = `${j + 1} de ${fila.length}`;
    const terminar = (acertou, msg) => {
      revisao.registrar(P, r.k, acertou);
      if (acertou) { acertos++; sons.acerto(); }
      pontuar("revisao");
      progresso.treinou(P);
      salvar();
      feedback(acertou ? "ok" : "info", msg);
      acoes.innerHTML = "";
      const b = botao(j + 1 < fila.length ? "Próximo" : "Concluir", "primary", () => { j++; proximo(); });
      acoes.appendChild(b);
      b.focus({ preventScroll: true });
    };
    if (r.tipo === "linha") {
      const L = licao(r.licao), s = L.passos[r.passo];
      box.innerHTML = `<p><strong>${L.titulo}</strong> · jogue a linha de memória com as ${s.cor === "b" ? "pretas" : "brancas"}.</p><div class="moves" id="linha"></div>`;
      board.setLastMove(null); board.setCheck(null); board.setTargets([]);
      ctl = runLinha(board, { ...s, sozinho: true }, { linha: box.querySelector("#linha") }, {
        onWrong: (msg) => feedback("bad", msg),
        onOk: () => feedback(),
        onDone: ({ erros }) => terminar(erros === 0, erros === 0 ? "Sem erros! Esta linha volta daqui a mais tempo." : `Linha completa, com ${erros} ${erros === 1 ? "erro" : "erros"}. Ela volta amanhã.`),
      });
    } else {
      box.innerHTML = `<p><strong>Puzzle que você errou</strong>${r.puzzle[4] ? " · " + r.puzzle[4].split(" ").filter((t) => TEMAS_PT[t] && !["short", "long", "middlegame", "endgame", "opening"].includes(t)).map((t) => TEMAS_PT[t]).join(", ") : ""}</p><p id="vez"></p>`;
      ctl = runPuzzle(board, r.puzzle, {
        onWrong: () => feedback("bad", "Não é esse lance. Tente de novo."),
        onProgress: () => feedback("info", "Boa! A sequência continua."),
        onSolved: ({ limpo, mostrado }) => terminar(limpo, limpo ? "Resolvido! Ele volta daqui a mais tempo." : mostrado ? "Essa era a solução. Ele volta amanhã." : "Resolvido, com ajuda. Ele volta amanhã."),
      });
      box.querySelector("#vez").textContent = `Você joga com as ${ctl.jogador === "w" ? "brancas" : "pretas"}. Espere o lance do adversário.`;
      acoes.appendChild(botao("Dica", "", () => ctl.dica()));
      acoes.appendChild(botao("Ver solução", "", () => ctl.solucao()));
    }
  };
  proximo();
  atual = () => ctl && ctl.destroy();
}

// ======================= rotas =======================
function rota() {
  if (atual) { atual(); atual = null; }
  const [, pagina, arg] = location.hash.split("/");
  window.scrollTo(0, 0);
  if (pagina === "licao") telaLicao(arg);
  else if (pagina === "puzzles") telaPuzzles();
  else if (pagina === "jogar") telaJogar();
  else if (pagina === "revisar") telaRevisar();
  else if (pagina === "analisar") telaAnalisar();
  else telaInicio();
  topo();
  document.title = (pagina === "licao" && licao(arg) ? licao(arg).titulo + " · " : pagina === "puzzles" ? "Puzzles · " : pagina === "jogar" ? "Jogar · " : pagina === "revisar" ? "Revisar · " : pagina === "analisar" ? "Analisar · " : "") + "Chess Trail";
}
// progresso vindo do endereço antigo: o redirecionamento manda o código no link (#importar=TX1...)
async function importarDoLink() {
  const m = location.hash.match(/^#importar=(.+)$/);
  if (!m) return;
  try { progresso.mesclar(P, await progresso.importar(decodeURIComponent(m[1]))); progresso.save(P); } catch { /* código ruim: segue sem ele */ }
  history.replaceState(null, "", location.pathname + location.search + "#/");
}
window.addEventListener("hashchange", () => (location.hash.startsWith("#importar=") ? importarDoLink().then(rota) : rota()));
await importarDoLink();
rota();
