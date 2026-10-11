// Tabuleiro interativo: tocar (peça, depois casa) ou arrastar. Não conhece as regras:
// quem usa informa os lances possíveis (dests) e decide se um lance vale (onMove).
import * as sons from "./sons.js";

const FILES = "abcdefgh";
const PIECE_URL = (p) => `assets/pieces/${p}.svg`; // p = "wK", "bP"...
const NAMES = { K: "rei", Q: "dama", R: "torre", B: "bispo", N: "cavalo", P: "peão" };

export function squareName(file, rank) { return FILES[file] + (rank + 1); }
export function parseSquare(sq) { return [FILES.indexOf(sq[0]), Number(sq[1]) - 1]; }

// só a parte das peças do FEN; aceita posições sem reis (lições de movimento)
export function fenToPieces(fen) {
  const map = {};
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, i) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { file += Number(ch); continue; }
      const color = ch === ch.toUpperCase() ? "w" : "b";
      map[squareName(file, 7 - i)] = color + ch.toUpperCase();
      file++;
    }
  });
  return map;
}

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#c99412" stroke="#7a5a08" stroke-width="1" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';

export class Board {
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = Object.assign({ orientation: "w", coords: true, interactive: true }, opts);
    this.orientation = this.opts.orientation;
    this.pieces = {};          // casa -> "wK"
    this.pieceEls = {};        // casa -> elemento
    this.selected = null;
    this.dests = [];
    this.marks = { last: [], check: null, hint: null };
    el.classList.add("board");
    el.setAttribute("role", "grid");
    el.setAttribute("aria-label", "Tabuleiro de xadrez");
    this.squares = {};
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const s = document.createElement("div");
      s.className = "sq " + ((f + r) % 2 ? "l" : "d");
      s.dataset.sq = squareName(f, r);
      el.appendChild(s);
      this.squares[s.dataset.sq] = s;
    }
    this.arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.arrowSvg.setAttribute("class", "arrows");
    this.arrowSvg.setAttribute("viewBox", "0 0 8 8");
    el.appendChild(this.arrowSvg);
    this.layout();
    this.bindInput();
  }

  // posição de cada casa conforme o lado de baixo
  xy(sq) {
    const [f, r] = parseSquare(sq);
    return this.orientation === "w" ? [f, 7 - r] : [7 - f, r];
  }
  layout() {
    for (const [sq, s] of Object.entries(this.squares)) {
      const [x, y] = this.xy(sq);
      s.style.left = x * 12.5 + "%";
      s.style.top = y * 12.5 + "%";
      s.querySelectorAll(".coord").forEach((c) => c.remove());
      if (this.opts.coords) {
        if (y === 7) s.insertAdjacentHTML("beforeend", `<span class="coord file">${sq[0]}</span>`);
        if (x === 0) s.insertAdjacentHTML("beforeend", `<span class="coord rank">${sq[1]}</span>`);
      }
    }
    for (const [sq, p] of Object.entries(this.pieceEls)) this.place(p, sq);
    this.drawArrows();
    this.drawTargets();
  }
  place(pieceEl, sq) {
    const [x, y] = this.xy(sq);
    pieceEl.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
  }
  setOrientation(c) { this.orientation = c; this.layout(); }
  flip() { this.setOrientation(this.orientation === "w" ? "b" : "w"); }

  // atualiza as peças reaproveitando elementos, para o lance deslizar em vez de sumir e aparecer
  setFen(fen) { this.setPieces(fenToPieces(fen)); }
  setPieces(map) {
    const old = this.pieceEls, next = {}, sobras = [];
    for (const [sq, el] of Object.entries(old)) {
      if (map[sq] === el.dataset.p) next[sq] = el;
      else sobras.push(el);
    }
    for (const [sq, p] of Object.entries(map)) {
      if (next[sq]) continue;
      const i = sobras.findIndex((el) => el.dataset.p === p);
      let el;
      if (i >= 0) el = sobras.splice(i, 1)[0];
      else {
        el = document.createElement("div");
        el.className = "piece";
        el.dataset.p = p;
        el.style.backgroundImage = `url(${PIECE_URL(p)})`;
        this.el.appendChild(el);
      }
      next[sq] = el;
      this.place(el, sq);
    }
    sobras.forEach((el) => el.remove());
    this.pieceEls = next;
    this.pieces = Object.assign({}, map);
    for (const [sq, s] of Object.entries(this.squares)) {
      const p = map[sq];
      s.setAttribute("aria-label", sq + (p ? ", " + NAMES[p[1]] + (p[0] === "w" ? " branco" : " preto") : ""));
    }
    this.deselect();
  }

  // ---------- marcas ----------
  setLastMove(from, to) {
    this.marks.last.forEach((sq) => this.squares[sq]?.classList.remove("last"));
    this.marks.last = from ? [from, to] : [];
    this.marks.last.forEach((sq) => this.squares[sq]?.classList.add("last"));
  }
  setCheck(sq) {
    if (this.marks.check) this.squares[this.marks.check].classList.remove("chk");
    this.marks.check = sq || null;
    if (sq) this.squares[sq].classList.add("chk");
  }
  setHint(sq) {
    if (this.marks.hint) this.squares[this.marks.hint].classList.remove("hint");
    this.marks.hint = sq || null;
    if (sq) this.squares[sq].classList.add("hint");
  }
  flash(sq, kind, ms = 700) {
    const s = this.squares[sq];
    if (!s) return;
    if (kind === "bad") sons.erro();
    s.classList.add(kind);
    setTimeout(() => s.classList.remove(kind), ms);
  }
  setTargets(list) { this.targets = list || []; this.drawTargets(); }
  drawTargets() {
    this.el.querySelectorAll(".target").forEach((t) => t.remove());
    (this.targets || []).forEach((sq) => {
      const t = document.createElement("div");
      t.className = "target";
      const [x, y] = this.xy(sq);
      t.style.left = x * 12.5 + "%";
      t.style.top = y * 12.5 + "%";
      t.innerHTML = STAR;
      this.el.appendChild(t);
    });
  }
  setArrows(list) { this.arrows = list || []; this.drawArrows(); }
  drawArrows() {
    const svg = this.arrowSvg;
    svg.innerHTML = '<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--arrow)"/></marker></defs>';
    (this.arrows || []).forEach(({ from, to }) => {
      const [x1, y1] = this.xy(from), [x2, y2] = this.xy(to);
      const cx1 = x1 + 0.5, cy1 = y1 + 0.5, cx2 = x2 + 0.5, cy2 = y2 + 0.5;
      const len = Math.hypot(cx2 - cx1, cy2 - cy1), k = (len - 0.32) / len;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", cx1); line.setAttribute("y1", cy1);
      line.setAttribute("x2", cx1 + (cx2 - cx1) * k); line.setAttribute("y2", cy1 + (cy2 - cy1) * k);
      line.setAttribute("stroke", "var(--arrow)"); line.setAttribute("stroke-width", "0.16");
      line.setAttribute("stroke-linecap", "round"); line.setAttribute("marker-end", "url(#ah)");
      svg.appendChild(line);
    });
  }

  // ---------- seleção e lances ----------
  select(sq) {
    this.deselect();
    const dests = this.opts.getDests ? this.opts.getDests(sq) : [];
    if (!dests.length) return false;
    this.selected = sq;
    this.dests = dests;
    this.squares[sq].classList.add("sel");
    dests.forEach((d) => {
      const m = document.createElement("div");
      m.className = "dest" + (this.pieces[d.to] || d.capture ? " cap" : "");
      const [x, y] = this.xy(d.to);
      m.style.left = x * 12.5 + "%";
      m.style.top = y * 12.5 + "%";
      this.el.appendChild(m);
    });
    return true;
  }
  deselect() {
    if (this.selected) this.squares[this.selected]?.classList.remove("sel");
    this.selected = null;
    this.dests = [];
    this.el.querySelectorAll(".dest").forEach((d) => d.remove());
  }
  async tryMove(from, to) {
    const p = this.pieces[from];
    let promo;
    const rank = Number(to[1]);
    if (p && p[1] === "P" && ((p[0] === "w" && rank === 8) || (p[0] === "b" && rank === 1)) && !this.opts.noPromotion) {
      promo = await this.askPromotion(p[0]);
      if (!promo) { this.setPieces(this.pieces); return; }
    }
    this.deselect();
    const ok = await this.opts.onMove?.(from, to, promo);
    if (ok === false) this.setPieces(this.pieces); // devolve a peça ao lugar
  }
  askPromotion(color) {
    return new Promise((resolve) => {
      const box = document.createElement("div");
      box.className = "promo";
      box.innerHTML = '<div class="promo-box" role="dialog" aria-label="Escolha a peça da promoção">' +
        ["q", "r", "b", "n"].map((t) => `<button type="button" data-t="${t}" aria-label="${NAMES[t.toUpperCase()]}" style="background-image:url(${PIECE_URL(color + t.toUpperCase())})"></button>`).join("") + "</div>";
      box.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        box.remove();
        resolve(b ? b.dataset.t : null);
      });
      this.el.appendChild(box);
      box.querySelector("button").focus();
    });
  }

  squareAt(clientX, clientY) {
    const r = this.el.getBoundingClientRect();
    const x = Math.floor((clientX - r.left) / (r.width / 8)), y = Math.floor((clientY - r.top) / (r.height / 8));
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    const f = this.orientation === "w" ? x : 7 - x, rk = this.orientation === "w" ? 7 - y : y;
    return squareName(f, rk);
  }

  bindInput() {
    let drag = null;
    this.el.addEventListener("pointerdown", (e) => {
      if (!this.opts.interactive || e.button > 0 || this.el.querySelector(".promo")) return;
      const sq = this.squareAt(e.clientX, e.clientY);
      if (!sq) return;
      if (this.opts.onSquareClick && this.opts.onSquareClick(sq) === true) return;
      // tocar numa casa de destino com uma peça já escolhida
      if (this.selected && this.dests.some((d) => d.to === sq)) { this.tryMove(this.selected, sq); return; }
      if (this.pieces[sq] && this.select(sq)) {
        const el = this.pieceEls[sq], r = this.el.getBoundingClientRect();
        drag = { from: sq, el, x0: e.clientX, y0: e.clientY, size: r.width / 8, rect: r, moved: false };
        this.el.setPointerCapture(e.pointerId);
      } else this.deselect();
    });
    this.el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
      drag.moved = true;
      drag.el.classList.add("drag");
      const x = e.clientX - drag.rect.left - drag.size / 2, y = e.clientY - drag.rect.top - drag.size / 2;
      drag.el.style.transform = `translate(${x}px, ${y}px)`;
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.el.classList.remove("drag");
      if (!d.moved) return; // foi um toque: a peça fica escolhida esperando a casa
      const sq = this.squareAt(e.clientX, e.clientY);
      if (sq && sq !== d.from && this.dests.some((x) => x.to === sq)) this.tryMove(d.from, sq);
      else { this.place(d.el, d.from); }
    };
    this.el.addEventListener("pointerup", end);
    this.el.addEventListener("pointercancel", end);
    new ResizeObserver(() => this.drawArrows()).observe(this.el);
  }
}

