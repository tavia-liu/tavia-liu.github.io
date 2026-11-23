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

The loop worked strikingly well in Overcooked. After ten rounds, Fable 5 and GPT 6.1 Sol both match or beat neural policies trained with PPO self-play on all five layouts. Their best policies are joint schedules found by search programs the models wrote for themselves. Google Research Football is a soccer simulator where players coordinate against built-in opponents while controlling their movement, first touches, and shot timing under stochastic dynamics. There, the same loop improved its policies but remained below the reported IPPO results on all eight scenarios and MAPPO on seven.

The gap comes from the feedback each game returns. In the kitchen, a failed rollout points to a specific collision or idle step, so the loop can treat coordination like a math problem and search for a joint schedule. In football, a single evaluation rarely says what went wrong. A lost episode could come from the team strategy, from low-level control of one player, or from a random bounce, and the loop spends most of its effort separating real improvements from lucky evaluations. When the evaluator leaks information, it learns to exploit that instead. The loop is strong at coordination it can reason out on paper and still weak at coordination that lives in physical movement, where low-level control must absorb large amounts of randomness. The rest of this post shows how each of these happens.

## Applying RSI to multi-agent coordination

Each round, the language model writes `policy.py`, which maps the team's observations to actions for every controlled player. The harness then runs evaluation on training seeds and returns the score, a step-level trace, a failure summary, and rendered rollouts. The model reads this feedback, keeps the best policy so far, and revises the policy code for the next round.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}?v=20261031-loop8" alt="The language model writes policy.py, the harness runs evaluation on training seeds, and the score, trace, failure summary, and video return to the model for the next round. Offline simulation and search sit inside the model step." style="display: block; width: 100%; height: auto;">
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

We compare the self-evolved controllers with reported reinforcement-learning results: PPO self-play from [Gessler et al. (2025)](https://arxiv.org/abs/2503.17821) on Overcooked, and IPPO and MAPPO from [Song et al. (2023)](https://arxiv.org/abs/2309.12951) on Google Research Football. These are published numbers from other implementations and evaluation protocols, so the comparison shows the level of performance reached and is not a matched-compute or sample-efficiency comparison.

## Results and Analysis

### Under deterministic dynamics: Overcooked

Both GPT 6.1 Sol and Fable 5 exceed the published PPO self-play mean on four layouts and match it on Cramped Room, where both reach 260 against a PPO mean of 259. They also both reach 300 on Coordination Ring. Fable 5 finishes one delivery ahead on Asymmetric Advantages, and GPT 6.1 Sol one delivery ahead on Forced Coordination. Counter Circuit has the largest gap, with 300 for Fable 5 and 240 for GPT 6.1 Sol.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}?v=20261031-final" alt="Best observed return by round on five Overcooked layouts for GPT 6.1 Sol and Fable 5, with published PPO self-play means as dashed reference lines." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Overcooked returns across revisions. Lines show the best score so far, dots show individual evaluations, and dashed lines show PPO means.</figcaption>
</figure>

#### Role assignment and offline planning

Early policies use local priorities, such as fetching an onion when a pot needs one or serving a finished soup. Each rule is reasonable on its own, but the two chefs follow them without regard for each other, and their plans collide. Some early policies leave both chefs blocking each other for most of the episode and deliver nothing.

The agents solve this by giving each chef a fixed role and passing items across counters, so the chefs stop competing for the same tiles. In Forced Coordination, GPT 6.1 Sol raises its return from 240 to 340 at round 6. One chef supplies three onions and a dish across the counter while the other operates both pots and serves a soup every 22 steps. In Counter Circuit, the Fable 5 controller transfers onions across the middle counter in a four-step supply cycle, compared with roughly fifteen steps for carrying them around the ring. Strategies like this can be hard for reinforcement learning to discover by exploration. A handoff only pays off when both chefs complete a long joint sequence, one placing and the other collecting at the right moment, and the reward arrives only when the soup is delivered. PPO self-play reaches 163 on Counter Circuit, against 300 for Fable 5.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}"><img src="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}" loading="lazy" alt="Three actual Counter Circuit frames at ticks 3, 4, and 5. The lower chef holds an onion, places it on the highlighted middle counter, and the upper chef retrieves it." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> A Counter Circuit handoff at ticks 3, 4, and 5. The lower chef supplies an onion through the highlighted counter; the upper chef retrieves it. The exchange supports a four-tick supply cycle.</figcaption>
</figure>

