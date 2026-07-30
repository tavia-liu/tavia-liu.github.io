---
title: "CaP Experiments"
date: 2026-07-29
description: "How GRF environment seeds change fixed scripted-policy outcomes."
tags: []
reading_time: ""
permalink: /blog/cap-experiments/
---

## What the environment seed changes

The seed does not move the initial ball or players in `academy_3_vs_1_with_keeper`. It selects hidden engine state and future random draws.

| Seed-controlled part | Meaning |
|---|---|
| Team processing order | Unless explicitly configured, even seeds use the normal internal order and odd seeds reverse it for the whole episode. |
| Animation phase | Players can start at different hidden animation frames not present in raw observations. |
| Ball contacts | Pass, trap, and first-touch direction or height can vary. |
| Shots | Direction, height, effective power, spin, and curve can vary at physical contact. |
| Saves and collisions | Deflections, rebounds, and body-ball collision rotation can vary. |
| AI behavior | Some AI shots, set pieces, and goalkeeper distributions use random choices. |
| Rendering | Lighting, pitch details, adboards, and camera motion can vary. |


## Honest scripted policies

### Run 075: far-post poacher

1. Player 1 aims for five steps and passes to player 2.
2. Player 2 uses dribble to collect the pass, runs diagonally toward goal, and shoots at `x >= 0.74`.
3. Player 3 runs to the opposite post at approximately `(0.93, ±0.06)`.
4. After a shot, player 3 chases a predicted rebound and shoots if he gains possession.

Run 074 first measured this policy at `86/100`. Run 075 repeated the exact policy on 300 new seeds and obtained `240/300 = 80%`, showing that the earlier 86% estimate contained substantial sample noise.


### Where Run 075 works and fails

| Outcome after the first shot | Episodes |
|---|---:|
| Win before any recorded regain | 223 |
| Win after a regain | 17 |
| Loss after a regain | 54 |
| Loss without a regain | 6 |

### Run 077: intended goalkeeper-read switch

Run 077 was designed to pass from player 2 to the far-post poacher when the goalkeeper moved toward the shooter; otherwise it would shoot.

It scored `87/100`, but trace inspection found that the intended switch never executed. Every episode contained only the initial pass from player 1; player 2 issued zero switch passes. Therefore the 87% batch does not validate the goalkeeper-read idea and is most plausibly another small-sample result from the underlying Run 075 behavior.

## Same scripted policy, opposite result

``football/codex_gpt_sol/academy_3_vs_1_with_keeper/experiments/self_evolve_001/run_084/evidence_same_obs``

We also bypassed learning and ran one fixed scripted poacher leaf:

`receiver=2`, `aim_limit=5`, `dribble=False`, `finish=shoot`

| Outcome | Seed | Length |
|---|---:|---:|
| Loss | `240431165` | 52 steps |
| Goal | `2113415427` | 31 steps |

All numeric fields in all three agents' raw observations were byte-identical before actions `t=0...18`. At `t=19`.

At the later physical shot contact, the raw vertical ball-direction component was `0.06717` in the loss and `0.18734` in the goal. One shot was deflected; the other passed the goalkeeper. The result changed because of hidden contact and shot randomness. Obs is exact the same, so it's hard to learn based on obs to decide what's the next action.
