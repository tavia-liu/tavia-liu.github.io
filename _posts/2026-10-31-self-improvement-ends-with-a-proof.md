---
title: "Self-Improvement Ends With a Proof, and the Proof Is Often Wrong"
date: 2026-10-31
description: "Two frontier models, five Overcooked layouts, ten rounds each. Both converge to the same scores. What they do with the leftover rounds, and what the same loop does in a random football engine, says more about recursive self-improvement than the scores do."
tags: [recursive self-improvement, agents, code as policy, multi agent systems]
reading_time: "13 min"
permalink: /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

**TL;DR.** We gave two frontier coding agents ten rounds each to evolve a Python control policy for two chefs in Overcooked, with one official evaluation per round and no inherited code. Both beat our PPO and MATCHA references on every layout, and on three of five layouts they landed on exactly the same score. The ten-round history explains the convergence: in a deterministic environment, self-evolution turns into schedule search, and schedule search converges. After the score flattens, each agent spends its remaining rounds proving that no more reward exists. Two of those proofs were wrong. Nothing inside the agent's own loop could have told it so; the error only became visible when we laid its frontier next to the other model's independent run on the same layout. The same loop in Google Research Football, where every kick is a random draw, produces the mirror image: the agent strips coordination out of its policy, stalls below MAPPO, and in one scenario decides on its own to train a neural network instead.

This continues [an earlier post](/blog/self-evolving-code-policies/) that asked whether execution feedback improves a code policy at all. This one fixes the budget and asks what the loop spends its rounds on.

## The setup.

Codex running GPT 6.1 Sol and Claude Code running Fable 5 each start from an empty folder for each of the five classic Overcooked layouts. The agent writes `policy.py`, writes a proposal with a hypothesis and an abandon criterion, runs one official evaluation at horizon 400 with seed 0, inspects the metrics, the step traces, the failure summary, and the rendered rollout, and writes the next policy. Ten runs, then stop. The model weights never change. The simulator source is readable, and the agent may write any offline tooling it wants, but only the ten harness calls count.

The code policies run in the overcooked_ai simulator, where cooking starts with an explicit interact and takes twenty ticks. The PPO reference is the standard self-play score of ten PPO agents from OvercookedV2 (Gessler et al., 2025, Table 1), measured over 500 episodes on the JaxMARL implementation of the same five layouts. The MATCHA reference is the final return of the MATCHA training curve after one million environment transitions, read from Figure 6 of the MATCHA paper.

Two features of this protocol drive everything below. The environment is deterministic, so a repeated episode returns the same score. And the cap is on official evaluations, not on compute.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}" alt="Five panels, one per Overcooked layout, showing the running best sparse return over ten rounds for Fable 5 and GPT 6.1 Sol, with PPO and MATCHA reference lines and light dots for each single round's raw score" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 1.</strong> Running best sparse return across ten self-evolution rounds on five Overcooked layouts. Solid lines are the frontier; light dots are the raw score of each round. Dashed lines are PPO self-play scores from Gessler et al. (2025); dotted lines are MATCHA returns after one million transitions (Ye et al., under review). Every frontier ends above both references. Cramped Room, Asymmetric Advantages, and Forced Coordination end at identical scores for the two models; Coordination Ring and Counter Circuit end one soup apart. Fable 5 starts higher on four of five layouts; GPT 6.1 Sol climbs from lower, including two layouts where its first policy scored zero.</figcaption>
</figure>

| Layout | PPO self-play (Gessler et al., 2025) | MATCHA, 1M transitions | Fable 5 (round reached) | GPT 6.1 Sol (round reached) |
| --- | ---: | ---: | ---: | ---: |
| Cramped Room | 259 | 238 | **260** (2) | **260** (6) |
| Asymmetric Advantages | 278 | 499 | **500** (9) | **500** (8) |
| Coordination Ring | 214 | 305 | 340 (4) | **360** (6) |
| Forced Coordination | 199 | 240 | **340** (7) | **340** (6) |
| Counter Circuit | 163 | 20 | 260 (9) | **280** (8) |

Rounds are indexed from zero. Twenty points is one delivered soup. The PPO column reports the mean over ten seeds; the standard deviations in the source table are 1, 1, 8, 1, and 14.

## Both models climb the same ladder.

The ten proposals for any layout, from either model, follow the same three rungs.

