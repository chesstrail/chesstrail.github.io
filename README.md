# Trilha do Xadrez

Site gratuito para aprender xadrez do zero: 22 lições guiadas em 4 níveis, puzzles táticos que se ajustam ao seu nível e partidas contra o computador (8 níveis) com revisão dos erros. O progresso fica salvo no navegador.

Site estático, sem build: abra `index.html` por um servidor local (`python3 -m http.server`).

- `js/lessons.js`: conteúdo das lições
- `scripts/build_puzzles.py`: gera `data/puzzles.json` a partir do banco aberto de puzzles do Lichess

Créditos: peças cburnett (GPLv2+), Stockfish 19 (GPL-3), chess.js (BSD-2), puzzles do Lichess (CC0). Código sob GPL-3.
