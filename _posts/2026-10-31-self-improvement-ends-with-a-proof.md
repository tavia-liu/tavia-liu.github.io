---
title: "Capping the Self-Evolution Loop: Ten Rounds Take Code Policies Past Trained MARL in Overcooked, and Not in Football"
date: 2026-10-31
description: "Two frontier models, five Overcooked layouts, ten rounds each: both pass PPO and MATCHA and converge to the same scores. The same loop in Google Research Football stays below MAPPO. The round-by-round record shows why."
tags: [recursive self-improvement, agents, code as policy, multi agent systems]
reading_time: "10 min"
permalink: /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

A self-evolving code policy is a Python controller that a language model writes, runs, reads the trace of, and rewrites, with frozen weights throughout. Our [August post](/blog/self-evolving-code-policies/) showed that this loop improves a controller at all. This post fixes the budget at ten rounds and asks what the rounds buy. We ran the loop with GPT 6.1 Sol and Fable 5 on the five classic Overcooked layouts and with Fable 5 on six Google Research Football scenarios, and we kept every proposal, trace, and search script.

Three results. In Overcooked, both models pass the PPO self-play reference on every layout and the MATCHA reference on every layout but one, and on three of five layouts they finish at exactly the same score. The round-by-round record shows why: both models spend their rounds discovering that the task is a scheduling problem, write a planner, and let the planner find a schedule the environment cannot beat. In football, where every kick is a random draw, the same loop stays below MAPPO on every scenario with a published value, and the policies it produces coordinate less with each round.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}" alt="Five panels, one per Overcooked layout, showing the running best sparse return over ten rounds for Fable 5 and GPT 6.1 Sol, with PPO and MATCHA reference lines and light dots for each single round's raw score" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 1.</strong> Running best sparse return over ten self-evolution rounds on five Overcooked layouts. Solid lines are the frontier; light dots are the raw score of each round. Dashed lines are PPO self-play scores from Gessler et al. (2025); dotted lines are MATCHA returns after one million transitions (Ye et al., under review). Cramped Room, Asymmetric Advantages, and Forced Coordination end at identical scores for the two models; Coordination Ring and Counter Circuit end one soup apart.</figcaption>
</figure>

## How the loop works

Each experiment starts from an empty folder. The agent has the task description, the simulator source, and an evaluation harness. One round is:

1. Write `proposal.md` with a hypothesis, the invariants the policy will keep, the failure modes expected, and an abandon criterion.
2. Write `policy.py`, a function from the joint observation to a joint action.
3. Run one official evaluation. In Overcooked this is a 400-step episode with seed 0; in football it is a batch of 50 to 100 fresh random seeds.
4. Read `metrics.json`, the step-level trace, the failure summary, and the rendered rollout.
5. Update the frontier and the strategy log, then start the next round.

The budget is ten official evaluations per layout. The agent may write any offline tooling it wants, and both models did: simulators, trace analyzers, beam searches. Only the ten harness calls count. The model weights never change.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/self-evolution-workflow.svg' | relative_url }}" alt="Six stage self evolution workflow from task specification to frontier selection and policy revision" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> One round of the loop. Every revision is grounded in the trace and rollout of the previous candidate.</figcaption>
</figure>

The Overcooked code policies run in the overcooked_ai simulator, where cooking starts with an explicit interact and takes twenty ticks, and score sparse return at twenty points per delivered soup. The PPO reference is the standard self-play score of ten PPO agents from OvercookedV2 (Gessler et al., 2025, Table 1), measured over 500 episodes on the JaxMARL implementation of the same layouts. The MATCHA reference is the final return of the MATCHA training curve after one million environment transitions, read from Figure 6 of the MATCHA paper. The football reference is MAPPO from Table 2 of Yu et al. (2022).

## Results

| Layout | PPO self-play | MATCHA, 1M transitions | Fable 5 (round reached) | GPT 6.1 Sol (round reached) |
| --- | ---: | ---: | ---: | ---: |
| Cramped Room | 259 | 238 | **260** (2) | **260** (6) |
| Asymmetric Advantages | 278 | 499 | **500** (9) | **500** (8) |
| Coordination Ring | 214 | 305 | 340 (4) | **360** (6) |
| Forced Coordination | 199 | 240 | **340** (7) | **340** (6) |
| Counter Circuit | 163 | 20 | 260 (9) | **280** (8) |

### Both models climb the same ladder and arrive at the environment's ceiling

