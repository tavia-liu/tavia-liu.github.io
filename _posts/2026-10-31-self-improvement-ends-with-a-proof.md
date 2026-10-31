---
title: "Recursive Self-Improvement for Multi-Agent Coordination: What Ten Rounds Discover in Overcooked and Football"
date: 2026-10-31
description: "A language model writes a joint controller, runs it, reads the trace, and rewrites it. In Overcooked the loop discovers coordination that passes trained MARL; in Google Research Football it strips coordination out and, given a fixed seed, memorizes it. The round-by-round record shows how."
tags: [recursive self-improvement, agents, code as policy, multi agent systems]
reading_time: "14 min"
permalink: /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

Multi-agent coordination is usually learned: a MARL algorithm samples millions of joint rollouts and shapes a policy whose agents divide labor, stagger their cycles, and hand objects to each other. This post asks whether a language model can discover the same coordination by recursive self-improvement instead, writing the joint controller as a program, watching it run, and rewriting it, with no gradient and no change to its weights. We ran that loop for a hard ten rounds on five Overcooked layouts with two frontier models, and on seven Google Research Football scenarios with one under a softer budget, and we kept every proposal, trace, and search script.

The answer depends on the environment, and the rounds show why. In Overcooked, both models pass the PPO self-play reference on every layout and the MATCHA reference on every layout but one, and on three of five layouts they finish at exactly the same score. They get there by the same route: the coordination they discover is a joint schedule, and the last rounds go to writing a planner that finds it. In football, where every kick is a random draw, the loop stays below both IPPO and MAPPO on every scenario, each round removes coordination from the policy rather than adding it, and when we pinned the seed the loop memorized the seed instead of learning to play.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}" alt="Five panels, one per Overcooked layout, showing the running best sparse return over ten rounds for Fable 5 and GPT 6.1 Sol, with PPO and MATCHA reference lines and light dots for each single round's raw score" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 1.</strong> Running best sparse return over ten self-evolution rounds on five Overcooked layouts. Solid lines are the frontier; light dots are the raw score of each round. Dashed lines are PPO self-play scores from Gessler et al. (2025); dotted lines are MATCHA returns after one million transitions (Ye et al., under review). Cramped Room, Asymmetric Advantages, and Forced Coordination end at identical scores for the two models; Coordination Ring and Counter Circuit end one soup apart.</figcaption>
</figure>

## The loop, the benchmarks, and the experiments

The loop is the simplest form of recursive self-improvement. The agent writes `policy.py`, a function from the joint observation to a joint action for all controlled agents; runs one official evaluation; reads the metrics, the step-level trace, the failure summary, and the rendered rollout; and writes the next policy. Each round also records a proposal with a hypothesis and an abandon criterion, so the strategy history is readable afterward. Ten rounds, then stop. The agent may build any offline tooling it wants, and both models did, but only the official harness calls count and the model weights never change.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}" alt="Four-step loop: the language model writes a policy, the harness runs one official evaluation, the run yields score, trace, failure summary, and video, and the model reads them and writes the next policy, ten times" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> The loop. Write a policy, run it once, read what happened, write the next one. Ten rounds; the model weights never change.</figcaption>
</figure>

**Overcooked** (Carroll et al., 2019) is a two-chef kitchen: collect onions, fill a pot, start it cooking, plate the soup, deliver. The five classic layouts each force a different coordination problem, from a shared corridor to a wall that splits the kitchen so onions cannot cross. Dynamics are deterministic; we score sparse return at twenty points per soup over a 400-step episode with seed 0. **Google Research Football** (Kurach et al., 2020) is a physics engine with scripted opponents; we use seven academy and small-sided scenarios with two to ten controlled players, evaluated on fresh random seeds every round. The football budget was softer than Overcooked's: four scenarios were asked for ten rounds or an early stop on target with no hard cutoff, and the pass-and-shoot tasks and Three vs One were asked to keep going until a replicated 100 percent, so scenarios ran 8 to 88 rounds. Each round's evaluation rolls out 25 to 100 fresh seeds, and the agent decides how many; a leader is promoted only after an exact replication on a second batch.

