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
      <video controls muted playsinline preload="none" poster="{{ '/assets/img/research/coordination-ring-poster.png' | relative_url }}" aria-label="Recorded Overcooked rollout of the joint schedule from round six" style="display: block; width: 100%; height: 300px; object-fit: contain; background: #f6f5f2; border-radius: 8px;">
        <source src="{{ '/assets/media/code-policies/coordination-ring-run006.mp4' | relative_url }}" type="video/mp4">
        <a href="{{ '/assets/media/code-policies/coordination-ring-run006.mp4' | relative_url }}">Watch the Overcooked rollout</a>
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
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}?v=20261031-loop6" alt="The language model writes policy.py, the harness runs evaluation on training seeds, and the score, trace, failure summary, and video return to the model for the next round. Offline simulation and search sit inside the model step." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> The RSI loop.</figcaption>
</figure>

## Benchmarks and evaluation

We use two existing benchmarks with different demands on coordination, [Overcooked](https://github.com/HumanCompatibleAI/overcooked_ai) and [Google Research Football](https://github.com/google-research/football):

| | Overcooked | Google Research Football |
| --- | --- | --- |
| Tasks | Five classic two-chef layouts | Six academy scenarios, Five vs Five, and Eleven vs Eleven |
| Dynamics | Deterministic, fixed start | Random outcomes and scripted opponents |
| Metric | Soup reward over 400 steps; 20 points per delivery | Success rate on 100 fresh evaluation seeds |
| Models | Fable 5 in Claude Code; GPT 6.1 Sol in Codex | Fable 5 in Claude Code |

Each Overcooked run has a budget of ten rounds, numbered 0 to 9. Overcooked is deterministic, so training and evaluation both use seed 0. In each football round, the agent runs its policy on a fresh batch of 25 to 100 random training seeds, choosing the batch size itself, and no seed is reused. Reported football scores come from 100 fresh evaluation seeds, or 300 for Three vs One. The football campaigns have varying stopping rules and lengths.

Official evaluation rounds are one part of the computation. The agent can run offline simulations and search between them, and these become central to the Overcooked results. We compare the self-evolved controllers with reported reinforcement-learning results: PPO self-play from [Gessler et al. (2025)](https://arxiv.org/abs/2503.17821) on Overcooked, and IPPO and MAPPO from [Song et al. (2023)](https://arxiv.org/abs/2309.12951) on Google Research Football. Our experiment measures team performance from one campaign per model and task, with access to joint observations and control of the team.

## Results: strong schedules in Overcooked, a larger gap in football

### Overcooked: two models arrive at nearly the same scores

Both models finish above the published PPO self-play mean on all five layouts. The two models agree at 260, 500, and 340 on Cramped Room, Asymmetric Advantages, and Forced Coordination. GPT finishes one soup ahead on Coordination Ring and Counter Circuit.

| Layout | PPO self-play | Fable 5 | GPT 6.1 Sol |
| --- | ---: | ---: | ---: |
| Cramped Room | 259 | **260** | **260** |
| Asymmetric Advantages | 278 | **500** | **500** |
| Coordination Ring | 214 | 340 | **360** |
| Forced Coordination | 199 | **340** | **340** |
| Counter Circuit | 163 | 260 | **280** |

PPO values are the standard self-play means in [Gessler et al., Table 1](https://arxiv.org/html/2503.17821v1#S5.T1), measured on classic Overcooked. The code-policy columns report each campaign's best evaluated score within rounds 0–9.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}?v=20261031-ppo" alt="Best reward across ten rounds on five Overcooked layouts. The models tie on three layouts; GPT finishes one delivery ahead on the other two." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Overcooked over ten rounds. Solid lines show the best score so far; faint dots show individual evaluations. Dashed lines show the PPO reference values.</figcaption>
</figure>

The starting policies differ much more than the final ones. GPT begins with zero reward on two layouts, then recovers to match Fable on three layouts and finish one soup ahead on two. The trajectories below explain what changes between those first rules and the final schedules.

### Football: iteration improves rules, but most gaps remain

The strongest rule-based football policies fall below the IPPO reference on all eight scenarios, and below MAPPO on seven. Run, Pass and Shoot is the exception: 72% compared with MAPPO's reported 66%. The largest gaps appear on Counterattack Hard and the full Eleven vs Eleven game, where the controller wins 14 of 100 matches and draws 57 against the strongest built-in opponent.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031-11v11" alt="Success rates on eight football tasks. Code policies trail IPPO on all eight and MAPPO on seven, with the largest gaps on Counterattack Hard and Eleven vs Eleven." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> Football results under fresh seeds. Code-policy values come from larger validation batches, pooling designated replications where applicable. IPPO and MAPPO are published references from Song et al. (2023).</figcaption>
</figure>

| Scenario | IPPO | MAPPO | Fable 5 rules |
| --- | ---: | ---: | ---: |
| Pass and Shoot | 93.7 | 92.9 | 74 |
| Run, Pass and Shoot | 73.7 | 66.0 | 72 |
| Three vs One | 91.7 | 90.0 | 80 |
| Counterattack Easy | 85.7 | 88.9 | 65 |
| Counterattack Hard | 71.6 | 81.3 | 29 |
| Corner | 50.4 | 50.5 | 41 |
| Five vs Five | 99.1 | 96.0 | 65 |
| Eleven vs Eleven | 52.7 | 45.4 | 14 |

All entries are percentages. The reinforcement-learning columns are maximum mean win rates during training from [Song et al., Table 3](https://arxiv.org/html/2309.12951v1#S4.T3). Our column reports success on fresh evaluation seeds for selected policies, with at least 100 episodes and 300 for Three vs One. These batches also informed selection during the campaigns. The following analysis examines how the policies reached these scores and what held them back.

## Insight 1: the loop learns to turn coordination into search

The Overcooked campaigns move through three increasingly explicit representations of coordination.

They begin with reactive rules. Fetch an onion when a pot needs one; take a plate when soup is ready; walk to the next station. These policies can produce soup, but they also expose basic failures immediately. Two chefs try to swap places in a narrow corridor and block each other. A controller misreads the map and interacts with the wrong tile. GPT's first Coordination Ring policy makes 395 interactions that accomplish nothing.

The next representation is division of labor. One chef loads while the other serves. A supplier stays near the dispenser while a courier works near the pot. The controller begins staging ingredients during cooking so that the next batch can start as soon as the pot clears. Counters become buffers: one agent leaves an object for the other to consume later. Fable's Forced Coordination policy assigns separate meanings to a lane, a buffer, and a staging slot.

The strongest representation is a joint schedule. The agent builds a model of the kitchen, searches over both chefs' actions, and emits a sequence for the team to execute. In eight of the ten campaigns, an agent-written search program produces the final schedule. GPT's Coordination Ring search explores about 1.49 million states; Fable's Counter Circuit search tries about 830,000 plan mutations. The executors check live state against the expected state and retain a reactive fallback.

### Case study: a plate crosses the center counter

A short sequence from GPT's round-six Coordination Ring controller shows what a joint schedule captures. At tick 219, the green chef holds a plate on the left of the kitchen. At tick 220, the plate sits on the center counter. At tick 222, the blue chef has retrieved it from the right, while the green chef is already collecting the next onion.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/coordination-ring-handoff.png' | relative_url }}"><img src="{{ '/assets/img/research/coordination-ring-handoff.png' | relative_url }}" loading="lazy" alt="Three real rollout frames at ticks 219, 220, and 222. The green chef carries a plate, stages it on the highlighted center counter, and the blue chef retrieves it as the green chef collects an onion." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 5.</strong> A plate handoff in Coordination Ring, checked against the step trace. The highlighted counter lets the chefs exchange an object while continuing different jobs. The next soup becomes ready at tick 223.</figcaption>
</figure>

The plate has to arrive before the soup finishes cooking. The chef who fetched it can then return to ingredient collection while the other plates the soup. This is a concrete dependency between two agents' plans: an object, a place, and a time connect their otherwise separate routes. Searching the joint action sequence makes that dependency explicit.

The important shift is what gets improved. Early rounds modify the controller directly. Later rounds improve a program that finds controllers. A language model can reach a strong policy by constructing a useful search procedure, making simulator accuracy and search coverage part of the RSI process.

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
  <img src="{{ '/assets/img/research/football-rsi-rounds.png' | relative_url }}?v=20261031-11v11" alt="Football evaluations across the campaigns. Individual scores fluctuate; larger-batch leaders progress more slowly. Separate markers indicate learned-policy follow-ups and excluded seed-reading evaluations." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 6.</strong> Football campaign histories. Dot size reflects evaluation size. Lines summarize the best values meeting each scenario's validation threshold; designated replications are pooled retrospectively. Triangles mark learned-policy follow-ups reported in the Pass and Shoot campaign summary. Crosses mark seed-reading evaluations, excluded from the valid frontier.</figcaption>
</figure>

### Case study: find the shot that actually wins

Counterattack Hard shows what trace analysis can still recover. The early controller tries to draw defenders wide and cut the ball back. It wins 18 of 100 episodes. Reading the traces overturns the explanation attached to that strategy: 17 of those wins come from a shot through the central seam, while entries into the wide phase produce only one win in 54 episodes.

The agent changes the controller to seek the seam shot earlier. Attempts rise from 38 to 59 per 100 episodes, conversion stays near 48%, and overall success rises from 18% to 29%. Later rule changes fail to produce a confirmed improvement.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}"><img src="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}" loading="lazy" alt="Three actual frames from a successful round-seven football rollout: the carrier approaches the central seam at tick 60, issues a shot command at tick 65, and releases the ball by tick 74." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 7.</strong> The revised controller seeks the central shot early. These frames come from one successful round-seven rollout; the full batch wins 29 of 100 episodes. The complete replay is in Figure 1.</figcaption>
</figure>

The video makes the revision easier to interpret. The controller moves the carrier toward the center and begins shooting while defenders are still closing. It improves how often the team reaches this opportunity. The 100-episode comparison determines whether that visible change helps across random outcomes.

The useful diagnosis separates reaching an opportunity from converting it. Routing improves the first; the tested finishing rules leave the second largely unchanged. This identifies where to spend the next round of work without claiming that the remaining conversion rate is an intrinsic ceiling.

The same pressure shapes coordination. Extra passes create more opportunities for interception or a poor touch, so several campaigns abandon elaborate passing sequences. Yet teammates remain useful: the validated Three vs One leader places an attacker at the far post to collect parries, taking advantage of the scenario's disabled offside rule. The loop retains spatial support while discarding several unreliable sequences of transfers.

### Can the initial observation predict the outcome?

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

## Acknowledgements

Thanks to Jianing Ye for helpful discussions on this project.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football references: Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. Classic Overcooked PPO references: Table 1, standard self-play.
