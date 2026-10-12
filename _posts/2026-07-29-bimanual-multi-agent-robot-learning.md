---
title: "Bimanual Multi-Agent Robot Learning Benchmark"
date: 2026-05-12
description: "Building bimanual robot manipulation tasks and evaluating RL baselines from scratch."
tags: [robotics, reinforcement-learning, multi-agent-systems]
reading_time: "3 min"
permalink: /blog/bimanual-multi-agent-robot-learning/
image: /assets/img/projects/marl-robotics.gif
---

I built a bimanual multi-agent manipulation task to study how reinforcement learning methods handle coordination in a shared robotic scene. I also evaluated two existing ManiSkill tasks so the new task could be compared against established benchmarks.

The work connects task design in ManiSkill with training and evaluation in HARL. I trained RL baselines from scratch, including PPO, MAPPO, HAPPO, and SAC, then compared how single-agent and multi-agent approaches behave across the task suite.

A longer writeup will cover the task design choices, reward shaping, evaluation protocol, and what the baselines revealed.