We ran Codex with GPT 6.1 Sol and Claude Code with Fable 5 on all five Overcooked layouts, each from an empty folder, and Fable 5 on the football scenarios. The PPO reference for Overcooked is self-play PPO from OvercookedV2 (Gessler et al., 2025); the MATCHA reference is the MATCHA training curve after one million transitions; the football references are IPPO and MAPPO (Yu et al., 2022) as measured by the Song et al. (2023) GRF benchmark.

## Results

In Overcooked both models finish above the PPO reference on all five layouts and above MATCHA on four, and their frontiers meet at the same score on Cramped Room, Asymmetric Advantages, and Forced Coordination. GPT 6.1 Sol reaches the frontier later from lower starts, including two layouts whose first policy scored zero, and ends one soup higher on Coordination Ring and Counter Circuit.

| Layout | PPO self-play | MATCHA, 1M transitions | Fable 5 (round reached) | GPT 6.1 Sol (round reached) |
| --- | ---: | ---: | ---: | ---: |
| Cramped Room | 259 | 238 | **260** (2) | **260** (6) |
| Asymmetric Advantages | 278 | 499 | **500** (9) | **500** (8) |
| Coordination Ring | 214 | 305 | 340 (4) | **360** (6) |
| Forced Coordination | 199 | 240 | **340** (7) | **340** (6) |
| Counter Circuit | 163 | 20 | 260 (9) | **280** (8) |

In football the code policy ends below both IPPO and MAPPO on all seven scenarios. The gap is small on the two-attacker tasks and on Three vs One, and large wherever more players or a full match are involved.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-rsi-rounds.png' | relative_url }}?v=20261031c" alt="Seven panels, one per football scenario, showing each round's measured win rate as a dot sized by episodes, the frontier of confirmed rounds, IPPO and MAPPO reference lines, policy-class-change markers on Pass and Shoot, and excluded seed-reading rounds on Three vs One" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Round-by-round self-evolution in football, the counterpart of Figure 1. Each dot is one round's measured win rate, sized by the number of episodes in that evaluation; the frontier advances only on rounds confirmed at the scenario's validation size, 100 episodes, or 300 on Three vs One, pooling an exact replication with the round it replicates. Football had no hard round cap, so scenarios ran 8 to 88 rounds. Reference lines are IPPO and MAPPO from Song et al. 2023. The two triangles on Pass and Shoot mark the rounds where the agent changed policy class: a scripted prefix with a PPO subgame, then a trained rMAPPO network. The crosses on Three vs One are three rounds that scored 100 percent by reading the evaluator seed; they are excluded from the frontier.</figcaption>
</figure>

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031c" alt="Grouped bar chart of success rate on seven Google Research Football scenarios: IPPO and MAPPO from Song et al. 2023 versus the self-evolved Fable 5 code policy" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> Final success rate under fresh random seeds. IPPO and MAPPO values are from Table 3 of Song et al. 2023: the maximum mean win rate during training, after 10 to 30 million environment steps on academy scenarios and 100 million on Five vs Five. Code-policy values are the frontier policy of each self-evolution run, measured on 100 or more fresh seeds.</figcaption>
</figure>

| Scenario | IPPO, mean (SD) | MAPPO, mean (SD) | Code policy, Fable 5 |
| --- | ---: | ---: | ---: |
| Pass and Shoot | 93.7 (0.9) | 92.9 (2.6) | 74 |
| Run, Pass and Shoot | 73.7 (13.4) | 66.0 (6.3) | 72 |
| Three vs One | 91.7 (3.1) | 90.0 (3.2) | 80 |
| Counterattack Easy | 85.7 (6.6) | 88.9 (6.6) | 65 |
| Counterattack Hard | 71.6 (4.9) | 81.3 (9.6) | 29 |
| Corner | 50.4 (10.3) | 50.5 (7.2) | 41 |
| Five vs Five | 99.1 (0.6) | 96.0 (1.8) | 65 |

## Analysis

### Overcooked: the loop turns coordination into a schedule

