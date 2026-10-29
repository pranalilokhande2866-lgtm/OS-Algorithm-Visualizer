# OS Algorithm Visualizer

An interactive web-based application for visualizing and understanding fundamental Operating System algorithms. The project helps students explore CPU scheduling, page replacement, and disk scheduling through user inputs, execution timelines, and performance metrics.

## Overview

Operating System algorithms can be difficult to understand through theory alone. This project provides a visual and interactive way to observe how different algorithms work, compare their behavior, and understand their results.

Users can enter algorithm-specific inputs, run simulations, and examine the resulting execution order and calculated metrics.

## Features

- **CPU Scheduling:** Simulate scheduling algorithms and analyze process execution.
- **Page Replacement:** Explore how page replacement strategies manage memory references.
- **Disk Scheduling:** Visualize disk request servicing and scheduling order.
- **Interactive Inputs:** Provide process details and other algorithm-specific parameters.
- **Execution Timeline:** Observe the order in which processes or requests are handled.
- **Performance Metrics:** View relevant calculated values, such as waiting time, turnaround time, and makespan where applicable.
- **Visual Learning:** Understand algorithm behavior through an interactive dashboard.

## Algorithms

### 1. CPU Scheduling

- First Come, First Served (FCFS)
- Shortest Job First (SJF)
- Round Robin (RR)
- Priority Scheduling

### 2. Page Replacement

- First In, First Out (FIFO)
- Least Recently Used (LRU)
- Optimal Page Replacement

### 3. Disk Scheduling

- First Come, First Served (FCFS)
- Shortest Seek Time First (SSTF)
- SCAN

*Note: Verify that every listed algorithm is implemented and working in the current version before publishing this README.*

## Tech Stack

- **Frontend:** React
- **Language:** JavaScript (JSX)
- **Development Tools:** Node.js, npm, Visual Studio Code
- **Version Control:** Git and GitHub
- **Deployment:** Vercel (planned)

## Getting Started

### Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/)
- npm, which is included with Node.js
- [Git](https://git-scm.com/) (optional for cloning and version control)

### Installation

1. Clone the repository:

   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   ```

2. Navigate to the project directory:

   ```bash
   cd <YOUR_PROJECT_FOLDER>
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in the terminal in your web browser.

## How to Use

1. Open the application in your browser.
2. Select the required category and algorithm.
3. Enter the required inputs, such as arrival time, burst time, priority, time quantum, page reference string, or disk requests, as applicable.
4. Run the simulation.
5. Observe the execution timeline and calculated results.
6. Compare the behavior of different algorithms using suitable input examples.

## Project Goals

- Improve understanding of Operating System concepts through visualization.
- Demonstrate the behavior of commonly used OS algorithms.
- Help students verify scheduling and resource-management calculations.
- Provide an interactive learning tool for academic practice and demonstrations.

## Future Enhancements

- Add more Operating System algorithms.
- Improve visual comparisons between algorithms.
- Add step-by-step simulation controls.
- Enhance responsiveness and accessibility.
- Deploy the application for public access.

## Contributors

Developed as an academic project focused on Operating Systems and interactive algorithm visualization.

## License

No license has been specified yet. Add a license if you intend to permit others to reuse, modify, or distribute the project.