// lances possíveis de uma peça sozinha num tabuleiro (para as lições de movimento,
// em que não há reis e o chess.js não aceita a posição); bloqueios e capturas valem
export function freeDests(pieces, sq) {
  const p = pieces[sq];
  if (!p) return [];
  const [f, r] = parseSquare(sq), color = p[0], type = p[1], out = [];
  const add = (df, dr, slide) => {
    let nf = f + df, nr = r + dr;
    while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      const to = squareName(nf, nr), occ = pieces[to];
      if (occ) { if (occ[0] !== color) out.push({ to, capture: true }); break; }
      out.push({ to });
      if (!slide) break;
      nf += df; nr += dr;
    }
  };
  const rook = [[1, 0], [-1, 0], [0, 1], [0, -1]], bishop = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (type === "R") rook.forEach(([a, b]) => add(a, b, true));
  if (type === "B") bishop.forEach(([a, b]) => add(a, b, true));
  if (type === "Q") rook.concat(bishop).forEach(([a, b]) => add(a, b, true));
  if (type === "K") rook.concat(bishop).forEach(([a, b]) => add(a, b, false));
  if (type === "N") [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]].forEach(([a, b]) => add(a, b, false));
  if (type === "P") {
    const dir = color === "w" ? 1 : -1, start = color === "w" ? 1 : 6;
    const one = squareName(f, r + dir);
    if (r + dir >= 0 && r + dir < 8 && !pieces[one]) {
      out.push({ to: one });
      const two = squareName(f, r + 2 * dir);
      if (r === start && !pieces[two]) out.push({ to: two });
    }
    [-1, 1].forEach((df) => {
      const nf = f + df, nr = r + dir;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) return;
      const to = squareName(nf, nr);
      if (pieces[to] && pieces[to][0] !== color) out.push({ to, capture: true });
    });
  }
  return out;
}