The ten proposals for any layout, from either model, follow three rungs. The first is reactive rules: each chef gets a priority list, fetch an onion if a pot needs one, grab a dish if a soup is ready. This scores between zero and respectable and produces both failures behind every zero in Figure 1, the swap deadlock in a one-tile corridor and a wrong map fact. GPT's first Coordination Ring policy aimed at the wrong onion station and executed 395 interactions that did nothing.

The second rung is roles and staging. The agent reads the trace, finds one chef idling while the other walks, and splits labor: a loader and a server, onions staged on a counter during the cook timer so the next batch starts the tick the pot clears. Most of the score arrives here, and it arrives from the trace rather than the video.

The third rung is the one that makes the two models converge. The agent stops writing policies and writes a planner. In all ten experiments the final frontier policy is an open-loop schedule, a fixed sequence of joint actions with a per-tick guard that checks the live state against the expected state and falls back to a reactive controller on mismatch. In eight of the ten, a search program the agent wrote produced the schedule. GPT built a compact model of each layout, validated it against the official traces, and ran beam search over joint primitive actions; its Coordination Ring search covered 1.49 million states. Fable ran a 36,000-rollout coordinate descent over twelve constants in Asymmetric Advantages and about 830,000 plan mutations in Counter Circuit. Once both models are searching the same deterministic transition system, the ceiling belongs to the environment, and the scores match.

Wall clock makes the same point from the other side. GPT 6.1 Sol finished each layout's ten rounds in 16 to 30 minutes. The rounds are cheap because most of the work is the planner's.

### Reactive coordination fails by phase-locking, and only a schedule fixes it

Deadlocks are loud: a zero, fixed in one round. The quiet failure that consumed the most rounds is what Fable called a phase attractor and GPT called synchronized pots. Every layout has two pots and a twenty-tick cook timer, and the throughput-optimal schedule staggers them so one cooks while the other loads. Reactive rules respond to whichever pot is emptier, which pulls both pots into the same phase, so both soups come ready at once and one waits. Fable's Coordination Ring baseline settled into a 24.5-tick delivery gap this way. GPT's Counter Circuit runs delivered in pairs eight ticks apart with 48-tick gaps between pairs. Fable's Asymmetric Advantages runs oscillated between 460 and 480 for eight rounds because every gating rule it added moved the attractor to the gate's own boundary.

Phase is a global property and each reactive rule sees local state, so no rule can hold two cycles apart. The fix in every case was to precompute the stagger. Under full observability and deterministic dynamics, the hard part of two-agent cooperation is not communication; Fable's tenth Cramped Room run replaced its centralized controller with two independent controllers that recompute the same plan from shared state, and the joint action sequence matched tick for tick. The hard part is that locally sensible rules converge to bad periodic orbits, and leaving them needs a plan with a clock in it.

### The rounds after convergence go to self-certification, and two certificates were wrong

Fable reaches 260 on Cramped Room at round two and the frontier never moves again. GPT reaches 360 on Coordination Ring at round six and ties it three more times. Neither model idles in those rounds. Each spends them proving that the frontier is the ceiling.

Sometimes the proof holds. Fable's final Cramped Room run is an exhaustive BFS that certifies two lower bounds on cook-start timing and concludes that a fourteenth pickup cannot occur before tick 407. GPT, on the same layout, wrote its own bound with a C++ and a Python search and reached the same 260. Both models also agree, by different arguments, that 340 caps Forced Coordination.

Sometimes it does not. Fable's Coordination Ring notes state a tick-conservation law, 44 agent-ticks per soup, 800 ticks per episode, therefore seventeen soups and 340. Fable then ran a beam search built to falsify this, with pruning that killed any branch behind an eighteen-soup pace, found nothing, and wrote *falsification attempt failed, supports optimality*. GPT scored 360 on the same layout, seed, and horizon by mixing ring circulation with center-counter handoffs. The conservation law described the macro-actions Fable had chosen to search over, and the falsifying search inherited them. Counter Circuit went the same way: Fable measured 57 agent-ticks per soup at saturation, called it the floor, and stopped at 260; GPT delivered fourteen soups for 280 with a counter relay.

Nothing inside either loop could have caught this. We found it by laying the two independent runs side by side. A self-evolving agent has no round-level signal that separates *I found the maximum* from *I found the maximum of what I searched*, and it stops when it runs out of doubt rather than when the environment runs out of reward.

### Under random dynamics the loop stays below MAPPO and removes coordination

