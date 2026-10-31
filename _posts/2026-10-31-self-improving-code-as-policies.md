---
title: "Self-Improving Code as Policies for Multi-Agent Coordination"
date: 2026-10-31
description: "We let language models write, run, and revise multi-agent controllers in Overcooked and Google Research Football. The results show how the loop discovers joint schedules, mistakes its search space for a performance ceiling, and adapts to the evaluator."
reading_time: "14 min"
permalink: /blog/self-improving-code-as-policies/
redirect_from:
  - /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

Can a language model discover how a team should coordinate by writing a controller, watching it fail, and rewriting it? And how does a policy written as code compare with neural-network policies trained with reinforcement learning?

We study this with a simple recursive self-improvement (RSI) loop. The language model writes a Python policy for the team, runs it, reads the resulting trace, and decides what to change. The controller and the tools it builds improve over time. We tested RSI on two benchmarks. In [Overcooked](https://github.com/HumanCompatibleAI/overcooked_ai), two chefs must prepare and deliver soup without blocking each other. In [Google Research Football](https://github.com/google-research/football), teammates must move the ball past defenders and score.

<figure style="margin: 2rem 0;">
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 1.25rem;">
    <div>
      <p style="margin: 0 0 .6rem;"><strong>Overcooked: Coordination Ring</strong></p>
      <video controls muted playsinline preload="none" poster="{{ '/assets/img/research/coordination-ring-poster.png' | relative_url }}?v=20261031-bb" aria-label="Recorded Overcooked rollout from round eight" style="display: block; width: 100%; height: 300px; object-fit: contain; background: #f6f5f2; border-radius: 8px;">
        <source src="{{ '/assets/media/code-policies/coordination-ring-run008.mp4' | relative_url }}" type="video/mp4">
        <a href="{{ '/assets/media/code-policies/coordination-ring-run008.mp4' | relative_url }}">Watch the Overcooked rollout</a>
      </video>
    </div>
    <div>
      <p style="margin: 0 0 .6rem;"><strong>Football: Counterattack Hard</strong></p>
      <video controls muted playsinline preload="none" poster="{{ '/assets/img/research/counterattack-hard-poster.png' | relative_url }}" aria-label="One recorded successful Counterattack Hard rollout from round seven" style="display: block; width: 100%; height: 300px; object-fit: contain; background: #f6f5f2; border-radius: 8px;">
        <source src="{{ '/assets/media/code-policies/counterattack-hard-run007-win.mp4' | relative_url }}" type="video/mp4">
        <a href="{{ '/assets/media/code-policies/counterattack-hard-run007-win.mp4' | relative_url }}">Watch the football rollout</a>
      </video>
    </div>
  </div>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 1.</strong> Example tasks. Left: Overcooked Coordination Ring, where two chefs execute a joint schedule. Right: Google Research Football Counterattack Hard, where the team controller seeks an early shot. Both clips are selected successful rollouts of LLM-written policies.</figcaption>
</figure>

The loop worked strikingly well in Overcooked. After ten rounds, Fable 5 and GPT 6.1 Sol both beat neural policies trained with PPO self-play on all five layouts. Their best policies are joint schedules found by search programs the models wrote for themselves. Google Research Football is a soccer simulator where players coordinate against built-in opponents while controlling their movement, first touches, and shot timing under stochastic dynamics. There, the same loop improved its policies but remained below the reported IPPO results on all eight scenarios and MAPPO on seven.

The gap comes from the feedback each game returns. In the kitchen, a failed rollout points to a specific collision or idle step, so the loop can treat coordination like a math problem and search for a joint schedule. In football, a single evaluation rarely says what went wrong. A lost episode could come from the team strategy, from low-level control of one player, or from a random bounce, and the loop spends most of its effort separating real improvements from lucky evaluations. When the evaluator leaks information, it learns to exploit that instead. The loop is strong at coordination it can reason out on paper and still weak at coordination that lives in physical movement, where low-level control must absorb large amounts of randomness. The rest of this post shows how each of these happens.

## The RSI loop

Each round, the language model writes `policy.py`, which maps the team's observations to actions for every controlled player. The harness then runs evaluation on training seeds and returns the score, a step-level trace, a failure summary, and rendered rollouts. The model reads this feedback, keeps the best policy so far, and revises the policy code for the next round.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}?v=20261031-loop7" alt="The loop: write policy, evaluate, inspect feedback, revise policy, then the next round." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> The RSI loop.</figcaption>
</figure>

## Benchmarks and evaluation

We use two existing benchmarks with different demands on coordination, [Overcooked](https://github.com/HumanCompatibleAI/overcooked_ai) and [Google Research Football](https://github.com/google-research/football):

| | Overcooked | Google Research Football |
| --- | --- | --- |
| Tasks | Five classic two-chef layouts | Six academy scenarios, Five vs Five, and Eleven vs Eleven |
| Dynamics | Deterministic, fixed start | Random outcomes and scripted opponents |
| Metric | Return on one 400-step evaluation episode at seed 0; 20 points per delivered soup | Success rate on 100 fresh evaluation seeds |
| Models | Fable 5 in Claude Code; GPT 6.1 Sol in Codex | Fable 5 in Claude Code |

Each Overcooked run has a budget of ten rounds, numbered 0 to 9. Overcooked is deterministic, so training and evaluation both use seed 0. In each football round, the agent runs its policy on a fresh batch of 25 to 100 random training seeds, choosing the batch size itself, and no seed is reused. Reported football scores come from 100 fresh evaluation seeds.

We compare the self-evolved controllers with reported reinforcement-learning results: PPO self-play from [Gessler et al. (2025)](https://arxiv.org/abs/2503.17821) on Overcooked, and IPPO and MAPPO from [Song et al. (2023)](https://arxiv.org/abs/2309.12951) on Google Research Football.

## Results and Analysis

### Overcooked: coordination becomes search

#### Both models beat PPO without touching the simulator

Both models finish above the published PPO self-play mean on all five layouts. On four layouts they end within one soup of each other: they tie at 260 on Cramped Room and 300 on Coordination Ring, Fable finishes one soup ahead on Asymmetric Advantages, and GPT one soup ahead on Forced Coordination. Counter Circuit separates them. Fable reaches 300 in its fifth round, three soups ahead of GPT's 240.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}?v=20261031-bb" alt="Best reward across ten rounds on five Overcooked layouts for both models, with the PPO reference as a dashed line." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Overcooked over ten rounds. Solid lines show the best score so far; faint dots show individual evaluations. Dashed lines show the PPO reference values. Fable's Counter Circuit campaign had completed six rounds when this was written.</figcaption>
</figure>

Each model opens with a zero-reward policy on one layout. GPT's first Cramped Room controller spends the episode on interactions that accomplish nothing; Fable's first two Coordination Ring controllers lock both chefs onto the same tile of the ring. Both recover within three rounds, and from there the curves climb in steps of one or two soups as the controllers change shape.

#### How the agents found the schedules

The campaigns pass through three increasingly explicit representations of coordination.

They begin with reactive rules. Fetch an onion when a pot needs one; take a plate when soup is ready; walk to the next station. These policies produce soup, and they fail in ways the trace exposes at once. GPT's second Counter Circuit controller treats the partner as a permanent obstacle: each chef needs the tile the other is standing on, and both stay put for 350 steps. Fable's second Coordination Ring controller contests one tile of the ring forever because its planner has no rule for two chefs choosing the same cell.

The next representation is division of labor, with counters as buffers. GPT's Forced Coordination breakthrough comes in round 6, from 240 to 340, when the left chef stops reacting and streams a fixed recipe of onion, onion, onion, dish across the shared counter while the right chef runs both pots and serves at a 22-step cadence. Fable's Counter Circuit controllers hand onions across the middle counter instead of carrying them around the ring: four steps per onion instead of about fifteen.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}"><img src="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}" loading="lazy" alt="Three rollout frames at ticks 3, 4, and 5. The lower chef faces the middle counter holding an onion, the onion sits on the highlighted counter tile, and the upper chef takes it and turns toward the pots." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> An onion handoff across the middle counter in Counter Circuit, checked against the step trace. At tick 3 the lower chef faces the counter holding an onion; at tick 4 the onion sits on the highlighted tile; at tick 5 the upper chef has taken it and turns back toward the pots. The exchange repeats every four ticks.</figcaption>
</figure>

The third representation is a joint schedule found by search, and here the two models part ways. GPT keeps writing rules and, where it schedules, schedules by hand: its final Cramped Room controller is a 30-step cycle read off the trace timings, plating at offset 0, delivering at 3, adding onions at 2, 6, and 9, and starting the cook at 10. Fable rebuilds the simulator it was denied. On Cramped Room, Asymmetric Advantages, and Counter Circuit it writes its own model of the kitchen from the rules in the prompt and the recorded traces, replays every earlier episode through the model until the predicted state matches the trace at every step, and then searches on the copy. On Asymmetric Advantages a sweep over 5,040 controller configurations and two beam searches on the copy top out at 500, and the official evaluation returns exactly 500. On Counter Circuit a beam search on the copy produces a two-soup choreography whose predicted delivery times match the real evaluation tick for tick at 260, and a wider search lifts it to 300. On Cramped Room an exhaustive search over joint chef states yields a 29-step cycle and an argument that a fourteenth delivery misses the horizon by 12 steps.

The important shift is what gets improved. Early rounds modify the controller directly. Later rounds improve a model and a search procedure that produce controllers. In a deterministic kitchen a model fitted to the traces predicts the evaluator exactly, so a plan found offline survives the official evaluation unchanged. That property is what turns coordination into search, and it is the property football lacks.

#### A plateau becomes a proof

Fable closes four of its five campaigns with an argument that its score is the ceiling: 260 on Cramped Room is "proven optimal", 500 on Asymmetric Advantages is "triple-confirmed", Coordination Ring has a "hard cap" near 20 deliveries, and 320 on Forced Coordination is "near the ceiling for this architecture". The GPT campaigns provide a check. Two of the claims survive it: GPT also stops at 260 on Cramped Room and below 500 on Asymmetric Advantages. The Forced Coordination claim does not. Fable's note puts the cook's labor at a floor of about 23 steps per soup and concludes that a seventeenth soup is out of reach. GPT's controller uses the same division of labor, the left chef feeding the shared counter and the right chef running both pots and serving, and delivers 17 soups with the last one at tick 385. Over the episode GPT's cook walks 51 steps and Fable's walks 69; the proof had counted that walking as unavoidable.

This is a specific failure of self-verification. An agent can use the same controller to propose a solution, justify its ceiling, and search for counterexamples, so agreement among those steps can reflect a shared blind spot. The bound described Fable's own controller, not the kitchen. A useful stopping rule should distinguish a plateau in the current search from a bound over the environment's legal actions, and a ceiling claim needs a checker that does not share the proposer's habits.

### Google Research Football: noisy feedback changes what counts as a useful revision

#### Iteration improves rules, but most gaps remain

The strongest rule-based football policies fall below the IPPO reference on all eight scenarios, and below MAPPO on seven. Run, Pass and Shoot is the exception: 72% compared with MAPPO's reported 66%. The largest gaps appear on Counterattack Hard and the full Eleven vs Eleven game, where the controller wins 14 of 100 matches and draws 57 against the strongest built-in opponent.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031-legend" alt="Success rates on eight football tasks. Code policies trail IPPO on all eight and MAPPO on seven, with the largest gaps on Counterattack Hard and Eleven vs Eleven." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 5.</strong> Football results under fresh seeds. Code-policy values come from larger validation batches, pooling designated replications where applicable.</figcaption>
</figure>

| Scenario | IPPO | MAPPO | Fable 5 rules |
| --- | ---: | ---: | ---: |
| Pass and Shoot | 93.7 | 92.9 | 74 |
| Run, Pass and Shoot | 73.7 | 66.0 | 72 |
| Three vs One | 91.7 | 90.0 | 81 |
| Counterattack Easy | 85.7 | 88.9 | 65 |
| Counterattack Hard | 71.6 | 81.3 | 29 |
| Corner | 50.4 | 50.5 | 41 |
| Five vs Five | 99.1 | 96.0 | 65 |
| Eleven vs Eleven | 52.7 | 45.4 | 14 |

All entries are percentages. The reinforcement-learning columns are maximum mean win rates during training. Our column reports success on 100 fresh evaluation seeds for each selected policy. These batches also informed selection during the campaigns. The following analysis examines how the policies reached these scores and what held them back.

#### A promising revision has to survive fresh seeds

In deterministic Overcooked, a saved tick survives the next evaluation from the same start. In football, a promising revision can disappear when replayed on fresh seeds. Three vs One illustrates the cost: an early policy scores 63% on one 100-episode batch and 46% on its exact replication. Larger batches become part of discovering whether an edit helped.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-rsi-rounds.png' | relative_url }}?v=20261031-legend" alt="Football evaluations across the campaigns. Individual scores fluctuate; larger-batch leaders progress more slowly. Separate markers indicate learned-policy follow-ups and excluded seed-reading evaluations." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 6.</strong> Football campaign histories. Dot size reflects evaluation size. Lines summarize the best values meeting each scenario's validation threshold; designated replications are pooled retrospectively. Triangles mark learned-policy follow-ups reported in the Pass and Shoot campaign summary. Crosses mark seed-reading evaluations, excluded from the valid frontier.</figcaption>
</figure>

#### Case study: find the shot that actually wins

Counterattack Hard shows what trace analysis can still recover. The early controller tries to draw defenders wide and cut the ball back. It wins 18 of 100 episodes. Reading the traces overturns the explanation attached to that strategy: 17 of those wins come from a shot through the central seam, while entries into the wide phase produce only one win in 54 episodes.

The agent changes the controller to seek the seam shot earlier. Attempts rise from 38 to 59 per 100 episodes, conversion stays near 48%, and overall success rises from 18% to 29%. Later rule changes fail to produce a confirmed improvement.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}"><img src="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}" loading="lazy" alt="Three actual frames from a successful round-seven football rollout: the carrier approaches the central seam at tick 60, issues a shot command at tick 65, and releases the ball by tick 74." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 7.</strong> The revised controller seeks the central shot early. These frames come from one successful round-seven rollout; the full batch wins 29 of 100 episodes. The complete replay is in Figure 1.</figcaption>
</figure>

