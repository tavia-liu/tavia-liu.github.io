---
title: "Self Evolving Code Policies Excel Under Predictable Dynamics"
date: 2026-08-19
description: "A controlled study of LLM written policies in Overcooked and Google Research Football, with deterministic gains and a clear stochastic generalization gap."
tags: [agents, code as policy, multi agent systems, reinforcement learning]
reading_time: "10 min"
permalink: /blog/self-evolving-code-policies/
image: /assets/img/research/overcooked-code-policy-scores.png
---

## Abstract

We evaluate executable policies written and revised by frontier language models in two cooperative control benchmarks. In Overcooked, deterministic dynamics let the strongest code policy reach sparse returns of 260, 500, 340, 300, and 1,156 across five layouts. Each value exceeds the trained MARL reference used in our study. In Google Research Football, the same approach solves three simple fixed seed tasks at 100 percent, then falls behind MAPPO across a broader random seed suite. The result isolates a central boundary: self evolution can optimize a precise coordination program when repeated actions produce repeated outcomes. Random opponent behavior, ball contact, keeper motion, and hidden engine state require a policy that represents a distribution of futures.

## Research question

[Code as Policies](https://code-as-policies.github.io/) established that a language model can express an embodied controller as executable code. Our study asks a narrower question: how far can repeated execution feedback improve that controller, and which environmental assumptions support the improvement?

We study two regimes. Overcooked provides a fixed transition system for each layout. Google Research Football provides a physics based simulator with stochastic opponent actions and contact outcomes. This contrast separates coordination complexity from dynamics uncertainty.

## Self evolution protocol

The policy is a Python program. The language model receives the task specification, the simulator interface, the score, and artifacts from previous candidates. Every turn creates a proposal, an executable policy, a rollout, and a diagnosis. A candidate enters the frontier when its measured objective improves or ties the strongest useful strategy. The model weights remain fixed throughout this process.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/self-evolution-workflow.svg' | relative_url }}" alt="Six stage self evolution workflow from task specification to frontier selection and policy revision" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;">Figure 1. The evaluation loop changes executable policy code. Each revision is grounded in simulator evidence.</figcaption>
</figure>

The archive records four forms of evidence for every completed candidate: aggregate metrics, step level traces, a failure summary, and a rendered rollout. The trace exposes positions, actions, held objects, rewards, and repeated states. This structure turns a scalar score into a concrete diagnosis such as corridor deadlock, dish starvation, route oscillation, or late service.

Codex GPT 5.5 and Fable 5 began from fresh folders and evolved independently. The experiment instructions prohibited policy transfer across model folders. Strategy branches received a repair budget that preserved the underlying idea through initial implementation failures.

## Overcooked setup

[Overcooked AI](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html) models two chefs who collect onions and dishes, cook soup, and deliver completed orders. The five layouts create distinct routing and handoff constraints. We use sparse return over 400 steps with seed 0. Depending on the archived configuration, each candidate was evaluated for one or five episodes. Repeated episodes were identical in these deterministic runs.

The reference MARL values come from the comparison already used in our project slide. They provide context for the code policy scores. A strict leaderboard comparison would require a fresh evaluation of every checkpoint under one repository revision, reward definition, observation interface, and seed protocol.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-code-policy-scores.png' | relative_url }}" alt="Grouped bar chart comparing trained MARL, Codex GPT 5.5, and Fable 5 sparse returns on five Overcooked layouts" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;">Figure 2. Sparse return at a 400 step horizon. The vertical scale is split because Counter Circuit uses a larger recipe reward.</figcaption>
</figure>

| Layout | Reference trained MARL | Codex GPT 5.5 | Frontier turn | Fable 5 | Frontier turn |
| --- | ---: | ---: | ---: | ---: | ---: |
| Cramped Room | 235 | 240 | 12 / 18 | **260** | 2 / 10 |
| Asymmetric Advantages | 490 | 460 | 21 / 23 | **500** | 9 / 9 |
| Coordination Ring | 300 | 280 | 22 / 22 | **340** | 4 / 9 |
| Forced Coordination | 235 | 240 | 0 / 8 | **300** | 4 / 4 |
| Counter Circuit | 70 | 816 | 19 / 19 | **1,156** | 1 / 9 |

The turn field reports the first frontier run index and the final run index. Run identifiers begin at 000. A low frontier turn means the productive structure appeared early. This field offers no compute measure, since later turns can include search programs and many internal simulator calls.

The strongest Fable policies reveal the value of explicit temporal structure. Cramped Room uses counter staging and a 29 step steady cycle for 13 deliveries. Asymmetric Advantages assigns complementary roles and uses a stash assisted pipeline for 25 deliveries. Coordination Ring executes a verified joint schedule for 17 deliveries. Forced Coordination multiplexes onion and dish handoffs through a shared counter for 15 deliveries. Counter Circuit staggers two pots and protects dedicated buffers, yielding 17 bonus soups and a return of 1,156.

These are compact programs with strong coordination conventions. Deterministic execution makes exact schedules, state guards, and collision repairs reusable on every episode.

## Football setup

[Google Research Football](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/) supplies a physics based engine, scripted opponents, academy scenarios, and full matches. The engine supports deterministic and stochastic modes. Our random seed evaluation varies opponent decisions, ball direction and height at contact, shot dispersion, spin, curve, deflections, rebounds, hidden animation phase, and team processing state.

Three simple tasks show the fixed seed ceiling. Codex GPT 5.5 found each policy on turn 0.

| Scenario | Code policy success | Frontier turn | Built in AI success |
| --- | ---: | ---: | ---: |
| Empty Goal | **100%** | 0 | 92% |
| Empty Goal Close | **100%** | 0 | 100% |
| Run to Score | **100%** | 0 | 89% |

The broader suite samples random engine dynamics. MAPPO is a trained neural policy that uses centralized value information during training and decentralized execution. The reference implementation and design are described by [Yu et al.](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html).

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-random-dynamics.png' | relative_url }}" alt="Dot plot comparing MAPPO, Fable 5 code policy, and built in AI success rates across eight random dynamics football tasks" style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;">Figure 3. Success rate under random engine dynamics. Lines show the spread among the three controllers within each task.</figcaption>
</figure>

| Task | Controlled agents | MAPPO success, mean (SD) | Network | Fable 5 | Built in AI | Duration |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| Pass and Shoot | 2 | 94.10 (0.50) | RNN | 74% | 51% | 400 |
| Run, Pass and Shoot | 2 | 77.80 (8.66) | RNN | 72% | 0% | 400 |
| Three versus One | 3 | 87.43 (2.36) | RNN | 80% | 27% | 400 |
| Counterattack Easy | 10 | 96.99 | MLP | 65% | 0% | 400 |
| Counterattack Hard | 10 | 91.40 | MLP | 35% | 0% | 400 |
| Five versus Five | 4 | 94.00 | MLP | 68% | 0% | 3,000 |
| Corner | 10 | 48.87 (2.21) | RNN | 35% | 0% | 400 |
| Eleven versus Eleven Stochastic | 10 | 44.00 | MLP | 39.58% | 53.33% | 3,000 |

Across these eight tasks, MAPPO averages 79.32 percent and Fable 5 averages 58.57 percent. MAPPO leads the code policy in every row. Fable 5 exceeds the built in controller in the first seven tasks. The built in controller leads both evaluated methods in the stochastic full match.

We also reproduced MAPPO on Three versus One with the recurrent architecture, a 64 unit hidden state, and 25 million environment steps. The three final checkpoints achieved 82.67, 91.33, and 91.00 percent in our evaluation record, for a mean of 88.33 percent. The nearest saved training evaluations were 82, 92, and 88 percent at 24.8 million steps. Historical best checkpoints were overwritten, so this reproduction evaluates final policies.

## Why random dynamics change the result

Self evolution in deterministic Overcooked behaves like program optimization against a stable transition function. A trace reveals a wasted step, the model edits a route or guard, and the measured gain persists. The final program can encode a highly specific schedule because the schedule remains valid.

Football exposes the controller to multiple futures after similar observed states. An opponent can choose a different interception line. A keeper can begin a different stride. The same intended kick can produce a different height, contact angle, deflection, or rebound. Our earlier trace study found two seeds with byte identical 112 value observations at the receiver decision and opposite winning receiver choices. A deterministic observation based selector must choose the same branch for both states.

MAPPO trains over rollouts sampled from the environment distribution. Its recurrent or feedforward network learns action probabilities that average across varied contacts and opponent responses. The code policy can also branch on observations, though the self evolution loop selected it from a finite collection of rollouts. A fixed development seed turns that selection process into trajectory specialization.

## Interpretation and limits

The Overcooked result demonstrates high throughput program synthesis in a predictable cooperative system. It supports a claim about optimization under fixed dynamics. It leaves open transfer to new layouts, perturbed starts, different horizons, and new partners.

The football result demonstrates a generalization gap under resampled dynamics. Several protocol differences remain relevant. Tasks use different numbers of controlled players and horizons. The MAPPO values summarize trained policies, while the code policy values summarize iterative program search. Simulator calls, language model inference cost, and wall clock time remain unnormalized. These results therefore compare achieved policy performance rather than sample efficiency.

Future evaluations should define a development seed set, a sealed validation set, and a final held out test set before policy evolution begins. Reports should include the full seed list, confidence intervals, rollout count, model calls, simulator steps, and checkpoint selection rule. A useful extension would combine readable program structure with a learned residual or stochastic world model for branches whose outcomes depend on hidden engine state.

## Conclusion

Frontier language models can write precise multi agent controllers and improve them through execution evidence. In deterministic Overcooked, that process discovers scheduling and handoff programs that exceed our trained MARL reference on all five layouts. In random dynamics football, Fable 5 remains competitive with scripted AI across academy tasks and trails MAPPO throughout the evaluation suite. Predictability determines how reliably a discovered code path transfers from one rollout to the next.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
