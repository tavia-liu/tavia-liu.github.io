---
title: "Self-Improving Code as Policies for Multi-Agent Coordination"
date: 2026-10-31
description: "I let language models write, run, and revise multi-agent controllers in Overcooked and Google Research Football. The loop plans joint schedules in the kitchen, finds team strategies on the pitch, and pairs well with learned control."
reading_time: "14 min"
permalink: /blog/self-improving-code-as-policies/
redirect_from:
  - /blog/self-improvement-ends-with-a-proof/
image: /assets/img/research/overcooked-rsi-ten-rounds.png
---

I think a language model can work out how a team should coordinate just by writing a controller, watching it fail, and rewriting it. **In Overcooked, ten rounds of this were enough to match or beat neural policies trained with PPO self-play on all five layouts.**

The setup is a simple recursive self-improvement (RSI) loop. The model writes a Python policy for the whole team, runs it, reads the trace, and decides what to change. I tried it on two benchmarks. In [Overcooked](https://github.com/HumanCompatibleAI/overcooked_ai), two chefs have to cook and deliver soup without getting in each other's way. In [Google Research Football](https://github.com/google-research/football), teammates have to move the ball past defenders and score.

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

Overcooked worked really well. Fable 5 and GPT 6.1 Sol both got there, and their best policies are joint schedules found by search programs the models wrote for themselves. Football was harder. The loop found team strategies that work and beat MAPPO on one scenario (72% vs. 66%), while trained policies led on the other seven.

I think the difference comes down to what each game asks of the controller. In the kitchen, coordination is basically a scheduling problem, so the model can reason it out and search for a schedule. In football, the team plan is only half the job; the other half is continuous control (movement, first touches, shot timing), and a learned policy is better at that than hand-written rules.

## Applying RSI to multi-agent coordination

Each round, the model writes `policy.py`, which maps the team's observations to actions for every player. The harness runs it and hands back the score, a step-level trace, a failure summary, and rendered rollouts. The model reads all of that, keeps the best policy so far, and tries again.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/rsi-loop.svg' | relative_url }}?v=20261031-loop8" alt="The language model writes policy.py, the harness runs evaluation on training seeds, and the score, trace, failure summary, and video return to the model for the next round. Offline simulation and search sit inside the model step." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 2.</strong> The RSI loop.</figcaption>
</figure>

## Benchmarks and evaluation

I use two existing benchmarks that ask for very different kinds of coordination.

| | Overcooked | Google Research Football |
| --- | --- | --- |
| Tasks | Five classic two-chef layouts | Six academy scenarios, Five vs Five, and Eleven vs Eleven |
| Dynamics | Deterministic, fixed start | Random outcomes and scripted opponents |
| Metric | Return on one 400-step evaluation episode at seed 0; 20 points per delivered soup | Success rate on 100 fresh evaluation seeds |
| Models | Fable 5 in Claude Code; GPT 6.1 Sol in Codex | Fable 5 in Claude Code |

Each Overcooked run has a budget of ten rounds, numbered 0 to 9. Overcooked is deterministic, so training and evaluation both use seed 0. In each football round, the agent runs its policy on a fresh batch of 25 to 100 random training seeds, choosing the batch size itself, and no seed is reused. Reported football scores come from 100 fresh evaluation seeds.

For reference, I compare against published RL results: PPO self-play from [Gessler et al. (2025)](https://arxiv.org/abs/2503.17821) on Overcooked, and IPPO and MAPPO from [Song et al. (2023)](https://arxiv.org/abs/2309.12951) on football. These numbers come from other implementations and protocols, so the comparison is about the level of performance reached.

## Results and Analysis

### Under deterministic dynamics: Overcooked

Both models beat the published PPO self-play mean on four layouts and tie it on Cramped Room (260 vs. 259). The biggest margin is on Counter Circuit, where PPO gets 163, GPT 6.1 Sol gets **240**, and Fable 5 gets **300**.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/overcooked-rsi-ten-rounds.png' | relative_url }}?v=20261031-final" alt="Best observed return by round on five Overcooked layouts for GPT 6.1 Sol and Fable 5, with published PPO self-play means as dashed reference lines." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 3.</strong> Overcooked returns across revisions. Lines show the best score so far, dots show individual evaluations, and dashed lines show PPO means.</figcaption>
</figure>

#### Role assignment and offline planning

The first policies are what you'd expect. Fetch an onion when a pot needs one, serve a soup when it's done. Each rule is fine on its own, but the two chefs follow them without looking at each other, and some early policies have both chefs blocking each other for most of the episode and delivering nothing.

Both models fix this the same way. They give each chef a fixed role and pass items across counters, so the chefs stop fighting over the same tiles. In Forced Coordination, GPT 6.1 Sol goes from **240 → 340** at round 6, with one chef passing onions and dishes across the counter while the other runs both pots and serves a soup every 22 steps. In Counter Circuit, Fable 5 moves onions across the middle counter in a four-step cycle, where walking them around the ring takes roughly fifteen. I think this kind of strategy is hard for RL to find by exploration, since a handoff only pays off after both chefs finish a long joint sequence and the reward only shows up when the soup is delivered.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}"><img src="{{ '/assets/img/research/counter-circuit-handoff.png' | relative_url }}" loading="lazy" alt="Three actual Counter Circuit frames at ticks 3, 4, and 5. The lower chef holds an onion, places it on the highlighted middle counter, and the upper chef retrieves it." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 4.</strong> A Counter Circuit handoff at ticks 3, 4, and 5. The lower chef supplies an onion through the highlighted counter; the upper chef retrieves it. The exchange supports a four-tick supply cycle.</figcaption>
</figure>

