import React, { useState, useRef, useEffect, useCallback } from 'react';
import { format, subDays, addDays, parse } from 'date-fns';
import './DailyEntry.scss';
import { loadData, saveData } from '../services/dataService';
import { useMedia } from '../contexts/MediaContent';

const COLOR_PALETTE = [
  '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#f97316', '#6b7280', '#000000', '#ffffff'
];

const initialState = {
  date: format(new Date(), 'dd/MM/yyyy'),
  efficiency: null,
  habits: [
    { id: 1, text: 'Exercise', completedByDate: { 'dd/MM/yyyy': true, '29/07/2025': false } },
    { id: 2, text: 'Meditation', completedByDate: { 'dd/MM/yyyy': true, '29/07/2025': false } },
  ],
  productivity: null,
  happiness: null,
  pomodoros: 0,
  pomodorosHistory: { '30': 0, '45': 0, '60': 0, 'custom': 0 },
  energy: { air: null, fire: null, water: null, earth: null },
  victory: '',
  loss: '',
  insight: '',
  activePomodoro: null,
  pomodoroDuration: 30,
  todos: [
    { id: 1, text: 'Complete project proposal', completed: false, color: '', timeStart: '', timeEnd: '' },
    { id: 2, text: 'Schedule team meeting', completed: false, color: '', timeStart: '', timeEnd: '' },
    { id: 3, text: 'Review client feedback', completed: false, color: '', timeStart: '', timeEnd: '' },
  ],
  mostImportantTask: ''
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  const parseTime = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  let diff = parseTime(endTime) - parseTime(startTime);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60), m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Info Button Component for Energy Elements
const InfoButton = ({ element }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getInfoText = (elem) => {
    switch(elem) {
      case 'fire':
        return '🔥 Fire: Passion, drive, motivation, and creative energy. How inspired and enthusiastic do you feel?';
      case 'water':
        return '💧 Water: Flow state, adaptability, and ease of movement through life. How smoothly are things flowing?';
      case 'air':
        return '💨 Air: Meaning in life, clarity of thought. How clear is your direction/sense of yourself?';
      case 'earth':
        return '🌍 Earth: Groundedness, discipline, stability, and physical energy. How rooted and organized do you feel?';
      default:
        return '';
    }
  };

  return (
   <div className="info-button-container" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className="energy-info-button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          opacity: 0.5,
          transition: 'opacity 0.2s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
      >
        ℹ️
      </button>
      {showTooltip && (
        <div className="info-tooltip" style={{
          position: 'absolute',
          bottom: '50%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none'
        }}>
          {getInfoText(element)}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#1e293b transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
};

const ColorPicker = ({ selectedColor, onSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`color-picker ${className}`} ref={pickerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="color-picker-toggle" onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: selectedColor || 'transparent', border: selectedColor === '#ffffff' ? '1px solid #ccc' : '1px solid #ddd', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', transition: 'all 0.2s ease' }}
        title="Select background color">🎨</button>
      {isOpen && (
        <div className="color-palette" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '140px' }}>
          {COLOR_PALETTE.map((color, index) => (
            <button key={index} type="button" className="color-option"
              style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => { onSelect(color); setIsOpen(false); }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title={`Color ${index + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
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
    if (autoFocus && textareaRef.current) textareaRef.current.focus();
  }, [adjustHeight, autoFocus]);

  const detectColors = (text) => {
    const colorMap = { '#red': '#ef4444', '#green': '#10b981', '#blue': '#3b82f6', '#yellow': '#f59e0b', '#purple': '#8b5cf6', '#pink': '#ec4899', '#orange': '#f97316', '#gray': '#6b7280', '#black': '#000000', '#white': '#ffffff' };
    return Object.entries(colorMap).filter(([k]) => text.includes(k)).map(([, v]) => v);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (onColorDetect) onColorDetect(detectColors(newValue));
    adjustHeight();
  };

  return <textarea ref={textareaRef} value={value} onChange={handleChange} placeholder={placeholder} className={className} rows={1} />;
};

const RichTextEditor = React.memo(({ value, onChange, placeholder, className, autoFocus, onColorDetect }) => {
  const editorRef = useRef(null);
  const isComposingRef = useRef(false);

  const detectColors = (text) => {
    const colorMap = { '#red': '#ef4444', '#green': '#10b981', '#blue': '#3b82f6', '#yellow': '#f59e0b', '#purple': '#8b5cf6', '#pink': '#ec4899', '#orange': '#f97316', '#gray': '#6b7280', '#black': '#000000', '#white': '#ffffff' };
    return Object.entries(colorMap).filter(([k]) => text.includes(k)).map(([, v]) => v);
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
    if (el && el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  useEffect(() => {
    if (autoFocus && editorRef.current) setCaretToEnd(editorRef.current);
  }, [autoFocus]);

  const handleInput = (e) => {
    if (!isComposingRef.current) {
      const newValue = e.currentTarget.innerHTML;
      onChange(newValue);
      if (onColorDetect) onColorDetect(detectColors(newValue));
    }
  };

  const handleCompositionStart = () => isComposingRef.current = true;
  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    const newValue = e.currentTarget.innerHTML;
    onChange(newValue);
    if (onColorDetect) onColorDetect(detectColors(newValue));
  };

  const applyFormat = (command) => {
    editorRef.current.focus();
    document.execCommand(command, false, null);
    const newValue = editorRef.current.innerHTML;
    onChange(newValue);
    if (onColorDetect) onColorDetect(detectColors(newValue));
    setCaretToEnd(editorRef.current);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <div className="toolbar">
        <button type="button" onClick={() => applyFormat('bold')}><b>B</b></button>
        <button type="button" onClick={() => applyFormat('italic')}><i>I</i></button>
        <button type="button" onClick={() => applyFormat('underline')}><u>U</u></button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleInput} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} placeholder={placeholder} className="editor-content" suppressContentEditableWarning={true} />
    </div>
  );
});

const MEDITATION_TRACKS = [
  { id: 1, title: "Blue Eyed", type: "audio", src: "/Blue_eyed.mp3", element: "fire", fallbackSrc: null },
  { id: 2, title: "Last Agni Kai", type: "audio", src: "/Agni_Kai.mp3", element: "fire", fallbackSrc: null },
  { id: 3, title: "Tibetian Bowl", type: "audio", src: "/Tibetian_bowl.mp3", element: "air", fallbackSrc: null },
  { id: 5, title: "Space Rangers", type: "audio", src: "/Space_Rangers.mp3", element: "earth", fallbackSrc: null },
  { id: 6, title: "Gibran Alcocer", type: "audio", src: "/Gibran_Alcocer.mp3", element: "air", fallbackSrc: null },
  { id: 7, title: "Eunaudi", type: "audio", src: "/Eunaudi.mp3", element: "air", fallbackSrc: null },
  { id: 8, title: "Handpan", type: "audio", src: "/handpan.mp3", element: "water", fallbackSrc: null },
  { id: 9, title: "Blume", type: "audio", src: "/blume.mp3", element: "water", fallbackSrc: null },
  { id: 10, title: "Blade runner", type: "audio", src: "/timer_music_1.mp3", element: "fire", fallbackSrc: null },
  { id: 11, title: "Evangelion", type: "audio", src: "/timer_music_2.mp3", element: "air", fallbackSrc: null },
  { id: 12, title: "Nine lives", type: "audio", src: "/timer_music_3.mp3", element: "water", fallbackSrc: null },
  { id: 13, title: "Itac", type: "audio", src: "/timer_music_4.mp3", element: "earth", fallbackSrc: null },
  { id: 14, title: "Mon amour, mon amie", type: "audio", src: "/timer_music_5.mp3", element: "fire", fallbackSrc: null },
];

const MeditationSection = () => {
  const { currentTrack, isPlaying, volume, playTrack, stopMusic, togglePlayPause, handleVolumeChange, isBeeping, stopBeep } = useMedia();
  const [audioError, setAudioError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getTrackEmoji = (element) => ({ air: '💨', water: '💧', earth: '🌍', fire: '🔥' }[element] || '🎵');

  const handleTrackClick = async (track) => {
    setAudioError(null);
    if (currentTrack?.id === track.id && isPlaying) { stopMusic(); return; }
    if (currentTrack?.id === track.id && !isPlaying) { togglePlayPause(); return; }
    setIsLoading(true);
    try {
      await playTrack(track);
      setAudioError(null);
    } catch (error) {
      setAudioError(`❌ Cannot play "${track.title}". Please check if the audio file exists.`);
      setTimeout(() => setAudioError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="meditation-section">
      <h3 className="section-subtitle">🧘 Meditation & Ambiance</h3>
      {audioError && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>{audioError}</div>
      )}
      {isLoading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', borderRadius: '10px', zIndex: 9999, textAlign: 'center' }}>Loading audio...</div>
      )}
      <div className="meditation-grid">
        <div className="tracks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' }}>
          {MEDITATION_TRACKS.map(track => (
            <div key={track.id} className="track-container">
              <button onClick={() => handleTrackClick(track)} disabled={isLoading}
                className={`track-button ${currentTrack?.id === track.id ? 'active' : ''} ${track.element}`}
                style={{ width: '100%', padding: '10px', backgroundColor: currentTrack?.id === track.id ? '#3b82f6' : '#f3f4f6', color: currentTrack?.id === track.id ? 'white' : '#374151', border: 'none', borderRadius: '8px', cursor: isLoading ? 'wait' : 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="track-emoji">{getTrackEmoji(track.element)}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{track.title}</span>
                {currentTrack?.id === track.id && isPlaying && <span style={{ fontSize: '12px' }}>🔊</span>}
              </button>
            </div>
          ))}
        </div>
      </div>
      {currentTrack && (
        <div className="now-playing" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Now playing: {currentTrack.title}</span>
          <div>
            <button onClick={togglePlayPause} style={{ marginRight: '10px' }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={stopMusic}>⏹</button>
          </div>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} style={{ width: '100px' }} />
        </div>
      )}
    </div>
  );
};

export default function DailyEntry() {
  const [pausedTimeLeft, setPausedTimeLeft] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [entry, setEntry] = useState(initialState);
  const [history, setHistory] = useState([]);
  const [newTodoId, setNewTodoId] = useState(null);

  const {
    isPomodoroActive,
    timeLeft,
    pomodoroDuration,
    setPomodoroDuration,
    startPomodoro,
    cancelPomodoro,
    formatTime,
    isMuted,
    setIsMuted,
    isBeeping,
    stopBeep,
  } = useMedia();

  const prevPomodoroActiveRef = useRef(false);
  const completionHandledRef = useRef(false);
  const wasManuallyStoppedRef = useRef(false);

  const pausePomodoroLocal = () => {
    if (isPomodoroActive) {
      wasManuallyStoppedRef.current = true;
      setPausedTimeLeft(timeLeft);
      setIsPaused(true);
      cancelPomodoro();
    }
  };

  const resumePomodoroLocal = () => {
    if (pausedTimeLeft > 0) {
      startPomodoro(pausedTimeLeft / 60);
      setIsPaused(false);
      setPausedTimeLeft(null);
    }
  };

  const getMetricColor = (value) => {
    if (value === null) return '#94a3b8';
    if (value < 33) return '#dc2626';
    if (value < 66) return '#f59e0b';
    return '#10b981';
  };

  // Get gradient background for energy sliders
const getEnergyGradient = (element, value) => {
  const percent = value ?? 50;
  switch(element) {
    case 'air':
      // Gray to White gradient (starts gray, fills to white based on percentage)
      return `linear-gradient(to right, #94a3b8 0%, #ffffff ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    case 'water':
      // Blue gradient (starts dark blue, fills to light blue)
      return `linear-gradient(to right, #2563eb 0%, #38bdf8 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    case 'fire':
      // Red/Orange gradient
      return `linear-gradient(to right, #dc2626 0%, #f97316 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    case 'earth':
      // Green gradient
      return `linear-gradient(to right, #059669 0%, #84cc16 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
    default:
      return `linear-gradient(to right, #e2e8f0 0%, #e2e8f0 100%)`;
  }
};

  const handleChange = (key, value) => setEntry(prev => ({ ...prev, [key]: value }));
  const handleEnergy = (key, value) => setEntry(prev => ({ ...prev, energy: { ...prev.energy, [key]: value } }));

  const handleDateChange = (e) => {
    const [year, month, day] = e.target.value.split('-');
    handleChange('date', `${day}/${month}/${year}`);
  };

  const changeDateBy = useCallback((days) => {
    const parsedDate = parse(entry.date, 'dd/MM/yyyy', new Date());
    const newDate = format(addDays(parsedDate, days), 'dd/MM/yyyy');
    const prevEntry = history.find(e => e.date === entry.date);
    const found = history.find(e => e.date === newDate);
    const copiedHabits = prevEntry?.habits?.map(h => ({ ...h, completedByDate: { ...h.completedByDate, [newDate]: h.completedByDate?.[newDate] ?? false } })) || [];
    const copiedTodos = found?.todos || prevEntry?.todos || initialState.todos;
    setEntry(found ? {
      ...found,
      habits: copiedHabits.length ? copiedHabits : found.habits || [],
      todos: copiedTodos,
      mostImportantTask: found.mostImportantTask ?? prevEntry?.mostImportantTask ?? ''
    } : {
      ...initialState,
      date: newDate,
      habits: copiedHabits,
      todos: copiedTodos,
      mostImportantTask: prevEntry?.mostImportantTask ?? ''
    });
  }, [entry.date, history]);

  const copyToTomorrow = () => {
    const parsedTodayDate = parse(entry.date, 'dd/MM/yyyy', new Date());
    const tomorrowDate = format(addDays(parsedTodayDate, 1), 'dd/MM/yyyy');
    const yesterdayDate = format(subDays(parsedTodayDate, 1), 'dd/MM/yyyy');
    const yesterdayEntry = history.find(e => e.date === yesterdayDate);
    if (yesterdayEntry) {
      const areStatsSame = ['efficiency', 'productivity', 'happiness', 'pomodoros'].every(s => entry[s] === yesterdayEntry[s]);
      const areEnergySame = ['air', 'fire', 'water', 'earth'].every(k => entry.energy[k] === yesterdayEntry.energy[k]);
      if (areStatsSame && areEnergySame) {
        if (!window.confirm("Today's performance metrics and energy levels are exactly the same as yesterday. Are you sure you want to copy this data to tomorrow?")) return;
      }
    }
    const tomorrowEntry = {
      ...entry,
      date: tomorrowDate,
      todos: entry.todos.map(todo => ({ ...todo })),
      habits: entry.habits.map(habit => ({ ...habit, completedByDate: { ...habit.completedByDate, [tomorrowDate]: false } })),
    };
    const tomorrowIndex = history.findIndex(e => e.date === tomorrowDate);
    const updatedHistory = [...history];
    if (tomorrowIndex >= 0) updatedHistory[tomorrowIndex] = tomorrowEntry;
    else updatedHistory.push(tomorrowEntry);
    saveData(updatedHistory);
    setHistory(updatedHistory);
    setEntry(tomorrowEntry);
    alert(`✅ Copied ALL today's data to tomorrow (${tomorrowDate})!`);
  };

  const handlePomodoroEndWrapper = () => {
    const pomodoroUnits = pomodoroDuration / 60;
    setEntry(prev => ({
      ...prev,
      pomodoros: parseFloat(((prev.pomodoros || 0) + pomodoroUnits).toFixed(2)),
      pomodorosHistory: {
        ...prev.pomodorosHistory,
        [pomodoroDuration]: parseFloat(((prev.pomodorosHistory?.[pomodoroDuration] || 0) + pomodoroUnits).toFixed(2))
      }
    }));
  };

  useEffect(() => {
    if (isPomodoroActive) {
      completionHandledRef.current = false;
      wasManuallyStoppedRef.current = false;
    }
    if (prevPomodoroActiveRef.current && !isPomodoroActive && timeLeft === 0) {
      if (!completionHandledRef.current && !wasManuallyStoppedRef.current) {
        completionHandledRef.current = true;
        handlePomodoroEndWrapper();
      }
    }
    prevPomodoroActiveRef.current = isPomodoroActive;
  }, [isPomodoroActive, timeLeft]);

  const handleTodoChange = (id, key, value) => {
    setEntry(prev => ({ ...prev, todos: prev.todos.map(todo => todo.id === id ? { ...todo, [key]: value } : todo) }));
  };

  const addNewTodo = () => {
    const newId = Date.now();
    setNewTodoId(newId);
    setEntry(prev => ({ ...prev, todos: [...prev.todos, { id: newId, text: '', completed: false, color: '', timeStart: '', timeEnd: '' }] }));
  };

  const deleteTodo = (id) => setEntry(prev => ({ ...prev, todos: prev.todos.filter(todo => todo.id !== id) }));
  const deleteHabit = (id) => setEntry(prev => ({ ...prev, habits: prev.habits.filter(habit => habit.id !== id) }));

  const moveTodo = (id, direction) => {
    const todos = [...entry.todos];
    const index = todos.findIndex(todo => todo.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < todos.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [todos[index], todos[newIndex]] = [todos[newIndex], todos[index]];
      setEntry(prev => ({ ...prev, todos }));
    }
  };

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (entry.date) {
        const existingIndex = history.findIndex(e => e.date === entry.date);
        const updated = [...history];
        if (existingIndex >= 0) updated[existingIndex] = entry;
        else updated.push(entry);
        saveData(updated);
        setHistory(updated);
      }
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [entry]);

  useEffect(() => {
    const saved = loadData();
    setHistory(saved || []);
    const today = format(new Date(), 'dd/MM/yyyy');
    const prevDate = format(subDays(new Date(), 1), 'dd/MM/yyyy');
    const prevEntry = saved?.find(e => e.date === prevDate);
    const todayEntry = saved?.find(e => e.date === today);
    if (todayEntry) setEntry(todayEntry);
    else if (prevEntry) {
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
        habits: prevEntry.habits?.map(h => ({ ...h, completedByDate: { ...h.completedByDate, [today]: false } })) || initialState.habits,
        todos: prevEntry.todos || initialState.todos,
        mostImportantTask: prevEntry.mostImportantTask || ''
      });
    } else setEntry({ ...initialState, date: today });
  }, []);

  return (
    <div className="daily-entry">
      <div className="pomodoro-section" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', textAlign: 'center' }}>
        {isPomodoroActive ? (
          <div>
            <div className="timer-display" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '15px' }}>{formatTime(timeLeft)}</div>
            <div>
              <button onClick={pausePomodoroLocal} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>⏸ Pause</button>
              <button onClick={() => { wasManuallyStoppedRef.current = true; cancelPomodoro(); }} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setIsMuted(!isMuted)} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: isMuted ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'all 0.2s ease' }} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>
          </div>
        ) : isPaused ? (
          <div>
            <div className="timer-display" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '15px' }}>{formatTime(pausedTimeLeft)}</div>
            <div>
              <button onClick={resumePomodoroLocal} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>▶ Resume</button>
              <button onClick={() => { setIsPaused(false); setPausedTimeLeft(null); }} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            {isBeeping && (
              <button onClick={stopBeep} style={{ padding: '10px 20px', marginBottom: '15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
                🔔 Stop Alarm
              </button>
            )}
            <div style={{ marginBottom: '15px' }}>
              <input type="number" min="1" max="180" value={pomodoroDuration} onChange={(e) => setPomodoroDuration(parseInt(e.target.value) || 1)} style={{ padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '80px', fontSize: '16px' }} />
              <button onClick={() => startPomodoro()} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Start {pomodoroDuration}m</button>
            </div>
            <div className="quick-pomodoros">
              <button onClick={() => startPomodoro(30)} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>30m</button>
              <button onClick={() => startPomodoro(45)} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>45m</button>
              <button onClick={() => startPomodoro(60)} style={{ padding: '8px 16px', margin: '0 5px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>60m</button>
            </div>
            {isMuted && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#ef4444' }}>
                🔇 Sound is muted - timer completion music will not play
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-box date-section">
          <div className="date-controls">
            <div className="nav-buttons">
              <button type="button" onClick={() => changeDateBy(-1)}>← Yesterday</button>
              <button type="button" onClick={() => changeDateBy(1)}>Tomorrow →</button>
            </div>
            <input type="date" value={entry.date.split('/').reverse().join('-')} onChange={handleDateChange} className="date-picker" />
            <button type="button" onClick={copyToTomorrow} className="copy-tomorrow-button">📋 Copy to Tomorrow</button>
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
                      <InfoButton element={key} />
                      <span className="energy-value">{value ?? ''}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={value ?? 50} 
                      onChange={e => handleEnergy(key, +e.target.value)} 
                      className="energy-slider"
                      style={{ 
                        background: getEnergyGradient(key, value),
                        transition: 'background 0.1s ease'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="section-box metrics-section">
              <h3 className="section-subtitle">Performance Metrics</h3>
              <div className="metrics-grid">
                {['efficiency', 'productivity', 'happiness'].map(metric => (
                  <div key={metric} className="metric-card">
                    <label className="metric-label">{metric.charAt(0).toUpperCase() + metric.slice(1)}<span className="metric-value" style={{ color: getMetricColor(entry[metric]) }}>{entry[metric] ?? ''}%</span></label>
                    <input type="range" min="0" max="100" value={entry[metric] ?? 50} onChange={e => handleChange(metric, +e.target.value)} className="metric-slider" style={{ '--track-color': getMetricColor(entry[metric]) }} />
                    <div className="slider-labels"><span>0</span><span>50</span><span>100</span></div>
                  </div>
                ))}
                <div className="metric-card pomodoros-card">
                  <label className="input-label">Pomodoros Completed</label>
                  <input type="number" min="0" step="0.01" value={entry.pomodoros} onChange={e => handleChange('pomodoros', parseFloat(e.target.value))} className="pomodoros-input" />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>(60min = 1 pomodoro)</div>
                </div>
              </div>
            </div>

            <div className="section-box todos-section">
              <h3 className="section-subtitle">Daily Tasks</h3>
              <div className="todos-grid">
                {entry.todos.map((todo, index) => (
                  <div key={todo.id} className={`todo-card ${todo.completed ? 'completed' : ''}`} style={{ backgroundColor: todo.color || 'transparent', transition: 'background-color 0.2s ease' }}>
                    <input type="checkbox" checked={todo.completed || false} onChange={(e) => handleTodoChange(todo.id, 'completed', e.target.checked)} className="todo-checkbox" />
                    <div className="todo-content">
                      <RichTextEditor value={todo.text || ''} onChange={(value) => handleTodoChange(todo.id, 'text', value)} onColorDetect={(colors) => colors.length > 0 && handleTodoChange(todo.id, 'color', colors[0])} placeholder="Enter a task... (use #red, #green, #blue, etc.)" className="todo-input" autoFocus={todo.id === newTodoId} />
                      <div className="todo-time-container">
                        <div className="time-input-group">
                          <div className="time-input-wrapper">
                            <input type="time" value={todo.timeStart || ''} onChange={(e) => handleTodoChange(todo.id, 'timeStart', e.target.value)} className="todo-time-input" />
                          </div>
                          <div className="time-separator">-</div>
                          <div className="time-input-wrapper">
                            <input type="time" value={todo.timeEnd || ''} onChange={(e) => handleTodoChange(todo.id, 'timeEnd', e.target.value)} className="todo-time-input" />
                          </div>
                          {todo.timeStart && todo.timeEnd && (
                            <div className="duration-display">
                              <span className="duration-badge">{calculateDuration(todo.timeStart, todo.timeEnd)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="todo-controls">
                      <ColorPicker selectedColor={todo.color} onSelect={(color) => handleTodoChange(todo.id, 'color', color)} className="todo-color-picker" />
                      <div className="todo-priority-buttons">
                        <button onClick={() => moveTodo(todo.id, 'up')} disabled={index === 0}>↑</button>
                        <button onClick={() => moveTodo(todo.id, 'down')} disabled={index === entry.todos.length - 1}>↓</button>
                      </div>
                      <button className="delete-todo" onClick={() => deleteTodo(todo.id)}>×</button>
                    </div>
                  </div>
                ))}
                <button className="add-todo-button" onClick={addNewTodo}>+ Add Task</button>
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
                    <AutoResizeTextarea value={entry.victory} onChange={(value) => handleChange('victory', value)} placeholder="What went well today? What didn't?" className="insight-textarea" />
                  </div>
                  <div className="insight-card loss-card">
                    <label className="input-label">💤 Dreams & What I feel</label>
                    <AutoResizeTextarea value={entry.loss} onChange={(value) => handleChange('loss', value)} placeholder="Insight into subconscious" className="insight-textarea" />
                  </div>
                  <div className="insight-card">
                    <label className="input-label">🤔 Insights & Learnings</label>
                    <AutoResizeTextarea value={entry.insight} onChange={(value) => handleChange('insight', value)} placeholder="What did u find out today?" className="insight-textarea" />
                  </div>
                </div>
              </div>

              <div className="section-box habits-section">
                <h3 className="section-subtitle">Habits Tracker</h3>
                <div className="habits-list">
                  {(entry.habits || []).map((habit) => (
                    <div key={habit.id} className="habit-item">
                      <input type="checkbox" checked={habit.completedByDate?.[entry.date] || false} onChange={e => {
                        const newHabits = [...entry.habits];
                        const habitIndex = newHabits.findIndex(h => h.id === habit.id);
                        newHabits[habitIndex].completedByDate = { ...newHabits[habitIndex].completedByDate, [entry.date]: e.target.checked };
                        setEntry(prev => ({ ...prev, habits: newHabits }));
                      }} />
                      <AutoResizeTextarea value={habit.text} onChange={(value) => {
                        const newHabits = [...entry.habits];
                        const habitIndex = newHabits.findIndex(h => h.id === habit.id);
                        newHabits[habitIndex].text = value;
                        setEntry(prev => ({ ...prev, habits: newHabits }));
                      }} placeholder="Enter habit..." className="habit-input" />
                      <button className="delete-habit" onClick={() => deleteHabit(habit.id)}>×</button>
                    </div>
                  ))}
                  <button className="add-habit-button" onClick={() => {
                    setEntry(prev => ({ ...prev, habits: [...prev.habits, { id: Date.now(), text: '', completedByDate: { [entry.date]: false } }] }));
                  }}>+ Add Habit</button>
                </div>
              </div>

              <div className="section-box mit-section">
                <h3 className="section-subtitle">Most Important Task</h3>
                <AutoResizeTextarea value={entry.mostImportantTask || ''} onChange={(value) => handleChange('mostImportantTask', value)} placeholder="What's the single, most important task you will dedicate at least 4-6 hours to?" className="mit-input" />
              </div>
            </div>
          </div>

          <MeditationSection />
        </div>
      </div>
    </div>
  );
}