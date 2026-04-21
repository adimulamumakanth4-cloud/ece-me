import React from 'react';
import { BookOpen, BrainCircuit, CheckSquare, MessageSquare, Plus, Send, RefreshCw, Clock, Zap, Cpu, FileText, Terminal, History, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, Task, Artifact, ResearchThread } from '../types';
import { explainConcept, generateSchedule } from '../lib/gemini';

interface DashboardViewProps {
  state: UserState;
  updateTasks: (tasks: Task[]) => void;
  updateState: (updates: Partial<UserState>) => void;
}

export default function DashboardView({ state, updateTasks, updateState }: DashboardViewProps) {
  const [activeTab, setActiveTab] = React.useState<'schedule' | 'translator' | 'lab'>('schedule');
  const [concept, setConcept] = React.useState("");
  const [explanation, setExplanation] = React.useState("");
  const [loadingExplanation, setLoadingExplanation] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [dailySchedule, setDailySchedule] = React.useState<any[]>([]);
  const [generatingSchedule, setGeneratingSchedule] = React.useState(false);
  const [activeSim, setActiveSim] = React.useState<string | null>(null);
  const [interactiveSteps, setInteractiveSteps] = React.useState<string[]>([]);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [activeArtifactId, setActiveArtifactId] = React.useState<string | null>(null);

  const labResources = [
    { title: "LTspice", desc: "Industry standard for analog circuit simulation. Mandatory for Analog Labs.", link: "https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html", canEmbed: false },
    { title: "Tinkercad Circuits", desc: "Perfect for breadboard prototyping and Arduino/Basic Digital logic.", link: "https://www.tinkercad.com/circuits", canEmbed: false },
    { title: "Proteus", desc: "Best for system-level microcontroller simulation and PCB design.", link: "https://www.labcenter.com/", canEmbed: false },
    { title: "MATLAB / Simulink", desc: "The heavy hitter for DSP, Control Systems, and Matrix math.", link: "https://www.mathworks.com/products/matlab.html", canEmbed: false },
    { title: "CircuitJS", desc: "Browser-based animated circuit simulator. Great for visualization.", link: "https://www.falstad.com/circuit/circuitjs.html", canEmbed: true }
  ];

  // Simulated Proactive check-in
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - state.lastCheckIn > 3 * 60 * 60 * 1000) {
        setShowCheckIn(true);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [state.lastCheckIn]);

  const handleExplain = async () => {
    if (!concept) return;
    setLoadingExplanation(true);
    try {
      const result = await explainConcept(concept);
      setExplanation(result || "Failed to process concept.");
      
      // Extract steps: [STEP 1]: ...
      const steps = result?.match(/\[STEP \d\]:.*?(?=\[STEP \d\]|\*\*|\n\n|$)/gs) || [];
      setInteractiveSteps(steps.map(s => s.replace(/\[STEP \d\]: /, '').trim()));
      setCurrentStep(0);

      // Claude Feature: Artifact Extraction
      const artifactMatch = result?.match(/\[ARTIFACT: (.*?)\]([\s\S]*?)\[\/ARTIFACT\]/);
      if (artifactMatch) {
        const title = artifactMatch[1];
        const content = artifactMatch[2].trim();
        const newArtifact: Artifact = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          content,
          type: content.includes('{') || content.includes('(') ? 'code' : 'report',
          timestamp: Date.now()
        };
        updateState({ artifacts: [newArtifact, ...state.artifacts].slice(0, 10) });
      }

      // Claude Feature: Thread History
      const newThread: ResearchThread = {
        id: Math.random().toString(36).substr(2, 9),
        topic: concept,
        summary: result?.substring(0, 100) + '...',
        timestamp: Date.now()
      };
      updateState({ researchThreads: [newThread, ...state.researchThreads].slice(0, 15) });

    } catch (err) {
      setExplanation("Error communicating with my central net. Try again.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleGenSchedule = async () => {
    setGeneratingSchedule(true);
    try {
      const subjects = state.subjects.map(s => s.name);
      const tasks = state.tasks.map(t => t.title);
      const result = await generateSchedule(subjects, state.routine, tasks);
      setDailySchedule(result.schedule || []);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const addTask = () => {
    if (!newTaskTitle) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      type: state.subjects.some(s => newTaskTitle.toLowerCase().includes(s.name.toLowerCase())) ? 'deep' : 'shallow',
      completed: false
    };
    updateTasks([...state.tasks, newTask]);
    setNewTaskTitle("");
  };

  const toggleTask = (id: string) => {
    updateTasks(state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="dashboard-grid h-[calc(100vh-64px)] overflow-hidden bg-slate-900">
      {/* Left Sidebar: Modules & Deadlines */}
      <aside className="sidebar border-r border-slate-800 overflow-y-auto space-y-8">
        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] mono">System Modules</h3>
          <div className="space-y-3">
            {state.subjects.map(s => (
              <div key={s.id} className="p-3 bg-slate-800/40 rounded border border-slate-700/50">
                <p className="text-xs font-semibold text-slate-300">{s.name}</p>
                <div className="w-full bg-slate-700/30 h-1 mt-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: s.isTough ? '40%' : '75%' }}
                    className={`h-full ${s.isTough ? 'bg-amber-500' : 'bg-blue-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] mono">Lab Resources</h3>
          <div className="space-y-2">
            {labResources.slice(0, 3).map((lab, i) => (
              <a key={i} href={lab.link} target="_blank" rel="noreferrer" className="block card p-3 hover:border-blue-500/50 transition-colors">
                <p className="text-[10px] font-bold text-blue-400 mb-1 mono">{lab.title}</p>
                <p className="text-[9px] text-slate-500 leading-tight">{lab.desc}</p>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] mono">Research Hub</h3>
          <div className="space-y-2">
            {(state.researchThreads?.length || 0) === 0 && (
              <p className="text-[9px] text-slate-600 italic px-2">No threads initialized.</p>
            )}
            {state.researchThreads?.map(thread => (
              <button 
                key={thread.id} 
                onClick={() => {
                  setConcept(thread.topic);
                  setActiveTab('translator');
                }}
                className="w-full text-left p-2 bg-slate-900/40 border border-slate-800 rounded hover:border-blue-500/50 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                  <p className="text-[10px] font-bold text-slate-300 truncate">{thread.topic}</p>
                </div>
                <p className="text-[9px] text-slate-500 line-clamp-1">{new Date(thread.timestamp).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] mono">Operational Cycle</h3>
          <div className="card bg-slate-800/20 p-3 space-y-2 text-xs mono">
            <div className="flex justify-between border-b border-slate-700/50 pb-2">
              <span className="text-slate-500">WAKE</span>
              <span className="text-blue-400 font-bold">{state.routine.wakeUp}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">SLEEP</span>
              <span className="text-blue-400 font-bold">{state.routine.sleep}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] mono">Lab Buffer</h3>
          <div className="space-y-2">
            <div className="text-[11px] p-2 bg-rose-900/10 border border-rose-900/30 rounded text-rose-300 flex justify-between items-center mono">
              <span>VLSI Sim Lab</span>
              <span className="bg-rose-500/20 px-1 rounded text-[9px] font-bold">URGENT</span>
            </div>
            <div className="text-[11px] p-2 bg-slate-800/50 border border-slate-700 rounded text-slate-400 flex justify-between items-center mono">
              <span>DSP Analysis</span>
              <span>T-48h</span>
            </div>
          </div>
        </section>
      </aside>

      {/* Main Content Area: Feed & Translator */}
      <main className="main-content overflow-y-auto custom-scroll">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex gap-6">
              {[
                { id: 'schedule', label: 'Timeline', icon: Clock },
                { id: 'translator', label: 'Translator', icon: Zap },
                { id: 'lab', label: 'Virtual Lab', icon: Cpu }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'}`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="tab" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-blue-400" />}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 mono uppercase tracking-widest bg-slate-800/50 px-2 py-1 rounded">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // Active
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'schedule' ? (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* Task Buffer section for mobile/quick access */}
                <section className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mono">Task Queue</h2>
                    <span className="text-[10px] text-slate-500 mono">{state.tasks.filter(t => !t.completed).length} Pending</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {state.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 rounded-full px-3 py-1 text-xs">
                         <button 
                          onClick={() => toggleTask(task.id)}
                          className={`w-3 h-3 rounded-full border ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-600' }`}
                        />
                        <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-300'}>{task.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add directive..."
                      className="flex-1 bg-slate-900/80 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors mono"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button onClick={addTask} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500"><Plus className="w-4 h-4" /></button>
                  </div>
                </section>

                {/* Vertical Timeline */}
                <section className="relative border-l border-slate-800 ml-2 space-y-10 pl-8">
                  {dailySchedule.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded bg-slate-900/20">
                      <Clock className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-600 text-sm mono italic uppercase">Standby... Compute Daily Protocol.</p>
                      <button onClick={handleGenSchedule} className="mt-4 text-xs bg-blue-600 px-4 py-2 rounded text-white font-bold hover:bg-blue-500">EXECUTE GEN</button>
                    </div>
                  )}
                  {dailySchedule.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="timeline-dot" style={{ background: item.type === 'deep' ? '#1e40af' : item.type === 'shallow' ? '#475569' : '#10b981' }} />
                      <span className={`status-tag ${item.type === 'deep' ? 'deep-work' : 'shallow-work'}`}>
                        {item.type || 'Routine'}
                      </span>
                      <h4 className="text-sm font-bold mt-2 text-slate-100">{item.activity}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">High fidelity block for target modules.</p>
                      <div className="mt-2 text-[10px] font-mono text-blue-400 tracking-widest">{item.time}</div>
                    </div>
                  ))}
                </section>
              </motion.div>
            ) : activeTab === 'translator' ? (
              <motion.div 
                key="translator"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 pb-12"
              >
                <div className="card space-y-6">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Input ECE concept for YouTube-style decoding..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors mono"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                    />
                    <button 
                      onClick={handleExplain}
                      disabled={loadingExplanation || !concept}
                      className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      <Send className="w-4 h-4" />
                      DECODE
                    </button>
                  </div>

                  <div className="translator-bubble relative overflow-hidden min-h-[400px]">
                    <div className="relative z-10">
                      {loadingExplanation ? (
                        <div className="flex flex-col items-center justify-center h-80 space-y-4">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <RefreshCw className="w-10 h-10 text-white opacity-80" />
                          </motion.div>
                          <p className="text-xs text-blue-100 mono animate-pulse tracking-widest">FILTERING NOISE // EXTRACTING INTUITION...</p>
                        </div>
                      ) : explanation ? (
                        <div className="space-y-6">
                          {/* Visualization Stage */}
                          {interactiveSteps.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-black/40 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                  <span className="text-[10px] font-bold text-blue-300 uppercase mono">Visual Walkthrough Stage</span>
                                </div>
                                <div className="flex gap-1">
                                  {interactiveSteps.map((_, i) => (
                                    <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === currentStep ? 'bg-blue-400' : 'bg-slate-700'}`} />
                                  ))}
                                </div>
                              </div>

                              <div className="h-32 flex items-center justify-center relative">
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-center px-8"
                                  >
                                    {/* Abstract animation based on step */}
                                    <div className="relative w-16 h-16 mx-auto mb-4 border-2 border-blue-500/30 rounded-lg flex items-center justify-center">
                                      {currentStep === 0 && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="w-6 h-6 bg-blue-500/50 rounded-full blur-sm" />}
                                      {currentStep === 1 && <motion.div animate={{ x: [-20, 20] }} transition={{ repeat: Infinity, duration: 2 }} className="w-4 h-4 bg-emerald-500/50 rounded-full blur-sm" />}
                                      {currentStep === 2 && <motion.div animate={{ opacity: [0, 1] }} className="w-8 h-8 border-2 border-amber-500/50 rounded-lg blur-[2px]" />}
                                      <Zap className="w-4 h-4 text-blue-300 absolute" />
                                    </div>
                                    <p className="text-xs text-blue-100 mono leading-relaxed h-12 overflow-hidden italic">
                                      {interactiveSteps[currentStep]}
                                    </p>
                                  </motion.div>
                                </AnimatePresence>
                              </div>

                              <div className="flex justify-between mt-6">
                                <button 
                                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                  disabled={currentStep === 0}
                                  className="px-4 py-2 text-[10px] uppercase font-bold text-slate-500 hover:text-blue-400 disabled:opacity-20 mono transition-colors"
                                >
                                  Prev State
                                </button>
                                <button 
                                  onClick={() => setCurrentStep(prev => Math.min(interactiveSteps.length - 1, prev + 1))}
                                  disabled={currentStep === interactiveSteps.length - 1}
                                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[10px] uppercase font-bold rounded mono transition-all"
                                >
                                  Next State
                                </button>
                              </div>
                            </motion.div>
                          )}

                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-blue-50 text-sm leading-relaxed space-y-6 pt-4"
                          >
                            {explanation.split('\n\n').map((para, i) => {
                              if (para.startsWith('1.') || para.startsWith('2.') || para.startsWith('3.') || para.startsWith('4.') || para.startsWith('5.')) {
                                if (para.includes('[STEP')) return null; // Hide raw step lines as they are in the walkthrough stage
                                const [title, ...rest] = para.split(':');
                                return (
                                  <motion.div 
                                    key={i}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-black/20 p-5 rounded-lg border border-white/5"
                                  >
                                    <h4 className="font-bold text-blue-300 mb-2 uppercase tracking-wider text-xs mono border-b border-blue-400/20 pb-2">{title}</h4>
                                    <div className="text-blue-50/90 whitespace-pre-wrap">{rest.join(':').trim()}</div>
                                  </motion.div>
                                );
                              }
                              if (para.includes('[STEP')) return null;
                              return <p key={i}>{para}</p>;
                            })}
                            
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                              <div className="p-2 bg-blue-400/20 rounded flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                <span className="text-[10px] font-bold uppercase mono text-blue-300">Logic Stream Verified</span>
                              </div>
                              <p className="text-[10px] text-blue-200/50 mono italic tracking-tight">System ready for iterative interrogation.</p>
                            </div>

                            {/* Artifacts Gallery (Claude Style) */}
                            {(state.artifacts?.length || 0) > 0 && (
                              <div className="grid grid-cols-2 gap-4 mt-8">
                                {state.artifacts?.filter(a => explanation.includes(a.title) || true).slice(0, 4).map(artifact => (
                                  <button 
                                    key={artifact.id}
                                    onClick={() => setActiveArtifactId(artifact.id)}
                                    className="flex items-center gap-4 p-4 bg-slate-950/80 border border-blue-500/20 rounded hover:border-blue-500/50 transition-all text-left"
                                  >
                                    <div className="w-10 h-10 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                      {artifact.type === 'code' ? <Terminal className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-[10px] text-slate-500 uppercase mono mb-1 tracking-widest">Artifact</p>
                                      <p className="text-xs font-bold text-slate-200 truncate">{artifact.title}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-80 text-blue-200/40">
                          <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-xs italic mono uppercase tracking-[0.3em]">Module Online // Standby for Logic Stream</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="lab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {activeSim ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSim(null)}
                          className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          <Send className="w-4 h-4 rotate-180" />
                        </button>
                        <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mono">Live Session: {activeSim}</h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] text-emerald-400 mono animate-pulse">● ENGINE CONNECTED</div>
                        <button 
                          onClick={() => setActiveSim(null)}
                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 mono"
                        >
                          TERMINATE SESSION
                        </button>
                      </div>
                    </div>
                    
                    <div className="card h-[600px] bg-black relative overflow-hidden p-0 border-blue-500/30">
                      {labResources.find(l => l.title === activeSim)?.canEmbed ? (
                        <iframe 
                          src={labResources.find(l => l.title === activeSim)?.link} 
                          className="w-full h-full border-none"
                          title="Simulation Engine"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 px-12 text-center">
                          <Cpu className="w-16 h-16 text-slate-800 animate-pulse" />
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-200">Native Application Required</h3>
                            <p className="text-xs text-slate-500 mono max-w-md leading-relaxed">
                              {activeSim} requires heavy local compute. Please launch your native workstation app and open the project template provided below.
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <a 
                              href={labResources.find(l => l.title === activeSim)?.link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded mono transition-all uppercase tracking-widest"
                            >
                              Launch Web Workspace
                            </a>
                            <button 
                              onClick={() => setActiveSim(null)}
                              className="px-6 py-3 border border-slate-700 hover:bg-slate-800 text-slate-400 text-[10px] font-bold rounded mono transition-all"
                            >
                              Return to Directory
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="card p-4 bg-slate-900/50">
                        <p className="text-[9px] text-slate-500 mono uppercase mb-1">Status</p>
                        <p className="text-xs font-bold text-emerald-400">Stable // 100%</p>
                      </div>
                      <div className="card p-4 bg-slate-900/50 text-center">
                        <p className="text-[9px] text-slate-500 mono uppercase mb-1">Session ID</p>
                        <p className="text-xs font-bold text-slate-300 mono uppercase">CC-{Math.random().toString(36).substr(2, 6)}</p>
                      </div>
                      <div className="card p-4 bg-slate-900/50 text-right">
                        <p className="text-[9px] text-slate-500 mono uppercase mb-1">Active Loop</p>
                        <p className="text-xs font-bold text-blue-400">Simulation Enabled</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mono mb-4 px-2">Simulation Directory</h2>
                      {labResources.map((lab, i) => (
                        <motion.div 
                          key={i}
                          whileHover={{ x: 10 }}
                          className="block card p-4 hover:border-blue-500/50 transition-all border-l-4 border-l-slate-700 hover:border-l-blue-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-100">{lab.title}</h3>
                            <Cpu className="w-4 h-4 text-slate-600" />
                          </div>
                          <p className="text-xs text-slate-400 mb-4">{lab.desc}</p>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setActiveSim(lab.title)}
                              className="text-[10px] font-bold text-blue-400 mono flex items-center gap-1 group"
                            >
                              START LIVE SESSION <Zap className="w-2 h-2 group-hover:scale-150 transition-transform" />
                            </button>
                            <a 
                              href={lab.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-300 mono"
                            >
                              DOCS
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mono mb-4 px-2">Practical Lab Projects</h2>
                      <div className="card bg-emerald-500/5 border-emerald-500/20 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Current Semester Benchmark
                        </h3>
                        <div className="space-y-4 text-xs text-slate-300">
                          {[
                            { title: "Op-Amp Filter Analysis", tool: "LTspice" },
                            { title: "8-bit Counter Design", tool: "Tinkercad Circuits" },
                            { title: "AM Modulator Implementation", tool: "CircuitJS" }
                          ].map((proj, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800 group cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => setActiveSim(proj.tool)}>
                              <span className="font-semibold">{proj.title}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded mono text-slate-500">{proj.tool}</span>
                                <Zap className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] italic text-emerald-300/60 pt-4">
                          "Choose a project, click 'Start Live Session', and visualize the circuit behavior. 
                          Immediate feedback is the best teacher."
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar: Status & Advice */}
      <aside className="sidebar border-l border-slate-800 overflow-y-auto space-y-8">
        <AnimatePresence>
          {showCheckIn && (
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="card border-blue-500 bg-blue-900/10"
            >
              <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 mono">System Inquiry</h3>
              <p className="text-xs leading-relaxed text-blue-100 mb-4 italic">
                "Hey champ, you're deep in the block. Is the phone in DND mode or should I start judging your CGPA?"
              </p>
              <button 
                onClick={() => setShowCheckIn(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-colors uppercase tracking-widest mono"
              >
                Locked In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="card flex flex-col justify-between h-auto">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mono">Senior's Protocol</h3>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Don't let Network Theory scare you. It's just fancy plumbing for electrons. Master the KVL/KCL basics and the rest of the semester is a cruise."
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-700/50">
            <div className="flex justify-between text-[10px] text-slate-500 mb-2 mono">
              <span>EXAM READINESS</span>
              <span className="text-blue-400">68%</span>
            </div>
            <div className="w-full bg-slate-700/30 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: '68%' }}></div>
            </div>
          </div>
        </section>

        <section className="p-4 bg-slate-900 border border-dashed border-slate-800 rounded">
          <p className="text-[9px] text-slate-600 mono uppercase tracking-tight text-center">
            CircuitChief Kernel v2.0 // Multi-Threaded Productivity
          </p>
        </section>
      </aside>

      {/* Claude Style Artifact Overlay */}
      <AnimatePresence>
        {activeArtifactId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-full max-w-2xl h-full bg-slate-900 border border-slate-700 shadow-2xl flex flex-col rounded-xl overflow-hidden"
            >
              <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    {state.artifacts.find(a => a.id === activeArtifactId)?.type === 'code' ? <Terminal className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                  </div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mono">
                    {state.artifacts.find(a => a.id === activeArtifactId)?.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-800 rounded text-slate-500 transition-colors"><Maximize2 className="w-4 h-4" /></button>
                  <button 
                    onClick={() => setActiveArtifactId(null)}
                    className="p-2 hover:bg-rose-500/20 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-8 custom-scroll bg-slate-950/20">
                <pre className="text-xs text-blue-100/90 whitespace-pre-wrap font-mono leading-relaxed bg-black/40 p-6 rounded border border-white/5">
                  {state.artifacts.find(a => a.id === activeArtifactId)?.content}
                </pre>
              </div>
              <div className="h-12 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between px-6">
                <span className="text-[9px] text-slate-600 mono uppercase">System Generated Artifact</span>
                <button className="text-[9px] font-bold text-blue-500 uppercase mono hover:text-blue-400 transition-colors">Download Logic-Stream</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
