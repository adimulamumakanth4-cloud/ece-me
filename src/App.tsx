import React from 'react';
import SetupView from './components/SetupView';
import DashboardView from './components/DashboardView';
import { UserState, Subject, Routine, Task } from './types';
import { Cpu } from 'lucide-react';

const STORAGE_KEY = 'circuit_chief_state';

export default function App() {
  const [state, setState] = React.useState<UserState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaults: UserState = {
      hasSetup: false,
      subjects: [],
      routine: { wakeUp: '07:00', sleep: '23:00' },
      tasks: [],
      lastCheckIn: Date.now(),
      artifacts: [],
      researchThreads: [],
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleSetupComplete = (subjects: Subject[], routine: Routine) => {
    setState(prev => ({
      ...prev,
      hasSetup: true,
      subjects,
      routine,
      lastCheckIn: Date.now(),
    }));
  };

  const updateTasks = (tasks: Task[]) => {
    setState(prev => ({ ...prev, tasks }));
  };

  const updateState = (updates: Partial<UserState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetSetup = () => {
    if (confirm("Reset everything? Your modules and schedules will be purged.")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-blue-400 uppercase">
            Circuit<span className="text-slate-200">Chief</span> <span className="text-slate-500 font-normal ml-2 tracking-widest">// ECE v2.0</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] -mt-1">
            2nd Year B.Tech • Electronics & Communication
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          {state.hasSetup && (
            <div className="hidden md:flex items-center gap-4 text-right">
              <div className="text-[10px]">
                <p className="text-slate-500 uppercase mono">Operational Status</p>
                <p className="font-mono font-bold text-blue-400 uppercase tracking-widest leading-tight">Optimized</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                EC
              </div>
              <button 
                onClick={resetSetup}
                className="text-[10px] uppercase font-bold text-slate-600 hover:text-rose-400 transition-colors mono ml-2"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        {!state.hasSetup ? (
          <div className="py-12">
            <SetupView onComplete={handleSetupComplete} />
          </div>
        ) : (
          <DashboardView 
            state={state} 
            updateTasks={updateTasks} 
            updateState={updateState}
          />
        )}
      </main>
    </div>
  );
}
