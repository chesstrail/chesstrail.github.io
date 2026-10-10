// A trilha: 6 níveis. Cada lição é uma sequência de passos.
//
// Tipos de passo:
//   texto   — explicação, com tabuleiro opcional (fen, setas)
//   casa    — tocar numa casa pedida
//   alvos   — mover uma peça (sem reis, regras livres) até recolher as estrelas
//             ou capturar as peças pretas paradas
//   lance   — um lance numa posição de verdade: lista de lances aceitos ou objetivo
//             ("mate", "xeque")
//   escolha — pergunta de múltipla escolha, com tabuleiro opcional
//   puzzle  — puzzles do banco do Lichess de um tema
//   vencer  — jogar contra o computador a partir da posição até cumprir o objetivo
//             dentro de um limite de lances: "mate", "promover" (e manter a dama),
//             "capturar" (ficar com a dama e deixar o adversário só com o rei) ou
//             "segurar" (chegar ao limite sem perder a torre nem deixar coroar)
//   linha   — uma abertura lance a lance: você joga os lances da sua cor (cor) e o
//             computador responde pelo livro; cada lance pode ser [lance, comentário].
//             Com sozinho: true, os comentários não aparecem (treino de memória)

import { Chess } from "../vendor/chess.js";

// FEN depois de uma sequência de lances a partir da posição inicial
const pos = (lances) => { const g = new Chess(); lances.split(" ").forEach((m) => g.move(m)); return g.fen(); };

const VAZIO = "8/8/8/8/8/8/8/8 w - - 0 1";
const INICIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const NIVEIS = [
  { n: 1, titulo: "Primeiros passos", resumo: "O tabuleiro e como cada peça se move." },
  { n: 2, titulo: "Xeque e xeque-mate", resumo: "Atacar o rei, defender o seu e as regras especiais." },
  { n: 3, titulo: "Tática", resumo: "Os golpes que ganham peças e partidas." },
  { n: 4, titulo: "Finais", resumo: "Mates básicos, finais de peões e finais de torre." },
  { n: 5, titulo: "Aberturas", resumo: "Como começar a partida com as brancas." },
  { n: 6, titulo: "Defesas", resumo: "Como responder às aberturas com as pretas." },
];

