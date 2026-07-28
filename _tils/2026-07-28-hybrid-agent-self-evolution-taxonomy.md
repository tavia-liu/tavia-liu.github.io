---
title: "Hybrid Agent Self-Evolution Taxonomy"
date: 2026-07-28
description: "A working taxonomy for self-evolving LLM agents."
tags: [literature, agents, code-as-policy, self-evolution]
status: "working note"
visibility: public
---

This is a working map, not a finished survey. I am grouping papers by the artifact that is actually changing:

- **policy code**: executable code that directly acts in the world
- **harness code**: the agent loop, tools, memory, prompts, routing, and orchestration
- **policy component**: a tool, reward, skill, or module inside the larger policy
- **non-code memory / data / weights**: text reflections, synthetic tasks, trajectories, or model parameters

My current bias: the most interesting line is where *the agent edits the executable substrate it later depends on*. That is the line between "using code as an action" and "treating the agent itself as an evolving software system."

## 1. Direct Code-as-Policy

The generated code is close to the action policy. This is the cleanest connection to robotics / embodied agents.

| Paper | What evolves | My note |
| --- | --- | --- |
| **Code as Policies, 2022** ([arXiv][1]) | Python policy programs over robot APIs. | Foundational, but mostly one-shot generation rather than persistent self-improvement. |
| **Voyager, 2023** ([arXiv][2]) | Minecraft skill programs. | Strong execution-feedback loop; skill library growth/pruning is the weak point. |
| **SMAC-R1, 2024–2025** ([Deep Learning Monitor][3]) | Python decision-tree combat scripts. | Interesting bridge from script search to SFT/GRPO, but centralized and SMAC-specific. |
| **CaP-X, 2026** ([arXiv][4]) | Robot programs from perception/control primitives. | Good benchmark framing; still depends heavily on the primitive interface. |
| **RHO, 2026** ([arXiv][5]) | Multi-file robot policy repositories. | Feels closest to "coding agent as roboticist"; compute and sandboxing become central. |
| **Self-Evolving Software Agents, 2026** ([arXiv][6]) | Goals, reasoning structures, and behaviors. | Conceptually broad; I need to check how much executable behavior really persists across generations. |

## 2. Harness-as-Policy

Here the "policy" is not just an action function. It is the whole agent harness: what gets retrieved, which model is called, how tools are used, how traces are summarized, and how the next step is chosen.

| Paper | What evolves | My note |
| --- | --- | --- |
| **STOP, 2023** ([arXiv][7]) | The optimizer scaffold itself. | Early recursive-improvement framing; tasks are still small and the LM is fixed. |
| **GPTSwarm, 2024** ([PMLR][8]) | Agent graph prompts and edges. | Useful abstraction, but the editable space is narrower than arbitrary source code. |
| **ADAS / Meta Agent Search, 2024** ([arXiv][9]) | Code-defined agent designs. | The discovered agents evolve; the meta-search procedure is still fixed. |
| **AFlow, 2024** ([arXiv][10]) | Executable workflow code. | Nice workflow-search formulation; evaluation cost is the obvious bottleneck. |
| **Gödel Agent, 2024** ([arXiv][11]) | Self-referential agent logic. | Important idea, but I want stronger evidence for stable long-horizon improvement. |
| **SICA, 2025** ([arXiv][12]) | The coding agent's own source. | Direct and clean setup; benchmark overfitting is a major concern. |
| **Darwin Gödel Machine, 2025** ([arXiv][13]) | A population/archive of coding agents. | More open-ended than single-agent self-editing; expensive and needs careful containment. |
| **Meta-Harness, 2026** ([arXiv][14]) | Complete harness candidates and traces. | Strong "agent-as-software" flavor; mostly optimizes information management. |
| **Agentic Harness Engineering, 2026** ([arXiv][15]) | Tools, memory, middleware, prompts. | I like the emphasis on observability and reversible edits. |
| **Retrospective Harness Optimization, 2026** ([arXiv][16]) | Skills/tools/workflows from past failures. | Nice use of old trajectories; self-preference may amplify model bias. |
| **Adaptive Auto-Harness, 2026** ([arXiv][17]) | A tree of specialized harnesses. | More realistic for changing task streams, but less elegant than one self-contained agent. |
| **Self-Programmed Execution, 2026** ([arXiv][18]) | Executable orchestration per completion. | Feels like an architectural precursor; persistence/selection across tasks is the missing piece. |

## 3. Policy Components

These systems evolve something that shapes the policy, but not necessarily the whole controller.

| Paper | What evolves | My note |
| --- | --- | --- |
| **Eureka, 2023** ([arXiv][19]) | Reward-function code. | Very influential, but the evolved artifact is the objective, not the acting policy. |
| **AgentOptimizer, 2024** ([arXiv][20]) | Tool functions. | Treating functions as learnable weights is a useful lens. |
| **AgentSquare, 2024** ([arXiv][21]) | Planning/reasoning/tool/memory modules. | Clean modular search; limited by the predefined module space. |
| **EvoTool, 2026** ([arXiv][22]) | Tool-use modules. | Blame assignment is the interesting part; cross-module failures are hard. |
| **GPTSwarm, 2024** ([PMLR][8]) | Prompts and graph edges. | Also fits here if I view each graph node as a policy component. |
| **Voyager, 2023** ([arXiv][2]) | Reusable skill programs. | Also fits here because the skill library is only part of the full agent. |

