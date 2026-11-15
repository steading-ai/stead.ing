---
nav: History
description: How Steading came about. Every piece of an agent stack needed another, so I tried to build it all, then learned to build small pieces that fit together.
order: 3
layout: story
kicker: The origin story
art:
  top:
    light: history/desk-day.png
    dark: history/desk-night.png
  why-it-matters:
    light: history/workshop-day.png
    dark: history/workshop-night.png
  the-work-isnt-done:
    light: history/plot-day.png
    dark: history/plot-night.png
cycle:
  the-chicken-and-egg-loop:
    center:
      light: history/loop-hen-day.png
      dark: history/loop-hen-night.png
    items:
      - light: history/loop-knowledge-day.png
        dark: history/loop-knowledge-night.png
      - light: history/loop-planning-day.png
        dark: history/loop-planning-night.png
      - light: history/loop-work-day.png
        dark: history/loop-work-night.png
      - light: history/loop-review-day.png
        dark: history/loop-review-night.png
      - light: history/loop-trust-day.png
        dark: history/loop-trust-night.png
      - light: history/loop-reach-day.png
        dark: history/loop-reach-night.png
---

# There was no *right place* to start

The story of chasing a whole agent stack, the chicken-and-egg loop where every piece needed another, and the realization that became Steading.

## The problem was everything

I wanted my agents to know what I know, so I built a way to search my notes. Better knowledge made for better plans, so I built a place to keep the plan. A plan needed something to carry it out. That needed a sandbox, the sandbox needed credentials, and the agents needed a way to reach me. And all of it needed watching.

**Each improvement revealed another missing piece.**

> I've gone too deep. I shifted from focusing on software to focusing on infrastructure…
>
> — Ivy, February 2026

## The chicken-and-egg loop

Every piece made the others better, which meant there was never a clear first step. It was a virtuous cycle, and a very effective way to chase my own tail.

1. **Knowledge** makes planning better.
2. **Planning** makes the work go faster.
3. **The work** makes more to review.
4. **Review** needs fences you can trust.
5. **Trust** needs agents that never hold your keys.
6. **Reach**, talking to your agents from anywhere, makes it all usable, and turns up more to know.

No single piece could solve the problem.

## So I tried to build it all

Over three and a half years I built tools, shipped a few, and wrote about six orchestrators before the one that stuck. Some worked and some didn't. Most were useful, and none of them was *the* system.

| When | Era | What it was | Commits a month |
| --- | --- | --- | --- |
| Mar 2023 – Nov 2024 | Curiosity | Ideas, open models on rented GPUs, a self-hosted chat UI | — |
| Dec 2024 – Jul 2025 | Tinkering | The first AI tools I shipped, side projects, yak-shaving | — |
| Aug 2025 – Jan 2026 | Owning the machine | A home lab, and dotfiles my agents manage | 17–137 |
| Feb – Mar 2026 | Four orchestrators | kb, Hive, atlas and OpenClaw: everything at once, then everything half done | 560, then 117 |
| Apr – Jul 2026 | The quiet season | One focused sprint: `work-on` | 22–212 |
| Aug – Sep 2026 | The factory | thicket, dagger (now skift), mill, the console, croft, stead | 582 → 923 |
| Oct 2026 | The burst | Side projects everywhere, at the highest commit rate yet | 1,173 |
| Nov 2026 | Steading | almanac, the strategy, the brand, this site | 345 in 11 days |

Commit counts include the commits my agents made under my name, and leave out large forks.

Three moments along the way:

- **February 8, 2026.** The first branch an agent wrote was merged into one of my repositories. I reverted it 22 seconds later.
- **September 5, 2026.** skift, then called dagger, built itself overnight: 43 of 45 tasks in about eight and a half hours, for $221.53 at list prices.
- **September 11, 2026.** mill merged a change it wrote into its own code, seven months after the 22-second revert.

## The shift: good enough, everywhere

The breakthrough wasn't a new model or a perfect orchestrator. It was a change in approach: stop perfecting one piece, build a useful version of each, and make them work together. Then improve whatever is slowing everything down.

| The old way | The new way |
| --- | --- |
| Build the one true system | Build small, useful pieces |
| Perfect each piece first | Get the whole loop working |
| Keep adding one more thing | Replace and improve the bottleneck |
| Finish all of it before any of it is useful | Keep the pieces loosely coupled |

## The architectural realization

The durable thing isn't any single implementation. It's a composable architecture: projects that are useful on their own, with clear boundaries, that work together and can be replaced.

- **Composable.** Each project does one job, behind an open interface.
- **Replaceable.** Swap a tool, a model, or a whole project without rewriting the rest.
- **Built to change.** Start simple, learn from real use, and improve what hurts.

[See how the projects fit together](/#idea).

## Why it matters

Everyone running agents is building their own version of this: a task list, a runner, a sandbox, a way to hold the keys. Each of us builds it by hand, to suit our own needs, and the plumbing slowly crowds out the ideas we started with.

It doesn't have to be that way. Steading is the opposite:

- Not a platform you have to adopt wholesale, but pieces you pick up one at a time.
- Pieces that are useful on their own.
- A foundation you can take apart, extend, and make your own.

## The work isn't done

Steading is what I wish I'd had when I started: the plumbing, built once and shared, so the hours go into the wildest ideas instead. Everyone's homestead looks different. Start with an overgrown plot, pick the pieces you need, and build it into yours.

[Start with one piece](/#start), or [come build it with us on Discord](https://discord.gg/BjCu2vHgX4).
