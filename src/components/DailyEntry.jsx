import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format, subDays, addDays, parse } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './DailyEntry.scss';
import { loadData, saveData } from '../services/dataService';

const initialState = {
  date: format(new Date(), 'dd/MM/yyyy'),
  efficiency: null,
  habits: [
    {
      id: 1,
      text: 'Exercise',
      completedByDate: {
        'dd/MM/yyyy': true,
        '29/07/2025': false,
      }
    },
    {
      id: 2,
      text: 'Meditation',
      completedByDate: {
        'dd/MM/yyyy': true,
        '29/07/2025': false,
      }
    },
  ],
  productivity: null,
  happiness: null,
  pomodoros: 0,
  pomodorosHistory: {
    '30': 0,
    '45': 0,
    '60': 0,
    'custom': 0
  },
  energy: {
    air: null,
    fire: null,
    water: null,
    earth: null,
  },
  victory: '',
  loss: '',
  insight: '',
  activePomodoro: null,
  pomodoroDuration: 30,
  todos: [
    { id: 1, text: 'Complete project proposal', completed: false },
    { id: 2, text: 'Schedule team meeting', completed: false },
    { id: 3, text: 'Review client feedback', completed: false },
  ],
  mostImportantTask: ''
};

const AutoResizeTextarea = ({ value, onChange, placeholder, className, autoFocus, onColorDetect }) => {
  const textareaRef = useRef(null);
  
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);
  
  useEffect(() => {
    adjustHeight();
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [adjustHeight, autoFocus]);

  const detectColors = (text) => {
    const colorMap = {
      '#red': '#ef4444',
      '#green': '#10b981', 
      '#blue': '#3b82f6',
      '#yellow': '#f59e0b',
      '#purple': '#8b5cf6',
      '#pink': '#ec4899',
      '#orange': '#f97316',
      '#gray': '#6b7280',
      '#black': '#000000',
      '#white': '#ffffff'
    };

    const foundColors = [];
    for (const [colorCode, hexValue] of Object.entries(colorMap)) {
      if (text.includes(colorCode)) {
        foundColors.push(hexValue);
      }
    }
    
    return foundColors;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (onColorDetect) {
      const colors = detectColors(newValue);
      onColorDetect(colors);
    }
    
    adjustHeight();
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      rows={1}
    />
  );
};