**Rung one: reactive rules.** Each chef gets a priority list. If a pot needs onions, fetch one. If a soup is ready, grab a dish. This is the policy a person writes in the first hour, and it scores somewhere between zero and respectable. It also produces both failures behind every zero in Figure 1. The first is the swap deadlock: two agents in a one-tile corridor each decide the other should yield. Fable's note after its second Cramped Room run puts it well: *individually correct per-agent rules still deadlock jointly.* The second is a wrong map fact. GPT's first Coordination Ring policy aimed at the wrong onion station and executed 395 interactions that did nothing.

**Rung two: roles and staging.** The agent reads the trace, finds one chef idling while the other walks, and splits labor. A loader and a server. A supplier and a courier. Onions staged on a counter during the cook timer so the next batch starts the tick the pot clears. Most of the score arrives on this rung, and it arrives by reading traces. Both models used the rollout video to confirm what the trace already said.

**Rung three: the agent stops writing policies and writes a planner.** In all ten experiments the final frontier policy is an open-loop schedule: a fixed sequence of joint actions, usually with a per-tick guard that compares the live state against the expected state and falls back to a reactive controller on mismatch. In eight of the ten, that schedule came out of a search program the agent wrote. GPT built a compact model of each layout, validated it against the official traces, and ran beam search over joint primitive actions; its Coordination Ring search covered 1.49 million states and 25.6 million transitions. Fable ran a 36,000-rollout coordinate descent over twelve constants in Asymmetric Advantages and about 830,000 plan mutations in Counter Circuit. The two exceptions, Fable's Coordination Ring and Forced Coordination policies, were hand-derived cycles that the agent verified with an offline simulator it had also written.

So the accurate description of what recursive self-improvement did here: **the policy did not get smarter over ten rounds. The agent discovered the problem was scheduling, built a scheduler, and the scheduler did the rest.** Improvement of the controller became improvement of the tooling around the controller. That is the right move, and it is why the two models converge. Once both are running near-exhaustive search over the same deterministic transition system, the ceilings belong to the environment.

## Reactive coordination fails by phase-locking, not by deadlock.

Deadlocks are loud. They show up as a zero and get fixed in one round. The quiet failure in two-agent coordination, the one that consumed the most rounds, is what Fable called a *phase attractor* and GPT called *synchronized pots*.

Every layout has two pots and a twenty-tick cook timer. The throughput-optimal schedule staggers the pots so one cooks while the other loads. Reactive rules respond to whichever pot is emptier, which pulls both pots into the same phase, so both soups come ready at once and one of them waits. Fable's Coordination Ring baseline settled into a 24.5-tick delivery gap this way. GPT's Counter Circuit runs delivered in pairs eight ticks apart with 48-tick gaps between pairs. Fable's Asymmetric Advantages runs oscillated between 460 and 480 for eight consecutive rounds because every gating rule it added relocated the attractor to the gate's own boundary. Its notes for that layout contain a section titled *the conservation law (why everything lands at 480)*, which is a fine thing for an agent to write at round seven.

The fix in every case was to stop reacting and precompute the stagger. A reactive policy cannot phase-lock two cycles because phase is a global property and each rule sees local state. **The hard part of two-agent cooperation under full observability is not communication. Locally sensible rules converge to globally bad periodic orbits, and escaping those orbits needs a plan with a clock in it.**

One more observation came free. Fable's tenth Cramped Room run replaced its centralized joint controller with two independent controllers, one per agent, each recomputing the same deterministic plan from the shared state. The joint action sequence matched the centralized version tick for tick. With deterministic dynamics and a common observation, decentralized execution of a shared plan costs nothing. The coordination problem is the plan.

## The cap limits ground truth, not compute.

Ten official evaluations sounds tight. Both models made it loose within the first few rounds by moving evaluation offline. They read the simulator source, wrote a faster model of it, checked the model against official traces, and searched the model as hard as they liked. The harness calls became verification calls: GPT's final Coordination Ring run reports that all 400 state fingerprints of its searched schedule matched the real simulator.

This changes what the cap constrains. The ten rounds did not limit how many candidates the agent could try; the search programs tried hundreds of thousands. The rounds limited how many times the agent could check its world model against reality, and that is where they mattered. GPT's eighth Cramped Room attempt predicted zero offline because the search let onions fill every counter and block the soup handoff. Only the official rollout could catch a model error of that kind, and it did.

For anyone designing a self-improvement harness: **budget official evaluations for falsifying the agent's model of the environment, not for scoring candidates.** The agent finds the candidates on its own.