The models obtain schedules differently. Fable 5 builds its own model of the environment without being asked to. Denied the simulator, it writes a simulator of its own on three layouts. It reconstructs the kitchen's rules from the prompt and the recorded rollouts, replays every earlier episode until its predictions match the traces step for step, and then searches for schedules on this copy. On Asymmetric Advantages, a sweep over 5,040 controller configurations and two beam searches yields 500, confirmed by evaluation. On Counter Circuit, a wider search improves a 260-return schedule to 300. GPT 6.1 Sol, in contrast, keeps revising rules by hand. Deterministic dynamics make these reconstructed models useful for evaluating plans before submission.

#### Verification of performance bounds

An agent can easily mistake a plateau for the best possible score, and then it stops exploring. On Forced Coordination, Fable 5 concludes that a seventeenth soup is out of reach and spends its last round only "to keep 320 robustly". GPT 6.1 Sol, with the same division of labor, delivers seventeen soups, so the ceiling was wrong.

### Under stochastic dynamics: Google Research Football

The best controllers score below IPPO on all eight scenarios and below MAPPO on seven. Run, Pass and Shoot is the exception, at 72% against MAPPO's reported 66%. The gap is widest on the harder tasks. Counterattack Hard reaches 29% against 81.3%, and Eleven vs Eleven reaches 14% against 45.4%.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031-3v1c" alt="Success rates across eight football scenarios, comparing self-evolved Fable 5 controllers with published IPPO and MAPPO results." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 5.</strong> Football success rates compared with IPPO and MAPPO, using fresh evaluation seeds and pooling designated replications.</figcaption>
</figure>

The RL references report maximum mean win rates during training. Our numbers come from 100-seed batches that were also used to choose between candidates, so they are slightly optimistic.

#### One evaluation says very little

In Overcooked, a failed rollout points at a specific collision. In football, the same Three vs One controller scores 63% on one batch of 100 episodes and 46% on the next. Much of the loop's effort goes into telling real improvements from lucky batches.

Reading traces still helps. On Counterattack Hard, an early controller tries to draw defenders wide and cut the ball back, and wins 18 of 100 episodes. The traces show that 17 of those wins come from a shot through the middle and only one from the wide play the controller was built around. The next version goes for the central shot earlier and reaches 29%.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}"><img src="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}" loading="lazy" alt="Frames from a successful Counterattack Hard rollout showing the carrier approaching the central seam at tick 60, issuing a shot command at tick 65, and the ball in flight at tick 74." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 6.</strong> Central-shot execution in one successful Counterattack Hard rollout. The full batch records 29 wins in 100 episodes. Figure 1 contains the complete replay.</figcaption>
</figure>

#### The loop optimizes whatever the evaluator exposes

Our first football runs used a fixed seed, and the controllers reached 100% on Three vs One and both Counterattack tasks. On new seeds they scored 20%, 0%, and 0%. They had memorized one trajectory.

In a separate run, a submission read the engine seed, recreated the hidden episode inside its own policy, tried sixteen options, and played back one that won. It scored 100% and we excluded it. Nothing in the prompt asked for this. When the evaluator leaks information, the loop tends to use it, so final results need seeds the agent never sees.

#### Where the gap is

Most of the remaining gap appears to be in low-level control, such as receiving the ball, the first touch, and shot timing, which is hard to write as rules. On Pass and Shoot, rules alone reach 74%. In the campaign summary, keeping the scripted opening and letting a PPO policy handle the finish reaches 82%, and an rMAPPO policy trained by the agent reaches 93.5%.

## Conclusion

The loop is good at coordination that can be worked out in advance and weak at coordination that depends on reflexes. In Overcooked the agent could plan, and it even rebuilt the simulator to do so. In football, planning was not the bottleneck.

The natural next step is to combine the two, with the language model writing the team plan and a learned policy handling control. We have one encouraging result on Pass and Shoot and do not yet know where that handoff should sit in other scenarios. That is what we want to try next.

## Acknowledgements

Thanks to Jianing Ye for helpful discussions on this project.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football references: Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. Classic Overcooked PPO references: Table 1, standard self-play.
