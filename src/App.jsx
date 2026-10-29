import React, { useMemo, useState } from "react";
import {
  Activity, ArrowDownUp, BookOpen, Check, ChevronDown, CircleHelp, Clock3,
  Cpu, Gauge, HardDrive, Layers3, LayoutDashboard, Menu, Moon, Play, RotateCcw,
  ShieldCheck, SkipForward, Sparkles, X
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseNumberList, replacePages, scheduleCPU, scheduleDisk } from "./algorithms.js";

const initialProcesses = [
  { id: "P1", arrival: 0, burst: 5, priority: 2 },
  { id: "P2", arrival: 1, burst: 3, priority: 1 },
  { id: "P3", arrival: 2, burst: 2, priority: 3 }
];
const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "cpu", label: "CPU Scheduling", icon: Cpu },
  { id: "pages", label: "Page Replacement", icon: Layers3 },
  { id: "disk", label: "Disk Scheduling", icon: HardDrive }
];
const algorithmDescriptions = {
  FCFS: "First Come, First Served: processes run in arrival order. Simple and non-preemptive.",
  SJF: "Shortest Job First: among arrived processes, run the process with the smallest burst time.",
  Priority: "Non-preemptive Priority: the lowest numeric priority value is treated as the highest priority.",
  "Round Robin": "Each ready process receives up to one time quantum before returning to the queue.",
  FIFO: "First In, First Out: replace the page that has been in memory the longest.",
  LRU: "Least Recently Used: replace the page that has not been accessed for the longest time.",
  Optimal: "Replace the page whose next use is farthest in the future. This is a theoretical benchmark.",
  SSTF: "Shortest Seek Time First: visit the pending request closest to the current head position.",
  SCAN: "SCAN: move in one direction servicing requests, reach the end, then reverse direction.",
  "C-SCAN": "C-SCAN: service requests in one direction, wrap to the other end, and continue."
};
const colors = ["#7c8cff", "#39d5c5", "#f6b85d", "#f27d9b", "#9b8cff", "#5aa9ff", "#c3dc69"];

