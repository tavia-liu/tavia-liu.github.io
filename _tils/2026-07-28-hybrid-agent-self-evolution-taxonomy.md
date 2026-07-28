---
title: "Hybrid Agent Self-Evolution Taxonomy"
date: 2026-07-28
description: "A taxonomy of hybrid self-evolving agent systems by the artifact each method primarily optimizes."
tags: [literature, agents, code-as-policy, self-evolution]
status: "note"
visibility: public
---

I classify hybrid systems **once by the artifact they primarily optimize**. The limitation column is my assessment based on each paper's method and evaluation scope.

## 1. Direct Code-as-Policy evolution

Here, the evolving executable code directly controls an environment or implements the agent's action policy.

| Paper | Method — two sentences | Main limitation — one sentence | My notes |
| --- | --- | --- | --- |
| **Code as Policies, 2022** — foundational precursor | The LLM generates hierarchical Python programs that compose perception outputs, geometry libraries, and robot-control APIs. The resulting program can implement waypoint policies, feedback loops, and reactive controllers. ([arXiv][1]) | It generates policies largely in one pass and does not contain a persistent execution-feedback self-improvement loop. |  |
| **Voyager, 2023** | Voyager generates executable Minecraft skills, tests them in the environment, and revises failed programs using execution errors and self-verification. Successful programs are stored in a reusable skill library and composed to solve progressively harder tasks. ([arXiv][2]) | Its improvement depends on Minecraft-specific APIs and an ever-growing library without a strong mechanism for pruning outdated or redundant skills. |  |
| **SMAC-R1, 2024–2025** | A planner-coder-critic loop generates Python decision-tree scripts that centrally control allied StarCraft units and encode tactics such as positioning and focus fire. Environmental rewards, errors, win rates, and combat statistics guide script revision, after which successful scripts support SFT and GRPO training. ([Deep Learning Monitor][3]) | It is a centralized controller evaluated mainly in SMAC, so it does not demonstrate decentralized agent policies or broad transfer outside closely related combat environments. |  |
| **CaP-X, 2026** | CaP-X evaluates coding agents that synthesize robot programs from perception and control primitives, then improves execution through multi-turn feedback, visual differencing, skill synthesis, and ensembled reasoning. CaP-Agent0 scales test-time agentic search, while CaP-RL updates the coding model using verifiable environmental rewards. ([arXiv][4]) | Performance remains sensitive to the quality and abstraction level of the human-provided perception and control primitives. |  |
| **RHO: Your Coding Agent Is Secretly a Roboticist, 2026** | Robotics Harness Optimization searches over multi-file neurosymbolic policy repositories containing prompts, tools, perception logic, and control code. A coding agent proposes repository modifications during training and evaluates them using execution outcomes and environmental rewards before deploying the selected repository. ([arXiv][5]) | The search is computationally intensive and currently validated mainly on structured robot-manipulation environments with predefined low-level primitives. |  |
| **Self-Evolving Software Agents, 2026** | The framework combines BDI reasoning with an LLM-based evolution module that derives new requirements from experience. It then modifies agent goals, reasoning structures, and executable behaviors to address changes in a dynamic environment. ([arXiv][6]) | The prototype still faces unresolved problems in behavioral inheritance, stability, and preserving useful behavior across generations. |  |

## 2. Harness-as-Policy evolution

Here, the evolving code determines how the complete LLM agent reasons, calls models, manages context, uses tools, and proceeds through a task.