We ran the same loop on Google Research Football with fresh random seeds on every evaluation. The agent traced the randomness to the engine: every kick draws a worst-case factor from the engine's random generator, so a correctly aimed shot still loses a quarter of its power or crosses outside the post on a bad draw. The agent counted 109 wins out of 109 when the first shot went in and 35 losses out of 36 when it was parried. Opponents and keeper decide differently on every seed; saves deflect rather than catch; keeper dive timing and the controller-to-player mapping live outside the observation. Pin the seed and the engine stops being the problem: in the August study, Codex GPT 5.5 solved Empty Goal, Empty Goal Close, and Run to Score at 100 percent on round zero with one fixed seed.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}" alt="Grouped bar chart of success rate on six Google Research Football scenarios: trained MAPPO from Yu et al. 2022 versus the self-evolved Fable 5 code policy" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Success rate under fresh random seeds. MAPPO values are from Table 2 of Yu et al. (2022): mean and standard deviation over six seeds of the last ten evaluations, after 25 million environment steps (50 million for Counterattack Hard and Corner). Code-policy values are the frontier of each self-evolution run, measured on 100 fresh seeds (50 for Five vs Five) with replication required before promotion. Yu et al. report no Five vs Five result.</figcaption>
</figure>

Three things change under fresh seeds, each visible in the run logs. First, the loop optimizes a sample. A Five versus Five candidate looked like a gain on a sixteen-seed screen and was rejected on a fifty-seed confirmation with the note *screen was noise*; a large share of the rounds went to re-measuring. Second, the search engine disappears. The third rung needs a transition function to search over, and in football an offline model cannot be validated against official traces, so the agent stays on the second rung: hand-edited rules screened by twenty-minute noisy rollouts.

Third, every handoff becomes a risk, so the evolved policy has fewer of them. In Overcooked, handoffs are deterministic and free, and the loop added them: GPT's best Coordination Ring schedule contains 42 counter exchanges. In football the loop deleted them. The Five versus Five escape pass was rejected with *pass = turnover*. The Counterattack Hard wing draw and cutback converted 1 of 54 entries. On corners, crosses into the box converted 0 percent, ground passes to a shooter 5 percent, screens 20 percent, and all three families were abandoned. The agent's phrase for the mechanism is *transport compounds*. The final football policies are a single carrier and a single shot, with teammates holding defensive stations. Spatial partition survives because it needs no handoff; temporal sequencing between agents dies because in a random engine it is a product of per-touch success probabilities.

MAPPO wins for the same reason. Its action distribution over passes and shots was shaped by the noise during training, so it hedges where a program commits. The agent reached this conclusion itself. On pass-and-shoot, after the code-policy line peaked at 74 percent and a scripted-prefix plus PPO hybrid reached 82, it trained an rMAPPO network with the reference implementation for 2.8 million steps and deployed the checkpoint at 93.5 percent, against the published 94.92. Its best self-improvement step was to change the policy class.

## What this suggests for the harness

Budget official evaluations for falsifying the agent's model of the environment, not for scoring candidates. Both models moved search offline within a few rounds and used the harness calls to verify that their compact simulators matched reality; the one offline prediction that was badly wrong, a Cramped Room search that let onions fill every counter, was caught only by an official rollout. A harness that provides a cheap model of the environment and charges only for ground-truth rollouts matches what the agents already do.

Give ceiling claims an adversary. A second agent with a different decomposition exposed both wrong certificates here, through our comparison after the fact. The next version puts that comparison inside the loop, requires every optimality claim to ship a certificate a separate checker can run, and labels narrative bounds as conjectures. The stopping rule should be external: tying the frontier three times is evidence of a local optimum, and the response is a forced change of representation, not a proof.

Keep the cap. Ten rounds covered every real gain on every Overcooked layout, and a longer budget would have produced longer proofs. The open question is on the other side of the determinism line. The 82 percent hybrid on pass-and-shoot, scripted macro-structure with a learned subgame for the stochastic touches, is one data point for a split that keeps the readable program where the dynamics are predictable and hands the rest to a policy that was trained on the noise. Where that line falls in a given task is what we want to measure next.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022. Football values from Table 2.
5. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. PPO values from Table 1, standard self-play.
6. Ye, J. et al. MATCHA: Bridging the Gap between Sample and Wall-Clock Efficiency in Model-Based Multi-Agent Reinforcement Learning. Under review. Overcooked values from Figure 6.