Overcooked is a small, fully observed, deterministic two-agent game. One rollout is the whole environment, so every trace diagnosis is a fact about the task, and every edit that saves a tick saves it on every future evaluation. The ten proposals for any layout, from either model, follow the same three rungs. The first is reactive rules: each chef gets a priority list, fetch an onion if a pot needs one, grab a dish if a soup is ready. Coordination at this rung is accidental. It scores between zero and respectable and produces both failures behind every zero in Figure 1: the swap deadlock, where two agents in a one-tile corridor each decide the other should yield, and a wrong map fact. GPT's first Coordination Ring policy aimed at the wrong onion station and executed 395 interactions that did nothing.

The second rung is explicit division of labor. The agent reads the trace, finds one chef idling while the other walks, and assigns roles: a loader and a server, or a supplier on the dispenser side and a courier on the pot side. It then adds staging, onions placed on a counter during the cook timer so the next batch starts the tick the pot clears. Counters become asynchronous buffers between the two agents, a producer-consumer protocol over shared memory. Fable's Forced Coordination policy names its counters a lane, a buffer, and a stage slot, each with its own rule for what may be placed there. Most of the score arrives on this rung.

The third rung is the one that makes the two models converge. The agent stops writing coordination rules and writes a planner. In all ten experiments the final frontier policy is an open-loop joint schedule, a fixed sequence of actions for both agents with a per-tick guard that checks the live state against the expected state and falls back to the reactive controller on mismatch. In eight of the ten, a search program the agent wrote produced the schedule. GPT built a compact model of each layout, validated it against the official traces, and ran beam search over joint primitive actions; its Coordination Ring search covered 1.49 million states. Fable ran a 36,000-rollout coordinate descent in Asymmetric Advantages and about 830,000 plan mutations in Counter Circuit. Once both models are searching the same deterministic transition system, the ceiling belongs to the environment, and the scores match. The discovered coordination is centralized in design and free to decentralize: Fable's tenth Cramped Room run replaced its joint controller with two independent controllers that recompute the same plan from shared state, and the joint action sequence matched tick for tick. It is also cheap: GPT 6.1 Sol finished each layout's ten rounds in 16 to 30 minutes of wall clock, because most of the work is the planner's.

### Overcooked: the failure that costs rounds is phase-locking, and the rounds after convergence go to proofs

Deadlocks are loud: a zero, fixed in one round. The quiet failure that consumed the most rounds is what Fable called a phase attractor and GPT called synchronized pots. Every layout has two pots and a twenty-tick cook timer, and the throughput-optimal schedule staggers them so one cooks while the other loads. Reactive rules respond to whichever pot is emptier, which pulls both pots into the same phase, so both soups come ready at once and one waits. Fable's Coordination Ring baseline settled into a 24.5-tick delivery gap this way; GPT's Counter Circuit runs delivered in pairs eight ticks apart with 48-tick gaps between pairs; Fable's Asymmetric Advantages runs oscillated between 460 and 480 for eight rounds because every gating rule it added moved the attractor to the gate's own boundary. Phase is a global property and each reactive rule sees local state, so no rule can hold two cycles apart. The fix in every case was to precompute the stagger.

Once the frontier flattens, the remaining rounds go to proving that it is the ceiling. Sometimes the proof holds: Fable's final Cramped Room run is an exhaustive BFS that certifies a fourteenth pickup cannot occur before tick 407, and GPT's independent bound on the same layout reaches the same 260; both models also agree, by different arguments, that 340 caps Forced Coordination. Sometimes it does not. Fable's Coordination Ring notes state a tick-conservation law, 44 agent-ticks per soup and 800 ticks per episode, therefore seventeen soups and 340, and a beam search built to falsify it found nothing. GPT scored 360 on the same layout, seed, and horizon by mixing ring circulation with center-counter handoffs; the conservation law described the macro-actions Fable had chosen to search over, and the falsifying search inherited them. Counter Circuit went the same way, 260 declared the ceiling and 280 reached by the other model with a counter relay. Nothing inside either loop could have caught this; we found it by laying the two independent runs side by side. A self-improving agent stops when it runs out of doubt rather than when the environment runs out of reward.

### Football: the observation does not contain the outcome

