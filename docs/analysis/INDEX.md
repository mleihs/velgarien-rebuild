---
title: "Analysis Index"
id: analysis-index
lang: en
type: analysis
status: active
tags: [analysis, index, balance, epochs]
---

# Epoch Analysis Reports

Game balance analysis from deterministic epoch simulations. Each report covers a specific player count with 50 complete epoch matches.

## Reports

| Report | Player Count | Games | Date | Key Findings |
|--------|-------------|-------|------|--------------|
| [Cross-Reference Analysis](epoch-cross-reference-analysis.md) | 2-5P | 200 | 2026-03-02 | Post v2.1 balance tuning. Nash equilibrium convergence. |
| [2-Player Analysis](epoch-2p-analysis.md) | 2P | 50 | 2026-02-28 | Duel dynamics, guardian effectiveness, spy value. |
| [3-Player Analysis](epoch-3p-analysis.md) | 3P | 50 | 2026-02-28 | Kingmaker scenarios, alliance/betrayal patterns. |
| [4-Player Analysis](epoch-4p-analysis.md) | 4P | 50 | 2026-02-28 | Team formation, diplomatic scoring impact. |
| [5-Player Analysis](epoch-5p-analysis.md) | 5P | 50 | 2026-02-28 | Full roster, strategy distribution, win rate variance. |
| [Playthrough Verification](epoch-playthrough.md) | 2P | 1 | 2026-02-28 | Bug fix verification via live API playthrough. |

## Methodology

All simulations run via `scripts/epoch_sim_lib.py` with deterministic seeding. Each game plays through full epoch lifecycle (lobby → foundation → competition → reckoning → completed) with strategy-weighted operative deployment and alliance decisions.