The part I find most interesting is how Fable 5 got its schedules. It had no access to the simulator, and nobody asked it to build one, but on three layouts it wrote its own. It reconstructed the kitchen's rules from the prompt and the recorded rollouts, replayed every earlier episode until its predictions matched the traces step for step, and then searched for schedules on that copy. On Asymmetric Advantages, a sweep over 5,040 controller configurations plus two beam searches gave 500, which held up in the real evaluation. On Counter Circuit, a wider search took a 260 schedule to **300**. GPT 6.1 Sol kept revising its rules by hand and still beat PPO.

### Under stochastic dynamics: Google Research Football

The loop gets better at football round by round, and on Run, Pass and Shoot it reaches **72%** against MAPPO's reported 66%. On the other seven scenarios MAPPO leads, with Counterattack Hard at 29% vs. 81.3% and Eleven vs Eleven at 14% vs. 45.4%.

<figure style="margin: 2rem 0; max-width: 100%;">
  <img src="{{ '/assets/img/research/football-mappo-vs-code-policy.png' | relative_url }}?v=20261031-3v1c" alt="Success rates across eight football scenarios, comparing self-evolved Fable 5 controllers with published IPPO and MAPPO results." style="display: block; width: 100%; height: auto;">
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 5.</strong> Football success rates compared with IPPO and MAPPO, using fresh evaluation seeds and pooling designated replications.</figcaption>
</figure>

The RL numbers are maximum mean win rates during training. Mine come from batches of 100 fresh seeds, which I also used to pick between candidates.

#### Strategy and execution

The loop is good at team strategy. On Counterattack Hard, an early controller tried to pull defenders wide and cut the ball back, and it won 18 of 100 episodes. Then the model read its own traces and noticed that 17 of those 18 wins came from a shot through the middle; the wide play it was built around produced exactly one. The next version went for the central shot earlier and got to **29%**.

<figure style="margin: 2rem 0;">
  <a href="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}"><img src="{{ '/assets/img/research/counterattack-hard-shot.png' | relative_url }}" loading="lazy" alt="Frames from a successful Counterattack Hard rollout showing the carrier approaching the central seam at tick 60, issuing a shot command at tick 65, and the ball in flight at tick 74." style="display: block; width: 100%; height: auto;"></a>
  <figcaption style="margin-top: .65rem; color: #65717d; font-size: .88rem; line-height: 1.5;"><strong>Figure 6.</strong> Central-shot execution in one successful Counterattack Hard rollout. The full batch records 29 wins in 100 episodes. Figure 1 contains the complete replay.</figcaption>
</figure>

Execution is where a learned policy helps. On Pass and Shoot, rules alone reach 74%. Keep the scripted opening and let a PPO policy handle the finish, and it goes to **82%**. An rMAPPO policy that the agent trained itself reaches **93.5%**.

## Conclusion

Writing code, running it, and rewriting it is enough for a language model to discover real multi-agent coordination. When the game can be planned, as in Overcooked, the model plans, and it will even rebuild the simulator to do it. When the game also needs reflexes, as in football, the model still finds the right team strategy, and the control is better left to a learned policy.

What I don't know yet is where that handoff should sit. Pass and Shoot is one scenario, and I'd guess the right split looks different in a full match. That's the next thing I want to try. If you're working on something similar, I'd love to hear about it.

## Acknowledgements

Thanks to Jianing Ye for helpful discussions on this project.

## References

1. Liang, J. et al. [Code as Policies: Language Model Programs for Embodied Control](https://arxiv.org/abs/2209.07753). ICRA, 2023.
2. Carroll, M. et al. [On the Utility of Learning about Humans for Human AI Coordination](https://proceedings.neurips.cc/paper/2019/hash/f5b1b89d98b7286673128a5fb112cb9a-Abstract.html). NeurIPS, 2019.
3. Kurach, K. et al. [Google Research Football: A Novel Reinforcement Learning Environment](https://research.google/pubs/google-research-football-a-novel-reinforcement-learning-environment/). AAAI, 2020.
4. Yu, C. et al. [The Surprising Effectiveness of PPO in Cooperative Multi Agent Games](https://papers.neurips.cc/paper_files/paper/2022/hash/9c1535a02f0ce079433344e14d910597-Abstract-Datasets_and_Benchmarks.html). NeurIPS, 2022.
5. Song, Y. et al. [Boosting Studies of Multi-Agent Reinforcement Learning on Google Research Football Environment: the Past, Present, and Future](https://arxiv.org/abs/2309.12951). arXiv, 2023. Football references: Table 3.
6. Gessler, T. et al. [OvercookedV2: Rethinking Overcooked for Zero-Shot Coordination](https://arxiv.org/abs/2503.17821). ICLR, 2025. Classic Overcooked PPO references: Table 1, standard self-play.
