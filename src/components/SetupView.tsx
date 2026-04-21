import React from 'react';
import { Cpu, Zap, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Subject, Routine } from '../types';

interface SetupViewProps {
  onComplete: (subjects: Subject[], routine: Routine) => void;
}

export default function SetupView({ onComplete }: SetupViewProps) {
  const [subjects, setSubjects] = React.useState<string>("");
  const [wakeUp, setWakeUp] = React.useState("07:00");
  const [sleep, setSleep] = React.useState("23:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean).map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      name: s,
      isTough: false // User can mark later or we can guess
    }));
    onComplete(subjectList, { wakeUp, sleep });
  };

  return (
    <div className="max-w-2xl mx-auto px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded bg-slate-900 border border-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.1)] mb-6">
          <Cpu className="text-blue-400 w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Access Kernel <span className="text-blue-400 font-mono text-2xl ml-2 uppercase">v2.0</span></h1>
        <p className="text-slate-500 uppercase tracking-[0.2em] text-xs mono">Initialize Academic Protocol</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-400 w-5 h-5" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mono text-slate-400">Sector: Modules</h2>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 mono tracking-widest">Active Semester Subjects</label>
            <textarea
              required
              placeholder="e.g. 8086 Microprocessors, Control Systems, VLSI Design, DSP"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded p-4 focus:outline-none focus:border-blue-500 transition-colors mono text-sm min-h-[120px] text-slate-200"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
            />
            <p className="text-[10px] text-slate-600 italic">Separate modules with commas for system parsing.</p>
          </div>
        </section>

        <section className="card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-400 w-5 h-5" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mono text-slate-400">Sector: Circadian</h2>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 mono tracking-widest">Wake Cycle</label>
              <input
                type="time"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors mono text-sm text-slate-200"
                value={wakeUp}
                onChange={(e) => setWakeUp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 mono tracking-widest">Sleep Cycle</label>
              <input
                type="time"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors mono text-sm text-slate-200"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
              />
            </div>
          </div>
        </section>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded shadow-lg shadow-blue-900/20 transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 mono"
        >
          <ShieldCheck className="w-4 h-4" />
          Deploy Kernel
        </motion.button>
      </form>
    </div>
  );
}