const RichTextEditor = ({ value, onChange, placeholder, className, autoFocus, onColorDetect }) => {
  const editorRef = useRef(null);
  const isComposingRef = useRef(false);

  const detectColors = (text) => {
    const colorMap = {
      '#red': '#ef4444',
      '#green': '#10b981', 
      '#blue': '#3b82f6',
      '#yellow': '#f59e0b',
      '#purple': '#8b5cf6',
      '#pink': '#ec4899',
      '#orange': '#f97316',
      '#gray': '#6b7280',
      '#black': '#000000',
      '#white': '#ffffff'
    };

    const foundColors = [];
    for (const [colorCode, hexValue] of Object.entries(colorMap)) {
      if (text.includes(colorCode)) {
        foundColors.push(hexValue);
      }
    }
    
    return foundColors;
  };

  const setCaretToEnd = (el) => {
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      setCaretToEnd(editorRef.current);
    }
  }, [autoFocus]);

  const handleInput = (e) => {
    if (!isComposingRef.current) {
      const newValue = e.currentTarget.innerHTML;
      onChange(newValue);
      
      if (onColorDetect) {
        const colors = detectColors(newValue);
        onColorDetect(colors);
      }
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  
  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    const newValue = e.currentTarget.innerHTML;
    onChange(newValue);
    
    if (onColorDetect) {
      const colors = detectColors(newValue);
      onColorDetect(colors);
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    const newValue = editorRef.current.innerHTML;
    onChange(newValue);
    
    if (onColorDetect) {
      const colors = detectColors(newValue);
      onColorDetect(colors);
    }
    
    setCaretToEnd(editorRef.current);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <div className="toolbar">
        <button type="button" onClick={() => applyFormat('bold')}><b>B</b></button>
        <button type="button" onClick={() => applyFormat('italic')}><i>I</i></button>
        <button type="button" onClick={() => applyFormat('underline')}><u>U</u></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        className="editor-content"
        style={{ minHeight: '60px', width: '100%' }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

// ============================================
// MEDITATION TRACKS - LOCAL MP3 FILES
// ============================================
const MEDITATION_TRACKS = [
  { 
    id: 1, 
    title: "Blue Eyed", 
    type: "audio",
    src: "Blue_eyed.mp3",
    element: "fire"
  },
  { 
    id: 2, 
    title: "Last Agni Kai", 
    type: "audio",
    src: "Agni_Kai.mp3",
    element: "fire"
  },
  { 
    id: 3, 
    title: "Tibetian Bowl", 
    type: "audio",
    src: "Tibetian_bowl.mp3",
    element: "air"
  },
  { 
    id: 4, 
    title: "Last of Us", 
    type: "audio",
    src: "Last_of_us.mp3",
    element: "water"
  },
  { 
    id: 5, 
    title: "Space Rangers", 
    type: "audio",
    src: "Space_Rangers.mp3",
    element: "earth"
  },
  { 
    id: 6, 
    title: "Gibran Alcocer", 
    type: "audio",
    src: "Gibran_Alcocer.mp3",
    element: "air"
  },
  { 
    id: 7, 
    title: "Eunaudi", 
    type: "audio",
    src: "Eunaudi.mp3",
    element: "air"
  },
  { 
    id: 8, 
    title: "Handpan", 
    type: "audio",
    src: "handpan.mp3",
    element: "water"
  },
  { 
    id: 9, 
    title: "Blume", 
    type: "audio",
    src: "Blume.mp3",
    element: "water"
  },
  { 
    id: 10, 
    title: "Blade runner", 
    type: "audio",
    src: "timer_music_1.mp3",
    element: "fire"
  },
  { 
    id: 11, 
    title: "Evangelion", 
    type: "audio",
    src: "timer_music_2.mp3",
    element: "air"
  },
  { 
    id: 12, 
    title: "Nine lives", 
    type: "audio",
    src: "timer_music_3.mp3",
    element: "water"
  },
  { 
    id: 13, 
    title: "itac", 
    type: "audio",
    src: "timer_music_4.mp3",
    element: "earth"
  },
  { 
    id: 14, 
    title: "mon amour, mon amie", 
    type: "audio",
    src: "timer_music_5.mp3",
    element: "fire"
  },
];

const MeditationSection = () => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const audioRefs = useRef({});

  const getTrackEmoji = (element) => {
    switch(element) {
      case 'air': return '💨';
      case 'water': return '💧';
      case 'earth': return '🌍';
      case 'fire': return '🔥';
      default: return '🎵';
    }
  };

  const handleTrackClick = async (track) => {
    if (currentTrack?.id === track.id) {
      // Stop current track
      if (playingTrack && playingTrack.type === 'audio') {
        const audio = audioRefs.current[playingTrack.id];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setCurrentAudio(null);
      }
      setCurrentTrack(null);
      setPlayingTrack(null);
    } else {
      // Stop any currently playing track
      if (playingTrack && playingTrack.type === 'audio') {
        const prevAudio = audioRefs.current[playingTrack.id];
        if (prevAudio) {
          prevAudio.pause();
          prevAudio.currentTime = 0;
        }
        setCurrentAudio(null);
      }
      
      // Start new track
      setCurrentTrack(track);
      setPlayingTrack(track);
      
      if (track.type === 'audio') {
        try {
          const audio = audioRefs.current[track.id];
          if (audio) {
            audio.loop = true;
            audio.volume = 0.7;
            
            try {
              await audio.play();
              setCurrentAudio(audio);
            } catch (playError) {
              console.log('Audio play failed:', playError);
              audio.muted = true;
              await audio.play();
              audio.muted = false;
              setCurrentAudio(audio);
            }
          }
        } catch (error) {
          console.log('Audio play failed:', error);
        }
      }
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  return (
    <div className="meditation-section">
      <h3 className="section-subtitle">🧘 Meditation & Ambiance</h3>
      <div className="meditation-grid">
        <div className="other-tracks-section">
          <div className="section-header">
            <h4>Audio Tracks</h4>
            {playingTrack && (
              <button 
                onClick={() => {
                  if (playingTrack.type === 'audio') {
                    const audio = audioRefs.current[playingTrack.id];
                    if (audio) {
                      audio.pause();
                      audio.currentTime = 0;
                    }
                    setCurrentAudio(null);
                  }
                  setCurrentTrack(null);
                  setPlayingTrack(null);
                }} 
                className="stop-meditation-button"
              >
                Stop {playingTrack.title}
              </button>
            )}
          </div>
          <div className="tracks-grid">
            {MEDITATION_TRACKS.map(track => (
              <div key={track.id} className="track-container">
                <button 
                  onClick={() => handleTrackClick(track)}
                  className={`track-button ${currentTrack?.id === track.id ? 'active' : ''} ${track.element}`}
                >
                  <span className="track-emoji">
                    {getTrackEmoji(track.element)}
                  </span>
                  {track.title}
                </button>
                {track.type === 'audio' && (
                  <audio
                    ref={el => audioRefs.current[track.id] = el}
                    src={track.src}
                    preload="auto"
                    onError={(e) => console.error('Audio error:', e)}
                  />
                )}
              </div>
            ))}
          </div>
          {playingTrack && playingTrack.type === 'audio' && currentAudio && (
            <div className="now-playing">
              <div className="now-playing-info">
                <span className="now-playing-emoji">{getTrackEmoji(playingTrack.element)}</span>
                <span className="now-playing-title">Now Playing: {playingTrack.title}</span>
              </div>
              <div className="audio-controls">
                <button 
                  onClick={() => {
                    const audio = audioRefs.current[playingTrack.id];
                    if (audio) {
                      if (audio.paused) {
                        audio.play();
                      } else {
                        audio.pause();
                      }
                    }
                  }}
                  className="play-pause-button"
                >
                  {currentAudio?.paused ? '▶️' : '⏸️'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentAudio?.volume || 0.7}
                  onChange={(e) => {
                    const audio = audioRefs.current[playingTrack.id];
                    if (audio) {
                      audio.volume = e.target.value;
                    }
                  }}
                  className="volume-slider"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function DailyEntry() {
  const [entry, setEntry] = useState(initialState);
  const [history, setHistory] = useState([]);
  const [audio, setAudio] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [newTodoId, setNewTodoId] = useState(null);

  // Pomodoro states
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pomodoroDuration, setPomodoroDuration] = useState(45);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const timerRef = useRef(null);

  const tracks = [
    "timer_music_1.mp3",
    "timer_music_2.mp3",
    "timer_music_3.mp3",
    "timer_music_4.mp3",
    "timer_music_5.mp3"
  ];

  const changeDateBy = useCallback((days) => {
    const parsedDate = parse(entry.date, 'dd/MM/yyyy', new Date());
    const newDate = format(addDays(parsedDate, days), 'dd/MM/yyyy');

    const prevEntry = history.find(e => e.date === entry.date);
    const found = history.find(e => e.date === newDate);

    const copiedHabits = prevEntry?.habits?.map(h => ({
      ...h,
      completedByDate: {
        ...h.completedByDate,
        [newDate]: h.completedByDate?.[newDate] ?? false
      }
    })) || [];

    const copiedTodos = found?.todos || prevEntry?.todos || initialState.todos;

    setEntry(found
      ? {
          ...found,
          habits: copiedHabits.length ? copiedHabits : found.habits || [],
          todos: copiedTodos,
          mostImportantTask: found.mostImportantTask ?? prevEntry?.mostImportantTask ?? ''
        }
      : {
          ...initialState,
          date: newDate,
          habits: copiedHabits,
          todos: copiedTodos,
          mostImportantTask: prevEntry?.mostImportantTask ?? ''
        }
    );
  }, [entry.date, history]);

  const copyToTomorrow = () => {
    const parsedTodayDate = parse(entry.date, 'dd/MM/yyyy', new Date());
    const tomorrowDate = format(addDays(parsedTodayDate, 1), 'dd/MM/yyyy');
    
    const yesterdayDate = format(subDays(parsedTodayDate, 1), 'dd/MM/yyyy');
    const yesterdayEntry = history.find(e => e.date === yesterdayDate);
    
    if (yesterdayEntry) {
      const statsToCompare = ['efficiency', 'productivity', 'happiness', 'pomodoros'];
      const areStatsSame = statsToCompare.every(stat => entry[stat] === yesterdayEntry[stat]);
      
      const areEnergySame = ['air', 'fire', 'water', 'earth'].every(
        key => entry.energy[key] === yesterdayEntry.energy[key]
      );
      
      if (areStatsSame && areEnergySame) {
        const proceed = window.confirm(
          "Today's performance metrics and energy levels are exactly the same as yesterday. " +
          "Are you sure you want to copy this data to tomorrow?"
        );
        if (!proceed) return;
      }
    }
    
    const tomorrowEntry = {
      ...entry,
      date: tomorrowDate,
      todos: entry.todos.map(todo => ({ ...todo })),
      habits: entry.habits.map(habit => ({
        ...habit,
        completedByDate: {
          ...habit.completedByDate,
          [tomorrowDate]: false
        }
      })),
    };
    
    const tomorrowIndex = history.findIndex(e => e.date === tomorrowDate);
    const updatedHistory = [...history];
    
    if (tomorrowIndex >= 0) {
      updatedHistory[tomorrowIndex] = tomorrowEntry;
    } else {
      updatedHistory.push(tomorrowEntry);
    }
    
    saveData(updatedHistory);
    setHistory(updatedHistory);
    setEntry(tomorrowEntry);
    
    alert(`✅ Copied ALL today's data to tomorrow (${tomorrowDate})!\n\nIncluding:
  • Tasks (completed/uncompleted)
  • Habits (RESET to unchecked)
  • Energy levels (Air/Fire/Water/Earth)
  • Performance metrics (Efficiency/Productivity/Happiness)
  • Pomodoros completed
  • Daily reflections
  • Most Important Task`);
  };

  // Auto-save
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (entry.date) {
        const existingIndex = history.findIndex(e => e.date === entry.date);
        const updated = [...history];
        
        if (existingIndex >= 0) {
          updated[existingIndex] = entry;
        } else {
          updated.push(entry);
        }
        
        saveData(updated);
        setHistory(updated);
      }
    }, 500);
    
    return () => clearTimeout(saveTimer);
  }, [entry]);

  // Load saved data
  useEffect(() => {
    const saved = loadData();
    setHistory(saved || []);

    const today = format(new Date(), 'dd/MM/yyyy');
    const prevDate = format(subDays(new Date(), 1), 'dd/MM/yyyy');
    const prevEntry = saved?.find(e => e.date === prevDate);
    const todayEntry = saved?.find(e => e.date === today);

    if (todayEntry) {
      setEntry(todayEntry);
    } else if (prevEntry) {
      setEntry({
        ...initialState,
        date: today,
        efficiency: prevEntry.efficiency,
        productivity: prevEntry.productivity,
        happiness: prevEntry.happiness,
        energy: { ...prevEntry.energy },
        victory: prevEntry.victory || '',
        loss: prevEntry.loss || '',
        insight: prevEntry.insight || '',
        pomodorosHistory: prevEntry.pomodorosHistory || initialState.pomodorosHistory,
        habits: prevEntry.habits?.map(h => ({
          ...h,
          completedByDate: {
            ...h.completedByDate,
            [today]: false
          }
        })) || initialState.habits,
        todos: prevEntry.todos || initialState.todos,
        mostImportantTask: prevEntry.mostImportantTask || ''
      });
    } else {
      setEntry({
        ...initialState,
        date: today
      });
    }
  }, []);

  // Pomodoro timer effect
  useEffect(() => {
    if (isPomodoroActive && timerEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timerEndTime - now) / 1000));
        
        setTimeLeft(remaining);
        
        document.title = `${formatTime(remaining)} - Pomodoro Timer`;
        
        if (remaining === 0) {
          handlePomodoroEnd();
        }
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPomodoroActive, timerEndTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPomodoroActive && timerEndTime) {
        const remaining = Math.max(0, Math.floor((timerEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = 'Daily Entry';
    };
  }, [isPomodoroActive, timerEndTime]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
      document.title = 'Daily Entry';
    };
  }, [audio]);

  const handleChange = (key, value) => {
    setEntry(prev => ({ ...prev, [key]: value }));
  };

  const handleEnergy = (key, value) => {
    setEntry(prev => ({
      ...prev,
      energy: { ...prev.energy, [key]: value }
    }));
  };

  const getMetricColor = (value) => {
    if (value === null) return '#94a3b8';
    if (value < 33) return '#dc2626';
    if (value < 66) return '#f59e0b';
    return '#10b981';
  };

  const handleDateChange = (e) => {
    const [year, month, day] = e.target.value.split('-');
    handleChange('date', `${day}/${month}/${year}`);
  };

  const startPomodoro = (duration) => {
    const durationInMinutes = typeof duration === 'number' ? duration : pomodoroDuration;
    const durationInSeconds = durationInMinutes * 60;
    
    setIsPomodoroActive(true);
    setTimeLeft(durationInSeconds);
    setTimerEndTime(Date.now() + durationInSeconds * 1000);
    
    if (typeof duration === 'number') {
      setPomodoroDuration(duration);
    }
  };

  const handlePomodoroEnd = async () => {
    clearInterval(timerRef.current);
    setIsPomodoroActive(false);
    document.title = 'Daily Entry';

    const pomodoroUnits = pomodoroDuration / 60;

    setEntry(prev => ({
      ...prev,
      pomodoros: parseFloat(((prev.pomodoros || 0) + pomodoroUnits).toFixed(2)),
      pomodorosHistory: {
        ...prev.pomodorosHistory,
        [pomodoroDuration]: parseFloat(((prev.pomodorosHistory?.[pomodoroDuration] || 0) + pomodoroUnits).toFixed(2))
      }
    }));

    if (!isMuted) {
      try {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        const newAudio = new Audio(randomTrack);
        newAudio.volume = 1.0;
        newAudio.preload = 'auto';
        
        try {
          await newAudio.play();
          setAudio(newAudio);
        } catch (playError) {
          console.log('Pomodoro audio play failed:', playError);
          newAudio.muted = true;
          await newAudio.play();
          newAudio.muted = false;
          setAudio(newAudio);
        }
      } catch (error) {
        console.error('Failed to play pomodoro end sound:', error);
      }
    }
  };

  const cancelPomodoro = () => {
    clearInterval(timerRef.current);
    setIsPomodoroActive(false);
    setTimeLeft(0);
    document.title = 'Daily Entry';
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (audio) {
      if (isMuted) {
        audio.play();
      } else {
        audio.pause();
      }
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTodoChange = (id, key, value, colors = []) => {
    setEntry(prev => ({
      ...prev,
      todos: prev.todos.map(todo => 
        todo.id === id ? { 
          ...todo, 
          [key]: value,
          ...(colors.length > 0 && { color: colors[0] })
        } : todo
      )
    }));
  };

  const addNewTodo = () => {
    const newId = Date.now();
    setNewTodoId(newId);
    setEntry(prev => ({
      ...prev,
      todos: [
        ...prev.todos,
        { id: newId, text: '', completed: false }
      ]
    }));
  };

  const deleteTodo = (id) => {
    setEntry(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== id)
    }));
  };

  const deleteHabit = (id) => {
    setEntry(prev => ({
      ...prev,
      habits: prev.habits.filter(habit => habit.id !== id)
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(entry.todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setEntry(prev => ({
      ...prev,
      todos: items
    }));
  };

  const moveTodo = (id, direction) => {
    const todos = [...entry.todos];
    const index = todos.findIndex(todo => todo.id === id);
    
    if ((direction === 'up' && index > 0) || 
        (direction === 'down' && index < todos.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      [todos[index], todos[newIndex]] = [todos[newIndex], todos[index]];
      
      setEntry(prev => ({
        ...prev,
        todos
      }));
    }
  };

  return (
    <div className="daily-entry">
      {/* Pomodoro Section */}
      <div className="pomodoro-section" style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        {isPomodoroActive ? (
          <div className="active-pomodoro">
            <div className="timer-display" style={{ 
              fontSize: '48px', 
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <button onClick={cancelPomodoro} className="cancel-pomodoro" style={{
                padding: '8px 16px',
                margin: '0 5px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
              <button onClick={toggleMute} className="mute-button" style={{
                padding: '8px 16px',
                margin: '0 5px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}>
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        ) : (
          <div className="pomodoro-controls">
            <div style={{ marginBottom: '15px' }}>
              <input
                type="number"
                min="1"
                max="180"
                value={pomodoroDuration}
                onChange={(e) => setPomodoroDuration(parseInt(e.target.value) || 1)}
                className="custom-duration-input"
                style={{
                  padding: '10px',
                  marginRight: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  width: '80px',
                  fontSize: '16px'
                }}
              />
              <button 
                onClick={() => startPomodoro()} 
                className="start-pomodoro"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Start {pomodoroDuration}m
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              {pomodoroDuration}min = {(pomodoroDuration / 60).toFixed(2)} pomodoro(s)
            </div>
            
            <div className="quick-pomodoros">
              <button 
                onClick={() => startPomodoro(30)} 
                className="pomodoro-button"
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                30m
              </button>
              <button 
                onClick={() => startPomodoro(45)} 
                className="pomodoro-button"
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                45m
              </button>
              <button 
                onClick={() => startPomodoro(60)} 
                className="pomodoro-button"
                style={{
                  padding: '8px 16px',
                  margin: '0 5px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                60m
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="card">
        <div className="section-box date-section">
          <div className="date-controls">
            <button type="button" onClick={() => changeDateBy(-1)}>&larr; Yesterday</button>
            <input 
              type="date"
              value={entry.date.split('/').reverse().join('-')}
              onChange={handleDateChange}
              className="date-picker"
            />
            <button type="button" onClick={() => changeDateBy(1)}>Tomorrow &rarr;</button>
            <button type="button" onClick={copyToTomorrow} className="copy-tomorrow-button">
              📋 Copy to Tomorrow
            </button>
          </div>
        </div>

        <div className="bottom-section">
          <div className="three-column-row">
            <div className="section-box energy-section">
              <h3 className="section-subtitle">Energy Levels</h3>
              <div className="energy-grid">
                {Object.entries(entry.energy).map(([key, value]) => (
                  <div key={key} className={`energy-card energy-${key}`}>
                    <label className="energy-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      <span className="energy-value">{value ?? ''}%</span>
                    </label>
                    <div className="energy-slider-container">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={value ?? 50} 
                        onChange={e => handleEnergy(key, +e.target.value)}
                        className="energy-slider"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-box metrics-section">
              <h3 className="section-subtitle">Performance Metrics</h3>
              <div className="metrics-grid">
                {['efficiency', 'productivity', 'happiness'].map(metric => (
                  <div key={metric} className="metric-card">
                    <label className="metric-label">
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      <span className="metric-value" style={{ color: getMetricColor(entry[metric]) }}>
                        {entry[metric] ?? ''}%
                      </span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={entry[metric] ?? 50} 
                      onChange={e => handleChange(metric, +e.target.value)} 
                      className="metric-slider"
                      style={{ '--track-color': getMetricColor(entry[metric]) }}
                    />
                    <div className="slider-labels">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                ))}

                <div className="metric-card pomodoros-card">
                  <label className="input-label">Pomodoros Completed</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={entry.pomodoros} 
                    onChange={e => handleChange('pomodoros', parseFloat(e.target.value))}
                    className="pomodoros-input"
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    (60min = 1 pomodoro)
                  </div>
                </div>
              </div>
            </div>

            <div className="section-box todos-section">
              <h3 className="section-subtitle">Daily Tasks</h3>
              <div className="todos-grid">
                {entry.todos.map((todo, index) => (
                  <div key={todo.id} className={`todo-card ${todo.completed ? 'completed' : ''}`}
                    style={{
                      backgroundColor: todo.color || '',
                      borderLeft: todo.color ? `4px solid ${todo.color}` : 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed || false}
                      onChange={(e) => handleTodoChange(todo.id, 'completed', e.target.checked)}
                      className="todo-checkbox"
                    />
                    <RichTextEditor
                      value={todo.text || ''}
                      onChange={(value) => handleTodoChange(todo.id, 'text', value)}
                      onColorDetect={(colors) => {
                        if (colors.length > 0) {
                          setEntry(prev => ({
                            ...prev,
                            todos: prev.todos.map(t => 
                              t.id === todo.id ? { ...t, color: colors[0] } : t
                            )
                          }));
                        }
                      }}
                      placeholder="Enter a task... (use #red, #green, #blue, etc.)"
                      className="todo-input"
                      autoFocus={todo.id === newTodoId}
                    />
                    <div className="todo-priority-buttons">
                      <button 
                        onClick={() => moveTodo(todo.id, 'up')}
                        disabled={index === 0}
                        className="priority-button"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => moveTodo(todo.id, 'down')}
                        disabled={index === entry.todos.length - 1}
                        className="priority-button"
                      >
                        ↓
                      </button>
                    </div>
                    <button 
                      className="delete-todo"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      ×
                    </button>
                    {todo.completed && (
                      <span className="completed-icon">✓</span>
                    )}
                  </div>
                ))}
                <button 
                  className="add-todo-button"
                  onClick={addNewTodo}
                >
                  + Add Task
                </button>
              </div>
            </div>
          </div>

          <div className="new-row">
            <div className="three-column-row">
              <div className="section-box insights-section">
                <h3 className="section-subtitle">Daily Reflections</h3>
                <div className="insights-grid">
                  <div className="insight-card victory-card">
                    <label className="input-label">❌✅ Victories / Losses</label>
                    <AutoResizeTextarea
                      value={entry.victory}
                      onChange={(value) => handleChange('victory', value)}
                      placeholder="What went well today? What didn't?"
                      className="insight-textarea"
                    />
                  </div>
                  <div className="insight-card loss-card">
                    <label className="input-label">💤 Dreams & What I feel</label>
                    <AutoResizeTextarea
                      value={entry.loss}
                      onChange={(value) => handleChange('loss', value)}
                      placeholder="Insight into subconscious"
                      className="insight-textarea"
                    />
                  </div>
                  <div className="insight-card insight-card">
                    <label className="input-label">🤔 Insights & Learnings</label>
                    <AutoResizeTextarea
                      value={entry.insight}
                      onChange={(value) => handleChange('insight', value)}
                      placeholder="What did u find out today?"
                      className="insight-textarea"
                    />
                  </div>
                </div>
              </div>
              
              <div className="section-box habits-section">
                <h3 className="section-subtitle">Habits Tracker</h3>
                <div className="habits-list">
                  {(entry.habits || []).map((habit) => (
                    <div key={habit.id} className="habit-item">
                      <input
                        type="checkbox"
                        checked={habit.completedByDate?.[entry.date] || false}
                        onChange={e => {
                          const newHabits = [...entry.habits];
                          const habitIndex = newHabits.findIndex(h => h.id === habit.id);
                          newHabits[habitIndex].completedByDate = {
                            ...newHabits[habitIndex].completedByDate,
                            [entry.date]: e.target.checked
                          };
                          setEntry(prev => ({ ...prev, habits: newHabits }));
                        }}
                      />
                      <AutoResizeTextarea
                        value={habit.text}
                        onChange={(value) => {
                          const newHabits = [...entry.habits];
                          const habitIndex = newHabits.findIndex(h => h.id === habit.id);
                          newHabits[habitIndex].text = value;
                          setEntry(prev => ({ ...prev, habits: newHabits }));
                        }}
                        placeholder="Enter habit..."
                        className="habit-input"
                      />
                      <button 
                        className="delete-habit"
                        onClick={() => deleteHabit(habit.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="add-habit-button"
                    onClick={() => {
                      const newHabit = { 
                        id: Date.now(), 
                        text: '', 
                        completedByDate: {
                          [entry.date]: false
                        } 
                      };
                      setEntry(prev => ({
                        ...prev,
                        habits: prev.habits ? [...prev.habits, newHabit] : [newHabit]
                      }));
                    }}
                  >
                    + Add Habit
                  </button>
                </div>
              </div>
              
              <div className="section-box mit-section">
                <h3 className="section-subtitle">Most Important Task</h3>
                <AutoResizeTextarea
                  value={entry.mostImportantTask || ''}
                  onChange={(value) => handleChange('mostImportantTask', value)}
                  placeholder="What's the single, most important task you will dedicate at least 4-6 hours to?"
                  className="mit-input"
                />
              </div>
            </div>
          </div>

          <MeditationSection />
        </div>
      </div>
    </div>
  );
}