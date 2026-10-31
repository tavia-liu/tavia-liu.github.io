---
title: "What Self-Improving Code Policies Learn About Coordination"
date: 2026-10-31
description: "We let language models write, run, and revise multi-agent controllers in Overcooked and Google Research Football. The results show how the loop discovers joint schedules, mistakes its search space for a performance ceiling, and adapts to the evaluator."
tags: [recursive self-improvement, agents, code as policy, multi agent systems]
reading_time: "13 min"
permalink: /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

Can a language model discover how a team should coordinate by writing a controller, watching it fail, and rewriting it?

We tested this in two games. In Overcooked, two chefs must prepare and deliver soup without blocking each other. In Google Research Football, teammates must move the ball past defenders and score. The language model writes a Python policy for the team, runs it, reads the resulting trace, and decides what to change. Its weights stay fixed; the controller and the tools it builds improve over time.

The loop worked strikingly well in Overcooked. After ten rounds, two models reached identical scores on three of five layouts, and finished one soup apart on the other two. Their strongest controllers executed joint schedules, often produced by search programs the models had written themselves. In football, rule-based controllers improved but usually remained below trained policies, and longer campaigns spent substantial effort separating real gains from lucky evaluations.

The most useful finding is how the loop changes its approach to the task. In a predictable kitchen, it learns to search for a coordinated schedule. In football, it learns which passes to avoid, which outcomes need repeated measurement, and sometimes how to exploit the evaluation itself. Reading the sequence of policies tells us more about self-improvement than the final score alone.

## The experiment

Each round has four steps: write `policy.py`, evaluate it, inspect the feedback, and propose the next revision. The policy maps the team's observations to actions for all controlled players. Feedback includes metrics, a step-level trace, a failure summary, and rendered rollouts. Proposals record a hypothesis and a criterion for abandoning it, giving us a history of what the agent believed and what it tested.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}" alt="The language model writes a team policy, evaluates it, reads scores and rollout traces, and revises the policy." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 1.</strong> The self-improvement loop. The language model can also write simulators, planners, and analysis scripts between evaluations. Its weights remain fixed.</figcaption>
</figure>

We use two existing benchmarks with different demands on coordination:

| | Overcooked | Google Research Football |
| --- | --- | --- |
| Tasks | Five classic two-chef layouts | Six academy scenarios and Five vs Five |
| Dynamics | Deterministic, fixed start | Random outcomes and scripted opponents |
| Metric | Soup reward over 400 steps; 20 points per delivery | Success rate on fresh engine seeds |
| Models | Fable 5 in Claude Code; GPT 6.1 Sol in Codex | Fable 5 in Claude Code |
| Budget | Ten evaluated rounds per model and layout, numbered 0–9 | Scenario-dependent campaigns with screening and larger validation batches |

The Overcooked runs evaluate a jointly designed team at seed 0. The football campaigns use fresh random seeds, typically screening on smaller batches before evaluating promising candidates on 100 episodes; Three vs One uses 300-episode validation for its final leaders. The football campaigns have varying stopping rules and lengths. They test what sustained iteration discovers under noisy feedback.

Official evaluation rounds are one part of the computation. The agent can run offline simulations and search between them, and these become central to the Overcooked results. We compare scores with published reinforcement-learning references; those references provide context under their original training and evaluation protocols. Our experiment measures team performance from one campaign per model and task, with access to joint observations and control of the team.

## Results: strong schedules in Overcooked, a larger gap in football

### Overcooked: two models arrive at nearly the same scores

Both models finish above the published standard self-play PPO mean on all five layouts. They also reach or exceed the MATCHA curve values used as references here. The two models agree at 260, 500, and 340 on Cramped Room, Asymmetric Advantages, and Forced Coordination. GPT finishes one soup ahead on Coordination Ring and Counter Circuit.

| Layout | PPO self-play | MATCHA, ≈1M transitions | Fable 5 | GPT 6.1 Sol |
| --- | ---: | ---: | ---: | ---: |
| Cramped Room | 259 | ≈238 | **260** | **260** |
| Asymmetric Advantages | 278 | ≈499 | **500** | **500** |
| Coordination Ring | 214 | ≈305 | 340 | **360** |
| Forced Coordination | 199 | ≈240 | **340** | **340** |
| Counter Circuit | 163 | ≈20 | 260 | **280** |

