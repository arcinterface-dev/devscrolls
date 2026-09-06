import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './DailyScroll.module.css';

// Types
type Priority = 'none' | 'low' | 'medium' | 'high';
type TimeBlock = 'morning' | 'afternoon' | 'evening';
interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  createdAt: number;
  migrated?: boolean;
  timeBlock?: TimeBlock;
  blocked?: boolean;
}
type DailyScrollData = Record<string, Task[]>;

const TIME_BLOCKS: { key: TimeBlock | 'anytime'; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '☀️' },
  { key: 'afternoon', label: 'Afternoon', icon: '🌤️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
  { key: 'anytime', label: 'Anytime', icon: '🕐' },
];

// Helpers
function getLocalDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getOffsetDateStr(offsetDays: number, baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return getLocalDateStr(d);
}
function getDayName(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function DailyScroll() {
  const [data, setData] = useState<DailyScrollData>({});
  const [currentDateStr, setCurrentDateStr] = useState<string>(getLocalDateStr());
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'high'>('all');
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [touchOverId, setTouchOverId] = useState<string | null>(null);
  const [touchOverTimeBlock, setTouchOverTimeBlock] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Undo action state (for both delete and defer)
  const [undoAction, setUndoAction] = useState<{ message: string; undo: () => void } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerUndoRef = useRef<(() => void) | null>(null);

  // Keyboard navigation & Shortcuts
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Standup Generator 2.0
  const [showStandupModal, setShowStandupModal] = useState(false);
  const [standupFormat, setStandupFormat] = useState<'slack' | 'markdown'>('slack');
  const [includeYesterdayDone, setIncludeYesterdayDone] = useState(false);
  const [editedStandupText, setEditedStandupText] = useState<string>('');
  const [isStandupCopied, setIsStandupCopied] = useState(false);
  const showStandupModalRef = useRef(false);
  showStandupModalRef.current = showStandupModal;

  // Data Portability & Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const showSettingsModalRef = useRef(false);
  showSettingsModalRef.current = showSettingsModal;
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus Timer (Pomodoro)
  const [focusSession, setFocusSession] = useState<{ taskId: string; taskText: string; initialMinutes: number } | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerCompleted, setIsTimerCompleted] = useState<boolean>(false);
  const focusSessionRef = useRef<{ taskId: string; taskText: string; initialMinutes: number } | null>(null);
  focusSessionRef.current = focusSession;
  const startFocusSessionRef = useRef<(taskId: string, taskText: string, minutes?: number) => void>(() => {});

  const selectedTaskIdRef = useRef<string | null>(null);
  selectedTaskIdRef.current = selectedTaskId;

  const editingTaskIdRef = useRef<string | null>(null);
  editingTaskIdRef.current = editingTaskId;

  const showShortcutsModalRef = useRef(false);
  showShortcutsModalRef.current = showShortcutsModal;

  const visibleTasksRef = useRef<Task[]>([]);
  const toggleTaskRef = useRef<(id: string) => void>(() => {});
  const deleteTaskRef = useRef<(id: string) => void>(() => {});
  const deferTaskRef = useRef<(id: string) => void>(() => {});
  const setTaskTimeBlockRef = useRef<(id: string, block?: TimeBlock) => void>(() => {});
  const moveTaskRelativeRef = useRef<(taskId: string, direction: -1 | 1) => void>(() => {});

  const scrollTaskIntoView = (taskId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  };

  useEffect(() => {
    const savedData = localStorage.getItem('devscrolls-dailyscroll-v2');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Clean up legacy 'medium' defaults
      Object.keys(parsed).forEach(date => {
        parsed[date] = parsed[date].map((t: Task) => {
          if (t.priority === 'medium' && (!t.tags || t.tags.length === 0)) {
            return { ...t, priority: 'none' };
          }
          return t;
        });
      });
      setData(parsed);
    } else {
      // Migrate V1
      const oldTasks = JSON.parse(localStorage.getItem('devscrolls-dailyscroll-tasks') || '[]');
      if (oldTasks.length > 0) {
        const migratedTasks = oldTasks.map((t: any) => ({
          ...t,
          priority: 'none',
          tags: []
        }));
        const initialData = { [getLocalDateStr()]: migratedTasks };
        setData(initialData);
        localStorage.setItem('devscrolls-dailyscroll-v2', JSON.stringify(initialData));
      }
    }
    setIsLoaded(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable;

      // When inside an input
      if (isInputActive) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          setSearchQuery('');
          setInputValue('');
          setEditingTaskId(null);
        }
        return;
      }

      // Escape when not in input: close modal, clear selection
      if (e.key === 'Escape') {
        if (showSettingsModalRef.current) {
          setShowSettingsModal(false);
          return;
        }
        if (showStandupModalRef.current) {
          setShowStandupModal(false);
          return;
        }
        if (showShortcutsModalRef.current) {
          setShowShortcutsModal(false);
          return;
        }
        setSelectedTaskId(null);
        setEditingTaskId(null);
        return;
      }

      // ? / Shift + /: Toggle shortcuts modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Ctrl+Z / Cmd+Z to undo
      if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        triggerUndoRef.current?.();
        return;
      }

      // Cmd+K to focus search
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSelectedTaskId(null);
        searchInputRef.current?.focus();
        return;
      }

      // / to focus search
      if (e.key === '/' && !e.shiftKey) {
        e.preventDefault();
        setSelectedTaskId(null);
        searchInputRef.current?.focus();
        return;
      }

      // n: focus add task input
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSelectedTaskId(null);
        inputRef.current?.focus();
        return;
      }

      // Navigation: j / ArrowDown
      if (e.key.toLowerCase() === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const tasks = visibleTasksRef.current;
        if (tasks.length === 0) return;
        const currentId = selectedTaskIdRef.current;
        const currentIndex = tasks.findIndex(t => t.id === currentId);
        let nextIndex = 0;
        if (currentIndex !== -1 && currentIndex < tasks.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (currentIndex === -1) {
          nextIndex = 0;
        } else {
          nextIndex = currentIndex;
        }
        const nextId = tasks[nextIndex].id;
        setSelectedTaskId(nextId);
        scrollTaskIntoView(nextId);
        return;
      }

      // Navigation: k / ArrowUp
      if (e.key.toLowerCase() === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const tasks = visibleTasksRef.current;
        if (tasks.length === 0) return;
        const currentId = selectedTaskIdRef.current;
        const currentIndex = tasks.findIndex(t => t.id === currentId);
        let prevIndex = tasks.length - 1;
        if (currentIndex > 0) {
          prevIndex = currentIndex - 1;
        } else if (currentIndex === -1) {
          prevIndex = tasks.length - 1;
        } else {
          prevIndex = 0;
        }
        const prevId = tasks[prevIndex].id;
        setSelectedTaskId(prevId);
        scrollTaskIntoView(prevId);
        return;
      }

      // Actions requiring a selected task
      const currentSelectedId = selectedTaskIdRef.current;
      if (!currentSelectedId) return;

      const tasks = visibleTasksRef.current;
      const currentTask = tasks.find(t => t.id === currentSelectedId);
      if (!currentTask) return;

      // x or Space: Toggle completion
      if (e.key.toLowerCase() === 'x' || e.key === ' ') {
        e.preventDefault();
        toggleTaskRef.current(currentSelectedId);
        return;
      }

      // d: Defer to tomorrow (only for pending tasks)
      if (e.key.toLowerCase() === 'd' && !currentTask.completed) {
        e.preventDefault();
        const currentIndex = tasks.findIndex(t => t.id === currentSelectedId);
        deferTaskRef.current(currentSelectedId);
        const remaining = tasks.filter(t => t.id !== currentSelectedId);
        if (remaining.length > 0) {
          const nextIdx = Math.min(currentIndex, remaining.length - 1);
          const nextId = remaining[nextIdx].id;
          setSelectedTaskId(nextId);
          scrollTaskIntoView(nextId);
        } else {
          setSelectedTaskId(null);
        }
        return;
      }

      // Delete / Backspace: Delete task
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const currentIndex = tasks.findIndex(t => t.id === currentSelectedId);
        deleteTaskRef.current(currentSelectedId);
        const remaining = tasks.filter(t => t.id !== currentSelectedId);
        if (remaining.length > 0) {
          const nextIdx = Math.min(currentIndex, remaining.length - 1);
          const nextId = remaining[nextIdx].id;
          setSelectedTaskId(nextId);
          scrollTaskIntoView(nextId);
        } else {
          setSelectedTaskId(null);
        }
        return;
      }

      // e: Edit task text
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setEditingTaskId(currentSelectedId);
        return;
      }

      // t: Cycle time block (anytime -> morning -> afternoon -> evening -> anytime)
      if (e.key.toLowerCase() === 't' && !currentTask.completed) {
        e.preventDefault();
        const cycleOrder: (TimeBlock | undefined)[] = ['morning', 'afternoon', 'evening', undefined];
        const currentBlock = currentTask.timeBlock;
        let nextBlockIdx = 0;
        if (currentBlock === 'morning') nextBlockIdx = 1;
        else if (currentBlock === 'afternoon') nextBlockIdx = 2;
        else if (currentBlock === 'evening') nextBlockIdx = 3;
        else nextBlockIdx = 0;
        const nextBlock = cycleOrder[nextBlockIdx];
        setTaskTimeBlockRef.current(currentSelectedId, nextBlock);
        return;
      }

      // p: Start or toggle focus timer on selected task
      if (e.key.toLowerCase() === 'p' && !currentTask.completed) {
        e.preventDefault();
        if (focusSessionRef.current?.taskId === currentSelectedId) {
          setIsTimerRunning(prev => !prev);
        } else {
          startFocusSessionRef.current(currentSelectedId, currentTask.text, 25);
        }
        return;
      }

      // Alt+Up / Alt+k: Move task up in list
      if (e.altKey && (e.key === 'ArrowUp' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        moveTaskRelativeRef.current(currentSelectedId, -1);
        return;
      }

      // Alt+Down / Alt+j: Move task down in list
      if (e.altKey && (e.key === 'ArrowDown' || e.key.toLowerCase() === 'j')) {
        e.preventDefault();
        moveTaskRelativeRef.current(currentSelectedId, 1);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('devscrolls-dailyscroll-v2', JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // Derived state
  const todayStr = getLocalDateStr();
  const tomorrowStr = getOffsetDateStr(1);
  const tasks = data[currentDateStr] || [];
  
  // Rollover logic
  const getRolloverInfo = () => {
    if (currentDateStr !== todayStr) return null;
    const pastDays = Object.keys(data)
      .filter(d => d < todayStr && d.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort((a, b) => b.localeCompare(a));

    for (const day of pastDays) {
      const pending = (data[day] || []).filter(t => !t.completed);
      if (pending.length > 0) {
        return { date: day, tasks: pending };
      }
    }
    return null;
  };
  const rolloverInfo = getRolloverInfo();

  const handleRollover = () => {
    if (!rolloverInfo) return;
    const { date, tasks } = rolloverInfo;
    const updatedPastTasks = data[date].filter(t => t.completed);
    const tasksToMove = tasks.map(t => ({ ...t, migrated: true, id: crypto.randomUUID() }));
    
    setData(prev => ({
      ...prev,
      [date]: updatedPastTasks,
      [todayStr]: [...(prev[todayStr] || []), ...tasksToMove]
    }));
  };

  // Filtered tasks based on search
  let filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.text.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
  });

  if (filter === 'pending') filteredTasks = filteredTasks.filter(t => !t.completed);
  if (filter === 'high') filteredTasks = filteredTasks.filter(t => t.priority === 'high');

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  // Group pending tasks by time block
  const groupedPending: Record<string, Task[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    anytime: [],
  };
  pendingTasks.forEach(t => {
    const block = t.timeBlock || 'anytime';
    groupedPending[block].push(t);
  });
  const activeBlockKeys = Object.keys(groupedPending).filter(k => groupedPending[k].length > 0);
  const hasAnyTimeBlocks = pendingTasks.some(t => t.timeBlock);

  // Ordered list of visible tasks currently rendered
  const visibleTasks = useMemo(() => {
    if (hasAnyTimeBlocks) {
      const list: Task[] = [];
      activeBlockKeys.forEach(k => {
        list.push(...groupedPending[k]);
      });
      list.push(...completedTasks);
      return list;
    }
    return [...pendingTasks, ...completedTasks];
  }, [hasAnyTimeBlocks, activeBlockKeys, groupedPending, pendingTasks, completedTasks]);
  visibleTasksRef.current = visibleTasks;

  // Clear selection if selected task is no longer in visible list
  useEffect(() => {
    if (selectedTaskId && !visibleTasks.some(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [visibleTasks, selectedTaskId]);

  // Stats calculation
  const allDates = Object.keys(data).sort();
  let weeklyCompleted = 0;
  
  const todayObj = new Date(todayStr);
  const weekAgo = new Date(todayObj);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  allDates.forEach(dateStr => {
    const d = new Date(dateStr);
    if (d >= weekAgo && d <= todayObj) {
      weeklyCompleted += data[dateStr].filter(t => t.completed).length;
    }
  });

  // Streak logic
  let streak = 0;
  let checkDate = new Date(todayStr);
  let hasCompletedToday = (data[todayStr] || []).some(t => t.completed);
  if (hasCompletedToday) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (true) {
    const checkStr = getLocalDateStr(checkDate);
    const dayTasks = data[checkStr] || [];
    if (dayTasks.some(t => t.completed)) {
      if (streak === 0 && checkDate.getTime() === (new Date(todayStr).getTime() - 86400000)) {
        streak = 1;
      } else {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Parsers
  const parseTaskInput = (input: string): { text: string, tags: string[], priority: Priority, timeBlock?: TimeBlock, blocked?: boolean } => {
    let priority: Priority = 'none';
    let timeBlock: TimeBlock | undefined;
    let blocked = false;
    let text = input;

    // Parse !blocked / !blocker
    text = text.replace(/(?:^|\s)!(blocked|blocker)\b/gi, () => {
      blocked = true;
      return ' ';
    });
    
    const foundPriorities: Priority[] = [];
    text = text.replace(/(?:^|\s)!(high|medium|low)\b/gi, (_, p1) => {
      foundPriorities.push(p1.toLowerCase() as Priority);
      return ' ';
    });

    if (foundPriorities.length > 0) {
      priority = foundPriorities[foundPriorities.length - 1];
    }

    // Parse time blocks: @morning, @afternoon, @evening
    text = text.replace(/(?:^|\s)@(morning|afternoon|evening)\b/gi, (_, block) => {
      timeBlock = block.toLowerCase() as TimeBlock;
      return ' ';
    });

    const tags: string[] = [];
    const tagMatches = text.match(/#[\w-]+/g);
    if (tagMatches) {
      tagMatches.forEach(t => {
        const tag = t.substring(1);
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
        if (tag.toLowerCase() === 'blocker' || tag.toLowerCase() === 'blocked') {
          blocked = true;
        }
      });
      text = text.replace(/#[\w-]+/g, '');
    }

    return { text: text.trim().replace(/\s+/g, ' '), tags, priority, timeBlock, blocked };
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const { text, tags, priority, timeBlock, blocked } = parseTaskInput(inputValue);

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      tags,
      createdAt: Date.now(),
      ...(timeBlock && { timeBlock }),
      ...(blocked && { blocked: true })
    };

    setData(prev => ({
      ...prev,
      [currentDateStr]: [...(prev[currentDateStr] || []), newTask]
    }));
    setInputValue('');
  };

  const appendSyntax = (syntax: string) => {
    setInputValue(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${syntax}` : `${syntax} `;
    });
    inputRef.current?.focus();
  };

  const toggleTask = (id: string) => {
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const deleteTask = (id: string) => {
    const dayTasks = data[currentDateStr] || [];
    const index = dayTasks.findIndex(t => t.id === id);
    const task = dayTasks[index];
    if (!task) return;

    // Clear any existing undo timer
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    // Remove the task
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].filter(t => t.id !== id)
    }));

    // Store for undo
    setUndoAction({
      message: 'Task deleted',
      undo: () => {
        setData(prev => {
          const dayList = [...(prev[currentDateStr] || [])];
          const insertAt = Math.min(index, dayList.length);
          dayList.splice(insertAt, 0, task);
          return { ...prev, [currentDateStr]: dayList };
        });
      }
    });

    // Auto-dismiss toast after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setUndoAction(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const deferTask = (id: string) => {
    const dayTasks = data[currentDateStr] || [];
    const index = dayTasks.findIndex(t => t.id === id);
    const task = dayTasks[index];
    if (!task) return;

    // Determine target date: tomorrow if on today, today if on past day, or next day
    let targetDateStr: string;
    if (currentDateStr < todayStr) {
      targetDateStr = todayStr;
    } else {
      targetDateStr = getOffsetDateStr(1, new Date(currentDateStr + 'T12:00:00'));
    }

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    const migratedTask: Task = {
      ...task,
      migrated: true
    };

    // Remove from current day, append to target day
    setData(prev => ({
      ...prev,
      [currentDateStr]: (prev[currentDateStr] || []).filter(t => t.id !== id),
      [targetDateStr]: [...(prev[targetDateStr] || []), migratedTask]
    }));

    const targetLabel = targetDateStr === todayStr ? 'Today' : targetDateStr === tomorrowStr ? 'Tomorrow' : getDayName(targetDateStr).substring(0, 3);

    setUndoAction({
      message: `Task deferred to ${targetLabel}`,
      undo: () => {
        setData(prev => {
          const currentList = [...(prev[currentDateStr] || [])];
          const insertAt = Math.min(index, currentList.length);
          currentList.splice(insertAt, 0, task);
          return {
            ...prev,
            [currentDateStr]: currentList,
            [targetDateStr]: (prev[targetDateStr] || []).filter(t => t.id !== id)
          };
        });
      }
    });

    undoTimeoutRef.current = setTimeout(() => {
      setUndoAction(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const triggerUndo = () => {
    if (!undoAction) return;
    undoAction.undo();
    setUndoAction(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setCurrentDateStr(dateStr);
    setSelectedTaskId(null);
    setEditingTaskId(null);
    const taskListEl = document.querySelector(`.${styles.taskList}`);
    if (taskListEl && 'scrollTo' in taskListEl) {
      taskListEl.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    const scrollContainer = document.querySelector('.tool-main') || window;
    if ('scrollTo' in scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const editTaskText = (id: string, newText: string) => {
    const { text, tags, priority, timeBlock, blocked } = parseTaskInput(newText);
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].map(t => 
        t.id === id ? { 
          ...t, 
          text, 
          priority, 
          tags, 
          timeBlock: timeBlock || t.timeBlock,
          blocked: blocked || (newText.includes('!blocked') ? true : t.blocked)
        } : t
      )
    }));
  };

  const setTaskTimeBlock = (id: string, block: TimeBlock | undefined) => {
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].map(t =>
        t.id === id ? { ...t, timeBlock: block } : t
      )
    }));
  };

  const moveTaskRelative = (taskId: string, direction: -1 | 1) => {
    const dayTasks = [...(data[currentDateStr] || [])];
    const currentIndex = dayTasks.findIndex(t => t.id === taskId);
    if (currentIndex === -1) return;
    const isCompleted = dayTasks[currentIndex].completed;
    
    let targetIndex = -1;
    if (direction === -1) {
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (dayTasks[i].completed === isCompleted) {
          targetIndex = i;
          break;
        }
      }
    } else {
      for (let i = currentIndex + 1; i < dayTasks.length; i++) {
        if (dayTasks[i].completed === isCompleted) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) return;

    const targetTask = dayTasks[targetIndex];
    const [removed] = dayTasks.splice(currentIndex, 1);
    if (targetTask.timeBlock) {
      removed.timeBlock = targetTask.timeBlock;
    }
    dayTasks.splice(targetIndex, 0, removed);

    setData(prev => ({
      ...prev,
      [currentDateStr]: dayTasks
    }));

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    scrollTaskIntoView(taskId);
  };

  // Stable refs for keydown handler registered on mount
  triggerUndoRef.current = triggerUndo;
  toggleTaskRef.current = toggleTask;
  deleteTaskRef.current = deleteTask;
  deferTaskRef.current = deferTask;
  setTaskTimeBlockRef.current = setTaskTimeBlock;
  moveTaskRelativeRef.current = moveTaskRelative;

  // Focus Timer Audio Chime (Web Audio API - no external files)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // AudioContext blocked
    }
  };

  const startFocusSession = (taskId: string, taskText: string, minutes = 25) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setFocusSession({ taskId, taskText, initialMinutes: minutes });
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    setIsTimerCompleted(false);
  };
  startFocusSessionRef.current = startFocusSession;

  const toggleTimerRunning = () => {
    setIsTimerRunning(prev => !prev);
  };

  const addFiveMinutes = () => {
    setTimerSeconds(prev => Math.min(prev + 300, 7200));
  };

  const resetFocusTimer = (minutes = 25) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    setIsTimerCompleted(false);
  };

  const handleFocusComplete = () => {
    if (focusSession) {
      toggleTask(focusSession.taskId);
    }
    stopFocusSession();
  };

  const stopFocusSession = () => {
    setFocusSession(null);
    setIsTimerRunning(false);
    setIsTimerCompleted(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Focus Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || !focusSession) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setIsTimerCompleted(true);
          playChime();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Session Completed! 🎯', {
              body: `Great job on "${focusSession.taskText}". Take a 5-minute break!`,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, focusSession]);

  // Tab title sync with timer
  useEffect(() => {
    if (focusSession) {
      const m = Math.floor(timerSeconds / 60);
      const s = String(timerSeconds % 60).padStart(2, '0');
      document.title = isTimerCompleted 
        ? `(🔔 Done!) DailyScroll` 
        : `(${m}:${s}) DailyScroll`;
    } else {
      document.title = "DailyScroll - Developer To-Do List & Standup Generator";
    }
    return () => {
      document.title = "DailyScroll - Developer To-Do List & Standup Generator";
    };
  }, [timerSeconds, focusSession, isTimerCompleted]);

  // Drag and drop & Touch Reorder logic
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDrop = (e: React.DragEvent, targetId: string, isCompletedList: boolean) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const dayTasks = [...(data[currentDateStr] || [])];
    const draggedIdx = dayTasks.findIndex(t => t.id === draggedId);
    const targetIdx = dayTasks.findIndex(t => t.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;
    if (dayTasks[draggedIdx].completed !== isCompletedList) return; 

    const targetTask = dayTasks[targetIdx];
    const [removed] = dayTasks.splice(draggedIdx, 1);
    if (targetTask.timeBlock) {
      removed.timeBlock = targetTask.timeBlock;
    }
    dayTasks.splice(targetIdx, 0, removed);
    
    setData(prev => ({
      ...prev,
      [currentDateStr]: dayTasks
    }));
    setDraggedId(null);
    setTouchOverId(null);
  };

  const handleTouchStartDrag = (taskId: string) => {
    setDraggedId(taskId);
    setSelectedTaskId(taskId);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleTouchMoveDrag = (clientX: number, clientY: number) => {
    if (!draggedId) return;
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return;

    const taskEl = el.closest('[data-task-id]') as HTMLElement | null;
    if (taskEl) {
      const targetId = taskEl.getAttribute('data-task-id');
      if (targetId && targetId !== draggedId) {
        setTouchOverId(targetId);
        setTouchOverTimeBlock(null);
        return;
      }
    }

    const blockEl = el.closest('[data-timeblock-key]') as HTMLElement | null;
    if (blockEl) {
      const blockKey = blockEl.getAttribute('data-timeblock-key');
      if (blockKey) {
        setTouchOverTimeBlock(blockKey);
        setTouchOverId(null);
        return;
      }
    }
  };

  const handleTouchEndDrag = () => {
    if (!draggedId) return;

    if (touchOverId && touchOverId !== draggedId) {
      const dayTasks = [...(data[currentDateStr] || [])];
      const sourceIdx = dayTasks.findIndex(t => t.id === draggedId);
      const targetIdx = dayTasks.findIndex(t => t.id === touchOverId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const targetTask = dayTasks[targetIdx];
        const [removed] = dayTasks.splice(sourceIdx, 1);
        if (targetTask.timeBlock) {
          removed.timeBlock = targetTask.timeBlock;
        }
        dayTasks.splice(targetIdx, 0, removed);

        setData(prev => ({
          ...prev,
          [currentDateStr]: dayTasks
        }));

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(25);
        }
      }
    } else if (touchOverTimeBlock) {
      setTaskTimeBlock(draggedId, touchOverTimeBlock === 'anytime' ? undefined : touchOverTimeBlock as TimeBlock);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    }

    setDraggedId(null);
    setTouchOverId(null);
    setTouchOverTimeBlock(null);
  };

  // Standup Generator 2.0 logic
  const generateStandupText = (format: 'slack' | 'markdown', withYesterday: boolean) => {
    const currentTasks = data[currentDateStr] || [];
    
    // Done tasks
    let doneList: Task[] = currentTasks.filter(t => t.completed);
    if (withYesterday) {
      const pastDates = Object.keys(data)
        .filter(d => d < currentDateStr && d.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort((a, b) => b.localeCompare(a));
      for (const d of pastDates) {
        const dDone = (data[d] || []).filter(t => t.completed);
        if (dDone.length > 0) {
          doneList = [...dDone, ...doneList];
          break;
        }
      }
    }

    // Pending tasks
    const pendingList = currentTasks.filter(t => !t.completed);
    const blockers = pendingList.filter(t => t.blocked || t.tags.includes('blocker') || t.tags.includes('blocked'));
    const inProgress = pendingList.filter(t => !blockers.includes(t));

    const dateTitle = `${getDayName(currentDateStr)}, ${new Date(currentDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    if (format === 'slack') {
      let text = `*Daily Standup — ${dateTitle}*\n\n`;

      text += `*✅ Done:*\n`;
      if (doneList.length > 0) {
        doneList.forEach(t => {
          text += `• ${t.text}\n`;
        });
      } else {
        text += `• None\n`;
      }
      text += `\n`;

      text += `*🔄 In Progress:*\n`;
      if (inProgress.length > 0) {
        inProgress.forEach(t => {
          const timePill = t.timeBlock ? ` [${t.timeBlock.toUpperCase()}]` : '';
          text += `• ${t.text}${timePill}\n`;
        });
      } else {
        text += `• None\n`;
      }
      text += `\n`;

      text += `*🚫 Blockers:*\n`;
      if (blockers.length > 0) {
        blockers.forEach(t => {
          text += `• ${t.text}\n`;
        });
      } else {
        text += `• None\n`;
      }

      return text.trim();
    } else {
      let text = `### Daily Standup — ${dateTitle}\n\n`;

      text += `#### ✅ Done\n`;
      if (doneList.length > 0) {
        doneList.forEach(t => {
          text += `- [x] ${t.text}\n`;
        });
      } else {
        text += `- None\n`;
      }
      text += `\n`;

      text += `#### 🔄 In Progress\n`;
      if (inProgress.length > 0) {
        inProgress.forEach(t => {
          const timePill = t.timeBlock ? ` (${t.timeBlock})` : '';
          text += `- [ ] ${t.text}${timePill}\n`;
        });
      } else {
        text += `- None\n`;
      }
      text += `\n`;

      text += `#### 🚫 Blockers\n`;
      if (blockers.length > 0) {
        blockers.forEach(t => {
          text += `- ⚠️ ${t.text}\n`;
        });
      } else {
        text += `- None\n`;
      }

      return text.trim();
    }
  };

  const openStandupModal = () => {
    const shouldIncludePrev = completedTasks.length === 0;
    setIncludeYesterdayDone(shouldIncludePrev);
    const text = generateStandupText(standupFormat, shouldIncludePrev);
    setEditedStandupText(text);
    setIsStandupCopied(false);
    setShowStandupModal(true);
  };

  const handleFormatChange = (fmt: 'slack' | 'markdown') => {
    setStandupFormat(fmt);
    setEditedStandupText(generateStandupText(fmt, includeYesterdayDone));
    setIsStandupCopied(false);
  };

  const handleYesterdayToggle = (checked: boolean) => {
    setIncludeYesterdayDone(checked);
    setEditedStandupText(generateStandupText(standupFormat, checked));
    setIsStandupCopied(false);
  };

  const copyStandupToClipboard = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(editedStandupText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const el = document.createElement('textarea');
      el.value = editedStandupText;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setIsStandupCopied(true);
    setTimeout(() => setIsStandupCopied(false), 2500);
  };

  const downloadStandupFile = () => {
    const blob = new Blob([editedStandupText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dailyscroll-standup-${currentDateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Data Portability & Backup logic
  const totalStoredTasks = useMemo(() => {
    return Object.values(data).reduce((acc, list) => acc + (list?.length || 0), 0);
  }, [data]);

  const totalRecordedDays = useMemo(() => {
    return Object.keys(data).filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/) && (data[k]?.length || 0) > 0).length;
  }, [data]);

  const storageSizeKB = useMemo(() => {
    try {
      const raw = JSON.stringify(data);
      return (new Blob([raw]).size / 1024).toFixed(1);
    } catch {
      return '0.0';
    }
  }, [data]);

  const exportJsonBackup = () => {
    const backup = {
      app: 'DailyScroll',
      version: 2,
      exportedAt: new Date().toISOString(),
      totalTasks: totalStoredTasks,
      totalDays: totalRecordedDays,
      data: data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dailyscroll-backup-${currentDateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setImportSuccess('Backup exported successfully!');
    setTimeout(() => setImportSuccess(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'replace') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const rawData = parsed.data || parsed;
        if (typeof rawData !== 'object' || rawData === null || Array.isArray(rawData)) {
          throw new Error('Invalid backup file format.');
        }

        let taskCount = 0;
        const sanitized: DailyScrollData = {};

        Object.keys(rawData).forEach(date => {
          if (Array.isArray(rawData[date])) {
            sanitized[date] = rawData[date].map((t: any) => ({
              id: t.id || crypto.randomUUID(),
              text: String(t.text || '').trim(),
              completed: Boolean(t.completed),
              priority: ['high', 'medium', 'low', 'none'].includes(t.priority) ? t.priority : 'none',
              tags: Array.isArray(t.tags) ? t.tags : [],
              createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
              ...(t.timeBlock && { timeBlock: t.timeBlock }),
              ...(t.blocked && { blocked: true }),
              ...(t.migrated && { migrated: true }),
            }));
            taskCount += sanitized[date].length;
          }
        });

        if (taskCount === 0 && Object.keys(sanitized).length === 0) {
          throw new Error('No valid tasks found in the uploaded file.');
        }

        if (mode === 'replace') {
          setData(sanitized);
        } else {
          setData(prev => {
            const merged: DailyScrollData = { ...prev };
            Object.keys(sanitized).forEach(date => {
              const existing = merged[date] || [];
              const incoming = sanitized[date];
              const existingIds = new Set(existing.map(t => t.id));
              const newTasks = incoming.filter(t => !existingIds.has(t.id));
              merged[date] = [...existing, ...newTasks];
            });
            return merged;
          });
        }

        setImportSuccess(`Successfully imported ${taskCount} tasks (${mode === 'replace' ? 'Full Replace' : 'Merged'})!`);
        setImportError(null);
        setTimeout(() => {
          setImportSuccess(null);
          setShowSettingsModal(false);
        }, 1500);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON backup.');
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAllData = () => {
    if (deleteConfirmText !== 'DELETE') return;
    localStorage.removeItem('devscrolls-dailyscroll-v2');
    localStorage.removeItem('devscrolls-dailyscroll-tasks');
    const freshState = { [currentDateStr]: [] };
    setData(freshState);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setShowSettingsModal(false);
    setUndoAction({
      message: 'All task data has been reset to factory state.',
      undo: () => {}
    });
  };

  if (!isLoaded) return null;

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  // Week days for navigation (Past 6 days + Today + Tomorrow = 8 days)
  const weekDays = Array.from({length: 8}).map((_, i) => {
    return getOffsetDateStr(i - 6);
  });

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.brandPanel}>
            <div className={styles.brandHeader}>
              <span className={styles.brandIcon}>📜</span>
              <div>
                <h2 className={styles.sidebarTitle}>DailyScroll</h2>
                <p className={styles.sidebarSubtitle}>Developer's Daily Mission</p>
              </div>
            </div>
          </div>
          
          <div className={styles.timelineSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionHeaderIcon}>📅</span>
              <span className={styles.sectionHeaderLabel}>TIMELINE</span>
            </div>
            <nav className={styles.sidebarWeeklyNav}>
              {weekDays.map(dateStr => {
                const isToday = dateStr === todayStr;
                const isTomorrow = dateStr === tomorrowStr;
                const tabLabel = isToday ? 'TOD' : isTomorrow ? 'TMR' : getDayName(dateStr).substring(0, 3);
                return (
                  <button 
                    key={dateStr}
                    className={`${styles.dayTab} ${currentDateStr === dateStr ? styles.dayTabActive : ''} ${isToday ? styles.dayTabToday : ''} ${isTomorrow ? styles.dayTabTomorrow : ''}`}
                    onClick={() => handleDateSelect(dateStr)}
                    title={isToday ? "Today" : isTomorrow ? "Tomorrow (Plan ahead)" : getDayName(dateStr)}
                  >
                    <div className={styles.dayTabName}>{tabLabel}</div>
                    <div className={styles.dayTabDate}>{dateStr.substring(8, 10)}</div>
                    {(data[dateStr]?.some(t => t.completed)) && <div className={styles.dayTabDot} />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.statBox}>
              <div className={styles.statHeader}>
                <span className={styles.statIcon}>🎯</span>
                <span className={styles.statLabel}>{currentDateStr === todayStr ? 'Today' : currentDateStr === tomorrowStr ? 'Tomorrow' : getDayName(currentDateStr).substring(0, 3)}</span>
              </div>
              <div className={styles.statNumbers}>
                <span className={styles.statValueDone}>{completedCount} <small>Done</small></span>
                <span className={styles.statDivider}>/</span>
                <span className={styles.statValuePending}>{pendingTasks.length} <small>Pending</small></span>
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statHeader}>
                <span className={styles.statIcon}>📊</span>
                <span className={styles.statLabel}>7-Day Total</span>
              </div>
              <div className={styles.statNumbers}>
                <span className={styles.statValueWeekly}>{weeklyCompleted} <small>Completed</small></span>
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statHeader}>
                <span className={styles.statIcon}>🔥</span>
                <span className={styles.statLabel}>Current Streak</span>
              </div>
              <div className={styles.statNumbers}>
                <span className={styles.statValueStreak}>{streak} <small>{streak === 1 ? 'Day' : 'Days'}</small></span>
              </div>
            </div>
          </div>

          <div className={styles.sidebarActions}>
            <button className={styles.exportBtn} onClick={openStandupModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Export Standup</span>
            </button>
            <button 
              className={styles.settingsBtn} 
              onClick={() => {
                setImportError(null);
                setImportSuccess(null);
                setShowDeleteConfirm(false);
                setShowSettingsModal(true);
              }}
              title="Backup, Data Portability & Reset"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Backup & Data</span>
            </button>
          </div>

          <div className={styles.sidebarPrivacyNotice}>
            <span className={styles.sidebarPrivacyIcon}>🔒</span>
            <span>Your tasks never leave your device. All data is securely saved in your browser's local storage.</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Mobile-only compact week strip */}
          <div className={styles.mobileTimelineSection}>
            <div className={styles.mobileTimelineHeader}>
              <span>📅 Timeline</span>
              <span className={styles.mobileTimelineCurrent}>{getDayName(currentDateStr).substring(0, 3)}, {currentDateStr.substring(8, 10)}</span>
            </div>
            <nav className={styles.mobileWeekStrip}>
              {weekDays.map(dateStr => {
                const isToday = dateStr === todayStr;
                const isTomorrow = dateStr === tomorrowStr;
                const tabLabel = isToday ? 'TOD' : isTomorrow ? 'TMR' : getDayName(dateStr).substring(0, 3);
                return (
                  <button 
                    key={dateStr}
                    className={`${styles.dayTab} ${currentDateStr === dateStr ? styles.dayTabActive : ''} ${isToday ? styles.dayTabToday : ''} ${isTomorrow ? styles.dayTabTomorrow : ''}`}
                    onClick={() => handleDateSelect(dateStr)}
                    title={isToday ? "Today" : isTomorrow ? "Tomorrow (Plan ahead)" : getDayName(dateStr)}
                  >
                    <div className={styles.dayTabName}>{tabLabel}</div>
                    <div className={styles.dayTabDate}>{dateStr.substring(8, 10)}</div>
                    {(data[dateStr]?.some(t => t.completed)) && <div className={styles.dayTabDot} />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={styles.stickyGroup}>
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                <h1 className={styles.mainTitle}>
                  {currentDateStr === todayStr ? "Today's Mission" : currentDateStr === tomorrowStr ? "Tomorrow's Plan" : "Mission Log"}
                </h1>
                <span className={styles.headerDateBadge}>
                  {getDayName(currentDateStr).substring(0, 3)}, {new Date(currentDateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBarTrack}>
                    <div 
                      className={`${styles.progressBarFill} ${progressPercent === 100 ? styles.progressBarComplete : ''}`} 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{completedCount}/{totalTasks} ({progressPercent}%)</span>
                </div>
              </div>
            </header>

            {/* Focus Timer Bar (Pomodoro) */}
            {focusSession && (
              <div className={`${styles.focusBar} ${isTimerRunning ? styles.focusBarRunning : styles.focusBarPaused} ${isTimerCompleted ? styles.focusBarCompleted : ''}`}>
                <div className={styles.focusBarLeft}>
                  <span className={styles.focusIcon}>{isTimerCompleted ? '🎉' : '⏱️'}</span>
                  <div className={styles.focusInfo}>
                    <span className={styles.focusLabel}>
                      {isTimerCompleted ? 'FOCUS GOAL REACHED!' : isTimerRunning ? 'FOCUS SPRINT' : 'TIMER PAUSED'}
                    </span>
                    <span className={styles.focusTaskText} title={focusSession.taskText}>
                      {focusSession.taskText}
                    </span>
                  </div>
                </div>

                <div className={styles.focusTimerDisplay}>
                  <span className={`${styles.focusTimeDigits} ${isTimerCompleted ? styles.focusTimeDigitsCompleted : ''}`}>
                    {formatTime(timerSeconds)}
                  </span>
                </div>

                <div className={styles.focusControls}>
                  {!isTimerCompleted ? (
                    <>
                      <button 
                        type="button" 
                        className={styles.focusControlBtn}
                        onClick={toggleTimerRunning}
                        title={isTimerRunning ? "Pause Timer (P)" : "Resume Timer (P)"}
                      >
                        {isTimerRunning ? '⏸' : '▶'}
                      </button>
                      <button 
                        type="button" 
                        className={styles.focusControlBtn}
                        onClick={addFiveMinutes}
                        title="Add 5 minutes (+5m)"
                      >
                        +5m
                      </button>
                      <button 
                        type="button" 
                        className={styles.focusControlBtn}
                        onClick={() => resetFocusTimer(25)}
                        title="Reset to 25m"
                      >
                        ↺
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      className={styles.focusBreakBtn}
                      onClick={() => resetFocusTimer(5)}
                      title="Start 5 minute break"
                    >
                      ☕ Take Break (5m)
                    </button>
                  )}
                  <button 
                    type="button" 
                    className={styles.focusCompleteBtn}
                    onClick={handleFocusComplete}
                    title="Mark task completed & finish focus session"
                  >
                    ✓ Done
                  </button>
                  <button 
                    type="button" 
                    className={styles.focusCloseBtn}
                    onClick={stopFocusSession}
                    title="Close timer"
                    aria-label="Close focus timer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {rolloverInfo && (
              <div className={styles.rolloverBanner}>
                <div className={styles.rolloverText}>
                  <span className={styles.rolloverIcon}>⚡</span>
                  <div>
                    <strong>{rolloverInfo.tasks.length} unfinished tasks</strong> from {getDayName(rolloverInfo.date).split(',')[0]}
                    <span className={styles.rolloverSubtext}>Roll them over to keep your momentum going</span>
                  </div>
                </div>
                <button className={styles.rolloverBtn} onClick={handleRollover}>Migrate to Today</button>
              </div>
            )}

            {/* Action Row: Task Input (left) + Search Input (right) */}
            <div className={styles.actionRow}>
              <form onSubmit={addTask} className={styles.inputForm}>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPromptIcon}>›</span>
                  <input
                    autoFocus
                    ref={inputRef}
                    type="text"
                    className={styles.taskInputPalette}
                    placeholder={currentDateStr === tomorrowStr ? "Plan tomorrow... (Press 'N')" : "Add a task... (Press 'N')"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  {inputValue && (
                    <button 
                      type="button" 
                      className={styles.inputClearBtn} 
                      onClick={() => setInputValue('')} 
                      title="Clear text"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              <div className={styles.searchWrapper}>
                <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  className={styles.searchInput}
                  placeholder="Search tasks... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className={styles.searchClearBtn} 
                    onClick={() => setSearchQuery('')} 
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Combined Toolbar: Filters on left + Quick Syntax on right */}
            <div className={styles.toolbarRow}>
              <div className={styles.filterPillsGroup}>
                <button 
                  className={`${styles.filterPill} ${filter === 'all' ? styles.filterPillActive : ''}`} 
                  onClick={() => setFilter('all')}
                >
                  All <span className={styles.filterBadge}>{tasks.length}</span>
                </button>
                <button 
                  className={`${styles.filterPill} ${filter === 'pending' ? styles.filterPillActive : ''}`} 
                  onClick={() => setFilter('pending')}
                >
                  Pending <span className={styles.filterBadge}>{tasks.filter(t => !t.completed).length}</span>
                </button>
                <button 
                  className={`${styles.filterPill} ${filter === 'high' ? styles.filterPillActive : ''}`} 
                  onClick={() => setFilter('high')}
                >
                  High <span className={styles.filterBadge}>{tasks.filter(t => t.priority === 'high' && !t.completed).length}</span>
                </button>
              </div>

              <div className={styles.syntaxHelperBar}>
                <span className={styles.syntaxHelperTitle}>Syntax:</span>
                <div className={styles.syntaxChipsList}>
                  <button 
                    type="button" 
                    className={`${styles.syntaxChip} ${styles.syntaxChipPriority}`} 
                    onClick={() => appendSyntax('!high')}
                    title="Click to add !high priority"
                  >
                    <code>!high</code>
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.syntaxChip} ${styles.syntaxChipBlocked}`} 
                    onClick={() => appendSyntax('!blocked')}
                    title="Click to mark task as !blocked"
                  >
                    <code>!blocked</code>
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.syntaxChip} ${styles.syntaxChipTime}`} 
                    onClick={() => appendSyntax('@morning')}
                    title="Click to add @morning time block"
                  >
                    <code>@morning</code>
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.syntaxChip} ${styles.syntaxChipTag}`} 
                    onClick={() => appendSyntax('#dev')}
                    title="Click to add #tag label"
                  >
                    <code>#tag</code>
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.syntaxChip} ${styles.syntaxChipCode}`} 
                    onClick={() => appendSyntax('`code`')}
                    title="Click to insert inline code snippet"
                  >
                    <code>`code`</code>
                  </button>
                  <button 
                    type="button" 
                    className={styles.hotkeysBtn} 
                    onClick={() => setShowShortcutsModal(true)}
                    title="View Keyboard Shortcuts (?)"
                  >
                    <span className={styles.hotkeysBtnIcon}>⌨</span>
                    <kbd className={styles.hotkeysKbd}>?</kbd>
                  </button>
                  <button 
                    type="button" 
                    className={styles.hotkeysBtn} 
                    onClick={() => {
                      setImportError(null);
                      setImportSuccess(null);
                      setShowDeleteConfirm(false);
                      setShowSettingsModal(true);
                    }}
                    title="Backup, Data Portability & Reset"
                  >
                    <span className={styles.hotkeysBtnIcon}>⚙</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Task List */}
        <div className={styles.taskList}>
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tasks found. Press <kbd>N</kbd> to plan your mission.</p>
            </div>
          ) : (
            <>
              {hasAnyTimeBlocks ? (
                // Grouped by time block
                activeBlockKeys.map(blockKey => {
                  const blockInfo = TIME_BLOCKS.find(b => b.key === blockKey)!;
                  const blockTasks = groupedPending[blockKey];
                  return (
                    <div 
                      key={blockKey} 
                      data-timeblock-key={blockKey}
                      className={`${styles.timeBlockSection} ${touchOverTimeBlock === blockKey ? styles.timeBlockDropTarget : ''}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedId) {
                          setTaskTimeBlock(draggedId, blockKey === 'anytime' ? undefined : blockKey as TimeBlock);
                          setDraggedId(null);
                        }
                      }}
                    >
                      <div className={styles.timeBlockHeader}>
                        <div className={styles.timeBlockHeaderLeft}>
                          <span className={styles.timeBlockIcon}>{blockInfo.icon}</span>
                          <span className={styles.timeBlockLabel}>{blockInfo.label}</span>
                        </div>
                        <span className={styles.timeBlockCount}>{blockTasks.length} {blockTasks.length === 1 ? 'task' : 'tasks'}</span>
                      </div>
                      <div className={styles.timeBlockTaskList}>
                        {blockTasks.map((task) => (
                          <TaskItemComponent 
                            key={task.id} 
                            task={task} 
                            currentDateStr={currentDateStr}
                            todayStr={todayStr}
                            toggleTask={toggleTask} 
                            deleteTask={deleteTask} 
                            deferTask={deferTask}
                            editTaskText={editTaskText}
                            setTaskTimeBlock={setTaskTimeBlock}
                            onDragStart={handleDragStart}
                            onDrop={(e: any) => handleDrop(e, task.id, false)}
                            isSelected={selectedTaskId === task.id}
                            onSelect={() => setSelectedTaskId(task.id)}
                            editingTaskId={editingTaskId}
                            setEditingTaskId={setEditingTaskId}
                            onStartFocus={startFocusSession}
                            isFocused={focusSession?.taskId === task.id}
                            onTouchStartDrag={() => handleTouchStartDrag(task.id)}
                            onTouchMoveDrag={handleTouchMoveDrag}
                            onTouchEndDrag={handleTouchEndDrag}
                            isTouchOver={touchOverId === task.id}
                            isDragging={draggedId === task.id}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Flat list (no time blocks assigned)
                pendingTasks.map((task) => (
                  <TaskItemComponent 
                    key={task.id} 
                    task={task} 
                    currentDateStr={currentDateStr}
                    todayStr={todayStr}
                    toggleTask={toggleTask} 
                    deleteTask={deleteTask} 
                    deferTask={deferTask}
                    editTaskText={editTaskText}
                    setTaskTimeBlock={setTaskTimeBlock}
                    onDragStart={handleDragStart}
                    onDrop={(e: any) => handleDrop(e, task.id, false)}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => setSelectedTaskId(task.id)}
                    editingTaskId={editingTaskId}
                    setEditingTaskId={setEditingTaskId}
                    onStartFocus={startFocusSession}
                    isFocused={focusSession?.taskId === task.id}
                    onTouchStartDrag={() => handleTouchStartDrag(task.id)}
                    onTouchMoveDrag={handleTouchMoveDrag}
                    onTouchEndDrag={handleTouchEndDrag}
                    isTouchOver={touchOverId === task.id}
                    isDragging={draggedId === task.id}
                  />
                ))
              )}

              {completedTasks.length > 0 && (
                <div className={styles.completedSection}>
                  <div className={styles.completedHeader}>
                    <span className={styles.completedHeaderTitle}>Completed</span>
                    <span className={styles.completedCount}>{completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'}</span>
                  </div>
                  <div className={styles.completedList}>
                    {completedTasks.map((task) => (
                      <TaskItemComponent 
                        key={task.id} 
                        task={task} 
                        currentDateStr={currentDateStr}
                        todayStr={todayStr}
                        toggleTask={toggleTask} 
                        deleteTask={deleteTask} 
                        deferTask={deferTask}
                        editTaskText={editTaskText}
                        setTaskTimeBlock={setTaskTimeBlock}
                        onDragStart={handleDragStart}
                        onDrop={(e: any) => handleDrop(e, task.id, true)}
                        isSelected={selectedTaskId === task.id}
                        onSelect={() => setSelectedTaskId(task.id)}
                        editingTaskId={editingTaskId}
                        setEditingTaskId={setEditingTaskId}
                        onStartFocus={startFocusSession}
                        isFocused={focusSession?.taskId === task.id}
                        onTouchStartDrag={() => handleTouchStartDrag(task.id)}
                        onTouchMoveDrag={handleTouchMoveDrag}
                        onTouchEndDrag={handleTouchEndDrag}
                        isTouchOver={touchOverId === task.id}
                        isDragging={draggedId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      </div>

      {showShortcutsModal && (
        <div 
          className={styles.shortcutsModalOverlay} 
          onClick={() => setShowShortcutsModal(false)}
        >
          <div 
            className={styles.shortcutsModal} 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard Shortcuts"
          >
            <div className={styles.shortcutsHeader}>
              <div className={styles.shortcutsHeaderTitle}>
                <span className={styles.shortcutsIcon}>⚡</span>
                <h3>Keyboard Shortcuts</h3>
              </div>
              <button 
                className={styles.shortcutsCloseBtn} 
                onClick={() => setShowShortcutsModal(false)}
                aria-label="Close Shortcuts Modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.shortcutsBody}>
              <div className={styles.shortcutsCategory}>
                <h4 className={styles.shortcutsCategoryTitle}>Navigation</h4>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Select next task</span>
                  <div className={styles.shortcutKeys}><kbd>J</kbd> or <kbd>↓</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Select previous task</span>
                  <div className={styles.shortcutKeys}><kbd>K</kbd> or <kbd>↑</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Deselect task</span>
                  <div className={styles.shortcutKeys}><kbd>Esc</kbd></div>
                </div>
              </div>

              <div className={styles.shortcutsCategory}>
                <h4 className={styles.shortcutsCategoryTitle}>Task Actions (when selected)</h4>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Toggle complete</span>
                  <div className={styles.shortcutKeys}><kbd>X</kbd> or <kbd>Space</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Defer to tomorrow</span>
                  <div className={styles.shortcutKeys}><kbd>D</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Edit task text</span>
                  <div className={styles.shortcutKeys}><kbd>E</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Cycle time block</span>
                  <div className={styles.shortcutKeys}><kbd>T</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Start/Toggle Focus sprint</span>
                  <div className={styles.shortcutKeys}><kbd>P</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Move task up / down</span>
                  <div className={styles.shortcutKeys}><kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>Alt</kbd>+<kbd>↓</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Delete task</span>
                  <div className={styles.shortcutKeys}><kbd>Del</kbd> or <kbd>⌫</kbd></div>
                </div>
              </div>

              <div className={styles.shortcutsCategory}>
                <h4 className={styles.shortcutsCategoryTitle}>Global</h4>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>New task (focus input)</span>
                  <div className={styles.shortcutKeys}><kbd>N</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Search tasks</span>
                  <div className={styles.shortcutKeys}><kbd>/</kbd> or <kbd>⌘K</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Undo last action</span>
                  <div className={styles.shortcutKeys}><kbd>Ctrl</kbd>+<kbd>Z</kbd></div>
                </div>
                <div className={styles.shortcutRow}>
                  <span className={styles.shortcutDesc}>Shortcuts cheat sheet</span>
                  <div className={styles.shortcutKeys}><kbd>?</kbd></div>
                </div>
              </div>
            </div>

            <div className={styles.shortcutsFooter}>
              <span>Tip: Press <kbd className={styles.miniKbd}>?</kbd> anytime to toggle this modal</span>
            </div>
          </div>
        </div>
      )}

      {showStandupModal && (
        <div className={styles.shortcutsModalOverlay} onClick={() => setShowStandupModal(false)}>
          <div className={styles.standupModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.standupHeader}>
              <div className={styles.standupHeaderTitle}>
                <span className={styles.standupIcon}>🚀</span>
                <div>
                  <h3 className={styles.standupTitle}>Daily Standup Generator</h3>
                  <p className={styles.standupSubtitle}>Auto-summarize today's progress, focus, and blockers</p>
                </div>
              </div>
              <button 
                className={styles.shortcutsCloseBtn} 
                onClick={() => setShowStandupModal(false)}
                aria-label="Close Standup Modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.standupControlsRow}>
              <div className={styles.standupFormatTabs}>
                <button
                  type="button"
                  className={`${styles.standupFormatTab} ${standupFormat === 'slack' ? styles.standupFormatTabActive : ''}`}
                  onClick={() => handleFormatChange('slack')}
                >
                  <span>💬 Slack / Discord</span>
                </button>
                <button
                  type="button"
                  className={`${styles.standupFormatTab} ${standupFormat === 'markdown' ? styles.standupFormatTabActive : ''}`}
                  onClick={() => handleFormatChange('markdown')}
                >
                  <span>📝 Clean Markdown</span>
                </button>
              </div>

              <label className={styles.standupToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.standupCheckbox}
                  checked={includeYesterdayDone}
                  onChange={(e) => handleYesterdayToggle(e.target.checked)}
                />
                <span>Include previous completed</span>
              </label>
            </div>

            <div className={styles.standupPreviewContainer}>
              <div className={styles.standupPreviewHeader}>
                <span className={styles.standupPreviewTitle}>Live Preview (Editable)</span>
                <span className={styles.standupPreviewStats}>{editedStandupText.length} characters</span>
              </div>
              <textarea
                className={styles.standupTextarea}
                value={editedStandupText}
                onChange={(e) => {
                  setEditedStandupText(e.target.value);
                  setIsStandupCopied(false);
                }}
                rows={11}
                placeholder="Generating standup summary..."
              />
            </div>

            <div className={styles.standupFooter}>
              <button
                type="button"
                className={styles.standupDownloadBtn}
                onClick={downloadStandupFile}
                title="Download as .md file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Download .md</span>
              </button>

              <button
                type="button"
                className={`${styles.standupCopyBtn} ${isStandupCopied ? styles.standupCopyBtnSuccess : ''}`}
                onClick={copyStandupToClipboard}
              >
                {isStandupCopied ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Standup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Portability & Settings Modal */}
      {showSettingsModal && (
        <div className={styles.shortcutsModalOverlay} onClick={() => setShowSettingsModal(false)}>
          <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <div className={styles.settingsHeaderTitle}>
                <span className={styles.settingsIcon}>💾</span>
                <div>
                  <h3 className={styles.settingsTitle}>Data & Backup Manager</h3>
                  <p className={styles.settingsSubtitle}>Export, restore, or reset your local developer mission logs</p>
                </div>
              </div>
              <button 
                className={styles.shortcutsCloseBtn} 
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close Settings Modal"
              >
                ✕
              </button>
            </div>

            <div className={styles.settingsStatsRow}>
              <div className={styles.settingsStatBox}>
                <span className={styles.settingsStatLabel}>TOTAL TASKS</span>
                <span className={styles.settingsStatVal}>{totalStoredTasks}</span>
              </div>
              <div className={styles.settingsStatBox}>
                <span className={styles.settingsStatLabel}>RECORDED DAYS</span>
                <span className={styles.settingsStatVal}>{totalRecordedDays}</span>
              </div>
              <div className={styles.settingsStatBox}>
                <span className={styles.settingsStatLabel}>STORAGE USAGE</span>
                <span className={styles.settingsStatVal}>{storageSizeKB} KB</span>
              </div>
            </div>

            {importSuccess && (
              <div className={styles.settingsAlertSuccess}>
                <span>✓ {importSuccess}</span>
              </div>
            )}

            {importError && (
              <div className={styles.settingsAlertError}>
                <span>⚠️ {importError}</span>
              </div>
            )}

            <div className={styles.settingsBody}>
              {/* Card 1: Export Backup */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <span className={styles.settingsCardIcon}>📥</span>
                  <div>
                    <h4 className={styles.settingsCardTitle}>Export Backup (.json)</h4>
                    <p className={styles.settingsCardDesc}>Save a complete timestamped snapshot of all your tasks and historical days.</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className={styles.settingsActionBtn}
                  onClick={exportJsonBackup}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download JSON Backup</span>
                </button>
              </div>

              {/* Card 2: Restore / Import Backup */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardHeader}>
                  <span className={styles.settingsCardIcon}>📤</span>
                  <div>
                    <h4 className={styles.settingsCardTitle}>Restore / Import Backup</h4>
                    <p className={styles.settingsCardDesc}>Restore tasks from a previously exported JSON backup file.</p>
                  </div>
                </div>

                <div className={styles.importModeSelector}>
                  <label className={`${styles.importRadioOption} ${importMode === 'merge' ? styles.importRadioOptionActive : ''}`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="merge" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')} 
                    />
                    <div>
                      <strong>Merge with existing</strong>
                      <small>Combines incoming tasks without deleting today's work</small>
                    </div>
                  </label>
                  <label className={`${styles.importRadioOption} ${importMode === 'replace' ? styles.importRadioOptionActive : ''}`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')} 
                    />
                    <div>
                      <strong>Full Replace</strong>
                      <small>Overwrites current database with the backup file</small>
                    </div>
                  </label>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".json,application/json" 
                  style={{ display: 'none' }}
                  onChange={(e) => handleImportFile(e, importMode)}
                />

                <button 
                  type="button" 
                  className={styles.settingsActionBtnSecondary}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Select JSON Backup File to Import</span>
                </button>
              </div>

              {/* Card 3: Danger Zone */}
              <div className={`${styles.settingsCard} ${styles.settingsCardDanger}`}>
                <div className={styles.settingsCardHeader}>
                  <span className={styles.settingsCardIcon}>🗑️</span>
                  <div>
                    <h4 className={styles.settingsCardTitleDanger}>Reset All Data</h4>
                    <p className={styles.settingsCardDesc}>Permanently wipe all mission history and local task data.</p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <button 
                    type="button" 
                    className={styles.settingsDangerBtn}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Clear All Data...
                  </button>
                ) : (
                  <div className={styles.deleteConfirmBox}>
                    <p className={styles.deleteConfirmWarning}>
                      ⚠️ Type <strong>DELETE</strong> to confirm wiping all {totalStoredTasks} tasks:
                    </p>
                    <div className={styles.deleteConfirmRow}>
                      <input 
                        type="text" 
                        className={styles.deleteConfirmInput}
                        placeholder="Type DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button" 
                        className={styles.deleteConfirmExecuteBtn}
                        disabled={deleteConfirmText !== 'DELETE'}
                        onClick={handleClearAllData}
                      >
                        Confirm Wipe
                      </button>
                      <button 
                        type="button" 
                        className={styles.deleteConfirmCancelBtn}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.settingsFooter}>
              <span>Tip: Backups are portable open standard JSON files</span>
            </div>
          </div>
        </div>
      )}

      {undoAction && (
        <div className={styles.undoToast}>
          <span className={styles.undoToastText}>{undoAction.message}</span>
          <button className={styles.undoToastBtn} onClick={triggerUndo}>Undo</button>
          <span className={styles.undoToastHint}>Ctrl+Z</span>
          <button className={styles.undoToastDismiss} onClick={() => { setUndoAction(null); if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); undoTimeoutRef.current = null; } }} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function TaskItemComponent({ 
  task, 
  currentDateStr, 
  todayStr, 
  toggleTask, 
  deleteTask, 
  deferTask, 
  editTaskText, 
  setTaskTimeBlock, 
  onDragStart, 
  onDrop,
  isSelected,
  onSelect,
  editingTaskId,
  setEditingTaskId,
  onStartFocus,
  isFocused,
  onTouchStartDrag,
  onTouchMoveDrag,
  onTouchEndDrag,
  isTouchOver,
  isDragging
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showTimeBlockPopover, setShowTimeBlockPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync with global editingTaskId (triggered via hotkey 'e')
  useEffect(() => {
    if (editingTaskId === task.id && !isEditing) {
      startEditing();
    }
  }, [editingTaskId, task.id]);

  // Close popover on outside click
  useEffect(() => {
    if (!showTimeBlockPopover) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowTimeBlockPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTimeBlockPopover]);

  const startEditing = () => {
    let rawText = task.text;
    if (task.blocked) rawText += ` !blocked`;
    if (task.priority !== 'none') rawText += ` !${task.priority}`;
    if (task.tags && task.tags.length > 0) rawText += ` ${task.tags.map((t: string) => `#${t}`).join(' ')}`;
    if (task.timeBlock) rawText += ` @${task.timeBlock}`;
    setEditText(rawText);
    setIsEditing(true);
  };

  const finishEditing = () => {
    editTaskText(task.id, editText);
    setIsEditing(false);
    setEditingTaskId?.(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditText(task.text);
    setEditingTaskId?.(null);
  };

  const priorityColor = task.priority === 'high' ? 'var(--color-error, #ef4444)' : task.priority === 'medium' ? 'var(--color-warning, #eab308)' : 'var(--color-success, #22c55e)';

  const handleEditSubmit = (e: any) => {
    if (e.key === 'Enter') {
      finishEditing();
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const renderTaskText = (text: string) => {
    const parts = text.split(/(`[^`]+`)/);
    return parts.map((part: string, i: number) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const currentBlockInfo = TIME_BLOCKS.find(b => b.key === (task.timeBlock || 'anytime'))!;

  const hasMeta = task.blocked || task.migrated || isFocused || (task.tags && task.tags.length > 0);

  return (
    <div 
      id={`task-${task.id}`}
      data-task-id={task.id}
      className={`${styles.taskItem} ${task.completed ? styles.completedTask : ''} ${showTimeBlockPopover ? styles.taskItemHasPopover : ''} ${isSelected ? styles.taskItemSelected : ''} ${task.blocked && !task.completed ? styles.taskItemBlocked : ''} ${isFocused ? styles.taskItemInFocus : ''} ${isDragging ? styles.taskItemDragging : ''} ${isTouchOver ? styles.taskItemDropTarget : ''}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          onSelect?.();
        }
      }}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div 
        className={`${styles.dragHandle} ${isDragging ? styles.dragHandleActive : ''}`} 
        title="Drag to reorder (or Alt+↑/↓)"
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStartDrag?.();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          const touch = e.touches[0];
          if (touch) {
            onTouchMoveDrag?.(touch.clientX, touch.clientY);
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onTouchEndDrag?.();
        }}
        onTouchCancel={(e) => {
          e.stopPropagation();
          onTouchEndDrag?.();
        }}
      >
        ⋮⋮
      </div>
      <button 
        className={`${styles.checkbox} ${task.completed ? styles.checkboxChecked : ''}`} 
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
        aria-label={task.completed ? "Mark pending" : "Mark completed"}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>
      
      {task.priority !== 'none' && (
        <span className={styles.priorityDotInline} style={{ backgroundColor: priorityColor }} title={`Priority: ${task.priority}`} />
      )}

      {/* Time Block Pill with Popover */}
      <div className={styles.timeBlockPillWrapper} ref={popoverRef}>
        <button 
          className={`${styles.timeBlockPill} ${task.timeBlock ? styles.timeBlockPillActive : ''}`}
          onClick={(e) => { e.stopPropagation(); setShowTimeBlockPopover(!showTimeBlockPopover); }}
          title={`Time: ${currentBlockInfo.label}`}
        >
          {task.timeBlock ? currentBlockInfo.icon : '🕐'}
        </button>
        {showTimeBlockPopover && (
          <div className={styles.timeBlockPopover}>
            {TIME_BLOCKS.map(block => (
              <button
                key={block.key}
                className={`${styles.timeBlockOption} ${(task.timeBlock || 'anytime') === block.key ? styles.timeBlockOptionActive : ''}`}
                onClick={() => {
                  setTaskTimeBlock(task.id, block.key === 'anytime' ? undefined : block.key);
                  setShowTimeBlockPopover(false);
                }}
              >
                <span>{block.icon}</span>
                <span>{block.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className={styles.taskContent} 
        onDoubleClick={() => {
          startEditing();
          setEditingTaskId?.(task.id);
        }}
      >
        {isEditing ? (
          <input 
            autoFocus
            type="text" 
            className={styles.editInput}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditSubmit}
            onBlur={finishEditing}
          />
        ) : (
          <span className={styles.taskText}>{renderTaskText(task.text)}</span>
        )}
        
        {hasMeta && (
          <div className={styles.taskMeta}>
            {isFocused && (
              <span className={`${styles.tagChip} ${styles.focusBadge}`} title="Active focus session">⏱️ in focus</span>
            )}
            {task.blocked && !task.completed && (
              <span className={`${styles.tagChip} ${styles.blockerBadge}`} title="Blocked task">⛔ Blocked</span>
            )}
            {task.migrated && (
              <span className={`${styles.tagChip} ${styles.migratedBadge}`} title="Migrated from a past day">⤤ migrated</span>
            )}
            {task.tags && task.tags.map((tag: string) => (
              <span key={tag} className={styles.tagChip}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.taskActions}>
        {!task.completed && (
          <button 
            className={`${styles.focusBtn} ${isFocused ? styles.focusBtnActive : ''}`} 
            onClick={(e) => { e.stopPropagation(); onStartFocus?.(task.id, task.text); }} 
            title={isFocused ? "In Focus Sprint (P)" : "Start 25m Focus Sprint (P)"}
            aria-label="Focus timer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
        )}
        {!task.completed && (
          <button 
            className={styles.deferBtn} 
            onClick={(e) => { e.stopPropagation(); deferTask(task.id); }} 
            title={currentDateStr === todayStr ? "Defer to Tomorrow" : currentDateStr < todayStr ? "Move to Today" : "Defer to Next Day"}
            aria-label="Defer task"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        )}
        <button 
          className={styles.deleteBtn} 
          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
          title="Delete Task"
          aria-label="Delete task"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