## After the reward runs out, the agent writes a proof.

Look at where the frontiers flatten in Figure 1. Fable reaches 260 on Cramped Room at round two and the frontier never moves again across eight more rounds. GPT reaches 360 on Coordination Ring at round six and ties it three more times. Neither model idles during those rounds. They spend them trying to prove that the frontier is the ceiling.

Sometimes the proof is right. Fable's final Cramped Room run is an exhaustive BFS that certifies two lower bounds on cook-start timing and concludes that a fourteenth pickup cannot occur before tick 407, so 260 is the maximum. GPT, on the same layout, wrote its own upper-bound argument with both a C++ and a Python search and reached the same number. Both models also agree, by different arguments, that 340 caps Forced Coordination. When two independent searches with different models of the environment meet at the same number, the number is credible.

Sometimes the proof is wrong. Fable's Coordination Ring notes state a tick-conservation law: an onion delivery costs exactly ten agent-ticks in every topology, a soup costs 44, two agents supply 800 ticks per episode, therefore seventeen soups and 340 is the theoretical maximum. Fable then ran a beam search built to falsify this, with pruning that killed any branch falling behind an eighteen-soup pace, found nothing, and wrote *falsification attempt failed, supports optimality*. GPT scored 360 on the same layout, seed, and horizon by mixing ring circulation with center-counter handoffs. Eighteen soups. The conservation law described the macro-actions Fable had chosen to search over, and the falsifying search inherited those macro-actions. The proof and its test shared an assumption, so the test could not fail.

Counter Circuit went the same way. Fable measured about 57 essential agent-ticks per soup at saturation, called it the floor, computed that a fourteenth soup would need 52.5, and stopped at 260 with the note *ceiling reached*. GPT delivered fourteen soups for 280 with a relay that stages soup on a counter and lets whichever chef finishes refilling carry it. A measured number became a bound by being written down.

Fable's own Cramped Room notes record that it had already been caught twice on that one layout. Its second run came with an optimality argument that assumed an unnecessary turn. Its third run came with a lemma that the cycle was at least 30 ticks, which missed a counter reachable from the serve stand. The round-nine learning entry reads, in the agent's words: *two hand-written optimality proofs in this experiment were wrong before certification; trust machine-checked floors, not narrative arguments.* It then went to Coordination Ring and wrote a narrative argument.

The pattern is not specific to Fable. GPT's reports say *best measured, not proven optimal* on the layouts where it ran no exhaustive search, which is the right epistemics, and GPT also stopped. It tied its own frontier two to four times per layout and declared completion; on Cramped Room and Forced Coordination the ceiling it stopped at happened to be real. Neither model has a round-level signal that separates *I have found the maximum* from *I have found the maximum of the thing I am searching*. The difference became visible to us because we had two independent runs to lay side by side.

**A self-improving agent does not stop when the environment runs out of reward. It stops when it runs out of doubt, and it manufactures certainty at about the rate it manufactures policies.** The convincing proof at the end of a flat frontier is the loop's terminal state, produced by the same process that produced the frontier.

## Under random dynamics, the loop removes coordination.

We ran the same loop on Google Research Football, with fresh random seeds on every evaluation. The agent traced the randomness to the engine. Every kick draws a worst-case factor from the engine's random generator, so a correctly aimed shot still loses a quarter of its power or crosses outside the post on a bad draw; the agent counted 109 wins out of 109 when the first shot went in and 35 losses out of 36 when it was parried. The built-in opponents and keeper decide differently on every seed. Saves deflect rather than catch, and the rebound lands wherever the shot line and the keeper's animation phase put it. Keeper dive timing, the alternating team build order, and the engine's mapping from controller slots to players all live outside the 115-value observation. Our earlier trace study found two seeds with byte-identical observations at the receiver decision and opposite winning choices. One observed state maps to several futures, and a deterministic program picks one branch.

Pin the seed and the engine stops being the problem. In our August study, with one fixed seed, Codex GPT 5.5 solved Empty Goal, Empty Goal Close, and Run to Score at 100 percent on round zero, and the fixed-seed policies were trajectory-specialized in the same way the Overcooked schedules are. Fresh seeds are what separate football from Overcooked, and three things follow from them, each visible in the run logs.

**The loop optimizes a sample.** In Overcooked, one rollout is the whole environment and every trace diagnosis is a fact about the task. In football a trace is one draw. A Five versus Five candidate looked like a gain on a sixteen-seed screen and was rejected on a fifty-seed confirmation with the note *screen was noise*. Promotion required exact replication on a second fresh batch. A large share of the rounds went to re-measuring.

