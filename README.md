# Project Planner

A lightweight project planning tool for managing work breakdown structures (WBS) and resource allocation across skill sets.

## What it does

Project Planner helps you plan project work by organizing tasks into work packages and estimating effort per skill set (e.g. Design, Frontend, Backend). It gives you two complementary views:

- **WBS** — a structured grid where you define work packages, add tasks under each, and fill in workload estimates per skill set. Work packages are collapsible and can be reordered via drag-and-drop.
- **Resource Planning** — a sequential timeline that shows how skill set load is distributed across work packages, helping you spot bottlenecks and balance effort.

Workload is measured in planning units (sprints, weeks, or months — configurable in Settings). All data is stored locally in the browser.

## Running locally

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/Antonio-Ingegnere/ProjectPlanner.git
cd ProjectPlanner
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Other commands

```bash
npm run build    # production build
npm run lint     # ESLint
```