export const LICOES = [
  // ---------------- nível 1 ----------------
  {
    id: "tabuleiro", nivel: 1, titulo: "O tabuleiro", resumo: "Casas, colunas e fileiras.",
    passos: [
      { t: "texto", fen: VAZIO, html: "<p>O tabuleiro tem <strong>64 casas</strong>, alternando claras e escuras. As colunas vão de <strong>a</strong> a <strong>h</strong> (da esquerda para a direita) e as fileiras de <strong>1</strong> a <strong>8</strong> (de baixo para cima, do lado das brancas).</p><p>Cada casa tem um nome: a coluna e a fileira. A casa no canto de baixo à esquerda é a <span class=\"notation\">a1</span>.</p>" },
      { t: "casa", fen: VAZIO, casa: "e4", instrucao: "Toque na casa <span class=\"notation\">e4</span>: coluna e, fileira 4." },
      { t: "casa", fen: VAZIO, casa: "h8", instrucao: "Agora a casa <span class=\"notation\">h8</span>, no canto oposto." },
      { t: "casa", fen: VAZIO, casa: "c6", instrucao: "E a <span class=\"notation\">c6</span>." },
      { t: "texto", fen: INICIAL, html: "<p>Esta é a <strong>posição inicial</strong>. Os peões ficam na segunda fileira; atrás deles, torres nos cantos, depois cavalos, bispos, e no meio a dama e o rei.</p><p>Uma regra para lembrar: <strong>a dama fica na casa da sua cor</strong> — a dama branca numa casa clara, a preta numa escura. E as <strong>brancas sempre começam</strong>.</p>" },
      { t: "escolha", fen: INICIAL, pergunta: "Em que casa está a dama branca?", opcoes: [
        { texto: "d1", certo: true, explica: "Isso: a dama branca fica em d1, uma casa clara." },
        { texto: "e1", explica: "Em e1 fica o rei. A dama está ao lado, em d1." },
        { texto: "d8", explica: "d8 é a casa da dama preta." },
      ] },
    ],
  },
  {
    id: "torre", nivel: 1, titulo: "A torre", resumo: "Em linha reta, quantas casas quiser.",
    passos: [
      { t: "texto", fen: "8/8/8/8/3R4/8/8/8 w - - 0 1", setas: [["d4", "d8"], ["d4", "h4"], ["d4", "d1"], ["d4", "a4"]], html: "<p>A torre anda em <strong>linha reta</strong>, na horizontal ou na vertical, quantas casas quiser. Ela não pode pular outras peças.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/8/R7 w - - 0 1", mover: "R", alvos: ["a5", "e5", "e8"], instrucao: "Leve a torre por todas as estrelas." },
      { t: "alvos", fen: "8/8/8/3P4/8/8/8/3R4 w - - 0 1", mover: "R", alvos: ["d4", "g4", "g8"], instrucao: "Seu próprio peão bloqueia o caminho: a torre não pula. Pegue as estrelas." },
    ],
  },
  {
    id: "bispo", nivel: 1, titulo: "O bispo", resumo: "Nas diagonais, sempre na mesma cor.",
    passos: [
      { t: "texto", fen: "8/8/8/8/3B4/8/8/8 w - - 0 1", setas: [["d4", "h8"], ["d4", "a7"], ["d4", "a1"], ["d4", "g1"]], html: "<p>O bispo anda nas <strong>diagonais</strong>, quantas casas quiser. Por isso ele <strong>nunca muda de cor</strong>: um bispo de casas escuras passa a partida inteira em casas escuras.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/8/2B5 w - - 0 1", mover: "B", alvos: ["f4", "h6", "f8"], instrucao: "Leve o bispo pelas estrelas." },
      { t: "escolha", pergunta: "Um bispo que está numa casa clara pode chegar a uma casa escura?", opcoes: [
        { texto: "Não, nunca", certo: true, explica: "Isso. Andando só nas diagonais, ele fica sempre na mesma cor." },
        { texto: "Sim, em dois lances", explica: "Não: toda diagonal tem casas de uma cor só." },
      ] },
    ],
  },
  {
    id: "dama", nivel: 1, titulo: "A dama", resumo: "Torre e bispo juntos: a peça mais forte.",
    passos: [
      { t: "texto", fen: "8/8/8/8/3Q4/8/8/8 w - - 0 1", setas: [["d4", "d8"], ["d4", "h8"], ["d4", "h4"], ["d4", "g1"], ["d4", "d1"], ["d4", "a1"], ["d4", "a4"], ["d4", "a7"]], html: "<p>A dama junta a torre e o bispo: anda em linha reta <strong>e</strong> nas diagonais, quantas casas quiser. É a peça mais forte do jogo.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/8/3Q4 w - - 0 1", mover: "Q", alvos: ["h5", "h8", "a1"], instrucao: "Pegue as estrelas com a dama, no menor número de lances que conseguir." },
    ],
  },
  {
    id: "rei", nivel: 1, titulo: "O rei", resumo: "Uma casa por vez, e é ele que precisa ser protegido.",
    passos: [
      { t: "texto", fen: "8/8/8/8/3K4/8/8/8 w - - 0 1", setas: [["d4", "d5"], ["d4", "e5"], ["d4", "e4"], ["d4", "e3"], ["d4", "d3"], ["d4", "c3"], ["d4", "c4"], ["d4", "c5"]], html: "<p>O rei anda <strong>uma casa</strong> em qualquer direção. É a peça mais importante: a partida termina quando o rei de alguém não consegue escapar de um ataque — o xeque-mate.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/8/4K3 w - - 0 1", mover: "K", alvos: ["e3", "g3", "g5"], instrucao: "Leve o rei pelas estrelas, uma casa por vez." },
    ],
  },
  {
    id: "cavalo", nivel: 1, titulo: "O cavalo", resumo: "Em L, e é o único que pula.",
    passos: [
      { t: "texto", fen: "8/8/8/8/3N4/8/8/8 w - - 0 1", setas: [["d4", "e6"], ["d4", "f5"], ["d4", "f3"], ["d4", "e2"], ["d4", "c2"], ["d4", "b3"], ["d4", "b5"], ["d4", "c6"]], html: "<p>O cavalo anda em <strong>L</strong>: duas casas numa direção e uma para o lado. É a única peça que <strong>pula</strong> por cima das outras. Repare: ele sempre troca de cor de casa a cada lance.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/8/1N6 w - - 0 1", mover: "N", alvos: ["c3", "d5", "f6"], instrucao: "Leve o cavalo pelas estrelas." },
      { t: "alvos", fen: "8/8/8/8/8/8/5PPP/6N1 w - - 0 1", mover: "N", alvos: ["f3", "g5", "h7"], instrucao: "Cercado pelos próprios peões, o cavalo pula para fora." },
    ],
  },
  {
    id: "peao", nivel: 1, titulo: "O peão", resumo: "Só para a frente, captura na diagonal e vira dama.",
    passos: [
      { t: "texto", fen: "8/8/8/8/8/8/4P3/8 w - - 0 1", setas: [["e2", "e4"]], html: "<p>O peão anda <strong>só para a frente</strong>, uma casa. No seu <strong>primeiro lance</strong>, pode andar duas. Ele nunca volta.</p>" },
      { t: "alvos", fen: "8/8/8/8/8/8/4P3/8 w - - 0 1", mover: "P", alvos: ["e4", "e6"], instrucao: "Avance o peão até as estrelas. Use o lance duplo do começo." },
      { t: "texto", fen: "8/8/8/3p1p2/4P3/8/8/8 w - - 0 1", setas: [["e4", "d5"], ["e4", "f5"]], html: "<p>O peão é diferente na hora de capturar: ele captura <strong>na diagonal</strong>, uma casa para a frente. E não consegue capturar o que está bem na sua frente.</p>" },
      { t: "alvos", fen: "8/8/8/3p4/4P3/8/8/8 w - - 0 1", mover: "P", alvos: ["d5"], instrucao: "Capture o peão preto." },
      { t: "lance", fen: "8/4P3/8/8/8/k7/8/K7 w - - 0 1", aceitar: ["e7e8"], instrucao: "Quando o peão chega à última fileira, ele <strong>vira outra peça</strong> — quase sempre uma dama. Leve o peão até a oitava fileira.", ok: "Promoção! O peão virou uma peça nova." },
    ],
  },
  {
    id: "capturar", nivel: 1, titulo: "Capturar e o valor das peças", resumo: "Tomar peças e saber quanto cada uma vale.",
    passos: [
      { t: "texto", fen: "8/8/8/8/8/8/8/8 w - - 0 1", html: "<p>Para capturar, a peça vai para a casa da peça adversária e a tira do tabuleiro. Todas capturam do jeito que andam (só o peão é diferente).</p><p>Um guia do valor de cada peça, em peões: <strong>peão 1, cavalo 3, bispo 3, torre 5, dama 9</strong>. O rei não tem preço: perder o rei é perder a partida.</p>" },
      { t: "alvos", fen: "8/8/p4p2/8/8/8/5p2/R7 w - - 0 1", mover: "R", capturar: true, instrucao: "Capture os três peões pretos com a torre." },
      { t: "alvos", fen: "8/8/2p5/4p3/1p6/2N5/8/8 w - - 0 1", mover: "N", capturar: true, instrucao: "Agora com o cavalo." },
      { t: "escolha", pergunta: "Vale a pena dar a sua torre para capturar um cavalo?", opcoes: [
        { texto: "Não: a torre vale 5, o cavalo 3", certo: true, explica: "Isso. Você perderia cerca de 2 pontos de material." },
        { texto: "Sim: qualquer captura é boa", explica: "Não: o que importa é o saldo. Torre (5) por cavalo (3) é prejuízo." },
      ] },
    ],
  },

  // ---------------- nível 2 ----------------
  {
    id: "xeque", nivel: 2, titulo: "Xeque", resumo: "Atacar o rei e as três formas de se defender.",
    passos: [
      { t: "texto", fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", setas: [["a1", "a8"]], html: "<p>Quando uma peça ataca o rei, isso é <strong>xeque</strong>. O jogador em xeque é obrigado a resolver na hora: não pode fazer outro lance qualquer.</p>" },
      { t: "lance", fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", objetivo: "xeque", instrucao: "Dê xeque no rei preto com a torre." },
      { t: "texto", fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", html: "<p>Há três jeitos de sair do xeque: <strong>fugir</strong> com o rei, <strong>bloquear</strong> colocando uma peça no caminho, ou <strong>capturar</strong> quem está atacando.</p>" },
      { t: "lance", fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", aceitar: ["e1e2"], instrucao: "A torre preta dá xeque e está sozinha. Saia do xeque <strong>capturando</strong> a torre.", errado: "Isso foge do xeque, mas a torre está sem defesa: dá para capturá-la com o rei." },
      { t: "lance", fen: "4k3/4r3/8/8/8/8/3B4/4K3 w - - 0 1", aceitar: ["d2e3"], instrucao: "Agora saia do xeque <strong>bloqueando</strong> com o bispo.", errado: "Funciona, mas a ideia aqui é bloquear: coloque o bispo entre a torre e o rei." },
    ],
  },
  {
    id: "mate", nivel: 2, titulo: "Xeque-mate", resumo: "O rei sem saída: fim de partida.",
    passos: [
      { t: "texto", fen: "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1", html: "<p><strong>Xeque-mate</strong> é o xeque do qual não dá para sair: o rei não tem para onde fugir, ninguém bloqueia e ninguém captura o atacante. Quem leva mate perde.</p><p>Aqui, os próprios peões prendem o rei preto, e a torre o ataca pela última fileira.</p>" },
      { t: "lance", fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", objetivo: "mate", instrucao: "Dê xeque-mate em um lance." },
      { t: "lance", fen: "6k1/8/6K1/8/8/8/8/R7 w - - 0 1", objetivo: "mate", instrucao: "Mate em um lance: o seu rei já cuida das casas da frente." },
      { t: "lance", fen: "k7/8/1K6/8/8/8/8/6Q1 w - - 0 1", objetivo: "mate", instrucao: "Mate em um lance com a dama." },
    ],
  },
  {
    id: "afogamento", nivel: 2, titulo: "Afogamento", resumo: "Sem xeque e sem lances: empate.",
    passos: [
      { t: "texto", fen: "k7/2Q5/1K6/8/8/8/8/8 b - - 0 1", html: "<p>Se é a sua vez, você <strong>não está em xeque</strong> e <strong>não tem nenhum lance</strong>, a partida termina <strong>empatada</strong>: é o afogamento. Isso salva muita gente que estava perdendo.</p>" },
      { t: "escolha", fen: "k7/2Q5/1K6/8/8/8/8/8 b - - 0 1", pergunta: "É a vez das pretas. O que aconteceu?", opcoes: [
        { texto: "Afogamento: empate", certo: true, explica: "Isso: o rei preto não está atacado, mas não tem nenhuma casa livre." },
        { texto: "Xeque-mate", explica: "Não há xeque: a dama em c7 não ataca a casa a8." },
        { texto: "Xeque", explica: "A dama não ataca o rei. Por isso é afogamento, não mate." },
      ] },
      { t: "lance", fen: "k7/8/1K6/8/8/8/8/2Q5 w - - 0 1", objetivo: "mate", instrucao: "Dê mate em um lance — cuidado para não afogar o rei preto." },
    ],
  },
  {
    id: "especiais", nivel: 2, titulo: "Roque e en passant", resumo: "Os dois lances especiais.",
    passos: [
      { t: "texto", fen: "r3k2r/pppq1ppp/2n1bn2/3pp3/3PP3/2N1BN2/PPPQ1PPP/R3K2R w KQkq - 0 1", setas: [["e1", "g1"], ["h1", "f1"]], html: "<p>No <strong>roque</strong>, o rei anda duas casas em direção a uma torre, e a torre pula para o outro lado dele. É o único lance em que duas peças se movem. Ele protege o rei e coloca a torre em jogo.</p><p>Só vale se o rei e aquela torre ainda não se mexeram, se não houver peças entre eles e se o rei não estiver em xeque nem passar por uma casa atacada.</p>" },
      { t: "lance", fen: "r3k2r/pppq1ppp/2n1bn2/3pp3/3PP3/2N1BN2/PPPQ1PPP/R3K2R w KQkq - 0 1", aceitar: ["e1g1"], instrucao: "Faça o <strong>roque pequeno</strong>: arraste o rei duas casas para a direita.", ok: "Roque feito: o rei está protegido e a torre veio para o centro." },
      { t: "texto", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", setas: [["e5", "d6"]], html: "<p>O <strong>en passant</strong> (\"de passagem\"): se um peão adversário anda duas casas e para ao lado do seu, seu peão pode capturá-lo como se ele tivesse andado só uma. Só vale <strong>no lance seguinte</strong>.</p><p>O peão preto acabou de ir de d7 para d5.</p>" },
      { t: "lance", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", aceitar: ["e5d6"], instrucao: "Capture en passant: o peão vai para d6 e o peão preto sai do tabuleiro." },
    ],
  },

  // ---------------- nível 3 ----------------
  {
    id: "soltas", nivel: 3, titulo: "Peças soltas", resumo: "Peça sem defesa é presente.",
    passos: [
      { t: "texto", html: "<p>Antes de cada lance, pergunte: <strong>alguma peça do adversário está sem defesa?</strong> E alguma minha? Boa parte das partidas entre iniciantes é decidida por uma peça deixada solta.</p><p>Nos exercícios a seguir, ache a peça que pode ser capturada de graça. São posições de partidas reais.</p>" },
      { t: "puzzle", tema: "hangingPiece", qtd: 4 },
    ],
  },
  {
    id: "garfo", nivel: 3, titulo: "Garfo", resumo: "Uma peça atacando duas ao mesmo tempo.",
    passos: [
      { t: "texto", fen: "r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1", setas: [["c7", "e8"], ["c7", "a8"]], html: "<p>No <strong>garfo</strong>, uma peça ataca duas ao mesmo tempo. O adversário só consegue salvar uma. O cavalo é o rei dos garfos, porque ataca casas que as outras peças não alcançam.</p>" },
      { t: "lance", fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1", aceitar: ["b5c7"], instrucao: "Dê um garfo: ataque o rei e a torre com o cavalo.", ok: "Garfo! O rei sai do xeque e a torre cai." },
      { t: "puzzle", tema: "fork", qtd: 4 },
    ],
  },
  {
    id: "cravada", nivel: 3, titulo: "Cravada", resumo: "A peça presa na frente de outra mais valiosa.",
    passos: [
      { t: "texto", fen: "4k3/4n3/8/8/8/8/8/4RK2 b - - 0 1", setas: [["e1", "e8"]], html: "<p>Na <strong>cravada</strong>, uma peça não pode sair do lugar porque deixaria uma peça mais valiosa atrás dela exposta. Aqui o cavalo preto não pode se mexer: o rei ficaria em xeque.</p>" },
      { t: "lance", fen: "4k3/4n3/8/8/8/8/8/R4K2 w - - 0 1", aceitar: ["a1e1"], instrucao: "Crave o cavalo preto contra o rei." },
      { t: "puzzle", tema: "pin", qtd: 4 },
    ],
  },
  {
    id: "espeto", nivel: 3, titulo: "Espeto", resumo: "A cravada ao contrário.",
    passos: [
      { t: "texto", html: "<p>O <strong>espeto</strong> é a cravada ao contrário: você ataca uma peça valiosa (muitas vezes o rei), ela é obrigada a sair, e você captura o que estava atrás.</p>" },
      { t: "lance", fen: "8/1q6/8/3k4/8/8/8/4KB2 w - - 0 1", aceitar: ["f1g2"], instrucao: "O rei e a dama pretos estão na mesma diagonal. Espete os dois com o bispo.", ok: "Xeque! O rei sai da diagonal e a dama cai no lance seguinte." },
      { t: "puzzle", tema: "skewer", qtd: 3 },
    ],
  },
  {
    id: "descoberto", nivel: 3, titulo: "Ataque descoberto", resumo: "Uma peça sai e revela o ataque de outra.",
    passos: [
      { t: "texto", html: "<p>No <strong>ataque descoberto</strong>, você move uma peça e, ao sair do caminho, ela revela o ataque de outra que estava atrás. São dois ataques num lance só.</p><p>Se as duas peças derem xeque ao mesmo tempo, é um <strong>xeque duplo</strong>: aí o rei é obrigado a fugir, porque não dá para bloquear ou capturar duas peças de uma vez.</p>" },
      { t: "puzzle", tema: "discoveredAttack", qtd: 3 },
      { t: "puzzle", tema: "doubleCheck", qtd: 2 },
    ],
  },
  {
    id: "mates-taticos", nivel: 3, titulo: "Mates de verdade", resumo: "Última fileira e mate em dois.",
    passos: [
      { t: "texto", html: "<p>O <strong>mate na última fileira</strong> acontece quando o rei fica preso atrás dos próprios peões e uma torre ou dama invade a fileira dele. Dica para as suas partidas: abra um \"respiro\" para o seu rei, avançando um dos peões do roque.</p>" },
      { t: "puzzle", tema: "backRankMate", qtd: 3 },
      { t: "texto", html: "<p>Agora, <strong>mates em dois lances</strong>. Procure lances que forçam: xeques primeiro, depois capturas, depois ameaças.</p>" },
      { t: "puzzle", tema: "mateIn2", qtd: 3 },
    ],
  },

  // ---------------- nível 4 ----------------
  {
    id: "mate-dama", nivel: 4, titulo: "Mate com dama", resumo: "Rei e dama contra rei.",
    passos: [
      { t: "texto", fen: "8/8/8/4k3/8/8/8/1Q2K3 w - - 0 1", html: "<p>Com rei e dama contra o rei sozinho, o mate é garantido — se você souber a técnica:</p><p>1. Use a dama para <strong>empurrar o rei preto até a borda</strong>, ficando a um lance de cavalo de distância dele.</p><p>2. Traga o <strong>seu rei</strong> para perto.</p><p>3. Dê o mate. E cuidado com o <strong>afogamento</strong>: deixe sempre uma casa livre para o rei preto até a hora do mate.</p>" },
      { t: "vencer", fen: "8/8/8/4k3/8/8/8/1Q2K3 w - - 0 1", objetivo: "mate", limite: 20, instrucao: "Dê mate em até 20 lances. O computador defende o rei preto." },
    ],
  },
  {
    id: "mate-torre", nivel: 4, titulo: "Mate com torre", resumo: "Rei e torre contra rei.",
    passos: [
      { t: "texto", fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", html: "<p>Com a torre, o mate demora mais, mas a ideia é a mesma: a torre corta o tabuleiro e <strong>encolhe a área</strong> do rei preto, fileira por fileira. O seu rei vem ajudar, sempre ficando de frente para o rei adversário (a <strong>oposição</strong>), até o mate na borda.</p><p>Se o rei preto atacar a torre, afaste-a para o lado oposto do tabuleiro.</p>" },
      { t: "vencer", fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", objetivo: "mate", limite: 32, instrucao: "Dê mate em até 32 lances." },
    ],
  },
  {
    id: "rei-peao", nivel: 4, titulo: "Rei e peão", resumo: "A oposição e a coroação.",
    passos: [
      { t: "texto", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", html: "<p>Nos finais, o rei vira uma peça de ataque. Com rei e peão contra rei, o segredo é colocar o <strong>seu rei na frente do peão</strong>, e não atrás dele.</p><p>Os reis nunca podem ficar lado a lado. Quando eles estão frente a frente com uma casa entre si e é a vez do adversário, você tem a <strong>oposição</strong>: o rei dele precisa ceder espaço.</p>" },
      { t: "vencer", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", objetivo: "promover", limite: 15, instrucao: "Promova o peão. O computador defende com o rei preto." },
    ],
  },
  {
    id: "quadrado", nivel: 4, titulo: "A regra do quadrado", resumo: "O rei alcança o peão?",
    passos: [
      { t: "texto", fen: "8/8/8/P3k3/8/8/8/7K w - - 0 1", setas: [["a5", "d5"], ["d5", "d8"]], html: "<p>Um peão sozinho correndo para coroar: o rei adversário consegue pegá-lo? Não precisa contar lance por lance.</p><p>Imagine um <strong>quadrado</strong> com um lado indo do peão até a casa de coroação (aqui, de a5 a a8) e o outro lado indo para dentro do tabuleiro (de a5 a d5). Se o rei <strong>conseguir entrar no quadrado</strong> no lance dele, ele pega o peão. Se não, o peão coroa.</p><p>Quando o peão anda, o quadrado encolhe junto.</p>" },
      { t: "escolha", fen: "8/8/8/P3k3/8/8/8/7K w - - 0 1", pergunta: "É a vez das brancas. O peão coroa?", opcoes: [
        { texto: "Sim: depois de a6, o quadrado encolhe e o rei fica de fora", certo: true, explica: "Isso. Depois de a6, o quadrado vai de a6 a c8. O rei em e5 não consegue entrar nele em um lance." },
        { texto: "Não: o rei está perto o bastante", explica: "Conte com o quadrado: depois de a6, ele vai de a6 a c8. Em um lance, o rei de e5 só chega até a coluna d." },
      ] },
      { t: "escolha", fen: "8/8/8/P3k3/8/8/8/7K b - - 0 1", pergunta: "Mesma posição, mas agora é a vez das pretas. E aí?", opcoes: [
        { texto: "O rei entra no quadrado (Rd5 ou Rd6) e pega o peão", certo: true, explica: "Isso. Um lance de diferença muda tudo: o rei entra no quadrado a5–d8 e alcança o peão a tempo." },
        { texto: "O peão coroa do mesmo jeito", explica: "Com as pretas jogando primeiro, o rei vai para d5 ou d6 e entra no quadrado. Daí em diante, ele chega a tempo." },
      ] },
      { t: "vencer", fen: "8/8/8/P3k3/8/8/8/7K w - - 0 1", objetivo: "promover", limite: 4, instrucao: "Agora na prática: coroe o peão sem deixar a dama nova ser capturada." },
    ],
  },
  {
    id: "dama-peao", nivel: 4, titulo: "Dama contra peão", resumo: "Parar o peão na sétima.",
    passos: [
      { t: "texto", fen: "8/7K/8/8/8/8/3pk3/7Q w - - 0 1", html: "<p>Um peão a um passo de coroar, protegido pelo rei, contra uma dama. A dama sozinha não basta: o seu rei está longe. A técnica é dar xeques e cravar o peão até <strong>forçar o rei preto a ficar na frente do próprio peão</strong>, na casa de coroação.</p><p>Nesse momento o peão não pode andar, e você ganha um lance livre para <strong>aproximar o seu rei</strong>. Repita isso até o rei chegar e o peão cair.</p><p>(Contra peões da coluna a, c, f ou h a história é outra: ali o rei preto às vezes se salva com o afogamento.)</p>" },
      { t: "vencer", fen: "8/7K/8/8/8/8/3pk3/7Q w - - 0 1", objetivo: "capturar", limite: 30, instrucao: "Capture o peão preto (e fique com a dama) em até 30 lances." },
      { t: "puzzle", tema: "queenEndgame", qtd: 2 },
    ],
  },
  {
    id: "lucena", nivel: 4, titulo: "Torre: a posição de Lucena", resumo: "Construir a ponte e coroar.",
    passos: [
      { t: "texto", fen: "3K4/3P1k2/8/8/8/8/2r5/4R3 w - - 0 1", html: "<p>Finais de torre são os mais comuns do xadrez, e a <strong>posição de Lucena</strong> é a vitória que todo jogador precisa conhecer: o seu rei está na frente do peão, que já chegou à sétima, e o rei preto está cortado por uma coluna.</p><p>O problema é que o seu rei não consegue sair sem levar xeques da torre preta. A solução é <strong>construir a ponte</strong>:</p><p>1. Xeque com a torre para afastar o rei preto mais uma coluna.</p><p>2. Leve a torre para a <strong>quarta fileira</strong>.</p><p>3. Saia com o rei. Quando os xeques chegarem, a torre se coloca no meio e bloqueia.</p>" },
      { t: "lance", fen: "3K4/3P1k2/8/8/8/8/2r5/4R3 w - - 0 1", aceitar: ["e1f1"], instrucao: "Primeiro passo: dê xeque para empurrar o rei preto para longe da coluna e.", errado: "O primeiro lance é um xeque com a torre, pela coluna f." },
      { t: "vencer", fen: "3K4/3P1k2/8/8/8/8/2r5/4R3 w - - 0 1", objetivo: "promover", limite: 20, instrucao: "Agora jogue tudo: construa a ponte e coroe o peão sem perder a dama." },
    ],
  },
  {
    id: "philidor", nivel: 4, cor: "b", titulo: "Torre: a defesa de Philidor", resumo: "Empatar um final com um peão a menos.",
    passos: [
      { t: "texto", fen: "4k3/R7/1r6/4PK2/8/8/8/8 b - - 0 1", html: "<p>Agora você está do outro lado: com as pretas, um peão a menos. A <strong>defesa de Philidor</strong> garante o empate:</p><p>1. Seu rei fica <strong>na frente do peão</strong>, na casa de coroação.</p><p>2. Sua torre fica na <strong>sexta fileira</strong> (a terceira, olhando do seu lado), impedindo o rei branco de avançar.</p><p>3. Quando o peão branco avançar para a sexta, ele tira o abrigo do próprio rei: aí a sua torre <strong>desce para a primeira fileira</strong> e dá xeques por trás, sem parar.</p>" },
      { t: "escolha", fen: "4k3/R7/4P3/5K2/8/8/8/1r6 b - - 0 1", pergunta: "O peão branco foi para e6, e a torre preta desceu para b1. Por quê?", opcoes: [
        { texto: "Para dar xeques por trás: o rei branco não tem mais onde se esconder", certo: true, explica: "Isso. Com o peão em e6, o rei branco não pode se abrigar na frente dele, e os xeques pelas colunas e fileiras não acabam." },
        { texto: "Para atacar o peão", explica: "O peão está protegido. A ideia é outra: com o peão em e6, o rei branco fica sem abrigo contra xeques." },
      ] },
      { t: "vencer", fen: "4k3/R7/1r6/4PK2/8/8/8/8 b - - 0 1", objetivo: "segurar", limite: 15, instrucao: "Você joga com as pretas. Segure o empate por 15 lances: não perca a torre e não deixe o peão coroar." },
      { t: "puzzle", tema: "rookEndgame", qtd: 3 },
    ],
  },
  {
    id: "abertura", nivel: 5, titulo: "Princípios de abertura", resumo: "Centro, desenvolvimento e roque.",
    passos: [
      { t: "texto", fen: INICIAL, html: "<p>Na abertura, três ideias valem quase sempre:</p><p>1. <strong>Ocupe o centro</strong> com os peões (as casas e4, d4, e5, d5).</p><p>2. <strong>Desenvolva</strong>: tire os cavalos e bispos das casas iniciais. Uma peça por lance, sem mexer a mesma duas vezes sem motivo.</p><p>3. <strong>Faça o roque</strong> cedo para proteger o rei. E não saia com a dama muito cedo: ela vira alvo.</p>" },
      { t: "escolha", fen: INICIAL, pergunta: "Qual destes é um bom primeiro lance?", opcoes: [
        { texto: "e4", certo: true, explica: "Isso: ocupa o centro e abre caminho para a dama e o bispo." },
        { texto: "h4", explica: "Não ajuda o centro nem o desenvolvimento das peças." },
        { texto: "Cavalo para a3", explica: "O cavalo na borda controla poucas casas. f3 ou c3 são melhores." },
      ] },
      { t: "escolha", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", pergunta: "Depois de 1.e4 e5, qual lance segue os princípios?", opcoes: [
        { texto: "Cavalo para f3", certo: true, explica: "Desenvolve uma peça e ataca o peão de e5." },
        { texto: "Dama para h5", explica: "Funciona contra iniciantes, mas expõe a dama: ela vai ser atacada com ganho de tempo." },
        { texto: "a3", explica: "Não desenvolve nada; é perder um tempo." },
      ] },
      { t: "lance", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", aceitar: ["e1g1"], instrucao: "Cavalo e bispo já saíram. Proteja o rei: faça o roque." },
    ],
  },
  {
    id: "italiana", nivel: 5, titulo: "Abertura Italiana", resumo: "1.e4 e5 2.Cf3 Cc6 3.Bc4: o bispo mira f7.",
    passos: [
      { t: "texto", fen: pos("e4 e5 Nf3 Nc6 Bc4"), setas: [["c4", "f7"]], html: "<p>A <strong>Italiana</strong> é uma das aberturas mais antigas e uma ótima primeira escolha com as brancas. Ela segue os princípios ao pé da letra: peão no centro, cavalo atacando e5 e o bispo numa diagonal ativa, mirando <strong>f7</strong>, o ponto fraco das pretas (só o rei o defende).</p><p>O plano das brancas é preparar <strong>d4</strong> com c3 e jogar com calma: rocar, trazer a torre para e1 e manobrar.</p>" },
      { t: "linha", cor: "w", instrucao: "Jogue a linha principal com as brancas. As pretas respondem sozinhas.", lances: [
        ["e4", "Ocupa o centro e abre caminho para a dama e o bispo de f1."], ["e5", "As pretas também ocupam o centro."],
        ["Nf3", "Desenvolve e já ataca o peão de e5."], ["Nc6", "As pretas defendem o peão desenvolvendo uma peça."],
        ["Bc4", "A Italiana: o bispo mira f7."], ["Bc5", "As pretas copiam a ideia: o bispo delas mira f2."],
        ["c3", "Prepara d4 e abre uma casa (c2 ou b3) para o bispo recuar no futuro."], ["Nf6", "Desenvolve e ataca o peão de e4."],
        ["d3", "Defende e4 de forma sólida. É a versão calma e moderna da Italiana."], ["d6", "As pretas também protegem o centro."],
        ["O-O", "Rei em segurança."], ["O-O"],
        ["Re1", "A torre vai para a coluna do centro, apoiando e4 e um futuro d4."], ["a6", "Dá uma casa de fuga ao bispo, caso as brancas joguem b4."],
        ["Bb3", "O bispo recua por conta própria, saindo do alcance de ...Ca5 e ...b5."], ["Ba7"],
        ["h3", "Impede ...Bg4, que cravaria o cavalo de f3. Agora as brancas podem planejar d4 ou Cbd2–f1–g3."],
      ] },
      { t: "linha", cor: "w", sozinho: true, instrucao: "De memória: jogue a mesma linha sem os comentários.", lances: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 h3".split(" ") },
      { t: "escolha", fen: pos("e4 e5 Nf3 Nc6 Bc4 Bc5 c3"), pergunta: "Qual é a principal ideia de 4.c3?", opcoes: [
        { texto: "Preparar o avanço d4, para dominar o centro", certo: true, explica: "Isso. Com c3, o peão de d4 fica apoiado e pode ser trocado em d4 sem perder o centro." },
        { texto: "Atacar o bispo de c5", explica: "c3 não ataca o bispo. O objetivo é apoiar o avanço d4." },
        { texto: "Proteger o rei", explica: "O rei se protege com o roque. c3 prepara d4." },
      ] },
    ],
  },
  {
    id: "espanhola", nivel: 5, titulo: "Abertura Espanhola", resumo: "3.Bb5: pressão no defensor de e5.",
    passos: [
      { t: "texto", fen: pos("e4 e5 Nf3 Nc6 Bb5"), setas: [["b5", "c6"], ["f3", "e5"]], html: "<p>A <strong>Espanhola</strong> (ou Ruy López) é a abertura com 1.e4 e5 mais jogada pelos grandes mestres há mais de um século. Em vez de mirar f7, o bispo ataca o <strong>cavalo de c6</strong>, que é quem defende e5.</p><p>Não é uma ameaça imediata (se Bxc6 e Cxe5, as pretas recuperam o peão com ...Dd4), mas é uma <strong>pressão lenta e duradoura</strong> no centro das pretas.</p>" },
      { t: "linha", cor: "w", instrucao: "Jogue a linha principal da Espanhola com as brancas.", lances: [
        "e4", "e5", "Nf3", "Nc6",
        ["Bb5", "A Espanhola: o bispo pressiona o defensor de e5."], ["a6", "A pergunta clássica: o bispo troca ou recua?"],
        ["Ba4", "Recua, mantendo a pressão (trocar em c6 também é jogável)."], ["Nf6"],
        ["O-O", "As brancas não se preocupam com e4: se ...Cxe4, Te1 recupera o peão."], ["Be7", "As pretas desenvolvem e se preparam para rocar."],
        ["Re1", "Agora e4 está defendido, e as brancas já ameaçam Bxc6 seguido de Cxe5."], ["b5", "As pretas tiram o bispo da diagonal de c6."],
        ["Bb3", "O bispo se instala na diagonal a2–g8, ainda mirando f7."], ["d6"],
        ["c3", "De novo a ideia de preparar d4 (e de dar a casa c2 ao bispo)."], ["O-O"],
        ["h3", "Tira de jogo o ...Bg4. Esta é a posição-chave da Espanhola Fechada."],
      ] },
      { t: "linha", cor: "w", sozinho: true, instrucao: "De memória, sem comentários.", lances: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3".split(" ") },
      { t: "escolha", fen: pos("e4 e5 Nf3 Nc6 Bb5"), pergunta: "Qual peça preta o bispo de b5 incomoda?", opcoes: [
        { texto: "O cavalo de c6, que defende o peão de e5", certo: true, explica: "Isso. Se o cavalo sumir, o peão de e5 fica sem defensor." },
        { texto: "O rei, pela diagonal", explica: "A diagonal até e8 está fechada pelo peão de d7. O alvo é o cavalo de c6." },
        { texto: "O peão de a6", explica: "Não há peão em a6 ainda. O bispo pressiona o cavalo de c6." },
      ] },
    ],
  },
  {
    id: "gambito-dama", nivel: 5, titulo: "Gambito da Dama", resumo: "1.d4 d5 2.c4: brigar pelo centro.",
    passos: [
      { t: "texto", fen: pos("d4 d5 c4"), setas: [["c4", "d5"]], html: "<p>Com <strong>1.d4</strong>, a partida costuma ser mais estratégica. No <strong>Gambito da Dama</strong>, as brancas oferecem o peão de c4 para desviar o peão preto de d5 e ficar com o centro.</p><p>Não é um gambito de verdade: se as pretas capturarem com ...dxc4, as brancas recuperam o peão facilmente. O mais comum é as pretas recusarem com <strong>2...e6</strong>, segurando d5.</p>" },
      { t: "linha", cor: "w", instrucao: "Jogue o Gambito da Dama Recusado com as brancas.", lances: [
        ["d4", "Ocupa o centro; o peão já está protegido pela dama."], "d5",
        ["c4", "O Gambito da Dama: ataca d5 pelo lado."], ["e6", "Recusado: as pretas defendem d5 com outro peão."],
        ["Nc3", "Mais uma peça contra d5."], ["Nf6", "E mais um defensor."],
        ["Bg5", "Crava o cavalo de f6, que defende d5."], ["Be7", "Desfaz a cravada."],
        ["e3", "Abre o caminho do bispo de f1."], ["O-O"],
        ["Nf3", "Desenvolvimento normal."], ["Nbd7"],
        ["Rc1", "A torre vai para a coluna c, que pode se abrir depois de uma troca em c4 ou d5."], ["c6", "As pretas reforçam d5 e se preparam para liberar o jogo."],
        ["Bd3", "As brancas completam o desenvolvimento e logo rocam."],
      ] },
      { t: "linha", cor: "w", sozinho: true, instrucao: "De memória, sem comentários.", lances: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3".split(" ") },
      { t: "escolha", fen: pos("d4 d5 c4 e6 Nc3 Nf6 Bg5"), pergunta: "Por que 4.Bg5 é um bom lance?", opcoes: [
        { texto: "Crava o cavalo que defende d5", certo: true, explica: "Isso. O cavalo de f6 fica preso à dama e defende d5 com menos força." },
        { texto: "Ameaça capturar a dama de d8 agora", explica: "O cavalo está no caminho. A ideia é cravá-lo, enfraquecendo a defesa de d5." },
      ] },
    ],
  },
  {
    id: "londres", nivel: 5, titulo: "Sistema Londres", resumo: "Uma estrutura sólida contra quase tudo.",
    passos: [
      { t: "texto", fen: pos("d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3"), html: "<p>O <strong>Sistema Londres</strong> é popular entre iniciantes e entre campeões do mundo por um motivo prático: as brancas montam quase sempre <strong>a mesma estrutura</strong>, seja lá o que as pretas jogarem.</p><p>A receita: d4, <strong>Bf4</strong> (o bispo sai <strong>antes</strong> de e3, para não ficar preso), e3, Cf3, c3, Cbd2, Bd3 e roque. Os peões em c3, d4 e e3 formam uma base firme.</p>" },
      { t: "linha", cor: "w", instrucao: "Monte o Londres com as brancas.", lances: [
        "d4", "d5",
        ["Bf4", "A marca do Londres: o bispo sai antes do peão de e3."], "Nf6",
        ["e3", "Agora sim: o peão abre caminho para o outro bispo."], "e6",
        "Nf3", ["c5", "As pretas atacam o centro pelo lado, a resposta mais ativa."],
        ["c3", "Reforça d4. É a base da pirâmide c3–d4–e3."], "Nc6",
        ["Nbd2", "O cavalo vai para d2, e não c3, para não bloquear o peão de c3."], ["Bd6", "As pretas oferecem a troca de bispos."],
        ["Bg3", "O bispo recua e mantém a diagonal. Se ...Bxg3, hxg3 abre a coluna h para a torre."], "O-O",
        ["Bd3", "A estrutura está completa. Próximos passos: roque, Ce5 ou Dc2/e4."],
      ] },
      { t: "linha", cor: "w", sozinho: true, instrucao: "De memória, sem comentários.", lances: "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3".split(" ") },
      { t: "escolha", fen: pos("d4 d5"), pergunta: "No Londres, por que o bispo vai para f4 antes de jogar e3?", opcoes: [
        { texto: "Depois de e3, o peão bloquearia a saída do bispo", certo: true, explica: "Isso. Com o peão em e3, o bispo de c1 ficaria preso atrás dos próprios peões." },
        { texto: "Para atacar o peão de d5", explica: "De f4, o bispo não ataca d5. O motivo é não prendê-lo atrás de e3." },
      ] },
    ],
  },
  {
    id: "armadilhas", nivel: 5, titulo: "Armadilhas de abertura", resumo: "O mate de Légal e golpes rápidos.",
    passos: [
      { t: "texto", fen: pos("e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6"), setas: [["f3", "e5"]], html: "<p>Na abertura, quem esquece do desenvolvimento ou ganha material com pressa pode cair numa armadilha. A mais famosa é o <strong>mate de Légal</strong>, do século XVIII: as pretas cravaram o cavalo de f3 contra a dama e acham que ele não pode se mover.</p><p>Mas uma cravada contra a dama não é absoluta: o cavalo pode sair, se o ganho compensar a dama.</p>" },
      { t: "linha", cor: "w", instrucao: "Jogue a armadilha com as brancas.", lances: [
        "e4", "e5", "Nf3", "d6", "Bc4", ["Bg4", "O bispo crava o cavalo de f3 contra a dama de d1."],
        "Nc3", ["g6", "Um lance lento. As pretas não percebem o perigo."],
        ["Nxe5", "O cavalo ignora a cravada! Se as pretas capturarem a dama…"], ["Bxd1", "Ganância: as pretas pegam a dama."],
        ["Bxf7+", "Xeque, e o rei só tem uma casa."], "Ke7",
        ["Nd5#", "Mate! Três peças menores derrotam o exército inteiro."],
      ] },
      { t: "escolha", fen: pos("e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5"), pergunta: "Depois de 5.Cxe5, o que as pretas deveriam ter feito?", opcoes: [
        { texto: "Não capturar a dama: jogar ...dxe5 e aceitar a perda de um peão", certo: true, explica: "Isso. Depois de ...dxe5 Dxg4, as brancas ficam só com um peão a mais. Capturar a dama leva a mate em dois." },
        { texto: "Capturar a dama, que vale muito mais", explica: "Era a armadilha: depois de ...Bxd1, Bxf7+ Re7 e Cd5 é mate." },
      ] },
      { t: "puzzle", tema: "opening", qtd: 4 },
    ],
  },
  {
    id: "pastor", nivel: 6, cor: "b", titulo: "Defendendo o mate do pastor", resumo: "Dama e bispo contra f7.",
    passos: [
      { t: "texto", fen: pos("e4 e5 Bc4 Nc6 Qh5"), setas: [["h5", "f7"], ["c4", "f7"]], html: "<p>Agora você joga com as <strong>pretas</strong>. Nesta parte da trilha você aprende a responder às aberturas das brancas.</p><p>A primeira ameaça que todo iniciante enfrenta é o <strong>mate do pastor</strong>: a dama e o bispo atacam <strong>f7</strong> juntos, e Dxf7 é mate. A defesa é simples, mas precisa ser feita agora.</p>" },
      { t: "lance", fen: pos("e4 e5 Bc4 Nc6 Qh5"), aceitar: ["g7g6", "d8e7", "d8f6"], instrucao: "As brancas ameaçam Dxf7 mate. Defenda.", errado: "Isso não impede Dxf7. Bloqueie a diagonal da dama ou proteja f7 com a sua dama.", ok: "Defendido! (...g6 ainda ataca a dama, ganhando tempo.)" },
      { t: "linha", cor: "b", instrucao: "Jogue com as pretas: defenda e depois desenvolva atacando a dama.", lances: [
        "e4", "e5", "Bc4", ["Nc6", "Defende e5 e desenvolve."],
        ["Qh5", "A ameaça: Dxf7 mate."], ["g6", "Bloqueia a diagonal h5–f7 e ataca a dama."],
        ["Qf3", "A dama volta a mirar f7, pela outra diagonal."], ["Nf6", "Fecha a diagonal f3–f7 e desenvolve. Cuidado com ...Cd4?, que deixaria f7 sem proteção."],
        "Ne2", ["Bg7", "O bispo sai pela casa que ...g6 abriu."],
        "Nbc3", ["d6", "As pretas estão bem desenvolvidas, e a dama branca saiu cedo à toa."],
      ] },
      { t: "escolha", fen: pos("e4 e5 Bc4 Nc6 Qh5"), pergunta: "E se as pretas jogarem 3...Cf6, atacando a dama?", opcoes: [
        { texto: "Perdem: Dxf7 é mate", certo: true, explica: "Exato. O cavalo de f6 ataca a dama, mas não defende f7. Dxf7# encerra a partida." },
        { texto: "Ganham tempo atacando a dama", explica: "Não dá tempo: a dama captura em f7 com mate antes." },
      ] },
    ],
  },
  {
    id: "siciliana", nivel: 6, cor: "b", titulo: "Defesa Siciliana", resumo: "1.e4 c5: desequilíbrio e contra-ataque.",
    passos: [
      { t: "texto", fen: pos("e4 c5"), setas: [["c5", "d4"]], html: "<p>A <strong>Siciliana</strong> é a resposta mais popular a 1.e4. Em vez de copiar com 1...e5, as pretas controlam <strong>d4</strong> pelo lado, com o peão c.</p><p>Quando as brancas jogam d4, as pretas trocam (...cxd4) um peão lateral por um peão central. O resultado é uma posição <strong>desequilibrada</strong>: as brancas costumam atacar o rei, e as pretas contra-atacam pela coluna c, que ficou aberta.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a Siciliana Najdorf com as pretas.", lances: [
        "e4", ["c5", "A Siciliana."], "Nf3", ["d6", "Controla e5 e prepara ...Cf6."],
        "d4", ["cxd4", "Troca o peão c pelo peão central d."], "Nxd4", ["Nf6", "Ataca e4, forçando as brancas a defendê-lo."],
        ["Nc3", "Defende e4."], ["a6", "A Najdorf, a favorita de Fischer e Kasparov: controla b5 e prepara ...e5 e ...b5."],
        "Be2", ["e5", "Expulsa o cavalo do centro."], "Nb3", ["Be7", "Desenvolve e prepara o roque."],
        "O-O", ["O-O", "Rei seguro. As pretas pensam em ...Be6, ...Cbd7 e ...b5."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O".split(" ") },
      { t: "escolha", fen: pos("e4 c5 Nf3 d6 d4 cxd4"), pergunta: "O que as pretas ganharam com 3...cxd4?", opcoes: [
        { texto: "Trocaram um peão lateral (c) por um central (d) e abriram a coluna c", certo: true, explica: "Isso. As pretas ficam com dois peões centrais contra um e usam a coluna c para o contra-ataque." },
        { texto: "Um peão a mais", explica: "As brancas recuperam o peão com Cxd4. O ganho é estrutural: dois peões centrais e a coluna c." },
      ] },
    ],
  },
  {
    id: "francesa", nivel: 6, cor: "b", titulo: "Defesa Francesa", resumo: "1.e4 e6: sólida, e depois ...c5.",
    passos: [
      { t: "texto", fen: pos("e4 e6 d4 d5"), setas: [["d5", "e4"]], html: "<p>Na <strong>Francesa</strong>, as pretas preparam ...d5 com 1...e6 e desafiam o peão de e4. Ela é sólida, mas tem um custo: o bispo de c8 fica preso atrás dos peões.</p><p>Quando as brancas avançam e5, a estrutura se fecha. A regra é <strong>atacar a base da corrente de peões</strong>: as pretas golpeiam d4 com <strong>...c5</strong>, e às vezes também com ...f6.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a Francesa Clássica com as pretas.", lances: [
        "e4", ["e6", "A Francesa: prepara ...d5."], "d4", ["d5", "Desafia o peão de e4."],
        "Nc3", ["Nf6", "Ataca e4 mais uma vez."], ["e5", "As brancas avançam e fecham o centro."], ["Nfd7", "O cavalo recua, pronto para apoiar ...c5."],
        ["f4", "As brancas reforçam e5."], ["c5", "Golpeia a base da corrente: o peão de d4."],
        "Nf3", ["Nc6", "Mais pressão em d4."], "Be3", ["cxd4", "Troca no centro…"],
        "Nxd4", ["Bc5", "…e o bispo ataca o cavalo de d4. As pretas têm bom contrajogo."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3 cxd4 Nxd4 Bc5".split(" ") },
      { t: "escolha", fen: pos("e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4"), pergunta: "Com o centro fechado, onde as pretas devem atacar?", opcoes: [
        { texto: "No peão de d4, a base da corrente, com ...c5", certo: true, explica: "Isso. Atacar a base enfraquece toda a corrente d4–e5." },
        { texto: "No peão de e5, a ponta da corrente", explica: "e5 é bem apoiado. O golpe que funciona é na base: ...c5 contra d4." },
        { texto: "Em nenhum lugar: esperar", explica: "Esperar deixa as brancas atacarem à vontade. As pretas precisam de ...c5." },
      ] },
    ],
  },
  {
    id: "caro-kann", nivel: 6, cor: "b", titulo: "Defesa Caro-Kann", resumo: "1.e4 c6: sólida, e o bispo sai livre.",
    passos: [
      { t: "texto", fen: pos("e4 c6 d4 d5"), setas: [["c8", "f5"]], html: "<p>A <strong>Caro-Kann</strong> também prepara ...d5, mas com 1...c6. A vantagem sobre a Francesa: a diagonal do bispo de c8 continua aberta, e ele sai para <strong>f5</strong> antes de ...e6.</p><p>É uma defesa sólida, com poucas fraquezas, muito usada por quem prefere posições seguras.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a variante Clássica da Caro-Kann com as pretas.", lances: [
        "e4", ["c6", "A Caro-Kann: prepara ...d5."], "d4", ["d5", "Desafia e4."],
        "Nc3", ["dxe4", "Troca no centro."], "Nxe4", ["Bf5", "A ideia de toda a defesa: o bispo sai antes de ...e6 e ataca o cavalo."],
        "Ng3", ["Bg6", "O bispo recua e continua na diagonal boa."],
        ["h4", "As brancas ameaçam h5, prendendo o bispo."], ["h6", "Dá uma casa de recuo (h7) ao bispo."],
        "Nf3", ["Nd7", "Controla e5 e evita Ce5."], "h5", ["Bh7", "O bispo se esconde em h7."],
        ["Bd3", "As brancas oferecem a troca de bispos."], ["Bxd3", "As pretas trocam o bispo, que já fez seu papel."],
        "Qxd3", ["e6", "Agora sim ...e6. Estrutura sólida, e as pretas seguem com ...Cgf6 e ...Be7."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6".split(" ") },
      { t: "escolha", fen: pos("e4 c6 d4 d5 Nc3 dxe4 Nxe4"), pergunta: "Por que a Caro-Kann joga ...Bf5 antes de ...e6?", opcoes: [
        { texto: "Para o bispo não ficar preso atrás do peão de e6", certo: true, explica: "Isso. É a grande diferença em relação à Francesa." },
        { texto: "Para atacar o rei branco", explica: "O motivo é outro: depois de ...e6, o bispo de c8 ficaria preso." },
      ] },
    ],
  },
  {
    id: "escandinava", nivel: 6, cor: "b", titulo: "Defesa Escandinava", resumo: "1.e4 d5: desafio direto.",
    passos: [
      { t: "texto", fen: pos("e4 d5"), setas: [["d5", "e4"]], html: "<p>A <strong>Escandinava</strong> desafia e4 no primeiro lance. É fácil de aprender: a estrutura das pretas fica parecida em quase todas as partidas.</p><p>O ponto de atenção: a dama sai cedo e leva um ataque (Cc3). A casa mais segura para ela é <strong>a5</strong>, de onde ela crava e pressiona as peças brancas.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a Escandinava com as pretas.", lances: [
        "e4", ["d5", "A Escandinava."], "exd5", ["Qxd5", "A dama recupera o peão."],
        ["Nc3", "Desenvolve atacando a dama."], ["Qa5", "A dama vai para a5, longe do alcance das peças brancas."],
        "d4", ["Nf6", "Desenvolve."], "Nf3", ["c6", "Dá uma casa de recuo à dama (c7 ou d8) e controla b5 e d5."],
        "Bc4", ["Bf5", "O bispo sai antes de ...e6, como na Caro-Kann."],
        ["Bd2", "As brancas ameaçam Cd5, descobrindo um ataque na dama."], ["e6", "Estrutura sólida: as pretas seguem com ...Cbd7, ...Bb4 e roque."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6".split(" ") },
    ],
  },
  {
    id: "eslava", nivel: 6, cor: "b", titulo: "Defesa Eslava", resumo: "Contra 1.d4: segurar d5 com ...c6.",
    passos: [
      { t: "texto", fen: pos("d4 d5 c4 c6"), setas: [["c6", "d5"]], html: "<p>Contra <strong>1.d4 d5 2.c4</strong>, a <strong>Eslava</strong> defende d5 com 2...c6. Como na Caro-Kann, o bispo de c8 continua livre para sair antes de ...e6.</p><p>Uma ideia comum é capturar em c4 (...dxc4) no momento certo e desenvolver o bispo para f5 com ganho de tempo.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a Eslava com as pretas.", lances: [
        "d4", "d5", ["c4", "O Gambito da Dama."], ["c6", "A Eslava: defende d5 com o peão c."],
        "Nf3", "Nf6", "Nc3", ["dxc4", "Agora as pretas capturam: as brancas gastam tempo para recuperar o peão."],
        ["a4", "Impede ...b5, que defenderia o peão."], ["Bf5", "O bispo sai antes de ...e6."],
        "e3", "e6", ["Bxc4", "As brancas recuperam o peão."], ["Bb4", "Crava o cavalo de c3."],
        "O-O", ["O-O", "Desenvolvimento completo e posição sólida."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O".split(" ") },
    ],
  },
  {
    id: "india-rei", nivel: 6, cor: "b", titulo: "Índia do Rei", resumo: "Contra 1.d4: deixar o centro e golpear depois.",
    passos: [
      { t: "texto", fen: pos("d4 Nf6 c4 g6 Nc3 Bg7 e4 d6"), setas: [["g7", "d4"]], html: "<p>A <strong>Índia do Rei</strong> é uma defesa de contra-ataque. As pretas deixam as brancas montarem um grande centro (c4, d4, e4) e, enquanto isso, desenvolvem o bispo em <strong>g7</strong> e rocam.</p><p>Depois, golpeiam o centro com <strong>...e5</strong> (ou ...c5). Se as brancas fecharem com d5, as pretas atacam no lado do rei com ...f5.</p>" },
      { t: "linha", cor: "b", instrucao: "Jogue a Índia do Rei Clássica com as pretas.", lances: [
        "d4", ["Nf6", "Controla e4 sem comprometer os peões."], "c4", ["g6", "Prepara o bispo em g7."],
        "Nc3", ["Bg7", "O bispo na grande diagonal, mirando d4."], ["e4", "As brancas montam o centro inteiro."], ["d6", "Prepara ...e5."],
        "Nf3", ["O-O", "Primeiro o rei em segurança."], "Be2", ["e5", "O golpe no centro."],
        "O-O", ["Nc6", "Mais pressão em d4."], ["d5", "As brancas fecham o centro e ganham espaço."],
        ["Ne7", "O cavalo vai para o lado do rei, preparando ...Cd7 e ...f5."],
      ] },
      { t: "linha", cor: "b", sozinho: true, instrucao: "De memória, sem comentários.", lances: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7".split(" ") },
      { t: "escolha", fen: pos("d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7"), pergunta: "O centro está fechado. Qual é o plano das pretas?", opcoes: [
        { texto: "Atacar no lado do rei com ...Cd7 (ou ...Ce8) e ...f5", certo: true, explica: "Isso. Com o centro fechado, cada lado ataca onde os peões apontam: as pretas no lado do rei, as brancas no lado da dama." },
        { texto: "Atacar no lado da dama com ...b5", explica: "Ali as brancas são mais fortes. O plano clássico das pretas é ...f5, no lado do rei." },
      ] },
    ],
  },
  {
    id: "defender", nivel: 6, cor: "b", titulo: "Como defender", resumo: "Achar a ameaça antes de jogar.",
    passos: [
      { t: "texto", fen: INICIAL, html: "<p>Defender bem começa com um hábito: antes de cada lance, pergunte <strong>\"o que o adversário quer fazer?\"</strong>. Olhe os xeques, as capturas e as ameaças dele.</p><p>Quando houver uma ameaça, procure, nesta ordem:</p><p>1. Um <strong>contra-ataque</strong> mais forte (um xeque ou uma ameaça maior).</p><p>2. Tirar a peça atacada para uma casa segura, <strong>defendê-la</strong> ou <strong>bloquear</strong> o ataque.</p><p>3. Trocar a peça que ataca.</p>" },
      { t: "puzzle", tema: "defensiveMove", qtd: 4 },
    ],
  },
];

export const licao = (id) => LICOES.find((l) => l.id === id);