**The search engine disappears.** Rung three needs a transition function to search over. In football an offline model cannot be validated against official traces the way it was in Overcooked, so the agent stays on rung two: hand-edited rules screened by twenty-minute noisy rollouts.

**Every handoff becomes a risk, so the evolved policy has fewer of them.** This is the coordination result. In Overcooked, handoffs are deterministic and free, and the loop added them: GPT's best Coordination Ring schedule contains 42 counter exchanges, and its Counter Circuit gain came from relaying soup across a counter. In football the loop deleted them. The 5 vs 5 escape pass was rejected with *pass = turnover*. The Counterattack Hard wing draw and cutback converted 1 of 54 entries. On corners, crosses into the box converted 0 percent, ground passes to a shooter 5 percent, screens 20 percent, and all three families were abandoned. In the full 11 vs 11 match every goal followed one pattern: the front player receives off a turnover and drives centrally alone. The agent's own phrase for the mechanism is *transport compounds*. The final football policies are a single carrier and a single shot, with teammates holding defensive stations. The coordination that survived is spatial partition, which needs no handoff. The coordination that died is temporal sequencing between agents, which in a random engine is a product of per-touch success probabilities.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}" alt="Grouped bar chart of success rate on six Google Research Football scenarios: trained MAPPO from Yu et al. 2022 versus the self-evolved Fable 5 code policy" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> Success rate under fresh random seeds. MAPPO values are from Table 2 of Yu et al. (2022): mean and standard deviation over six seeds of the last ten evaluations, after 25 million environment steps (50 million for Counterattack Hard and Corner). Code-policy values are the frontier of each self-evolution run, measured on 100 fresh seeds (50 for Five vs Five) with replication required before promotion. Yu et al. report no Five vs Five result. MAPPO leads on every scenario where both exist.</figcaption>
</figure>

| Scenario | MAPPO, mean (SD) | Code policy, Fable 5 | Evaluation seeds |
| --- | ---: | ---: | ---: |
| Pass and Shoot | 94.92 (0.68) | 74 | 100, replicated |
| Run, Pass and Shoot | 76.83 (1.81) | 72 | 100, replicated |
| Counterattack Easy | 87.76 (1.34) | 65 | 100 |
| Counterattack Hard | 77.38 (4.81) | 29 | 100 |
| Corner | 65.53 (2.19) | 35 | 100 |
| Five vs Five | not reported | 68 | 50 |

MAPPO wins here for the same reason. Its action distribution over passes and shots was shaped by the noise during training, so it hedges where a program commits. The agent reached this conclusion on its own. On the pass-and-shoot scenario, after the code-policy line peaked at 74 percent and a scripted-prefix plus PPO hybrid reached 82, the agent trained an rMAPPO network with the reference implementation for 2.8 million steps and deployed the checkpoint: 93.5 percent, matching the published figure. The loop's best self-improvement step was to change the policy class.

## What to change, and what to keep.

Three changes for the next version of this experiment.

First, budget world-model checks, not candidates. Both models were right to move search offline. The harness should make that the default: provide a cheap model of the environment and charge only for ground-truth rollouts.

Second, give ceiling claims an adversary. The cheapest one is a second agent with a different decomposition. That is what exposed both wrong proofs here, through our side-by-side comparison after the fact; the next version puts the comparison inside the loop. A stronger version requires every optimality claim to ship a certificate a separate checker can run, with narrative bounds labeled as conjectures. Fable's own notes ask for this.

Third, make the stopping rule external. Tying the frontier three times is evidence of a local optimum. The right response is a forced change of representation, and the agent should not be the one deciding that the frontier is the ceiling.

Keep the cap. Ten rounds covered every real gain on every layout, and the rounds after the gain are where the agents showed how they reason about their own limits. A longer budget would have produced longer proofs.

If you work on self-improving agents, harness design, or multi-agent coordination and any of this looks wrong or familiar, my inbox is open. The run folders, with every proposal, trace, search script, and proof, are the kind of artifact I am happy to share.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022. Football values from Table 2.
5. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. PPO values from Table 1, standard self-play.
6. Ye, J. et al. MATCHA: Bridging the Gap between Sample and Wall-Clock Efficiency in Model-Based Multi-Agent Reinforcement Learning. Under review. Overcooked values from Figure 6.