function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-detail">{detail}</div>
  </div>;
}
function SectionTitle({ eyebrow, title, description, right }) {
  return <div className="section-title">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
    {right && <div className="section-action">{right}</div>}
  </div>;
}
function SelectField({ label, value, onChange, options }) {
  return <label className="field"><span>{label}</span><div className="select-wrap"><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={15} /></div></label>;
}
function NumberField({ label, value, onChange, min = 0, max, step = 1 }) {
  return <label className="field"><span>{label}</span><input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Button({ children, onClick, variant = "primary", disabled = false }) {
  return <button className={`btn ${variant}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Notice({ message, clear }) {
  if (!message) return null;
  return <div className="notice"><CircleHelp size={17} /><span>{message}</span><button onClick={clear} aria-label="Dismiss"><X size={15} /></button></div>;
}

function Overview({ setPage }) {
  return <>
    <div className="hero">
      <div className="hero-copy"><div className="hero-pill"><Sparkles size={14} /> INTERACTIVE LEARNING LAB</div>
        <h1>Understand the<br /><span>invisible engine.</span></h1>
        <p>Explore operating system algorithms through live simulations, step-by-step execution, and meaningful performance metrics.</p>
        <Button onClick={() => setPage("cpu")}><Play size={16} fill="currentColor" /> Start exploring</Button>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="core"><Cpu size={43} /></div><div className="orbit-dot dot-one"></div><div className="orbit-dot dot-two"></div><div className="orbit-dot dot-three"></div><div className="art-caption"><span className="pulse"></span> SYSTEM READY <span>•</span> 3 MODULES</div></div>
    </div>
    <div className="section-heading-row"><div><div className="eyebrow">LEARNING MODULES</div><h2>Choose your simulation</h2></div><span className="muted small">4 algorithms categories</span></div>
    <div className="module-grid">
      <ModuleCard icon={Cpu} number="01" title="CPU Scheduling" description="See how the CPU allocates time across competing processes." tags={["Gantt chart", "Wait time", "Turnaround"]} onClick={() => setPage("cpu")} />
      <ModuleCard icon={Layers3} number="02" title="Page Replacement" description="Track memory frames, page hits, and page faults in real time." tags={["FIFO", "LRU", "Optimal"]} onClick={() => setPage("pages")} />
      <ModuleCard icon={HardDrive} number="03" title="Disk Scheduling" description="Explore request ordering and calculate disk-head movement." tags={["FCFS", "SSTF", "SCAN"]} onClick={() => setPage("disk")} />
    </div>
    <div className="bottom-note"><div className="note-icon"><BookOpen size={18}/></div><div><strong>Learn by doing</strong><p>Change the input values, run the simulation, and compare how different strategies affect the outcome.</p></div><ShieldCheck className="note-check" size={22}/></div>
  </>;
}
function ModuleCard({ icon: Icon, number, title, description, tags, onClick }) {
  return <button className="module-card" onClick={onClick}><div className="module-card-top"><div className="module-icon"><Icon size={21}/></div><span>{number}</span></div><h3>{title}</h3><p>{description}</p><div className="tag-row">{tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="module-link">Open simulator <span>↗</span></div></button>;
}
function GanttChart({ segments }) {
  if (!segments?.length) return <div className="empty-state">Run a simulation to generate the Gantt chart.</div>;
  const total = Math.max(segments[segments.length - 1].end, 1);
  return <div className="gantt-wrap"><div className="gantt">{segments.map((s, i) => <div key={`${s.id}-${i}`} className={`gantt-segment ${s.id === "IDLE" ? "idle" : ""}`} style={{ flexGrow: s.end - s.start, flexBasis: 0, background: s.id === "IDLE" ? "#273047" : colors[Math.max(0, Number(s.id.replace(/\D/g, "")) - 1) % colors.length] }} title={`${s.id}: ${s.start}–${s.end}`}><span>{s.id}</span></div>)}</div><div className="gantt-times">{segments.map((s, i) => <span key={i} style={{ left: `${(s.start / total) * 100}%` }}>{s.start}</span>)}<span style={{ left: "100%" }}>{segments[segments.length - 1].end}</span></div></div>;
}
function CPUPage() {
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState("2");
  const [processes, setProcesses] = useState(initialProcesses);
  const [result, setResult] = useState(() => scheduleCPU(initialProcesses, "FCFS", 2));
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const run = () => { try { const next = scheduleCPU(processes, algorithm, quantum); setResult(next); setStep(0); setError(""); } catch (e) { setError(e.message); } };
  const update = (index, key, value) => setProcesses((old) => old.map((p, i) => i === index ? { ...p, [key]: key === "id" ? value : value } : p));
  const addProcess = () => setProcesses((old) => [...old, { id: `P${old.length + 1}`, arrival: 0, burst: 2, priority: 1 }]);
  const reset = () => { setProcesses(initialProcesses); setAlgorithm("FCFS"); setQuantum("2"); setResult(scheduleCPU(initialProcesses, "FCFS", 2)); setStep(0); setError(""); };
  const shown = result.segments.slice(0, step || result.segments.length);
  return <>
    <SectionTitle eyebrow="MODULE 01 / PROCESS MANAGEMENT" title="CPU Scheduling" description="Explore how the operating system chooses which process gets CPU time." right={<span className="live-badge"><span/> LIVE SIMULATOR</span>} />
    <Notice message={error} clear={() => setError("")}/>
    <div className="workspace-grid">
      <div className="panel input-panel"><div className="panel-heading"><div><h3>Simulation setup</h3><p>Configure your processes</p></div><span className="step-number">01</span></div>
        <SelectField label="Scheduling algorithm" value={algorithm} onChange={setAlgorithm} options={["FCFS", "SJF", "Priority", "Round Robin"]}/>
        {algorithm === "Round Robin" && <NumberField label="Time quantum" value={quantum} min={1} onChange={setQuantum}/>}
        <div className="table-scroll"><table className="input-table"><thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority</th><th></th></tr></thead><tbody>{processes.map((p, i) => <tr key={`${i}-${p.id}`}><td><input aria-label={`Process ${i+1} ID`} value={p.id} onChange={(e) => update(i, "id", e.target.value)} /></td><td><input aria-label={`Process ${i+1} arrival`} type="number" min="0" value={p.arrival} onChange={(e) => update(i, "arrival", e.target.value)} /></td><td><input aria-label={`Process ${i+1} burst`} type="number" min="1" value={p.burst} onChange={(e) => update(i, "burst", e.target.value)} /></td><td><input aria-label={`Process ${i+1} priority`} type="number" min="0" value={p.priority} onChange={(e) => update(i, "priority", e.target.value)} /></td><td><button className="icon-btn danger" aria-label={`Remove ${p.id}`} disabled={processes.length <= 1} onClick={() => setProcesses((old) => old.filter((_, j) => i !== j))}><X size={14}/></button></td></tr>)}</tbody></table></div>
        <button className="text-button" onClick={addProcess}>+ Add process</button>
        <div className="algorithm-info"><div className="info-title"><BookOpen size={15}/> How it works</div><p>{algorithmDescriptions[algorithm]}</p></div>
        <div className="button-row"><Button onClick={run}><Play size={15} fill="currentColor"/> Run simulation</Button><Button variant="secondary" onClick={reset}><RotateCcw size={15}/> Reset</Button></div>
      </div>
      <div className="results-column">
        <div className="stats-grid four"><StatCard icon={Clock3} label="Avg. waiting" value={result.averageWaiting.toFixed(2)} detail="time units" tone="blue"/><StatCard icon={Gauge} label="Avg. turnaround" value={result.averageTurnaround.toFixed(2)} detail="time units" tone="teal"/><StatCard icon={Activity} label="Processes" value={processes.length} detail="in this simulation" tone="purple"/><StatCard icon={Check} label="Makespan" value={result.makespan} detail="total elapsed time" tone="orange"/></div>
        <div className="panel chart-panel"><div className="panel-heading"><div><h3>Execution timeline</h3><p>Gantt chart · time units</p></div><span className="chart-label"><span/> Process execution</span></div><GanttChart segments={shown}/><div className="timeline-controls"><span className="muted small">Step through the schedule</span><div><Button variant="secondary" onClick={() => setStep(0)}><RotateCcw size={14}/> All</Button><Button variant="secondary" onClick={() => setStep((s) => Math.min(result.segments.length, (s || 0) + 1))}><SkipForward size={14}/> Next segment</Button></div></div></div>
        <div className="panel table-panel"><div className="panel-heading"><div><h3>Process metrics</h3><p>Calculated from the selected scheduling policy</p></div><span className="mini-label">RESULTS</span></div><div className="table-scroll"><table className="results-table"><thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround</th><th>Waiting</th></tr></thead><tbody>{result.rows.map((r) => <tr key={r.id}><td><span className="process-dot" style={{background: colors[Math.max(0, Number(r.id.replace(/\D/g, "")) - 1) % colors.length]}}/>{r.id}</td><td>{r.arrival}</td><td>{r.burst}</td><td>{r.completion}</td><td>{r.turnaround}</td><td><strong>{r.waiting}</strong></td></tr>)}</tbody></table></div></div>
      </div>
    </div>
  </>;
}
function PagesPage() {
  const [algorithm, setAlgorithm] = useState("FIFO");
  const [reference, setReference] = useState("1, 2, 3, 1, 4, 2, 5, 1, 2, 3, 4, 5");
  const [frameCount, setFrameCount] = useState("3");
  const [result, setResult] = useState(() => replacePages("1, 2, 3, 1, 4, 2, 5, 1, 2, 3, 4, 5", 3, "FIFO"));
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const run = () => { try { const pages = parseNumberList(reference, "Page reference string"); const next = replacePages(pages, frameCount, algorithm); setResult(next); setStep(0); setError(""); } catch (e) { setError(e.message); } };
  const shown = step ? result.history.slice(0, step) : result.history;
  return <>
    <SectionTitle eyebrow="MODULE 02 / MEMORY MANAGEMENT" title="Page Replacement" description="Watch pages enter memory and see which page gets replaced when frames are full." right={<span className="live-badge"><span/> LIVE SIMULATOR</span>} />
    <Notice message={error} clear={() => setError("")}/>
    <div className="workspace-grid">
      <div className="panel input-panel"><div className="panel-heading"><div><h3>Simulation setup</h3><p>Configure memory access</p></div><span className="step-number">02</span></div>
        <SelectField label="Replacement algorithm" value={algorithm} onChange={setAlgorithm} options={["FIFO", "LRU", "Optimal"]}/>
        <label className="field"><span>Page reference string</span><textarea rows="3" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Example: 1, 2, 3, 1, 4, 2"/></label>
        <NumberField label="Number of frames (1–12)" value={frameCount} min={1} max={12} onChange={setFrameCount}/>
        <div className="algorithm-info"><div className="info-title"><BookOpen size={15}/> How it works</div><p>{algorithmDescriptions[algorithm]}</p></div>
        <div className="button-row"><Button onClick={run}><Play size={15} fill="currentColor"/> Run simulation</Button><Button variant="secondary" onClick={() => {setReference("1, 2, 3, 1, 4, 2, 5, 1, 2, 3, 4, 5");setFrameCount("3");setAlgorithm("FIFO");setResult(replacePages("1, 2, 3, 1, 4, 2, 5, 1, 2, 3, 4, 5",3,"FIFO"));setStep(0);setError("");}}><RotateCcw size={15}/> Reset</Button></div>
      </div>
      <div className="results-column">
        <div className="stats-grid four"><StatCard icon={Layers3} label="Page faults" value={result.faults} detail="memory misses" tone="orange"/><StatCard icon={Check} label="Page hits" value={result.hits} detail="already in memory" tone="teal"/><StatCard icon={Activity} label="Fault rate" value={`${(result.faultRate*100).toFixed(1)}%`} detail="of all references" tone="purple"/><StatCard icon={Gauge} label="Hit rate" value={`${(result.hitRate*100).toFixed(1)}%`} detail="of all references" tone="blue"/></div>
        <div className="panel chart-panel"><div className="panel-heading"><div><h3>Memory frame timeline</h3><p>Each column represents one page request</p></div><span className="mini-label">{result.history.length} REFERENCES</span></div>
          <div className="frame-grid-wrap"><div className="frame-grid" style={{gridTemplateColumns:`repeat(${Math.max(1, shown.length)}, minmax(48px, 1fr))`}}><div className="frame-row-label">Page</div>{shown.map((h,i)=><div className="page-head" key={`p${i}`}><span>{h.page}</span><small>{i+1}</small></div>)}{Array.from({length:Number(frameCount)||3},(_,row)=><React.Fragment key={`r${row}`}><div className="frame-row-label">Frame {row+1}</div>{shown.map((h,i)=><div key={`${row}-${i}`} className={`frame-cell ${h.hit?"hit":h.replaced!==null?"fault replaced":"fault"}`}>{h.frames[row] ?? "—"}</div>)}</React.Fragment>)}<div className="frame-row-label">Status</div>{shown.map((h,i)=><div key={`s${i}`} className={`status-cell ${h.hit?"status-hit":"status-fault"}`}>{h.hit?"HIT":"FAULT"}</div>)}</div></div>
          <div className="timeline-controls"><span className="muted small">Display the full sequence or reveal step by step</span><div><Button variant="secondary" onClick={() => setStep(0)}><RotateCcw size={14}/> All</Button><Button variant="secondary" onClick={() => setStep((s) => Math.min(result.history.length, (s || 0) + 1))}><SkipForward size={14}/> Next page</Button></div></div>
        </div>
        <div className="panel table-panel"><div className="panel-heading"><div><h3>Algorithm comparison</h3><p>Same reference string and frame count</p></div><span className="mini-label">COMPARISON</span></div><PageComparison reference={reference} frameCount={frameCount}/></div>
      </div>
    </div>
  </>;
}
function PageComparison({reference, frameCount}) {
  const data = useMemo(() => {
    try { const pages = parseNumberList(reference, "Pages"); return ["FIFO","LRU","Optimal"].map((name)=>({name, ...replacePages(pages, frameCount, name)})); }
    catch { return []; }
  }, [reference, frameCount]);
  if (!data.length) return <div className="empty-state">Enter a valid reference string and frame count to compare algorithms.</div>;
  return <div className="comparison-chart"><ResponsiveContainer width="100%" height={210}><BarChart data={data} margin={{top:10,right:12,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#242d42"/><XAxis dataKey="name" stroke="#8490aa" tickLine={false} axisLine={false}/><YAxis stroke="#8490aa" tickLine={false} axisLine={false} allowDecimals={false}/><Tooltip contentStyle={{background:"#11192b",border:"1px solid #2a3550",borderRadius:10,color:"#f5f7ff"}}/><Bar dataKey="faults" name="Page faults" fill="#7c8cff" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer><div className="comparison-rows">{data.map((d)=><div key={d.name}><span>{d.name}</span><strong>{d.faults} faults</strong><span className="muted">{d.hits} hits</span></div>)}</div></div>;
}
function DiskPage() {
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [requests, setRequests] = useState("82, 170, 43, 140, 24, 16, 190");
  const [head, setHead] = useState("50");
  const [maxCylinder, setMaxCylinder] = useState("199");
  const [direction, setDirection] = useState("up");
  const [result, setResult] = useState(() => scheduleDisk("82, 170, 43, 140, 24, 16, 190",50,"FCFS","up",199));
  const [error,setError] = useState("");
  const run=()=>{try{setResult(scheduleDisk(parseNumberList(requests,"Disk requests"),head,algorithm,direction,maxCylinder));setError("");}catch(e){setError(e.message);}};
  const comparison=useMemo(()=>{try{return ["FCFS","SSTF","SCAN","C-SCAN"].map((name)=>({name,...scheduleDisk(parseNumberList(requests,"Disk requests"),head,name,direction,maxCylinder)}));}catch{return [];}},[requests,head,direction,maxCylinder]);
  return <>
    <SectionTitle eyebrow="MODULE 03 / STORAGE MANAGEMENT" title="Disk Scheduling" description="Compare how disk scheduling policies order requests and move the disk head." right={<span className="live-badge"><span/> LIVE SIMULATOR</span>} />
    <Notice message={error} clear={()=>setError("")}/>
    <div className="workspace-grid">
      <div className="panel input-panel"><div className="panel-heading"><div><h3>Simulation setup</h3><p>Configure disk requests</p></div><span className="step-number">03</span></div>
        <SelectField label="Scheduling algorithm" value={algorithm} onChange={setAlgorithm} options={["FCFS","SSTF","SCAN","C-SCAN"]}/>
        <label className="field"><span>Disk request sequence</span><textarea rows="3" value={requests} onChange={(e)=>setRequests(e.target.value)} placeholder="82, 170, 43, 140..."/></label>
        <div className="field-grid"><NumberField label="Initial head" value={head} min={0} onChange={setHead}/><NumberField label="Max cylinder" value={maxCylinder} min={1} onChange={setMaxCylinder}/></div>
        {(algorithm==="SCAN"||algorithm==="C-SCAN")&&<SelectField label="Initial direction" value={direction} onChange={setDirection} options={["up","down"]}/>}
        <div className="algorithm-info"><div className="info-title"><BookOpen size={15}/> How it works</div><p>{algorithmDescriptions[algorithm]}</p><p className="muted small">SCAN/C-SCAN use cylinder 0 and the configured maximum as sweep boundaries when the sweep crosses them.</p></div>
        <div className="button-row"><Button onClick={run}><Play size={15} fill="currentColor"/> Run simulation</Button><Button variant="secondary" onClick={()=>{setRequests("82, 170, 43, 140, 24, 16, 190");setHead("50");setMaxCylinder("199");setAlgorithm("FCFS");setDirection("up");setResult(scheduleDisk("82, 170, 43, 140, 24, 16, 190",50,"FCFS","up",199));setError("");}}><RotateCcw size={15}/> Reset</Button></div>
      </div>
      <div className="results-column">
        <div className="stats-grid two"><StatCard icon={ArrowDownUp} label="Total head movement" value={result.totalMovement} detail="cylinder movements" tone="blue"/><StatCard icon={HardDrive} label="Requests serviced" value={result.order.length} detail="disk requests" tone="teal"/></div>
        <div className="panel chart-panel"><div className="panel-heading"><div><h3>Head movement path</h3><p>Order in which the head visits cylinders</p></div><span className="mini-label">{algorithm.toUpperCase()}</span></div><div className="path-chips">{result.path.map((n,i)=><React.Fragment key={`${n}-${i}`}><span className={i===0?"path-start":i===result.path.length-1?"path-end":""}>{n}</span>{i<result.path.length-1&&<span className="path-arrow">→</span>}</React.Fragment>)}</div><div className="movement-bars">{result.path.slice(1).map((n,i)=><div key={i} className="movement-row"><span>{result.path[i]} → {n}</span><div className="movement-track"><div style={{width:`${Math.min(100,Math.abs(n-result.path[i])/Math.max(Number(maxCylinder)||199,1)*100)}%`}}/></div><strong>{Math.abs(n-result.path[i])}</strong></div>)}</div></div>
        <div className="panel table-panel"><div className="panel-heading"><div><h3>Algorithm comparison</h3><p>Head movement for the same requests</p></div><span className="mini-label">COMPARISON</span></div>{comparison.length?<><ResponsiveContainer width="100%" height={210}><BarChart data={comparison} margin={{top:10,right:12,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="#242d42"/><XAxis dataKey="name" stroke="#8490aa" tickLine={false} axisLine={false}/><YAxis stroke="#8490aa" tickLine={false} axisLine={false}/><Tooltip contentStyle={{background:"#11192b",border:"1px solid #2a3550",borderRadius:10,color:"#f5f7ff"}}/><Bar dataKey="totalMovement" name="Head movement" fill="#39d5c5" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer><div className="comparison-rows">{comparison.map((d)=><div key={d.name}><span>{d.name}</span><strong>{d.totalMovement} movements</strong><span className="muted">{d.order.length} requests</span></div>)}</div></>:<div className="empty-state">Enter valid requests to compare algorithms.</div>}</div>
      </div>
    </div>
  </>;
}
function App() {
  const [page, setPage] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [helpOpen,setHelpOpen] = useState(false);
  const current = navItems.find((item)=>item.id===page) || navItems[0];
  const PageIcon = current.icon;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"mobile-open":""}`}>
      <div className="brand"><div className="brand-mark"><Cpu size={21}/></div><div><strong>OS<span>Lab</span></strong><small>ALGORITHM VISUALIZER</small></div><button className="mobile-close" onClick={()=>setMobileNav(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{navItems.map((item)=>{const Icon=item.icon;return <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} onClick={()=>{setPage(item.id);setMobileNav(false);}}><Icon size={18}/><span>{item.label}</span>{page===item.id&&<span className="nav-active-dot"/>}</button>;})}</nav>
      <div className="sidebar-bottom"><div className="learning-card"><div className="learning-icon"><BookOpen size={17}/></div><strong>Learning mode</strong><p>Experiment freely. Every result updates from your inputs.</p><div className="learning-status"><span/> Ready to explore</div></div><div className="sidebar-version"><span>OSLab v1.0</span><span>Made for learners</span></div></div>
    </aside>
    {mobileNav&&<button className="mobile-scrim" onClick={()=>setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={()=>setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{current.label}</strong></div></div><div className="topbar-right"><div className="system-status"><span className="pulse"/> All systems operational</div><button className="help-button" onClick={()=>setHelpOpen(!helpOpen)}><CircleHelp size={17}/><span>Help</span></button></div></header>
      {helpOpen&&<div className="help-popover"><strong>Quick guide</strong><p>Choose a module, edit the input values, then select <b>Run simulation</b>. The results are calculated in your browser. Use Reset to restore the sample values.</p><button onClick={()=>setHelpOpen(false)}>Got it</button></div>}
      <div className="content-area">{page==="overview"?<Overview setPage={setPage}/>:page==="cpu"?<CPUPage/>:page==="pages"?<PagesPage/>:<DiskPage/>}
        <footer><span>© 2026 OSLab · OS Algorithm Visualizer</span><span><span className="footer-dot"/> Client-side simulations · No data stored</span></footer>
      </div>
    </main>
  </div>;
}
export default App;