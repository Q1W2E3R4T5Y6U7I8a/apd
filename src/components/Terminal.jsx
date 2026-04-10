import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Terminal.scss';

const Terminal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [commandOutput, setCommandOutput] = useState([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistoryList, setCommandHistoryList] = useState([]);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const audioContextRef = useRef(null);

  // ========== SOUND EFFECTS (Request #5) ==========
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
    audioContextRef.current.resume().catch(() => {});
  };

  const playTypingSound = (char) => {
    if (!audioContextRef.current) return;
    if (!char || char === ' ') return;

    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-8 * i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200 + ((char.charCodeAt(0) % 40) * 20);
    filter.Q.value = 0.8;
    noise.connect(filter);
    
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
    noise.stop(ctx.currentTime + 0.03);
  };

  const playSuccessSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const playErrorSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  };

  // ========== HELPER FUNCTIONS ==========
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    if (typeof num === 'number') return num.toFixed(2);
    return num;
  };

  // ========== COMMAND: STATS (Request #1 - much more shit) ==========
  const getAdvancedStats = async () => {
    try {
      const { loadData } = await import('../services/dataService');
      const daily = loadData();
      const dreams = JSON.parse(localStorage.getItem('dreams') || '{"past":[],"present":[],"future":[]}');
      const calendar = JSON.parse(localStorage.getItem('calendar-goals') || '{}');
      
      // Date range
      const dates = daily.map(e => e.date);
      const uniqueDates = [...new Set(dates)];
      const firstDate = uniqueDates.sort()[0];
      const lastDate = uniqueDates.sort().reverse()[0];
      
      // Calculate expected days (assuming continuous from first to last)
      let expectedDays = 0;
      if (firstDate) {
        const [d1, m1, y1] = firstDate.split('/');
        const [d2, m2, y2] = lastDate.split('/');
        const start = new Date(`${y1}-${m1}-${d1}`);
        const end = new Date(`${y2}-${m2}-${d2}`);
        expectedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const skippedDays = expectedDays - uniqueDates.length;
      const completionPercentage = expectedDays > 0 ? ((uniqueDates.length / expectedDays) * 100).toFixed(1) : 0;
      
      // Todo statistics
      let totalTodos = 0;
      let completedTodos = 0;
      let totalTodoDays = 0;
      
      daily.forEach(entry => {
        if (entry.todos && entry.todos.length > 0) {
          totalTodoDays++;
          totalTodos += entry.todos.length;
          completedTodos += entry.todos.filter(t => t.completed).length;
        }
      });
      
      const avgTodosPerDay = totalTodoDays > 0 ? (totalTodos / totalTodoDays).toFixed(1) : 0;
      const todoCompletionRate = totalTodos > 0 ? ((completedTodos / totalTodos) * 100).toFixed(1) : 0;
      
      // Habit statistics
      let totalHabits = 0;
      let completedHabits = 0;
      let habitDays = 0;
      const habitMap = new Map();
      
      daily.forEach(entry => {
        if (entry.habits && entry.habits.length > 0) {
          habitDays++;
          entry.habits.forEach(habit => {
            totalHabits++;
            const isCompleted = habit.completedByDate?.[entry.date] || false;
            if (isCompleted) completedHabits++;
            
            const habitName = habit.text?.trim();
            if (habitName) {
              if (!habitMap.has(habitName)) {
                habitMap.set(habitName, { total: 0, completed: 0 });
              }
              const h = habitMap.get(habitName);
              h.total++;
              if (isCompleted) h.completed++;
            }
          });
        }
      });
      
      const habitCompletionRate = totalHabits > 0 ? ((completedHabits / totalHabits) * 100).toFixed(1) : 0;
      
      // Best habits
      const bestHabits = Array.from(habitMap.entries())
        .map(([name, data]) => ({ name, rate: (data.completed / data.total) * 100 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3);
      
      // Performance metrics completeness
      let efficiencyCount = 0, productivityCount = 0, happinessCount = 0, mitCount = 0;
      daily.forEach(entry => {
        if (entry.efficiency !== null && entry.efficiency !== undefined) efficiencyCount++;
        if (entry.productivity !== null && entry.productivity !== undefined) productivityCount++;
        if (entry.happiness !== null && entry.happiness !== undefined) happinessCount++;
        if (entry.mostImportantTask?.trim()) mitCount++;
      });
      
      const completeness = {
        efficiency: daily.length > 0 ? ((efficiencyCount / daily.length) * 100).toFixed(1) : 0,
        productivity: daily.length > 0 ? ((productivityCount / daily.length) * 100).toFixed(1) : 0,
        happiness: daily.length > 0 ? ((happinessCount / daily.length) * 100).toFixed(1) : 0,
        mit: daily.length > 0 ? ((mitCount / daily.length) * 100).toFixed(1) : 0,
      };
      
      // Streak calculation
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      const sortedDates = uniqueDates.sort((a,b) => {
        const [d1,m1,y1] = a.split('/');
        const [d2,m2,y2] = b.split('/');
        return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
      });
      
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const [d1,m1,y1] = sortedDates[i-1].split('/');
          const [d2,m2,y2] = sortedDates[i].split('/');
          const prev = new Date(`${y1}-${m1}-${d1}`);
          const curr = new Date(`${y2}-${m2}-${d2}`);
          const diff = (curr - prev) / (1000 * 60 * 60 * 24);
          
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak);
        if (i === sortedDates.length - 1) currentStreak = tempStreak;
      }
      
      // Dreams stats
      const totalDreams = dreams.past.length + dreams.present.length + dreams.future.length;
      const dreamsByColumn = {
        past: dreams.past.length,
        present: dreams.present.length,
        future: dreams.future.length
      };
      
      return {
        totalEntries: daily.length,
        uniqueDates: uniqueDates.length,
        expectedDays,
        skippedDays,
        completionPercentage,
        firstDate: firstDate || 'N/A',
        lastDate: lastDate || 'N/A',
        currentStreak,
        bestStreak,
        avgTodosPerDay,
        todoCompletionRate,
        totalTodos,
        completedTodos,
        habitCompletionRate,
        totalHabits,
        completedHabits,
        bestHabits,
        completeness,
        totalDreams,
        dreamsByColumn,
        totalPomodoros: daily.reduce((sum, e) => sum + (e.pomodoros || 0), 0),
        avgHappiness: daily.length > 0 ? (daily.reduce((sum, e) => sum + (e.happiness || 0), 0) / daily.length).toFixed(1) : 0,
        avgEfficiency: daily.length > 0 ? (daily.reduce((sum, e) => sum + (e.efficiency || 0), 0) / daily.length).toFixed(1) : 0,
        avgProductivity: daily.length > 0 ? (daily.reduce((sum, e) => sum + (e.productivity || 0), 0) / daily.length).toFixed(1) : 0,
      };
    } catch (error) {
      return { error: error.message };
    }
  };

  // ========== COMMAND: TRENDS with custom range (Request #4) ==========
  const getTrends = async (args) => {
    try {
      const { loadData } = await import('../services/dataService');
      const daily = loadData();
      
      if (daily.length < 2) return 'Need at least 2 entries to calculate trends.';
      
      // Parse arguments: trends [days] or trends [recent] [previous]
      let recentDays = parseInt(args[0]) || 7;
      let previousDays = parseInt(args[1]) || recentDays;
      
      recentDays = Math.min(recentDays, daily.length);
      previousDays = Math.min(previousDays, daily.length - recentDays);
      
      if (previousDays <= 0) return `Not enough data. Need ${recentDays + 1} entries.`;
      
      const recent = daily.slice(-recentDays);
      const previous = daily.slice(-(recentDays + previousDays), -recentDays);
      
      const avg = (arr, key) => {
        const filtered = arr.filter(e => e[key] !== null && e[key] !== undefined);
        if (filtered.length === 0) return 0;
        return filtered.reduce((sum, e) => sum + e[key], 0) / filtered.length;
      };
      
      const metrics = ['efficiency', 'productivity', 'happiness'];
      let output = `\n╔════════════════════════════════════════════════════════════════╗\n`;
      output += `║              📈 TRENDS ANALYSIS (Last ${recentDays} vs Previous ${previousDays})              ║\n`;
      output += `╠════════════════════════════════════════════════════════════════╣\n`;
      
      for (const metric of metrics) {
        const recentAvg = avg(recent, metric);
        const previousAvg = avg(previous, metric);
        const change = previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100;
        const icon = change > 10 ? '🚀' : change > 5 ? '📈' : change > 0 ? '↗️' : change < -10 ? '📉💀' : change < 0 ? '↘️' : '➡️';
        const trend = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
        
        output += `║  ${metric.toUpperCase().padEnd(12)} ${recentAvg.toFixed(1)}%  vs  ${previousAvg.toFixed(1)}%     ${icon} ${trend.padStart(8)}  ║\n`;
      }
      
      // Pomodoro trend
      const recentPomo = recent.reduce((sum, e) => sum + (e.pomodoros || 0), 0) / recentDays;
      const previousPomo = previous.reduce((sum, e) => sum + (e.pomodoros || 0), 0) / previousDays;
      const pomoChange = previousPomo === 0 ? 0 : ((recentPomo - previousPomo) / previousPomo) * 100;
      const pomoIcon = pomoChange > 20 ? '⚡' : pomoChange > 0 ? '📈' : pomoChange < 0 ? '📉' : '➡️';
      
      output += `║  ${'POMODOROS'.padEnd(12)} ${recentPomo.toFixed(1)}   vs   ${previousPomo.toFixed(1)}     ${pomoIcon} ${pomoChange > 0 ? '+' : ''}${pomoChange.toFixed(1)}%  ║\n`;
      output += `╚════════════════════════════════════════════════════════════════╝\n`;
      
      return output;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  // ========== COMMAND: WORDCLOUD for all sections (Request #3) ==========
  const getWordCloud = async (args) => {
    const section = args[0]?.toLowerCase();
    
    const validSections = ['victories', 'insights', 'dreams', 'goals', 'calendar', 'tasks', 'habits', 'mit', 'losses'];
    
    if (!section || !validSections.includes(section)) {
      return `Usage: wordcloud [${validSections.join('|')}]\nExample: wordcloud victories`;
    }
    
    try {
      const { loadData } = await import('../services/dataService');
      const daily = loadData();
      
      const stopWords = new Set([
        'the', 'and', 'to', 'of', 'a', 'i', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with',
        'it', 'was', 'are', 'as', 'at', 'be', 'from', 'have', 'or', 'an', 'my', 'me', 'so', 'but',
        'not', 'all', 'can', 'will', 'just', 'like', 'very', 'really', 'well', 'got', 'get', 'go',
        'day', 'today', 'feel', 'feeling', 'felt', 'still', 'even', 'then', 'there', 'their',
        'what', 'when', 'where', 'who', 'why', 'how', 'been', 'being', 'than', 'then'
      ]);
      
      let text = '';
      
      switch(section) {
        case 'victories':
          text = daily.filter(e => e.victory?.trim()).map(e => e.victory.toLowerCase()).join(' ');
          break;
        case 'insights':
          text = daily.filter(e => e.insight?.trim()).map(e => e.insight.toLowerCase()).join(' ');
          break;
        case 'losses':
          text = daily.filter(e => e.loss?.trim()).map(e => e.loss.toLowerCase()).join(' ');
          break;
        case 'mit':
          text = daily.filter(e => e.mostImportantTask?.trim()).map(e => e.mostImportantTask.toLowerCase()).join(' ');
          break;
        case 'dreams': {
          const dreams = JSON.parse(localStorage.getItem('dreams') || '{"past":[],"present":[],"future":[]}');
          text = [...dreams.past, ...dreams.present, ...dreams.future].map(d => d.content?.toLowerCase() || '').join(' ');
          break;
        }
        case 'goals':
        case 'calendar': {
          const calendar = JSON.parse(localStorage.getItem('calendar-goals') || '{}');
          text = Object.values(calendar).flatMap(day => day.tasks?.map(t => t.text?.toLowerCase()) || []).join(' ');
          break;
        }
        case 'tasks': {
          text = daily.flatMap(e => e.todos?.map(t => t.text?.toLowerCase()) || []).join(' ');
          break;
        }
        case 'habits': {
          text = daily.flatMap(e => e.habits?.map(h => h.text?.toLowerCase()) || []).join(' ');
          break;
        }
      }
      
      if (!text) return `No ${section} found to analyze.`;
      
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      const wordCount = new Map();
      words.forEach(word => { if (!stopWords.has(word)) wordCount.set(word, (wordCount.get(word) || 0) + 1); });
      
      const sorted = Array.from(wordCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
      if (sorted.length === 0) return `No significant words found in ${section}.`;
      
      const maxCount = sorted[0][1];
      let output = `\n╔════════════════════════════════════════════════════════════════╗\n`;
      output += `║           📊 WORD CLOUD - ${section.toUpperCase()}                         ║\n`;
      output += `╠════════════════════════════════════════════════════════════════╣\n`;
      
      sorted.forEach(([word, count]) => {
        const intensity = Math.floor((count / maxCount) * 20);
        const bar = '█'.repeat(intensity) + '░'.repeat(20 - intensity);
        const sizeIcon = count === maxCount ? '🔴' : count > maxCount/2 ? '🟡' : '🟢';
        output += `║  ${sizeIcon} ${word.padEnd(18)} ${bar} ${count.toString().padStart(3)}                                   ║\n`;
      });
      
      output += `╚════════════════════════════════════════════════════════════════╝\n`;
      return output;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  // ========== ALL COMMANDS ==========
  const commands = {
    help: () => {
      playSuccessSound();
      return `
╔══════════════════════════════════════════════════════════════════════════╗
║                         APD TERMINAL v1.0                                ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  📖 COMMANDS:                                                            ║
║                                                                          ║
║    help                    - Show this help                              ║
║    clear                   - Clear terminal                              ║
║    hide                    - Minimize terminal                           ║
║                                                                          ║
║    stats                   - Full statistics (completeness, todos, etc)  ║
║    trends [r] [p]          - Trends (r=recent days, p=previous days)     ║
║    quote                   - Random motivational quote                   ║
║    habits                  - List all habits with rates                  ║
║                                                                          ║
║    wordcloud [section]     - Word cloud for:                             ║
║                              victories, insights, dreams, goals,         ║
║                              calendar, tasks, habits, mit, losses        ║
║                                                                          ║
║    export [section]        - Export: dreams, insights, victories, mit    ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  💡 EXAMPLES:                                                            ║
║    trends 7 7              - Compare last 7 vs previous 7 days           ║
║    trends 3 3              - Compare last 3 vs previous 3 days           ║
║    trends 30 30            - Compare last 30 vs previous 30 days         ║
║    wordcloud victories     - Show most used words in victories           ║
║    wordcloud dreams        - Show most used words in dreams              ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
`;
    },
    
    clear: () => ({ clear: true }),
    hide: () => ({ hide: true }),
    
    quote: () => {
      playSuccessSound();
      const quotes = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
        { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
        { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" }
      ];
      const random = quotes[Math.floor(Math.random() * quotes.length)];
      return `\n💬 "${random.text}"\n   — ${random.author}\n`;
    },
    
    stats: async () => {
      playSuccessSound();
      const s = await getAdvancedStats();
      if (s.error) return `Error: ${s.error}`;
      
      return `
╔══════════════════════════════════════════════════════════════════════════╗
║                         📊 ADVANCED STATISTICS                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  📅 ENTRY COMPLETENESS:                                                  ║
║     Total entries:       ${String(s.totalEntries).padStart(6)}                                           ║
║     Unique dates:        ${String(s.uniqueDates).padStart(6)}                                           ║
║     Expected days:       ${String(s.expectedDays).padStart(6)}                                           ║
║     Skipped days:        ${String(s.skippedDays).padStart(6)} (${(100 - s.completionPercentage).toFixed(1)}% missing)              ║
║     Completion rate:     ${String(s.completionPercentage).padStart(6)}%                                          ║
║                                                                          ║
║  🔥 STREAKS:                                                            ║
║     Current streak:      ${String(s.currentStreak).padStart(6)} days                                         ║
║     Best streak:         ${String(s.bestStreak).padStart(6)} days                                         ║
║                                                                          ║
║  ✅ TASKS COMPLETION:                                                    ║
║     Total todos:         ${String(s.totalTodos).padStart(6)}                                           ║
║     Completed:           ${String(s.completedTodos).padStart(6)} (${s.todoCompletionRate}%)                               ║
║     Avg todos/day:       ${String(s.avgTodosPerDay).padStart(6)}                                           ║
║                                                                          ║
║  🎯 HABITS COMPLETION:                                                   ║
║     Total habit entries: ${String(s.totalHabits).padStart(6)}                                           ║
║     Completed:           ${String(s.completedHabits).padStart(6)} (${s.habitCompletionRate}%)                               ║
║     Best habits:                                                        ║
${s.bestHabits.map((h, i) => `║        ${i+1}. ${h.name.padEnd(25)} ${h.rate.toFixed(0)}%                                        ║`).join('\n')}
║                                                                          ║
║  📝 METRICS COMPLETENESS:                                                ║
║     Efficiency:          ${String(s.completeness.efficiency).padStart(6)}% filled                                    ║
║     Productivity:        ${String(s.completeness.productivity).padStart(6)}% filled                                    ║
║     Happiness:           ${String(s.completeness.happiness).padStart(6)}% filled                                    ║
║     Most Important Task: ${String(s.completeness.mit).padStart(6)}% filled                                    ║
║                                                                          ║
║  📈 AVERAGES:                                                            ║
║     Avg Happiness:       ${String(s.avgHappiness).padStart(6)}%                                          ║
║     Avg Efficiency:      ${String(s.avgEfficiency).padStart(6)}%                                          ║
║     Avg Productivity:    ${String(s.avgProductivity).padStart(6)}%                                          ║
║     Total Pomodoros:     ${String(s.totalPomodoros).padStart(6)}                                           ║
║                                                                          ║
║  ✨ DREAMS:                                                              ║
║     Total dreams:        ${String(s.totalDreams).padStart(6)}                                           ║
║     Past:                ${String(s.dreamsByColumn.past).padStart(6)}                                           ║
║     Present:             ${String(s.dreamsByColumn.present).padStart(6)}                                           ║
║     Future:              ${String(s.dreamsByColumn.future).padStart(6)}                                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
`;
    },
    
    trends: async (args) => {
      playSuccessSound();
      return await getTrends(args);
    },
    
    habits: async () => {
      playSuccessSound();
      try {
        const { loadData } = await import('../services/dataService');
        const daily = loadData();
        
        const habitMap = new Map();
        daily.forEach(entry => {
          if (entry.habits) {
            entry.habits.forEach(habit => {
              const name = habit.text?.trim();
              if (name) {
                if (!habitMap.has(name)) habitMap.set(name, { total: 0, completed: 0 });
                const h = habitMap.get(name);
                h.total++;
                if (habit.completedByDate?.[entry.date]) h.completed++;
              }
            });
          }
        });
        
        if (habitMap.size === 0) return 'No habits found.';
        
        const sorted = Array.from(habitMap.entries()).sort((a, b) => (b[1].completed/b[1].total) - (a[1].completed/a[1].total));
        let output = `\n╔════════════════════════════════════════════════════════════════╗\n`;
        output += `║                    ✅ HABIT COMPLETION RATES                    ║\n`;
        output += `╠════════════════════════════════════════════════════════════════╣\n`;
        
        sorted.forEach(([name, data]) => {
          const rate = (data.completed / data.total) * 100;
          const barLength = Math.floor(rate / 5);
          const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
          output += `║  ${name.padEnd(20)} ${bar} ${rate.toFixed(0)}% (${data.completed}/${data.total})    ║\n`;
        });
        
        output += `╚════════════════════════════════════════════════════════════════╝\n`;
        return output;
      } catch (error) {
        return `Error: ${error.message}`;
      }
    },
    
    wordcloud: async (args) => {
      playSuccessSound();
      return await getWordCloud(args);
    },
    
    export: async (args) => {
      const section = args[0]?.toLowerCase();
      if (!section || !['dreams', 'insights', 'victories', 'mit'].includes(section)) {
        return 'Usage: export [dreams|insights|victories|mit]';
      }
      
      try {
        const { loadData } = await import('../services/dataService');
        const daily = loadData();
        let data = [], filename = '';
        
        switch(section) {
          case 'dreams':
            data = JSON.parse(localStorage.getItem('dreams') || '{"past":[],"present":[],"future":[]}');
            filename = `dreams_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'insights':
            data = daily.filter(e => e.insight?.trim()).map(e => ({ date: e.date, insight: e.insight }));
            filename = `insights_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'victories':
            data = daily.filter(e => e.victory?.trim()).map(e => ({ date: e.date, victory: e.victory }));
            filename = `victories_${new Date().toISOString().split('T')[0]}.json`;
            break;
          case 'mit':
            data = daily.filter(e => e.mostImportantTask?.trim()).map(e => ({ date: e.date, mit: e.mostImportantTask }));
            filename = `mit_${new Date().toISOString().split('T')[0]}.json`;
            break;
        }
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        playSuccessSound();
        return `✅ Exported ${data.length} items to ${filename}`;
      } catch (error) {
        playErrorSound();
        return `Error: ${error.message}`;
      }
    }
  };

  // ========== COMMAND EXECUTION ==========
  const executeCommand = useCallback(async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return null;
    
    setCommandHistoryList(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    
    const parts = trimmed.split(' ');
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    const command = commands[commandName];
    
    if (!command) {
      playErrorSound();
      return `Unknown command: "${commandName}". Type "help" for available commands.`;
    }
    
    try {
      const result = await command(args);
      if (result?.clear) return { clear: true };
      if (result?.hide) return { hide: true };
      return result;
    } catch (error) {
      playErrorSound();
      return `Error: ${error.message}`;
    }
  }, []);

  // ========== UI HANDLERS ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCommand.trim()) return;
    
    // Play typing sound for each character
    for (let char of currentCommand) {
      playTypingSound(char);
    }
    
    const result = await executeCommand(currentCommand);
    
    setCommandHistory([...commandHistory, currentCommand]);
    
    if (result?.clear) {
      setCommandOutput([]);
      setCommandHistory([]);
    } else if (result?.hide) {
      setIsVisible(false);
    } else if (result) {
      setCommandOutput([...commandOutput, `> ${currentCommand}`, result]);
    }
    
    setCurrentCommand('');
    
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistoryList.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistoryList[commandHistoryList.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistoryList[commandHistoryList.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  // ========== KEYBOARD SHORTCUTS ==========
  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      if ((e.ctrlKey && e.key === 't') || e.key === '`') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        initAudio();
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isVisible]);

  // Unlock audio on first click
  useEffect(() => {
    const handleClick = () => {
      initAudio();
      document.body.removeEventListener('click', handleClick);
    };
    document.body.addEventListener('click', handleClick);
    return () => document.body.removeEventListener('click', handleClick);
  }, []);

  // ========== RENDER ==========
  if (!isVisible) {
    return (
      <button type="button" className="terminal-toggle-btn" onClick={() => setIsVisible(true)} title="Open terminal">
        +
      </button>
    );
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-blink">●</span>
        <span className="terminal-title">APD TERMINAL v1.0</span>
        <span className="terminal-close" onClick={() => setIsVisible(false)}>[-]</span>
      </div>
      
      <div className="terminal-body" ref={terminalRef}>
        {commandOutput.map((line, index) => (
          <div key={index} className={`terminal-line ${line.startsWith('>') ? 'command' : 'output'}`}>
            {line}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="terminal-prompt">{'➜'}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            spellCheck={false}
            autoFocus
          />
          <span className="terminal-cursor">█</span>
        </form>
      </div>
    </div>
  );
};

export default Terminal;