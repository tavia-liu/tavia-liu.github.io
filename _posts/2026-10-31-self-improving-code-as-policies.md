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

We compare the self-evolved controllers with reported reinforcement-learning results: PPO self-play from [Gessler et al. (2025)](https://arxiv.org/abs/2503.17821) on Overcooked, and IPPO and MAPPO from [Song et al. (2023)](https://arxiv.org/abs/2309.12951) on Google Research Football.

## Results and Analysis

### Overcooked under deterministic dynamics

Both GPT 6.1 Sol and Fable 5 exceed the published PPO self-play mean on all five layouts. Their best observed returns are close on four layouts. They both reach 260 on Cramped Room and 300 on Coordination Ring; Fable 5 finishes one delivery ahead on Asymmetric Advantages, while GPT 6.1 Sol finishes one delivery ahead on Forced Coordination. The largest difference appears on Counter Circuit, where Fable 5 reaches 300 and GPT 6.1 Sol reaches 240.

The reported returns are the best observed within rounds 0 to 9. The Fable 5 Counter Circuit campaign is ongoing in the inspected record; it first reaches 300 at round 4.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}?v=20261031-bb" alt="Best observed return by round on five Overcooked layouts for GPT 6.1 Sol and Fable 5, with published PPO self-play means as dashed reference lines." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Overcooked performance across policy revisions. Solid lines show the best return so far; faint dots show individual evaluations. Dashed lines show PPO self-play means. The plotted Fable 5 Counter Circuit series contains the six evaluations available when the figure was generated.</figcaption>
</figure>

The improvement trajectories include substantial regressions. GPT 6.1 Sol initially scores zero on Cramped Room, while the first two Fable 5 Coordination Ring policies score zero. Both campaigns recover by round 2. Later revisions can also reduce performance, so the best-so-far curves summarize policy selection rather than continuous improvement in every submitted controller. The traces identify which revisions repair basic execution failures and which improve coordination after the controllers already produce soup.

#### Development of coordinated controllers

Early controllers assign each chef a list of local priorities, such as fetching an onion, collecting a plate, or serving a finished soup. Their failures often involve the interaction between two individually reasonable choices. In GPT 6.1 Sol's second Counter Circuit evaluation, each chef treats the partner as a permanent obstacle. Each needs the other's tile, and both remain stationary for 350 steps. Fable 5's second Coordination Ring policy repeatedly directs both chefs toward the same cell without resolving the conflict.

Explicit roles and object staging produce larger improvements. In Forced Coordination, GPT 6.1 Sol raises its return from 240 to 340 at round 6 by assigning a repeating supply sequence to the left chef. That chef transfers three onions and a dish across the shared counter while the right chef loads the pots and serves soup at a 22-step cadence. The policy coordinates the timing of supply with the cook's production cycle.

Counter exchanges also reduce transport costs. In Fable 5's Counter Circuit controller, the lower chef supplies onions through the middle counter and the upper chef retrieves them near the pots. The resulting supply cycle takes four steps per onion, compared with roughly fifteen for carrying an onion around the ring.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}"><img src="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}" loading="lazy" alt="Three actual Counter Circuit frames at ticks 3, 4, and 5. The lower chef holds an onion, places it on the highlighted middle counter, and the upper chef retrieves it." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> An onion transfer in Counter Circuit, verified against the step trace. The lower chef holds the onion at tick 3, the onion is on the counter at tick 4, and the upper chef has retrieved it at tick 5. This exchange supports a four-tick supply cycle.</figcaption>
</figure>

The shared counter allows the chefs to continue different tasks between transfers. Its value depends on a joint plan for what is supplied, where it is placed, and when the receiving chef needs it. These dependencies become explicit in the stronger controllers' production schedules.

#### Simulator reconstruction and offline planning

The two models develop schedules through different procedures. GPT 6.1 Sol mainly revises rules and derives schedules from observed timings. Its final Cramped Room controller follows a 30-step cycle with fixed offsets for plating, delivery, ingredient loading, and starting the next cook.

Fable 5 builds local transition models for Cramped Room, Asymmetric Advantages, and Counter Circuit using the supplied rules and recorded rollouts. It checks those models by replaying earlier episodes and comparing the predicted states with the traces, then uses the models for offline search. The agent has therefore created a planning tool from the feedback available through the permitted interface.

On Asymmetric Advantages, a sweep over 5,040 controller configurations and two beam searches on the reconstructed model produce a return of 500; official evaluation confirms that return. On Counter Circuit, the model predicts the delivery times of a two-soup schedule that scores 260 in the real environment. A wider search raises the return to 300. On Cramped Room, a search over joint chef states finds a 29-step cycle.

These cases show how deterministic feedback supports improvements beyond direct policy editing. A sufficiently accurate local model lets the agent evaluate many joint action sequences offline, then submit a selected schedule for official evaluation. The models' different results also identify useful search directions. Fable 5's reconstructed model and search improve Counter Circuit, while GPT 6.1 Sol's revised supply schedule reaches a higher return on Forced Coordination. Both planning tools and manually derived schedules contribute to the observed gains.

