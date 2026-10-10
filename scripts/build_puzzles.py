"""Seleciona puzzles do banco aberto do Lichess (CC0) e grava data/puzzles.json.

Lê o arquivo compactado em streaming e para assim que as cotas enchem: o banco tem
milhões de puzzles em ordem aleatória, e o site precisa de alguns milhares.

- "adaptativo": faixa ampla de dificuldade (400 a 2499), para o modo que sobe e desce
  conforme o acerto;
- "temas": conjuntos por tema, de nível iniciante/intermediário, para as lições.

Só entram puzzles bem avaliados e com dificuldade estável (muito jogados, boa
aprovação, desvio de rating baixo).

    python3 scripts/build_puzzles.py
"""
import csv
import io
import json
import urllib.request
from pathlib import Path

import zstandard

URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst"
OUT = Path(__file__).resolve().parent.parent / "data" / "puzzles.json"

FAIXAS = range(400, 2500, 100)
POR_FAIXA = 100
# tema do Lichess -> (quantidade, rating máximo)
TEMAS = {
    "mateIn1": (60, 1200),
    "mateIn2": (40, 1600),
    "backRankMate": (30, 1500),
    "hangingPiece": (40, 1100),
    "fork": (50, 1500),
    "pin": (50, 1500),
    "skewer": (30, 1600),
    "discoveredAttack": (30, 1600),
    "doubleCheck": (20, 1700),
    "promotion": (25, 1500),
    "pawnEndgame": (25, 1600),
}


def bom(r):
    return int(r["RatingDeviation"]) <= 80 and int(r["Popularity"]) >= 85 and int(r["NbPlays"]) >= 300


def compacto(r):
    temas = [t for t in r["Themes"].split() if t in TEMAS or t in ("mate", "short", "long", "endgame", "middlegame", "opening")]
    return [r["PuzzleId"], r["FEN"], r["Moves"], int(r["Rating"]), " ".join(temas)]


def main():
    adaptativo = {f: [] for f in FAIXAS}
    por_tema = {t: [] for t in TEMAS}
    usados = set()
    lidos = 0
    req = urllib.request.Request(URL, headers={"User-Agent": "TrilhaDoXadrez/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resposta:
        leitor = zstandard.ZstdDecompressor().stream_reader(resposta)
        texto = io.TextIOWrapper(leitor, encoding="utf-8")
        for r in csv.DictReader(texto):
            lidos += 1
            if not bom(r):
                continue
            rating = int(r["Rating"])
            temas = set(r["Themes"].split())
            # primeiro as cotas por tema (mais raras), depois a faixa de dificuldade
            for tema, (qtd, maximo) in TEMAS.items():
                if tema in temas and rating <= maximo and len(por_tema[tema]) < qtd and r["PuzzleId"] not in usados:
                    por_tema[tema].append(compacto(r))
                    usados.add(r["PuzzleId"])
                    break
            else:
                faixa = rating // 100 * 100
                if faixa in adaptativo and len(adaptativo[faixa]) < POR_FAIXA:
                    adaptativo[faixa].append(compacto(r))
                    usados.add(r["PuzzleId"])
            cheio = all(len(v) >= POR_FAIXA for v in adaptativo.values()) and all(len(por_tema[t]) >= q for t, (q, _) in TEMAS.items())
            if cheio or lidos >= 1_500_000:
                break

    payload = {
        "fonte": "Lichess puzzle database (CC0), database.lichess.org",
        "campos": ["id", "fen", "lances", "rating", "temas"],
        "adaptativo": sorted((p for v in adaptativo.values() for p in v), key=lambda p: p[3]),
        "temas": por_tema,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{lidos} puzzles lidos -> {len(payload['adaptativo'])} no adaptativo, "
          f"{sum(len(v) for v in por_tema.values())} por tema -> {OUT} ({OUT.stat().st_size // 1024} KB)")
    for f, v in adaptativo.items():
        if len(v) < POR_FAIXA:
            print(f"  faixa {f}: só {len(v)}")
    for t, v in por_tema.items():
        if len(v) < TEMAS[t][0]:
            print(f"  tema {t}: só {len(v)}")


if __name__ == "__main__":
    main()
