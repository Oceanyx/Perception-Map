# Perception Map — Version 1 (Discontinued)

This was my first attempt at making a tool for mapping perception.
V1 helped me figure out what the project actually *was*, but the structure didn’t quite hold up, so I’m documenting it here before moving on to V2.

---

## What V1 Tried to Do

The idea was simple:

When you notice a perception happening — a reaction, a thought, a shift, whatever — you could map it visually by placing pieces of it into three categories:

* **Private** (internal sensations / emotions)
* **Public** (behaviors / interactions)
* **Abstract** (concepts / interpretations / frameworks)

The UI was a big canvas with three circles.
You dropped a node into whichever circle it belonged to, and then connected nodes together if they related.

It worked in a basic sense. But the more I used it, the more I realized the structure was too rigid for how perception actually shows up.

---

## What Nodes Could Contain

Each node had:

* some text (the actual content)
* a domain (decided by which circle you dropped it into)
* an optional lens (like “psychological,” “relational,” etc.)
* an optional interpretation or reflection

Pretty minimal, pretty manual.

---

## Why I Ultimately Stopped Working on V1

Main reasons:

---

### 1. The three-circle layout ended up being more confusing than helpful

Perception isn’t spatial, but the UI forced it to be.

### 2. Too much cognitive effort

You had to think *about* how to map before you could map anything.

### 3. Everything felt over-determined

Some experiences don’t want interpretation, but the UI nudged you to add one anyway.

### 4. No good way to represent patterns across moments

Everything was stuck inside one perception instance, with no real “zoom out” view.

### 5. Architecturally, it didn’t scale

One playground = one moment.
No clear way to store or revisit multiple moments.

All of this pushed me toward redesigning the whole thing instead of trying to force V1 forward.

---

## Placeholder for Video Overview

> **[Add Video Here]**
> I’ll link a walkthrough of V1 and explain what worked, what didn’t, and why I’m rebuilding it.

---

## What I Learned from V1

A few principles that shaped V2:

* Domains shouldn’t be literal spaces — they should be simple tags.
* Not every node needs a lens or interpretation.
* The UI shouldn’t pressure the user to “figure things out” prematurely.
* Real insight comes from connecting multiple perception instances, not over-polishing one.
* Flexibility > structure.

---

## Project Status

* **V1:** Archived / reference only
* **V2:** Being designed from scratch
* **Purpose of this repo:** Portfolio and documentation

---

# Perception Map — Starter Scaffold

This repo also includes a minimal starter so the playground can run.

## How to Run

1. `npm install`
2. `npm run dev`

Tech used:

* Vite
* React
* Tailwind
* React Flow
* Dexie (for local IndexedDB storage)

## Notes

This starter is intentionally barebones.
You can expand `CanvasView` to add:

* lens visuals
* domain overlays
* connection logic
* node editing panel
* anything else you want to experiment with