#### Assessment of performance bounds

Several campaigns end with arguments that further improvement is impossible. Such arguments need to cover the environment's legal schedules, including ways to coordinate that the current controller does not express.

Forced Coordination provides a direct counterexample to one proposed bound. Fable 5 estimates that the cook needs about 23 steps of work per soup and concludes that a seventeenth delivery is out of reach for its architecture. GPT 6.1 Sol uses the same broad division of labor, with one chef supplying the counter and the other operating the pots, and delivers seventeen soups. Its final delivery occurs at tick 385. Over the episode, the GPT 6.1 Sol cook walks 51 steps, compared with 69 for the Fable 5 cook. Some movement treated as unavoidable in the bound can be removed by changing the schedule.

The two models both reaching 260 on Cramped Room provides agreement on an attained score. A global optimality claim additionally depends on the coverage and correctness of the accompanying search or bound. Similarly, failure to improve a score through additional beam search establishes a plateau for that search procedure.

### Google Research Football under stochastic dynamics

The selected rule-based controllers score below the published IPPO references on all eight scenarios and below MAPPO on seven. Run, Pass and Shoot is the exception, with 72% success compared with MAPPO's reported 66%. The largest MAPPO gap is on Counterattack Hard, where the code policy reaches 29% against 81.3%. Five vs Five reaches 65% against 96%, and Eleven vs Eleven reaches 14% against 45.4%.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031-3v1c" alt="Success rates across eight football scenarios, comparing self-evolved Fable 5 controllers with published IPPO and MAPPO results." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 5.</strong> Football performance relative to IPPO and MAPPO. Code-policy values use fresh evaluation seeds, pooling designated replications where applicable.</figcaption>
</figure>

The reinforcement-learning values are maximum mean win rates observed during training. The code-policy values come from selected controllers evaluated in 100-seed batches, with designated replications pooled. These evaluations also informed candidate selection during the campaigns. In Eleven vs Eleven, the selected controller records 14 wins, 57 draws, and 29 losses in 100 matches against the strongest built-in opponent. Its draw rate captures defensive performance that the win-rate comparison alone does not show.

Three vs One requires a distinction between the original campaign and later interventions. The headline result is 75%, obtained by pooling the recorded 100-episode evaluations of rounds 47 and 48. The main comparison uses rounds 0 to 48, before the operator changed the protocol following the seed-reading evaluations. Later rounds provide diagnostic evidence about support positioning, control, and imitation of a trained policy.

#### Evaluation variability and candidate selection

Fresh seeds make replication part of the optimization process. An early Three vs One controller scores 63% on one 100-episode batch and 46% on an exact replication. A smaller screen can therefore favor a revision whose apparent advantage does not persist in a larger evaluation. The campaign histories record both improvements in the selected controller and variation in individual measurements.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-rsi-rounds.png' | relative_url }}?v=20261031-3v1c" alt="Round-by-round football evaluations, showing batch sizes, selected performance frontiers, excluded seed-reading evaluations, and the Three vs One protocol change." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 6.</strong> Football evaluation histories. Dot size indicates the number of evaluated episodes. Lines summarize the best values meeting the scenario's validation threshold, with designated replications pooled retrospectively. Triangles indicate learned-policy follow-ups; crosses indicate excluded seed-reading evaluations. The Three vs One frontier stops before the operator's protocol change.</figcaption>
</figure>

This changes how traces support revisions. In Overcooked, a collision or unnecessary movement can be checked against the same deterministic start. In football, a trace identifies a candidate failure mechanism, and repeated evaluations measure whether the corresponding change improves success across outcomes. The Counterattack Hard campaign illustrates this combination of diagnosis and verification.

#### Opportunity creation in Counterattack Hard

An early Counterattack Hard controller attempts to draw defenders toward the wing and pass the ball back toward the center. It wins 18 of 100 episodes. The trace analysis shows that 17 of those wins involve a shot through the central seam; entries into the intended wide phase produce only one win in 54 episodes. The successful trajectories identify a scoring opportunity that the controller reaches only intermittently.

The next revision directs the carrier toward that central shot earlier. Seam-shot attempts increase from 38 to 59 per 100 episodes, while their conversion rate remains near 48%. Overall success rises from 18% to 29%. The gain comes primarily from reaching the opportunity more often. Subsequent rule changes do not produce a confirmed improvement over 29%.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}"><img src="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}" loading="lazy" alt="Frames from a successful Counterattack Hard rollout showing the carrier approaching the central seam at tick 60, issuing a shot command at tick 65, and the ball in flight at tick 74." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 7.</strong> Shot preparation and execution in the revised Counterattack Hard controller. These frames show one successful round-seven rollout. The full evaluation records 29 wins in 100 episodes; Figure 1 contains the complete example replay.</figcaption>
</figure>

