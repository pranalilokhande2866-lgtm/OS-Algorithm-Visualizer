export function parseNumberList(value, label = "Values") {
  const parts = String(value).split(/[,\s]+/).filter(Boolean);
  if (!parts.length) throw new Error(`${label} cannot be empty.`);
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((n) => !Number.isFinite(n) || !Number.isInteger(n) || n < 0)) {
    throw new Error(`${label} must contain non-negative whole numbers.`);
  }
  return numbers;
}

function metricsFromSegments(processes, segments) {
  const byId = new Map(processes.map((p) => [p.id, p]));
  const completion = {};
  segments.forEach((s) => {
    if (s.id !== "IDLE") completion[s.id] = s.end;
  });
  const rows = processes.map((p) => {
    const ct = completion[p.id] ?? p.arrival;
    const tat = ct - p.arrival;
    const wt = tat - p.burst;
    return { ...p, completion: ct, turnaround: tat, waiting: wt };
  });
  const avg = (key) => rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : 0;
  return {
    segments,
    rows,
    averageWaiting: avg("waiting"),
    averageTurnaround: avg("turnaround"),
    makespan: segments.length ? segments[segments.length - 1].end : 0
  };
}

export function scheduleCPU(inputProcesses, algorithm, quantum = 2) {
  if (!inputProcesses.length) throw new Error("Add at least one process.");
  const ids = new Set();
  const processes = inputProcesses.map((p) => {
    const item = {
      id: String(p.id).trim(),
      arrival: Number(p.arrival),
      burst: Number(p.burst),
      priority: Number(p.priority ?? 1)
    };
    if (!item.id) throw new Error("Process IDs cannot be empty.");
    if (ids.has(item.id)) throw new Error("Process IDs must be unique.");
    ids.add(item.id);
    if (!Number.isInteger(item.arrival) || item.arrival < 0 ||
        !Number.isInteger(item.burst) || item.burst < 1 ||
        !Number.isInteger(item.priority) || item.priority < 0) {
      throw new Error("Arrival must be ≥ 0, burst must be ≥ 1, and priority must be a non-negative whole number.");
    }
    return item;
  });

  const remaining = new Map(processes.map((p) => [p.id, p.burst]));
  const segments = [];
  let time = 0;
  let finished = 0;
  const done = new Set();
  const append = (id, start, end) => {
    if (end <= start) return;
    const last = segments[segments.length - 1];
    if (last && last.id === id && last.end === start) last.end = end;
    else segments.push({ id, start, end });
  };
  const ordered = [...processes].sort((a, b) => a.arrival - b.arrival || processes.indexOf(a) - processes.indexOf(b));

  if (algorithm === "FCFS" || algorithm === "SJF" || algorithm === "Priority") {
    while (finished < processes.length) {
      const available = processes.filter((p) => !done.has(p.id) && p.arrival <= time);
      if (!available.length) {
        const next = Math.min(...processes.filter((p) => !done.has(p.id)).map((p) => p.arrival));
        append("IDLE", time, next);
        time = next;
        continue;
      }
      let chosen;
      if (algorithm === "FCFS") chosen = available[0] && ordered.filter((p) => available.some((a) => a.id === p.id))[0];
      if (algorithm === "SJF") chosen = [...available].sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || processes.indexOf(a) - processes.indexOf(b))[0];
      if (algorithm === "Priority") chosen = [...available].sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || processes.indexOf(a) - processes.indexOf(b))[0];
      const start = time;
      time += chosen.burst;
      append(chosen.id, start, time);
      done.add(chosen.id);
      remaining.set(chosen.id, 0);
      finished++;
    }
  } else if (algorithm === "Round Robin") {
    if (!Number.isInteger(Number(quantum)) || Number(quantum) < 1) throw new Error("Time quantum must be a whole number ≥ 1.");
    const q = Number(quantum);
    const queue = [];
    const arrived = new Set();
    let cursor = 0;
    const addArrivals = (at) => {
      while (cursor < ordered.length && ordered[cursor].arrival <= at) {
        if (!arrived.has(ordered[cursor].id)) {
          queue.push(ordered[cursor].id);
          arrived.add(ordered[cursor].id);
        }
        cursor++;
      }
    };
    while (finished < processes.length) {
      addArrivals(time);
      if (!queue.length) {
        const next = ordered.find((p) => remaining.get(p.id) > 0 && p.arrival > time);
        if (!next) break;
        append("IDLE", time, next.arrival);
        time = next.arrival;
        addArrivals(time);
      }
      const id = queue.shift();
      if (remaining.get(id) <= 0) continue;
      const runFor = Math.min(q, remaining.get(id));
      const start = time;
      time += runFor;
      remaining.set(id, remaining.get(id) - runFor);
      append(id, start, time);
      addArrivals(time);
      if (remaining.get(id) > 0) queue.push(id);
      else finished++;
    }
  } else {
    throw new Error("Select a supported CPU scheduling algorithm.");
  }

  return metricsFromSegments(processes, segments);
}

