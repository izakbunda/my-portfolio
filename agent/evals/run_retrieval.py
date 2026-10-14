"""Retrieval eval for Izak AI.

Runs every question in golden.yaml through the same search the agent uses and
reports where the first relevant chunk landed.

    cd agent && venv/bin/python -m evals.run_retrieval [--k 6] [--min-mrr 0.7]
"""
import argparse
import sys
from pathlib import Path

import yaml

from app.retriever import search, MATCH_COUNT

GOLDEN = Path(__file__).parent / "golden.yaml"


def first_hit_rank(rows: list[dict], expect: list[str]) -> int | None:
    needles = [e.lower() for e in expect]
    for rank, row in enumerate(rows, start=1):
        content = row["content"].lower()
        if any(n in content for n in needles):
            return rank
    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=MATCH_COUNT, help="chunks the agent sees")
    parser.add_argument("--depth", type=int, default=10, help="how deep to look for the hit")
    parser.add_argument("--min-mrr", type=float, default=0.0, help="exit non-zero below this MRR")
    args = parser.parse_args()

    cases = yaml.safe_load(GOLDEN.read_text())
    ranks = []
    for case in cases:
        rows = search(case["question"], match_count=args.depth)
        rank = first_hit_rank(rows, case["expect"])
        ranks.append(rank)
        mark = "✓" if rank == 1 else ("~" if rank and rank <= args.k else "✗")
        top = rows[0]["content"][:70].replace("\n", " ") if rows else "—"
        print(f"{mark} rank={rank or '-':>2}  {case['question']:<45} top: {top}")

    n = len(ranks)
    hit1 = sum(r == 1 for r in ranks) / n
    hitk = sum(r is not None and r <= args.k for r in ranks) / n
    mrr = sum(1 / r for r in ranks if r) / n
    print(f"\n{n} cases   hit@1 {hit1:.0%}   hit@{args.k} {hitk:.0%}   MRR {mrr:.3f}")

    if mrr < args.min_mrr:
        sys.exit(1)


if __name__ == "__main__":
    main()
