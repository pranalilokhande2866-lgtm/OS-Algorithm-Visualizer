# OSLab — OS Algorithm Visualizer

A browser-based learning tool for interactive Operating System algorithm simulations.

## Modules

- **CPU Scheduling:** FCFS, non-preemptive SJF, non-preemptive Priority (lower number means higher priority), and Round Robin.
- **Page Replacement:** FIFO, LRU, and Optimal, with page hits/faults and side-by-side comparison.
- **Disk Scheduling:** FCFS, SSTF, SCAN, and C-SCAN, with head-movement calculations and comparison.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.

The project uses client-side JavaScript and does not require a database or API keys.

## Conventions

- CPU Priority Scheduling is non-preemptive; a smaller numeric value represents higher priority.
- Round Robin uses a configurable positive integer time quantum.
- Disk cylinders range from 0 to the configured maximum. SCAN/C-SCAN include sweep boundary movement where applicable.
- Simulation data is processed in the browser and is not persisted.
