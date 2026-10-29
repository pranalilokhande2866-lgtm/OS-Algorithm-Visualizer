import { describe, it, expect } from "vitest";
import { scheduleCPU, replacePages, scheduleDisk } from "./algorithms.js";

describe("CPU scheduling", () => {
  const processes = [
    { id: "P1", arrival: 0, burst: 5, priority: 2 },
    { id: "P2", arrival: 1, burst: 3, priority: 1 },
    { id: "P3", arrival: 2, burst: 2, priority: 3 }
  ];
  it("calculates FCFS metrics", () => {
    const r = scheduleCPU(processes, "FCFS");
    expect(r.makespan).toBe(10);
    expect(r.rows.map(x => x.waiting)).toEqual([0, 4, 6]);
    expect(r.rows.map(x => x.turnaround)).toEqual([5, 7, 8]);
  });
  it("handles Round Robin", () => {
    const r = scheduleCPU(processes, "Round Robin", 2);
    expect(r.makespan).toBe(10);
    expect(r.rows.every(x => x.waiting >= 0)).toBe(true);
  });
});
describe("Page replacement", () => {
  it("counts FIFO hits and faults", () => {
    const r = replacePages("1, 2, 3, 1, 4, 2", 3, "FIFO");
    expect(r.hits).toBe(1);
    expect(r.faults).toBe(5);
  });
});
describe("Disk scheduling", () => {
  it("calculates FCFS head movement", () => {
    const r = scheduleDisk("82,170,43,140,24,16,190", 50, "FCFS", "up", 199);
    expect(r.totalMovement).toBe(642);
  });
});