| Paper | Method — two sentences | Main limitation — one sentence | My notes |
| --- | --- | --- | --- |
| **STOP, 2023** | STOP begins with an LM-powered scaffolding program that improves input programs according to a utility function. The scaffolding program is then applied to its own source code, producing improved improvers that use strategies such as search, sampling, or evolutionary optimization. ([arXiv][7]) | The underlying language model remains fixed and experiments use relatively small algorithmic tasks, so it is not full recursive self-improvement. |  |
| **GPTSwarm, 2024** | GPTSwarm represents LLM agents and multi-agent systems as computational graphs whose nodes perform operations or LLM calls and whose edges transmit information. Its optimizers modify node prompts and graph connectivity using task performance to improve agent behavior. ([Proceedings of Machine Learning Research][8]) | The optimization space is restricted to prompts and graph connectivity rather than arbitrary agent source-code modification. |  |
| **Automated Design of Agentic Systems / Meta Agent Search, 2024** | A fixed meta-agent writes complete code-defined agents and evaluates them on downstream tasks. Successful designs are stored in an archive that the meta-agent uses to invent increasingly effective agent architectures. ([arXiv][9]) | The target agents evolve, but the meta-agent and overall discovery algorithm remain human-designed and fixed. |  |
| **AFlow, 2024** | AFlow represents agent workflows as executable code connecting LLM-calling nodes through control-flow edges. Monte Carlo Tree Search uses execution feedback and accumulated tree experience to propose and evaluate workflow-code modifications. ([arXiv][10]) | It searches within a predefined workflow representation and requires repeated benchmark evaluations for every candidate. |  |
| **Gödel Agent, 2024** | Gödel Agent allows an LLM agent to inspect and rewrite its own logic and behavior under a high-level task objective. The revised agent is evaluated, and successful self-modifications become the basis for later rounds of recursive improvement. ([arXiv][11]) | Evidence for sustained improvement is limited to selected reasoning and agent benchmarks, with safety and stability under unrestricted modification remaining unresolved. |  |
| **A Self-Improving Coding Agent — SICA, 2025** | SICA gives a coding agent access to its own implementation and basic editing tools, allowing it to propose modifications to its source code. Candidate versions are evaluated on coding tasks, and stronger versions are retained for subsequent self-editing rounds. ([arXiv][12]) | Benchmark-driven selection can overfit the agent to the evaluation distribution and does not guarantee that modifications remain safe or generally useful. |  |
| **Darwin Gödel Machine, 2025** | DGM maintains an archive of coding agents and samples existing agents as parents for LLM-generated source-code modifications. Descendants are empirically evaluated, added to a growing evolutionary tree when useful, and can improve both task-solving and future self-modification capabilities. ([arXiv][13]) | Open-ended population search requires substantial evaluation compute, sandboxing, and human oversight. |  |
| **Meta-Harness, 2026** | Meta-Harness exposes the source code, scores, and execution traces of all previous harness candidates to an agentic proposer. The proposer writes a new harness, evaluates it, and returns its complete trace to a persistent filesystem for use in later iterations. ([arXiv][14]) | It optimizes how an LLM application manages information rather than directly evolving an environmental action policy. |  |
| **Agentic Harness Engineering, 2026** | AHE represents tools, middleware, memory, prompts, and other editable harness components as explicit and reversible files. It condenses execution traces into an evidence corpus and requires each proposed edit to make a prediction that is checked against later task outcomes. ([arXiv][15]) | The method requires extensive instrumentation and repeated task-level evaluations, making it difficult to apply to opaque or weakly observable agents. |  |
| **Retrospective Harness Optimization, 2026** | The method selects difficult tasks from past trajectories and re-solves them multiple times using the current harness. It uses self-validation, self-consistency, and pairwise self-preference to generate and select updates to skills, tools, and workflows without external labels. ([arXiv][16]) | Because the agent evaluates its own harness candidates, systematic model biases can be reinforced rather than corrected. |  |
| **Adaptive Auto-Harness, 2026** | Adaptive Auto-Harness maintains a tree of specialized harnesses for open-ended and shifting task streams rather than repeatedly modifying one universal harness. A stateful evolver constructs new harnesses, while solve-time routing selects the appropriate branch and human steering handles unsupported cases. ([arXiv][17]) | The routing tree and occasional human intervention make the system more complex and less fully autonomous than a single self-contained evolving agent. |  |
| **Self-Programmed Execution, 2026** — architectural precursor | SPE makes each model completion an executable orchestration program rather than placing the model inside a fixed turn-to-turn control loop. Its Spell language permits programs to inspect, edit, and re-evaluate themselves while avoiding repeated external side effects. ([arXiv][18]) | The paper demonstrates self-programmable execution but does not yet implement a persistent outer loop that selects and retains improved orchestrators across tasks. |  |

## 3. Policy-component evolution

Here, the system evolves a component that strongly influences the policy, but not necessarily the complete executable controller.