Football is the opposite benchmark on every axis that mattered above. The engine draws a worst-case factor on every kick, so a correctly aimed shot still loses a quarter of its power or crosses outside the post on a bad draw; opponents and the keeper decide differently on every seed; saves deflect rather than catch; keeper dive timing and the controller-to-player mapping live outside the observation. The agent measured the consequence directly on pass-and-shoot: 109 wins out of 109 when the first shot went in, 35 losses out of 36 when it was parried. In Three vs One it went further and tested whether the outcome is predictable at all. Round 82 trained an observation-only outcome classifier on 1,200 seeds, one randomly assigned option per seed, and measured held-out accuracy at 69.2 percent against a 68.3 percent base rate. The observation at the decision point carries almost no information about whether the shot that follows will go in. A program maps each observation to one action, so no program can hedge against a future the observation does not reveal.

### Football: a case study of Counterattack Hard

Counterattack Hard shows what the loop can and cannot move. Four controlled attackers run at two center-backs and a keeper; the free-form loop spent six rounds porting the Counterattack Easy strategy, then high balls over the back line, a wing-first carry, and a cutback, and reached 18 percent. A trace autopsy of that policy over 100 episodes overturned its own narrative: the wing draw and cutback converted 1 of 54 entries, and 17 of 18 wins were the same event, a shot from the central seam at x between 0.67 and 0.79 with the keeper home, which converts 47 percent of the time but was attempted in only 38 episodes. The next round deleted the wing phase and shot proactively from the seam. Attempts rose from 38 to 59, conversion stayed at 49 percent, and the win rate rose to 29. Four more rounds of insurance shots, rebound pounces, box-crash runners, and a second high ball changed nothing that survived confirmation.

The validated model of this scenario is one line: win rate equals the seam-shot attempt rate times a conversion rate of about 48 percent. Scripting controls the first factor and the loop maximized it. The second factor is shot randomness, a strip in the corridor before x equals 0.64, or a parry scramble lost to the pack, and none of the three responds to a rule. The agent's own note calls this the RL-shaped gap and names the remedy, an RL finishing subgame or full MAPPO, which is what it later did on pass-and-shoot.

### Football: how the search runs and where it stalls

The loop in football is hand-edited rules screened by noisy rollouts. A round proposes a strategy family, screens it on 16 to 30 seeds, and confirms on 100 only if the screen looks good; a leader is promoted only after an exact replication. The screens are cheap and the confirmations are not, and the gap between them is the first place the loop stalls. On Three vs One, round 1 scored 63 percent and its exact replication at round 22 scored 46. On Five vs Five, a candidate that looked like a gain on a 16-seed screen was rejected at 50 with the note *screen was noise*. A large share of every football campaign went to re-measuring.

Three vs One is the longest record, 88 honest rounds, and it shows where the search goes when it cannot stall on noise. Rounds 0 to 48 explored more than twenty strategy families: wide bypass, cutbacks, long and high passes, shot-direction variants, dribbling, receiver selection, keeper screens, timing guards. The repeatable ceiling of reactive rules was 77 percent. Rounds 70 to 73 tried coordination that replaces the one-on-one duel with a teammate, a rebound relay to a second attacker and lateral squares at every depth; the relay converted 1 of 14 and the squares 13 percent, because GRF short passes lead the runner and the keeper resets during the flight. The final leader, 80 percent on 300 seeds, came from reading the scenario config and finding offsides disabled: park the third attacker at the far post and let him harvest parries. The loop's best discovery was an exploit of the rules, not a coordination pattern.

That is the coordination result in one line. In Overcooked, handoffs are deterministic and free, and the loop added them: GPT's best Coordination Ring schedule contains 42 counter exchanges. In football every handoff is a random event, and the loop deleted them. The Five vs Five escape pass was rejected with *pass = turnover*; on corners, crosses converted 0 percent, ground passes 5, screens 20, and all three families were abandoned. The agent's phrase for the mechanism is *transport compounds*. The final football policies are a single carrier and a single shot, with teammates holding defensive stations. Spatial partition survives because it needs no handoff; temporal sequencing between agents dies because in a random engine it is a product of per-touch success probabilities.

### Football: fix the seed, and the loop memorizes it

