export interface Subject {
  id: string;
  name: string;
  isTough: boolean;
}

export interface Routine {
  wakeUp: string;
  sleep: string;
}

export interface Task {
  id: string;
  title: string;
  type: 'deep' | 'shallow';
  completed: boolean;
  timeSlot?: string;
}

export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: 'code' | 'circuit' | 'report' | 'math';
  timestamp: number;
}

export interface ResearchThread {
  id: string;
  topic: string;
  summary: string;
  timestamp: number;
}

export interface UserState {
  hasSetup: boolean;
  subjects: Subject[];
  routine: Routine;
  tasks: Task[];
  lastCheckIn: number;
  artifacts: Artifact[];
  researchThreads: ResearchThread[];
}