| Paper | Method — two sentences | Main limitation — one sentence | My notes |
| --- | --- | --- | --- |
| **Eureka, 2023** | Eureka uses an LLM to generate populations of executable reward functions for reinforcement-learning environments. RL training results are summarized as feedback, allowing the LLM to iteratively mutate and select better reward code. ([arXiv][19]) | The evolved code defines the learning objective rather than directly controlling the agent, and every candidate may require expensive RL training. |  |
| **AgentOptimizer, 2024** | AgentOptimizer treats an agent's tool functions as learnable parameters while leaving the underlying LLM weights unchanged. An LLM modifies the functions using offline task performance, with rollback and early stopping used to reject harmful updates. ([arXiv][20]) | Improvement is constrained by the predefined function interface and the representativeness of the offline training tasks. |  |
| **AgentSquare, 2024** | AgentSquare decomposes agents into planning, reasoning, tool-use, and memory modules with standardized interfaces. It evolves individual modules, recombines successful designs, and uses a performance predictor to avoid evaluating obviously weak configurations. ([arXiv][21]) | Its search cannot discover architectures that fall outside the predefined four-module design space. |  |
| **EvoTool, 2026** | EvoTool decomposes tool-use behavior into planner, selector, caller, and synthesizer modules. It attributes trajectory failures to individual modules, applies feedback-guided mutations to the blamed module, and retains a diverse population of policy candidates. ([arXiv][22]) | Its fixed modular decomposition may misattribute failures that arise from interactions across several components. |  |
| **GPTSwarm, 2024** — hybrid placement | GPTSwarm can also be viewed as component evolution because it separately optimizes node prompts and inter-agent graph edges. The resulting changes alter reasoning modules and information flow without necessarily replacing the complete agent implementation. ([Proceedings of Machine Learning Research][8]) | Its gradient or graph-based optimizers do not provide unrestricted semantic editing of tools, memory implementations, or arbitrary code. |  |
| **Voyager, 2023** — hybrid placement | Voyager's skill library can also be classified as a policy-component system because each generated program is a reusable temporally extended action module. Retrieved skills are composed by the higher-level agent rather than functioning as the complete agent architecture. ([arXiv][2]) | The separation between high-level planning and skill execution means that only part of the overall policy actually evolves. |  |

## 4. Non-code agent self-evolution

Here, the evolving artifact is primarily text, memory, experience, synthetic data, or model parameters rather than executable policy code.

| Paper | Method — two sentences | Main limitation — one sentence | My notes |
| --- | --- | --- | --- |
| **Self-Refine, 2023** | The same LLM generates an initial answer, critiques that answer in natural language, and produces a revised version. This feedback-and-refinement process repeats at inference time without supervised training or parameter updates. ([arXiv][23]) | Improvements normally disappear after the current task because the system does not persistently update an agent policy, memory, or architecture. |  |
| **Reflexion, 2023** | Reflexion converts task rewards or failures into natural-language reflections and stores them in an episodic memory buffer. Later attempts retrieve these reflections as context, enabling the agent to change its decisions without modifying model weights. ([arXiv][24]) | Performance depends heavily on reflection quality, and textual memories may accumulate incorrect or overly task-specific lessons. |  |
| **GEPA, 2025** | GEPA samples execution trajectories and uses an LLM to diagnose failures and propose natural-language prompt mutations. Genetic and Pareto-based selection retain complementary high-performing prompts and combine lessons from previous candidates. ([arXiv][25]) | It generally evolves textual instructions rather than executable policy logic, and its conclusions remain dependent on the chosen evaluator. |  |
| **EvolveR, 2025–2026** | EvolveR distills interaction trajectories into a structured repository of abstract strategic principles. During online interaction, the agent retrieves these principles, generates new experiences, and applies policy reinforcement to iteratively update future behavior. ([arXiv][26]) | Its reported evaluation concentrates on multi-hop question answering and does not establish executable code or harness evolution. |  |
| **AgentEvolver, 2025** | AgentEvolver generates new tasks through self-questioning, reuses prior experiences to guide exploration, and attributes rewards to individual trajectory steps. These self-generated tasks and credit signals are used in an RL loop to improve the model agent. ([arXiv][27]) | The results are preliminary, and self-generated tasks may fail to cover capabilities or failure modes that the current agent cannot recognize. |  |
| **Q-Evolve, 2026** | Q-Evolve jointly evolves an LLM policy, a value critic, and an agent-generated trajectory dataset. It derives dense process rewards from an in-distribution critic and performs behavior-proximal policy optimization over expert and self-generated data. ([arXiv][28]) | It requires model-weight training and expert-seeded datasets, so it is policy learning rather than Code-as-Policy evolution. |  |

### Papers I would keep outside the four core tables

**FunSearch and AlphaEvolve** evolve executable algorithms, but the evolved program is generally the solution to a problem rather than the policy or harness of an autonomous LLM agent. **CodeAct** supports iterative executable code actions, but its revisions mainly occur within a single task and are not normally retained as persistent self-evolution.

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