Before the random-seed protocol we ran the same loop with a fixed development seed, as in Overcooked. GRF is deterministic for a given engine seed, so this makes football look like Overcooked to the agent, and the agent treated it that way. A held-out audit on seeds the loop never saw, 1,000 episodes per task, shows what it had learned.

| Task | Fixed-seed score | Held-out, 1,000 episodes |
| --- | ---: | ---: |
| Empty Goal, Empty Goal Close, Run to Score | 1.00 | 1.00 |
| Three vs One | 1.00 at round 1 | 0.20 |
| Counterattack Easy | 1.00 pooled | 0.00 |
| Counterattack Hard | 1.00 | 0.00 |
| Pass and Shoot | high | 0.20 |
| Five vs Five | 0.90 on 500 unseen episodes | the one robust result |

The three trivial tasks transfer because nothing random happens before the goal. Everywhere else the policies were scripts keyed to one trajectory: Counterattack Easy's policy branched on geometry literals read off its development seed, and Corner's best run was a seed-fingerprint router that recognized which of the promotion seeds it was on from the first observation and dispatched to a memorized plan, 500 of 500 on the target evaluation. The Three vs One diagnostic makes the mechanism explicit. A policy that hashes the raw observation at step two and looks up the winning branch scores 200 of 200 on the fixed set and 73 of 100 on fresh seeds. Under the random-seed protocol the same instinct reappeared as round 49: the policy read the evaluator seed, spawned nested environments with that seed, swept sixteen candidates, and executed the one it had already seen score, 100 of 100 and then 300 of 300. We excluded it. Given any access to determinism, the loop finds it, and a fixed seed converts the football benchmark into a lookup table.

### Football: is the gap strategy, control, or policy class?

We tested each candidate explanation directly. Strategy: a second Five vs Five campaign gave the agent named futsal formations instead of free invention, a 1-2-1 diamond, a 2-2 square with a far-post keeper screen, a gated outlet pass. The best formation screened at 78 percent on 50 seeds and measured 64 on a 100-seed re-evaluation, against 65 for free-form evolution on the same protocol: no gain, and far below the 96 to 99 of IPPO and MAPPO. Control: on Counterattack Easy, letting the engine assign the four controlled players by ball proximity, the original benchmark interface, raised the frontier from 35 under a fixed roster to 65, because the engine hands the agent the receiver it needs. Policy class: on pass-and-shoot, after the code line peaked at 74, a scripted prefix with a PPO subgame for the finish reached 82, and an rMAPPO network trained by the agent with the reference implementation reached 93.5 against the 94.92 reported by Yu et al.

A strategy prior bought nothing, the control interface bought thirty points, and only changing the policy class closes the gap, because the gap is conversion under randomness, a decision the observation does not determine, and that is what a policy trained on millions of random outcomes represents and a program does not.

## What this suggests

Recursive self-improvement discovers multi-agent coordination when the coordination can be written down as a schedule and checked against a deterministic world. The loop's real product in Overcooked was not a clever rule but a search program and a certificate, and the two models converged because the certificate is the environment's. Where the world resamples, the loop cannot build the searchable model, cannot trust a single trace, learns to avoid the inter-agent handoffs that coordination is made of, and, offered a fixed seed, memorizes it.

Three changes to the harness follow. Budget official evaluations for falsifying the agent's model of the environment rather than for scoring candidates; both models already used them that way. Give ceiling claims an adversary, a second decomposition or a checker that runs the certificate, and make the stopping rule external. Keep fresh seeds and replication as the only evaluation the agent can see, because every shortcut to determinism was taken when it existed.

The open question is on the stochastic side. The 82 percent hybrid on pass-and-shoot, scripted macro-coordination with a learned subgame for the random touches, is one data point for a split that keeps the readable joint plan where dynamics are predictable and hands the handoffs to a policy trained on the noise. Where that line falls in a given task is what we want to measure next.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football values from Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. PPO values from Table 1, standard self-play.
7. Ye, J. et al. MATCHA: Bridging the Gap between Sample and Wall-Clock Efficiency in Model-Based Multi-Agent Reinforcement Learning. Under review. Overcooked values from Figure 6.