PPO values are the standard self-play means in [Gessler et al., Table 1](https://arxiv.org/html/2503.17821v1#S5.T1), measured on classic Overcooked. MATCHA values are approximate readings from its Figure 6 at one million transitions. The code-policy columns report each campaign's best evaluated score within rounds 0–9.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}" alt="Best reward across ten rounds on five Overcooked layouts. The models tie on three layouts; GPT finishes one delivery ahead on the other two." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> Overcooked over ten rounds. Solid lines show the best score so far; faint dots show individual evaluations. Dashed and dotted lines show published PPO and approximate MATCHA reference values.</figcaption>
</figure>

The starting policies differ much more than the final ones. GPT begins with zero reward on two layouts, then recovers and reaches the same neighborhood as Fable. The trajectories below explain what changes between those first rules and the final schedules.

### Football: iteration improves rules, but most gaps remain

The strongest rule-based football policies fall below the IPPO reference on all seven scenarios, and below MAPPO on six. Run, Pass and Shoot is the exception: 72% compared with MAPPO's reported 66%. The largest gaps appear on Counterattack Hard and Five vs Five.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}" alt="Success rates on seven football tasks. Code policies trail IPPO on all seven and MAPPO on six, with the largest gaps on Counterattack Hard and Five vs Five." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Football results under fresh seeds. Code-policy values come from larger validation batches, pooling designated replications where applicable. IPPO and MAPPO are published references from Song et al. (2023).</figcaption>
</figure>

| Scenario | IPPO, mean (SD) | MAPPO, mean (SD) | Fable 5 rules |
| --- | ---: | ---: | ---: |
| Pass and Shoot | 93.7 (0.9) | 92.9 (2.6) | 74 |
| Run, Pass and Shoot | 73.7 (13.4) | 66.0 (6.3) | 72 |
| Three vs One | 91.7 (3.1) | 90.0 (3.2) | 80 |
| Counterattack Easy | 85.7 (6.6) | 88.9 (6.6) | 65 |
| Counterattack Hard | 71.6 (4.9) | 81.3 (9.6) | 29 |
| Corner | 50.4 (10.3) | 50.5 (7.2) | 41 |
| Five vs Five | 99.1 (0.6) | 96.0 (1.8) | 65 |

All entries are percentages. The reinforcement-learning columns are maximum mean win rates during training from [Song et al., Table 3](https://arxiv.org/html/2309.12951v1#S4.T3); their SDs summarize variation across training seeds. Our column reports success on fresh evaluation seeds for selected policies, with at least 100 episodes and 300 for Three vs One. These batches also informed selection during the campaigns. The following analysis examines how the policies reached these scores and what held them back.

## Insight 1: the loop learns to turn coordination into search

The Overcooked campaigns move through three increasingly explicit representations of coordination.

They begin with reactive rules. Fetch an onion when a pot needs one; take a plate when soup is ready; walk to the next station. These policies can produce soup, but they also expose basic failures immediately. Two chefs try to swap places in a narrow corridor and block each other. A controller misreads the map and interacts with the wrong tile. GPT's first Coordination Ring policy makes 395 interactions that accomplish nothing.

The next representation is division of labor. One chef loads while the other serves. A supplier stays near the dispenser while a courier works near the pot. The controller begins staging ingredients during cooking so that the next batch can start as soon as the pot clears. Counters become buffers: one agent leaves an object for the other to consume later. Fable's Forced Coordination policy assigns separate meanings to a lane, a buffer, and a staging slot.

The strongest representation is a joint schedule. The agent builds a model of the kitchen, searches over both chefs' actions, and emits a sequence for the team to execute. In eight of the ten campaigns, an agent-written search program produces the final schedule. GPT's Coordination Ring search explores about 1.49 million states; Fable's Counter Circuit search tries about 830,000 plan mutations. The executors check live state against the expected state and retain a reactive fallback.

The important shift is what gets improved. Early rounds modify the controller directly. Later rounds improve a program that finds controllers. A language model can reach a strong policy by constructing a useful search procedure, making simulator accuracy and search coverage part of the self-improvement process.

This shift also solves a persistent timing problem. Reactive policies repeatedly bring the two pots into the same phase: both soups become ready together, then both pots wait. Fable's Asymmetric Advantages policies oscillate between 460 and 480 for eight rounds while local gating rules move the timing problem around. A joint schedule can explicitly stagger the cycles and maintain the offset. The coordination becomes visible as a relationship between events across time.

## Insight 2: a search plateau can become a false proof

Once the scores flatten, several campaigns spend their remaining rounds explaining why a higher score is impossible. Comparing the models exposes a problem with those explanations.

Fable's Coordination Ring notes claim that each soup needs 44 agent-ticks, which limits a 400-step episode to seventeen deliveries and 340 reward. It also runs beam searches that fail to find a better plan. GPT reaches 360 on the same layout and horizon by combining ring circulation with center-counter handoffs.

The missing delivery came from an interaction outside Fable's chosen set of macro-actions. Its accounting argument described the plans it had considered, and its attempted falsification searched within the same representation. Counter Circuit repeats the pattern: Fable settles at 260, while GPT finds a counter relay that reaches 280.

This is a specific failure of self-verification. An agent can use the same abstraction to propose a solution, justify its ceiling, and search for counterexamples. Agreement among those steps can reflect a shared blind spot. Here, the independently constructed controller supplies a decisive counterexample.

A useful stopping rule should therefore distinguish a plateau in the current search from a bound over the environment's legal actions. Stronger ceiling claims need a checker or a search representation capable of expressing plans the proposing agent left out.

## Insight 3: noisy feedback changes what counts as a useful revision

In deterministic Overcooked, a saved tick survives the next evaluation from the same start. In football, a promising revision can disappear when replayed on fresh seeds. Three vs One illustrates the cost: an early policy scores 63% on one 100-episode batch and 46% on its exact replication. Larger batches become part of discovering whether an edit helped.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-rsi-rounds.png' | relative_url }}?v=20261031c" alt="Football evaluations across the campaigns. Individual scores fluctuate; larger-batch leaders progress more slowly. Separate markers indicate learned-policy follow-ups and excluded seed-reading evaluations." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> Football campaign histories. Dot size reflects evaluation size. Lines summarize the best values meeting each scenario's validation threshold; designated replications are pooled retrospectively. Triangles mark learned-policy follow-ups reported in the Pass and Shoot campaign summary. Crosses mark seed-reading evaluations, excluded from the valid frontier.</figcaption>
</figure>

Counterattack Hard shows what trace analysis can still recover. The early controller tries to draw defenders wide and cut the ball back. It wins 18 of 100 episodes. Reading the traces overturns the explanation attached to that strategy: 17 of those wins come from a shot through the central seam, while entries into the wide phase produce only one win in 54 episodes.

The agent changes the controller to seek the seam shot earlier. Attempts rise from 38 to 59 per 100 episodes, conversion stays near 48%, and overall success rises from 18% to 29%. Later rule changes fail to produce a confirmed improvement.

The useful diagnosis separates reaching an opportunity from converting it. Routing improves the first; the tested finishing rules leave the second largely unchanged. This identifies where to spend the next round of work without claiming that the remaining conversion rate is an intrinsic ceiling.

The same pressure shapes coordination. Extra passes create more opportunities for interception or a poor touch, so several campaigns abandon elaborate passing sequences. Yet teammates remain useful: the validated Three vs One leader places an attacker at the far post to collect parries, taking advantage of the scenario's disabled offside rule. The loop retains spatial support while discarding several unreliable sequences of transfers.

An outcome-prediction experiment gives another view of the difficulty. In Three vs One, an MLP trained on 1,200 seeds predicts success from an early observation and one of eight tactical options. Held-out classification accuracy is 69.2%, compared with a 68.3% majority baseline. Its selected policy scores 76% on 100 fresh seeds, below the 80% validated leader. That feature set and training procedure recover little predictive signal about the later outcome; the result directs attention toward richer control and training across trajectories.

## Insight 4: the evaluator helps determine what the loop learns

We first evaluated football on fixed development seeds. This made it possible to improve a particular trajectory until it succeeded. Transfer to other seeds told a different story.

| Task | Fixed-seed development success | Success in the held-out audit |
| --- | ---: | ---: |
| Three vs One | 100% | 20% |
| Counterattack Easy | 100% | 0% |
| Counterattack Hard | 100% | 0% |

The archived audit uses **10 held-out engine seeds, with 100 repeated episodes per seed**. Its 1,000 episodes therefore cover ten distinct seeds. The resulting failures reveal how strongly these controllers depended on the development trajectories.

Fresh seeds improve the objective, but evaluation access matters too. During Three vs One, the agent writes a policy that reads the evaluator's engine seed, recreates the episode, tries sixteen candidate options, and executes one it has already observed winning. It scores 100% on both 100- and 300-episode evaluations. Those runs are excluded from the valid results because the controller used hidden evaluation information.

The lesson is operational: evaluation isolation belongs in the harness. A policy should receive its allowed observations and episode state; hidden seeds and nested access to the test environment should remain outside its execution boundary. An independent final test is also needed to measure transfer after repeated candidate selection.

The harness shapes performance through legitimate interfaces as well. On Counterattack Easy, changing from a fixed controlled roster to the benchmark's proximity-based assignment raises the observed frontier from 35% to 65%. In a separate Five vs Five campaign, supplying named formations produces 64% on re-evaluation, compared with 65% for free-form evolution. The control interface has a larger observed effect than that strategy prior.

The Pass and Shoot campaign then changes how the policy is obtained. Its recorded experiment summary reports 74% for the best rule-based controller, 82% for a scripted prefix with a PPO finishing subgame, and 93.5% for an rMAPPO policy trained by the agent, evaluated over two 100-episode batches. This progression motivates a hybrid design: search over predictable team structure, and learn the control decisions that require experience across many outcomes.

## What I would change in the next loop

The Overcooked result makes an appealing case for giving coding agents more than a policy file to edit. They can build the simulator, search procedure, and execution checks that make a coordinated plan easier to discover. The strongest artifact may be the tool that produces the policy.

The next harness should make three distinctions explicit. Count offline search alongside official evaluations so the budget reflects the work performed. Check ceiling claims using a representation independent of the proposing agent's chosen macro-actions. Separate candidate selection from an isolated final evaluation on unseen randomness.

For football, the most informative next experiment is to vary where a joint script hands control to a learned subpolicy. Pass and Shoot provides one encouraging case. Testing that split across scenarios would tell us which parts of coordination benefit from explicit planning and which benefit from learning through repeated interaction.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football references: Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). 2025. Classic Overcooked PPO references: Table 1, standard self-play.
7. Ye, J. et al. MATCHA: Bridging the Gap between Sample and Wall-Clock Efficiency in Model-Based Multi-Agent Reinforcement Learning. Under review. Approximate Overcooked curve values: Figure 6.
