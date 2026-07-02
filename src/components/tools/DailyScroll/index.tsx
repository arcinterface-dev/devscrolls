import React, { useState, useEffect, useRef } from 'react';
import styles from './DailyScroll.module.css';

// Types
type Priority = 'none' | 'low' | 'medium' | 'high';
interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  createdAt: number;
  migrated?: boolean;
}
type DailyScrollData = Record<string, Task[]>;

// Helpers
function getLocalDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getDayName(dateStr: string) {
  const d = new Date(dateStr);
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Global shortcut: N or / or Cmd+K to focus search/input
      if ((e.key === '/' || e.key.toLowerCase() === 'n' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) && 
          document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Esc to clear inputs
      if (e.key === 'Escape' && document.activeElement?.tagName === 'INPUT') {
        (document.activeElement as HTMLInputElement).blur();
        setSearchQuery('');
        setInputValue('');
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
  const parseTaskInput = (input: string): { text: string, tags: string[], priority: Priority } => {
    let priority: Priority = 'none';
    let text = input;
    
    if (/(^|\s)!high(?=\s|$)/i.test(text)) { priority = 'high'; text = text.replace(/(^|\s)!high(?=\s|$)/ig, ' '); }
    else if (/(^|\s)!medium(?=\s|$)/i.test(text)) { priority = 'medium'; text = text.replace(/(^|\s)!medium(?=\s|$)/ig, ' '); }
    else if (/(^|\s)!low(?=\s|$)/i.test(text)) { priority = 'low'; text = text.replace(/(^|\s)!low(?=\s|$)/ig, ' '); }
  
    const tags: string[] = [];
    const tagMatches = text.match(/#[\w-]+/g);
    if (tagMatches) {
      tagMatches.forEach(t => tags.push(t.substring(1)));
      text = text.replace(/#[\w-]+/g, '');
    }
  
    return { text: text.trim().replace(/\s+/g, ' '), tags, priority };
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const { text, tags, priority } = parseTaskInput(inputValue);

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      tags,
      createdAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      [currentDateStr]: [...(prev[currentDateStr] || []), newTask]
    }));
    setInputValue('');
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
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].filter(t => t.id !== id)
    }));
  };

  const editTaskText = (id: string, newText: string) => {
    const { text, tags, priority } = parseTaskInput(newText);
    setData(prev => ({
      ...prev,
      [currentDateStr]: prev[currentDateStr].map(t => 
        t.id === id ? { ...t, text, priority, tags } : t
      )
    }));
  }

  // Drag and drop logic
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDrop = (e: React.DragEvent, targetId: string, isCompletedList: boolean) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const dayTasks = [...(data[currentDateStr] || [])];
    const draggedIdx = dayTasks.findIndex(t => t.id === draggedId);
    const targetIdx = dayTasks.findIndex(t => t.id === targetId);

    if (dayTasks[draggedIdx].completed !== isCompletedList) return; 

    const [removed] = dayTasks.splice(draggedIdx, 1);
    dayTasks.splice(targetIdx, 0, removed);
    
    setData(prev => ({
      ...prev,
      [currentDateStr]: dayTasks
    }));
    setDraggedId(null);
  };

  const exportStandup = () => {
    let md = `# ${getDayName(currentDateStr)}\n\n`;
    tasks.forEach(t => {
       md += `- [${t.completed ? 'x' : ' '}] ${t.text}\n`;
    });
    if (tasks.length === 0) md += "No tasks.";
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded) return null;

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  // Week days for navigation
  const weekDays = Array.from({length: 7}).map((_, i) => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateStr(d);
  });

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
        <div className={styles.brandPanel}>
          <h2 className={styles.sidebarTitle}>DailyScroll</h2>
          <p className={styles.sidebarSubtitle}>A developer's Todo</p>
        </div>
        
        <nav className={styles.sidebarWeeklyNav}>
          {weekDays.map(dateStr => (
            <button 
              key={dateStr}
              className={`${styles.dayTab} ${currentDateStr === dateStr ? styles.dayTabActive : ''}`}
              onClick={() => setCurrentDateStr(dateStr)}
            >
              <div className={styles.dayTabName}>{getDayName(dateStr).substring(0,3)}</div>
              <div className={styles.dayTabDate}>{dateStr.substring(8,10)}</div>
              {(data[dateStr]?.some(t=>t.completed)) && <div className={styles.dayTabDot} />}
            </button>
          ))}
        </nav>

        <div className={styles.statsPanel}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Today</span>
            <span className={styles.statValue}>{completedCount} <small>Done</small></span>
            <span className={styles.statValue}>{pendingTasks.length} <small>Pending</small></span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>This Week</span>
            <span className={styles.statValue}>{weeklyCompleted} <small>Done</small></span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statValue}>{streak} <small>Days</small></span>
          </div>
        </div>



        <button className={styles.exportBtn} onClick={exportStandup}>
          {copied ? '✓ Copied Markdown' : 'Export Markdown'}
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Mobile-only compact week strip */}
        <nav className={styles.mobileWeekStrip}>
          {weekDays.map(dateStr => (
            <button 
              key={dateStr}
              className={`${styles.dayTab} ${currentDateStr === dateStr ? styles.dayTabActive : ''}`}
              onClick={() => setCurrentDateStr(dateStr)}
            >
              <div className={styles.dayTabName}>{getDayName(dateStr).substring(0,3)}</div>
              <div className={styles.dayTabDate}>{dateStr.substring(8,10)}</div>
            </button>
          ))}
        </nav>

        <div className={styles.stickyGroup}>


        <header className={styles.header}>
          <h1 className={styles.mainTitle}>{currentDateStr === todayStr ? "Today's Mission" : "Mission Log"}</h1>
          <div className={styles.progressContainer}>
            <div className={styles.progressStats}>
              <span>Progress</span>
              <span>{completedCount} / {totalTasks}</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span className={styles.progressText}>{progressPercent}%</span>
            </div>
          </div>
        </header>

        {rolloverInfo && (
          <div className={styles.rolloverBanner}>
            <div className={styles.rolloverText}>
              <span className={styles.rolloverIcon}>⚡</span>
              <span>You have <strong>{rolloverInfo.tasks.length} unfinished tasks</strong> from {getDayName(rolloverInfo.date).split(',')[0]}</span>
            </div>
            <button className={styles.rolloverBtn} onClick={handleRollover}>Migrate to Today</button>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controlsBar}>
          <form onSubmit={addTask} className={styles.inputForm}>
            <input
              autoFocus
              ref={inputRef}
              type="text"
              className={styles.taskInputPalette}
              placeholder="Add Task (Press 'N' to focus)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className={styles.inputHelper}>
              💡 <strong>Pro tip:</strong> Type <code>!high</code>, <code>!medium</code>, <code>!low</code> for priorities, <code>#tag</code> for labels, or <code>`code`</code> for snippets.
            </div>
          </form>
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterBar}>
          <button className={`${styles.filterPill} ${filter === 'all' ? styles.filterPillActive : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`${styles.filterPill} ${filter === 'pending' ? styles.filterPillActive : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`${styles.filterPill} ${filter === 'high' ? styles.filterPillActive : ''}`} onClick={() => setFilter('high')}>High Priority</button>
        </div>

        {/* Task List */}
        <div className={styles.taskList}>
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tasks found. Press <kbd>N</kbd> to plan your mission.</p>
            </div>
          ) : (
            <>
              {pendingTasks.map((task) => (
                <TaskItemComponent 
                  key={task.id} 
                  task={task} 
                  toggleTask={toggleTask} 
                  deleteTask={deleteTask} 
                  editTaskText={editTaskText}
                  onDragStart={handleDragStart}
                  onDrop={(e: any) => handleDrop(e, task.id, false)}
                />
              ))}

              {completedTasks.length > 0 && (
                <div className={styles.completedSection}>
                  <h3 className={styles.completedHeader}>Completed</h3>
                  <div className={styles.completedList}>
                    {completedTasks.map((task) => (
                      <TaskItemComponent 
                        key={task.id} 
                        task={task} 
                        toggleTask={toggleTask} 
                        deleteTask={deleteTask} 
                        editTaskText={editTaskText}
                        onDragStart={handleDragStart}
                        onDrop={(e: any) => handleDrop(e, task.id, true)}
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

      <div className={styles.privacyNotice}>
        <span style={{flexShrink: 0}}>🔒</span>
        <span>Your tasks never leave your device. All data is securely saved in your browser's local storage.</span>
      </div>
    </div>
  );
}

function TaskItemComponent({ task, toggleTask, deleteTask, editTaskText, onDragStart, onDrop }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const startEditing = () => {
    let rawText = task.text;
    if (task.priority !== 'none') rawText += ` !${task.priority}`;
    if (task.tags && task.tags.length > 0) rawText += ` ${task.tags.map((t: string) => `#${t}`).join(' ')}`;
    setEditText(rawText);
    setIsEditing(true);
  };

  const priorityColor = task.priority === 'high' ? 'var(--color-error, #ef4444)' : task.priority === 'medium' ? 'var(--color-warning, #eab308)' : 'var(--color-success, #22c55e)';

  const handleEditSubmit = (e: any) => {
    if (e.key === 'Enter') {
      editTaskText(task.id, editText);
      setIsEditing(false);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(task.text);
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

  return (
    <div 
      className={`${styles.taskItem} ${task.completed ? styles.completedTask : ''}`}
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className={styles.dragHandle} title="Drag to reorder">⋮⋮</div>
      <button 
        className={`${styles.checkbox} ${task.completed ? styles.checkboxChecked : ''}`} 
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? "Mark pending" : "Mark completed"}
      >
        {task.completed ? '✓' : ''}
      </button>
      
      {task.priority !== 'none' && (
        <span className={styles.priorityDotInline} style={{ backgroundColor: priorityColor }} title={`Priority: ${task.priority}`} />
      )}
      
      <div className={styles.taskContent} onDoubleClick={startEditing}>
        {isEditing ? (
          <input 
            autoFocus
            type="text" 
            className={styles.editInput}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditSubmit}
            onBlur={() => { editTaskText(task.id, editText); setIsEditing(false); }}
          />
        ) : (
          <span className={styles.taskText}>{renderTaskText(task.text)}</span>
        )}
        
        {task.tags && task.tags.length > 0 && (
          <div className={styles.taskMeta}>
            {task.migrated && (
              <span className={`${styles.tagChip} ${styles.migratedBadge}`} title="Migrated from a past day">⤤ migrated</span>
            )}
            {task.tags.map((tag: string) => (
              <span key={tag} className={styles.tagChip}>#{tag}</span>
            ))}
          </div>
        )}
        {(!task.tags || task.tags.length === 0) && task.migrated && (
          <div className={styles.taskMeta}>
             <span className={`${styles.tagChip} ${styles.migratedBadge}`} title="Migrated from a past day">⤤ migrated</span>
          </div>
        )}
      </div>
      
      <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} title="Delete Task">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  );
}
