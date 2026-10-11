# Trilha do Xadrez

Site gratuito para aprender xadrez do zero: 39 lições guiadas em 6 níveis (do movimento das peças a tática, finais, aberturas e defesas), puzzles táticos que se ajustam ao seu nível e partidas contra o computador (8 níveis) com revisão dos erros. O progresso fica salvo no navegador (com um código para levar a outro aparelho), as aberturas e os puzzles errados voltam numa revisão espaçada, e o site pode ser instalado no celular e usado sem internet.

Site estático, sem build: abra `index.html` por um servidor local (`python3 -m http.server`).

- `js/lessons.js`: conteúdo das lições
- `sw.js`: lista dos arquivos guardados para uso offline (inclua ali arquivos novos)
- `scripts/build_puzzles.py`: gera `data/puzzles.json` a partir do banco aberto de puzzles do Lichess

Créditos: peças cburnett (GPLv2+), Stockfish 19 (GPL-3), chess.js (BSD-2), puzzles do Lichess (CC0). Código sob GPL-3.
