import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import './Calendar.scss';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('calendar-goals');
    return saved ? JSON.parse(saved) : {};
  });
  const [newTask, setNewTask] = useState('');

  const exportGoalsToJson = () => {
  const jsonString = JSON.stringify(goals, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'goal-tracker-data.json';
  link.click();
  URL.revokeObjectURL(url);
};

const importGoalsFromJson = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedGoals = JSON.parse(event.target.result);
      if (typeof importedGoals === 'object' && importedGoals !== null) {
        setGoals(importedGoals);
      } else {
        alert('Invalid JSON format');
      }
    } catch {
      alert('Error parsing JSON file');
    }
  };
  reader.readAsText(file);
};


  useEffect(() => {
    localStorage.setItem('calendar-goals', JSON.stringify(goals));
  }, [goals]);

  const generateMonthDays = () => {
    const days = [];
    const startDate = new Date(currentDate);
    startDate.setDate(1); // Start from first day of month
    
    // Adjust to start from Monday
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() - 1);
    }

    for (let i = 0; i < 42; i++) { // 6 weeks
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }

    return days;
  };

  const renderDays = () => {
    const days = generateMonthDays();
    
    return (
      <div className="month-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
        
        {days.map((day) => {
          const dateStr = day.toISOString().split('T')[0];
          const dayGoals = goals[dateStr] || { tasks: [], note: '' };
          const isCurrentDay = isSameDay(day, currentDate);
          const isDayToday = isToday(day);
          const isDayPast = isPast(day) && !isDayToday;
          const isDayFuture = isFuture(day) && !isDayToday;

          return (
            <div 
              key={dateStr} 
              className={`day-cell 
                ${isCurrentDay ? 'current-day' : ''} 
                ${isDayToday ? 'today' : ''}
                ${isDayPast ? 'past-day' : ''}
                ${isDayFuture ? 'future-day' : ''}`
              }
              onClick={() => setCurrentDate(day)}
            >
              <div className="day-header">
                <div className="day-number">{format(day, 'd')}</div>
                {isDayToday && <div className="today-badge">Today</div>}
              </div>
              
              <div className="day-content">
                <div className="tasks-preview">
                  {dayGoals.tasks.slice(0, 3).map((task, index) => (
                    <div 
                      key={index} 
                      className={`task-preview ${task.completed ? 'completed' : ''}`}
                    >
                      {task.text}
                    </div>
                  ))}
                  {dayGoals.tasks.length > 3 && (
                    <div className="more-tasks">+{dayGoals.tasks.length - 3} more</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedDay = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayGoals = goals[dateStr] || { tasks: [], note: '' };

    return (
       
      <div className="selected-day-view">
       

        
        <h2 className="selected-day-title">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
        
        <div className="tasks-container">
          {dayGoals.tasks.map((task, index) => (
            <div key={index} className="task-item">
              <button
                className={`task-check ${task.completed ? 'completed' : ''}`}
                onClick={() => toggleTask(dateStr, index)}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.completed ? '✓' : ''}
              </button>
              <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                {task.text}
              </span>
              <button 
                className="task-delete"
                onClick={() => deleteTask(dateStr, index)}
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="task-input-container">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask(dateStr)}
            placeholder="Add new task..."
            className="task-input"
          />
          <button 
            className="add-task-button"
            onClick={() => addTask(dateStr)}
            disabled={!newTask.trim()}
          >
            Add Task
          </button>
        </div>
        
        <div className="day-notes">
          <h3 className="notes-title">Daily Notes</h3>
          <textarea
            value={dayGoals.note || ''}
            onChange={(e) => updateNote(dateStr, e.target.value)}
            placeholder="Write your notes here..."
            className="notes-textarea"
          />
        </div>
      </div>
    );
  };

  const addTask = (date) => {
    if (!newTask.trim()) return;
    
    setGoals(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || { note: '' }),
        tasks: [...(prev[date]?.tasks || []), { text: newTask, completed: false }]
      }
    }));
    setNewTask('');
  };

  const toggleTask = (date, index) => {
    setGoals(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        tasks: prev[date].tasks.map((task, i) => 
          i === index ? { ...task, completed: !task.completed } : task
        )
      }
    }));
  };

  const deleteTask = (date, index) => {
    setGoals(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        tasks: prev[date].tasks.filter((_, i) => i !== index)
      }
    }));
  };

  const updateNote = (date, note) => {
    setGoals(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || { tasks: [] }),
        note
      }
    }));
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(direction === 'next' ? prev.getMonth() + 1 : prev.getMonth() - 1);
      return newDate;
    });
  };

  return (
    <div className="goal-tracker">
      <div className="calendar-header">
        <button 
          className="nav-button prev-button"
          onClick={() => navigateMonth('prev')}
        >
          ←
        </button>
        <h2 className="month-title">{format(currentDate, 'MMMM yyyy')}</h2>
        <button 
          className="nav-button next-button"
          onClick={() => navigateMonth('next')}
        >
          →
        </button>
      </div>
      
      {renderDays()}
      
      <div className="day-detail-container">
        {renderSelectedDay()}
      </div>
    </div>
  );
}