## 4. Non-Code Self-Evolution

The system changes text, memories, data, or weights rather than executable agent code.

| Paper | What evolves | My note |
| --- | --- | --- |
| **Self-Refine, 2023** ([arXiv][23]) | In-context critique and revision. | Useful baseline, but improvements usually disappear after the task. |
| **Reflexion, 2023** ([arXiv][24]) | Natural-language reflections. | Persistent memory, but the memory can become noisy or misleading. |
| **GEPA, 2025** ([arXiv][25]) | Prompt mutations from trajectory reflection. | Strong prompt-evolution result; not code/harness evolution. |
| **EvolveR, 2025–2026** ([arXiv][26]) | Strategic principles from experience. | More like experience distillation than executable self-modification. |
| **AgentEvolver, 2025** ([arXiv][27]) | Self-generated tasks and RL signals. | I need to check whether the task generator discovers blind spots or just repeats what the model already knows. |
| **Q-Evolve, 2026** ([arXiv][28]) | Policy, critic, and trajectory dataset. | Model-weight learning, not Code-as-Policy evolution. |

## Outside This Map

**FunSearch** and **AlphaEvolve** evolve executable algorithms, but the program is usually the answer to a problem, not the policy/harness of an autonomous agent.

**CodeAct** is related because code is used as an action interface. I would keep it outside the core tables unless the code revisions are retained across tasks.

## Questions For Later

- Is "harness-as-policy" too broad, or is it the right abstraction for LLM agents?
- For robotics, where is the boundary between policy code and a skill library?
- Which papers actually preserve improvements across tasks, not just within one episode?
- What evaluation would distinguish real self-evolution from benchmark-driven prompt/tool tuning?

[1]: https://arxiv.org/abs/2209.07753 "Code as Policies: Language Model Programs for Embodied Control"
[2]: https://arxiv.org/abs/2305.16291 "Voyager: An Open-Ended Embodied Agent with Large Language Models"
[3]: https://deeplearn.org/arxiv/583522/smac-r1%3A-the-emergence-of-intelligence-in-decision-making-tasks "SMAC-R1: The Emergence of Intelligence in Decision-Making Tasks - Paper Detail"
[4]: https://arxiv.org/abs/2603.22435 "CaP-X: A Framework for Benchmarking and Improving Coding Agents for Robot Manipulation"
[5]: https://arxiv.org/abs/2606.16458 "RHO: Your Coding Agent is Secretly a Roboticist"
[6]: https://arxiv.org/abs/2604.27264 "[2604.27264] Self-Evolving Software Agents"
[7]: https://arxiv.org/abs/2310.02304 "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation"
[8]: https://proceedings.mlr.press/v235/zhuge24a.html "GPTSwarm: Language Agents as Optimizable Graphs"
[9]: https://arxiv.org/abs/2408.08435 "Automated Design of Agentic Systems"
[10]: https://arxiv.org/abs/2410.10762 "AFlow: Automating Agentic Workflow Generation"
[11]: https://arxiv.org/abs/2410.04444 "Gödel Agent: A Self-Referential Agent Framework for Recursive Self-Improvement"
[12]: https://arxiv.org/abs/2504.15228 "A Self-Improving Coding Agent"
[13]: https://arxiv.org/abs/2505.22954 "Darwin Godel Machine: Open-Ended Evolution of Self-Improving Agents"
[14]: https://arxiv.org/abs/2603.28052 "Meta-Harness: End-to-End Optimization of Model Harnesses"
[15]: https://arxiv.org/abs/2604.25850 "Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses"
[16]: https://arxiv.org/abs/2606.05922 "Retrospective Harness Optimization: Improving LLM Agents via Self-Preference over Trajectory Rollouts"
[17]: https://arxiv.org/abs/2606.01770 "Adaptive Auto-Harness: Sustained Self-Improvement for Agentic System Deployment on Open-Ended Task Streams"
[18]: https://arxiv.org/abs/2605.06898 "[2605.06898] Self-Programmed Execution for Language-Model Agents"
[19]: https://arxiv.org/abs/2310.12931 "Eureka: Human-Level Reward Design via Coding Large Language Models"
[20]: https://arxiv.org/abs/2402.11359 "Offline Training of Language Model Agents with Functions as Learnable Weights"
[21]: https://arxiv.org/abs/2410.06153 "AgentSquare: Automatic LLM Agent Search in Modular Design Space"
[22]: https://arxiv.org/abs/2603.04900 "EvoTool: Self-Evolving Tool-Use Policy Optimization in LLM Agents via Blame-Aware Mutation and Diversity-Aware Selection"
[23]: https://arxiv.org/abs/2303.17651 "Self-Refine: Iterative Refinement with Self-Feedback"
[24]: https://arxiv.org/abs/2303.11366 "Reflexion: Language Agents with Verbal Reinforcement Learning"
[25]: https://arxiv.org/abs/2507.19457 "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning"
[26]: https://arxiv.org/abs/2510.16079 "[2510.16079] EvolveR: Self-Evolving LLM Agents through an Experience-Driven Lifecycle"
[27]: https://arxiv.org/abs/2511.10395 "AgentEvolver: Towards Efficient Self-Evolving Agent System"
[28]: https://arxiv.org/abs/2606.07367 "Self-evolving LLM agents with in-distribution Optimization"