The video makes the revision easier to interpret. The controller moves the carrier toward the center and begins shooting while defenders are still closing. It improves how often the team reaches this opportunity. The 100-episode comparison determines whether that visible change helps across random outcomes.

The useful diagnosis separates reaching an opportunity from converting it. Routing improves the first; the tested finishing rules leave the second largely unchanged. This identifies where to spend the next round of work without claiming that the remaining conversion rate is an intrinsic ceiling.

The same pressure shapes coordination. Extra passes create more opportunities for interception or a poor touch, so several campaigns abandon elaborate passing sequences. Yet teammates remain useful: the validated Three vs One leader places an attacker at the far post to collect parries, taking advantage of the scenario's disabled offside rule. The loop retains spatial support while discarding several unreliable sequences of transfers.

#### Can the initial observation predict the outcome?

An outcome-prediction experiment gives another view of the difficulty. In Three vs One, an MLP trained on 1,200 seeds predicts success from an early observation and one of eight tactical options. Held-out classification accuracy is 69.2%, compared with a 68.3% majority baseline. Its selected policy scores 76% on 100 fresh seeds, below the 80% validated leader. That feature set and training procedure recover little predictive signal about the later outcome; the result directs attention toward richer control and training across trajectories.

#### The evaluator shapes what the loop learns

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

The Overcooked result makes a case for letting coding agents build tools rather than only edit a policy file. Denied the simulator, Fable rebuilt one from the rollout traces, checked it against every recorded episode, and planned on the copy. The strongest artifact may be the model that produces the policy.

The next harness should make three distinctions explicit. Count offline search alongside official evaluations so the budget reflects the work performed. Check ceiling claims with a checker independent of the proposing agent's controller. Separate candidate selection from an isolated final evaluation on unseen randomness.

For football, the most informative next experiment is to vary where a joint script hands control to a learned subpolicy. Pass and Shoot provides one encouraging case. Testing that split across scenarios would tell us which parts of coordination benefit from explicit planning and which benefit from learning through repeated interaction.

## Acknowledgements

Thanks to Jianing Ye for helpful discussions on this project.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football references: Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. Classic Overcooked PPO references: Table 1, standard self-play.