export function replacePages(reference, frameCount, algorithm) {
  const pages = Array.isArray(reference) ? reference : parseNumberList(reference, "Page reference string");
  const count = Number(frameCount);
  if (!pages.length) throw new Error("Enter a page reference string.");
  if (!Number.isInteger(count) || count < 1 || count > 12) throw new Error("Frame count must be between 1 and 12.");
  if (!["FIFO", "LRU", "Optimal"].includes(algorithm)) throw new Error("Select a supported page replacement algorithm.");
  const frames = [];
  const history = [];
  let pointer = 0;
  let hits = 0;
  let faults = 0;
  const lastUsed = new Map();

  pages.forEach((page, index) => {
    const existing = frames.indexOf(page);
    let hit = existing !== -1;
    let replaced = null;
    if (hit) {
      hits++;
      lastUsed.set(page, index);
    } else {
      faults++;
      if (frames.length < count) {
        frames.push(page);
      } else {
        let victimIndex = 0;
        if (algorithm === "FIFO") {
          victimIndex = pointer % count;
          pointer++;
        } else if (algorithm === "LRU") {
          victimIndex = frames.reduce((best, current, i) =>
            (lastUsed.get(current) ?? -1) < (lastUsed.get(frames[best]) ?? -1) ? i : best, 0);
        } else {
          let farthest = -1;
          frames.forEach((current, i) => {
            const nextUse = pages.slice(index + 1).indexOf(current);
            const distance = nextUse === -1 ? Infinity : nextUse;
            if (distance > farthest) { farthest = distance; victimIndex = i; }
          });
        }
        replaced = frames[victimIndex];
        frames[victimIndex] = page;
      }
      lastUsed.set(page, index);
    }
    history.push({ page, frames: [...frames], hit, replaced, hits, faults });
  });
  return { history, hits, faults, faultRate: faults / pages.length, hitRate: hits / pages.length };
}

export function scheduleDisk(requestsInput, headInput, algorithm, direction = "up", maxCylinderInput = 199) {
  const requests = Array.isArray(requestsInput) ? requestsInput : parseNumberList(requestsInput, "Disk requests");
  const head = Number(headInput);
  const maxCylinder = Number(maxCylinderInput);
  if (!requests.length) throw new Error("Enter at least one disk request.");
  if (!Number.isInteger(head) || !Number.isInteger(maxCylinder) || maxCylinder < 1 || head < 0 || head > maxCylinder) {
    throw new Error("Head and cylinder range must be whole numbers, with head inside the range.");
  }
  if (requests.some((n) => !Number.isInteger(n) || n < 0 || n > maxCylinder)) {
    throw new Error(`Requests must be whole numbers from 0 to ${maxCylinder}.`);
  }
  let order = [];
  let path = [head];
  if (algorithm === "FCFS") {
    order = [...requests];
  } else if (algorithm === "SSTF") {
    const pending = [...requests];
    let current = head;
    while (pending.length) {
      let best = 0;
      pending.forEach((n, i) => {
        if (Math.abs(n - current) < Math.abs(pending[best] - current)) best = i;
      });
      current = pending.splice(best, 1)[0];
      order.push(current);
    }
  } else if (algorithm === "SCAN" || algorithm === "C-SCAN") {
    const lower = requests.filter((n) => n < head).sort((a, b) => b - a);
    const higher = requests.filter((n) => n >= head).sort((a, b) => a - b);
    if (direction === "up") {
      order = [...higher];
      if (algorithm === "SCAN") {
        if (lower.length) order.push(maxCylinder, ...lower);
      } else if (lower.length) order.push(maxCylinder, 0, ...lower);
    } else {
      order = [...lower];
      if (algorithm === "SCAN") {
        if (higher.length) order.push(0, ...higher);
      } else if (higher.length) order.push(0, maxCylinder, ...higher);
    }
    // Keep physical sweep endpoints in the path but not in the serviced request order.
    const requestSet = [...requests];
    const movementPath = [head];
    let current = head;
    if (direction === "up") {
      const above = requests.filter((n) => n >= head).sort((a, b) => a - b);
      const below = requests.filter((n) => n < head).sort((a, b) => b - a);
      movementPath.push(...above);
      current = above.length ? above[above.length - 1] : head;
      if (algorithm === "SCAN" && below.length) { movementPath.push(maxCylinder, ...below); }
      if (algorithm === "C-SCAN" && below.length) { movementPath.push(maxCylinder, 0, ...below); }
    } else {
      const below = requests.filter((n) => n < head).sort((a, b) => b - a);
      const above = requests.filter((n) => n >= head).sort((a, b) => a - b);
      movementPath.push(...below);
      if (algorithm === "SCAN" && above.length) movementPath.push(0, ...above);
      if (algorithm === "C-SCAN" && above.length) movementPath.push(0, maxCylinder, ...above);
    }
    // The order list above includes endpoints for sweep; return only actual requests separately.
    const serviced = order.filter((n) => requests.includes(n));
    const totalMovement = movementPath.slice(1).reduce((sum, n, i) => sum + Math.abs(n - movementPath[i]), 0);
    return { order: serviced, path: movementPath, totalMovement };
  } else {
    throw new Error("Select a supported disk scheduling algorithm.");
  }
  path = [...path, ...order];
  const totalMovement = path.slice(1).reduce((sum, n, i) => sum + Math.abs(n - path[i]), 0);
  return { order, path, totalMovement };
}