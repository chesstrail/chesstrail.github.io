// A trilha: 4 níveis, 22 lições. Cada lição é uma sequência de passos.
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
//             ("mate" ou "promover") dentro de um limite de lances

const VAZIO = "8/8/8/8/8/8/8/8 w - - 0 1";
const INICIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const NIVEIS = [
  { n: 1, titulo: "Primeiros passos", resumo: "O tabuleiro e como cada peça se move." },
  { n: 2, titulo: "Xeque e xeque-mate", resumo: "Atacar o rei, defender o seu e as regras especiais." },
  { n: 3, titulo: "Tática", resumo: "Os golpes que ganham peças e partidas." },
  { n: 4, titulo: "Finais e aberturas", resumo: "Dar mate com poucas peças e começar bem a partida." },
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
    id: "abertura", nivel: 4, titulo: "Princípios de abertura", resumo: "Centro, desenvolvimento e roque.",
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
];

export const licao = (id) => LICOES.find((l) => l.id === id);