Separating opportunity creation from conversion makes the remaining problem more specific. The routing change increases access to the central seam, while the tested reception and finishing rules leave substantial losses after reaching it. These results motivate closer analysis of interception, possession, and shot release, alongside the distribution of shot outcomes.

#### Ball control and reception timing

The football diagnostics identify control details that are absent from a description of the team's formation or passing route. Movement direction, sprinting, and dribbling can persist across action steps. A controller must manage these states when changing from chasing the ball to receiving it, carrying it, or shooting.

In Pass and Shoot, a controller sprints toward the incoming ball and retains the sprint state after reception. The resulting sprint-and-dribble behavior allows the defender to take possession in the diagnostic probes. Releasing sprint while keeping dribble active lets the carrier retain the ball for longer in those probes. In Three vs One, another revision activates dribble shortly before reception while preserving the receiver's diagonal movement, then shoots on the first possession step. These experiments make the timing of state changes part of the policy being optimized.

Inspection of a trained MAPPO policy provides a more detailed example. The later Three vs One diagnostics record an opening that sends a loose ball toward the penalty area and draws the goalkeeper away from the goal line. The receiving player uses a buffered first-touch shot for a low ball and a control-then-release sequence for a higher, bouncing delivery. Those responses depend on the ball's current flight and the positions of the goalkeeper and defender.

The agent reproduces the reference policy's opening delivery with a scripted action sequence, then tests receiving and finishing rules. A subsequent imitation controller records 56 wins on 100 fresh evaluation seeds. The diagnostic log reports 91% for the MAPPO reference actor on fresh seeds in the same evaluator. The opening can be replicated more closely than the subsequent interception and finishing behavior. This comparison identifies feedback control after the pass as a concrete target for improvement.

Teammate support also remains useful. In the later Three vs One rounds, placing an attacker at the far post allows the team to collect goalkeeper parries under the scenario's disabled offside rule. That controller scores 81% on 100 fresh evaluation seeds. These follow-ups show a contribution from spatial support even as several more elaborate passing sequences are abandoned.

#### Outcome prediction from early observations

A separate Three vs One experiment trains an MLP on 1,200 seeds to predict success from an early observation and one of eight tactical options. Held-out classification accuracy is 69.2%, compared with a 68.3% majority baseline. The resulting option selector scores 76% on 100 fresh seeds, below the later rule-based controller's 81% evaluation. This predictor adds little to the tested controller. The result concerns that observation point, feature set, and learning procedure; the MAPPO diagnostics above examine control adjustments made throughout the subsequent trajectory.

#### Generalization across evaluation seeds

The earlier fixed-seed campaigns achieve high development scores by improving particular trajectories. Their performance changes substantially when evaluated on other engine seeds.

| Task | Fixed-seed development success | Success in the held-out audit |
| --- | ---: | ---: |
| Three vs One | 100% | 20% |
| Counterattack Easy | 100% | 0% |
| Counterattack Hard | 100% | 0% |

The archived audit contains ten held-out engine seeds, with 100 repeated episodes per seed. The 1,000 episodes therefore cover ten distinct seeds. On these tasks, success on the development trajectory transfers poorly to that seed set. Repeating an episode at the same seed measures reproducibility of the trajectory; evaluating new seeds measures a different property.

The Three vs One campaign also exposes a failure of evaluator isolation. One submitted controller reads the engine seed, recreates the hidden episode, tests sixteen candidate options, and executes an option it has already observed winning. It records 100% success on both 100- and 300-episode evaluations. Those submissions are excluded because they use hidden evaluation information. The operator subsequently prohibits seed access and nested environments, and the campaign continues under the revised rule.

These findings motivate two distinct evaluation controls. Hidden seeds and access to the test environment must be excluded from the policy's execution interface. Candidate selection also needs a final evaluation that remains untouched during iteration. Fresh seeds address dependence on particular trajectories, while execution isolation prevents a controller from inspecting the outcome it is supposed to predict through interaction.

#### Control interfaces and learned subpolicies

The control interface changes which decisions the policy can make. On Counterattack Easy, moving from a fixed controlled roster to the benchmark's proximity-based player assignment raises the observed frontier from 35% to 65%. The engine can transfer a control slot to the receiver as the ball moves. This interface change affects the controller's ability to execute the attack as well as its apparent strategy.

A separate Five vs Five campaign supplies named formations, including a diamond and a square with a far-post goalkeeper screen. Its best formation scores 64% on re-evaluation, compared with 65% for free-form evolution. Under those evaluations, the strategy prior does not improve the selected controller.

The Pass and Shoot campaign then changes the policy representation. Its recorded summary reports 74% for the best rule-based controller, 82% for a scripted opening followed by a PPO finishing subpolicy, and 93.5% for an rMAPPO policy trained by the agent and evaluated over two 100-episode batches. The sequence supports testing a division of work in which code specifies team structure and learned subpolicies handle reception and finishing.

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
