import React, { useEffect, useState } from 'react';
import { 
  loadData, 
  deleteEntry, 
  exportToJSON, 
  importFromJSON, 
  saveData, 
  downloadFromOneDrive 
} from '../services/dataService';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Statistics.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbaImathelvIkO4I1bgX9YDrQb9nBN4TaJA5Z983yDpmUB3Dd0DvH1_iSHwy2fiugeaA/exec';
const ONEDRIVE_URL = 'https://1drv.ms/u/c/a12b363c8e324d56/ETFHLX4ggw9HhvgxBk66zBQBjMeeFnIL1dCZUhyklhGxWw?e=TkNVo2';

export default function Statistics() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [averages, setAverages] = useState({});
  const [syncStatus, setSyncStatus] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistoryByDateRange();
  }, [history, dateRange]);

  const loadHistory = () => {
    const data = loadData();
    setHistory(data);
  };

  const filterHistoryByDateRange = () => {
    if (!history.length) return;

    const today = new Date();
    let startDate = null;

    switch(dateRange) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case '14days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14);
        break;
      case '30days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case 'all':
      default:
        startDate = null;
        break;
    }

    let filtered = [...history];
    
    if (startDate) {
      filtered = history.filter(entry => {
        const [day, month, year] = entry.date.split('/');
        const entryDate = new Date(`${year}-${month}-${day}`);
        return entryDate >= startDate;
      });
    }

    setFilteredHistory(filtered);
    calculateAverages(filtered);
  };

  const calculateAverages = (data) => {
    if (!data || data.length === 0) {
      setAverages({});
      return;
    }
    
    const metrics = {
      efficiency: { sum: 0, count: 0 },
      productivity: { sum: 0, count: 0 },
      happiness: { sum: 0, count: 0 },
      air: { sum: 0, count: 0 },
      fire: { sum: 0, count: 0 },
      water: { sum: 0, count: 0 },
      earth: { sum: 0, count: 0 },
      pomodoros: { sum: 0, count: 0 }
    };
    
    data.forEach(entry => {
      const hasPerformanceData = 
        (entry.efficiency && entry.efficiency > 0) || 
        (entry.productivity && entry.productivity > 0) || 
        (entry.happiness && entry.happiness > 0) ||
        (entry.pomodoros && entry.pomodoros > 0);
      
      if (hasPerformanceData) {
        if (entry.efficiency && entry.efficiency > 0) {
          metrics.efficiency.sum += entry.efficiency;
          metrics.efficiency.count++;
        }
        if (entry.productivity && entry.productivity > 0) {
          metrics.productivity.sum += entry.productivity;
          metrics.productivity.count++;
        }
        if (entry.happiness && entry.happiness > 0) {
          metrics.happiness.sum += entry.happiness;
          metrics.happiness.count++;
        }
        if (entry.pomodoros && entry.pomodoros > 0) {
          metrics.pomodoros.sum += entry.pomodoros;
          metrics.pomodoros.count++;
        }
        if (entry.energy) {
          if (entry.energy.air && entry.energy.air > 0) {
            metrics.air.sum += entry.energy.air;
            metrics.air.count++;
          }
          if (entry.energy.fire && entry.energy.fire > 0) {
            metrics.fire.sum += entry.energy.fire;
            metrics.fire.count++;
          }
          if (entry.energy.water && entry.energy.water > 0) {
            metrics.water.sum += entry.energy.water;
            metrics.water.count++;
          }
          if (entry.energy.earth && entry.energy.earth > 0) {
            metrics.earth.sum += entry.energy.earth;
            metrics.earth.count++;
          }
        }
      }
    });
    
    const calculatedAverages = {};
    Object.keys(metrics).forEach(key => {
      if (metrics[key].count > 0) {
        calculatedAverages[key] = Math.round((metrics[key].sum / metrics[key].count) * 100) / 100;
      } else {
        calculatedAverages[key] = null;
      }
    });
    
    setAverages(calculatedAverages);
  };

  const exportToGoogleSheets = async () => {
    try {
      setSyncStatus('Exportation vers Google Sheets...');
      for (const entry of history) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'dailyEntry',
            date: entry.date,
            efficiency: entry.efficiency || 0,
            productivity: entry.productivity || 0,
            happiness: entry.happiness || 0,
            pomodoros: entry.pomodoros || 0,
            energy: entry.energy || {},
            victory: entry.victory || '',
            loss: entry.loss || '',
            insight: entry.insight || '',
            mostImportantTask: entry.mostImportantTask || '',
            habits: entry.habits || [],
            todos: entry.todos || []
          })
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setSyncStatus('✅ Données exportées vers Google Sheets!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setSyncStatus('❌ Erreur lors de l\'export');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const importFromGoogleSheets = async () => {
    try {
      setSyncStatus('Importation depuis Google Sheets...');
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) throw new Error('Failed to fetch from Google Sheets');
      const data = await response.json();
      if (Array.isArray(data)) {
        const existingData = loadData();
        const mergedData = mergeData(existingData, data);
        saveData(mergedData);
        setHistory(mergedData);
        setSyncStatus('✅ Données importées depuis Google Sheets!');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        throw new Error('Invalid data format from Google Sheets');
      }
    } catch (error) {
      console.error('Import error:', error);
      setSyncStatus('❌ Erreur lors de l\'import');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const mergeData = (existing, newData) => {
    const merged = [...existing];
    newData.forEach(newEntry => {
      const existingIndex = merged.findIndex(entry => entry.date === newEntry.date);
      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...newEntry,
          habits: newEntry.habits || merged[existingIndex].habits,
          todos: newEntry.todos || merged[existingIndex].todos
        };
      } else {
        merged.push(newEntry);
      }
    });
    return merged;
  };

  const handleDeleteEntry = (dateToDelete) => {
    const updatedHistory = deleteEntry(dateToDelete);
    if (updatedHistory) {
      setHistory(updatedHistory);
      setConfirmDelete(null);
    }
  };

  const handleExport = () => {
    try {
      setSyncStatus('Exportation vers JSON et OneDrive...');
      exportToJSON();
      setSyncStatus('✅ Données exportées! Téléchargez le fichier et uploader vers OneDrive.');
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setSyncStatus('❌ Erreur lors de l\'export');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSyncStatus('Importation depuis le fichier local...');
      importFromJSON(file)
        .then(data => {
          setHistory(data);
          setSyncStatus('✅ Données importées avec succès!');
          setTimeout(() => setSyncStatus(''), 3000);
        })
        .catch(error => {
          console.error('Import error:', error);
          setSyncStatus('❌ Erreur lors de l\'import');
          setTimeout(() => setSyncStatus(''), 3000);
        });
    }
  };

  const handleOneDriveImport = async () => {
    try {
      setSyncStatus('Importation depuis OneDrive...');
      setShowImportModal(false);
      const data = await downloadFromOneDrive();
      const existingData = loadData();
      const mergedData = mergeData(existingData, data);
      saveData(mergedData);
      setHistory(mergedData);
      setSyncStatus('✅ Données importées depuis OneDrive!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('OneDrive import error:', error);
      setSyncStatus(`❌ ${error.message}`);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  const openImportModal = () => {
    setShowImportModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateRangeLabel = () => {
    switch(dateRange) {
      case 'week': return 'Last 7 Days';
      case '14days': return 'Last 14 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'all': return 'All Time';
      default: return 'All Time';
    }
  };

  if (history.length === 0) {
    return (
      <div className="statistics-page">
        <div className="card empty-state">
          <h2 className="section-title">Statistics</h2>
          <p className="empty-message">No data available yet. Start by adding daily entries.</p>
        </div>
      </div>
    );
  }

  const dates = filteredHistory.map(entry => formatDate(entry.date));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { font: { size: 18, weight: 'bold', color: '#000' } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const formattedDate = formatDate(filteredHistory[context.dataIndex].date);
            return `${context.dataset.label}: ${context.raw}% (${formattedDate})`;
          }
        },
        bodyFont: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#000', font: { size: 14, weight: 'bold' } },
        grid: { display: false }
      },
      y: { 
        min: 0, max: 100,
        ticks: { color: '#000', font: { size: 14, weight: 'bold' } }
      }
    }
  };

  const pomodoroChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        min: 0,
        max: Math.max(30, ...filteredHistory.map(entry => entry.pomodoros || 0)),
        title: { display: true, text: 'Minutes', color: '#000', font: { size: 16, weight: 'bold' } },
        ticks: { color: '#000', font: { size: 14, weight: 'bold' }, callback: value => value }
      }
    }
  };

  return (
    <div className="statistics-page">
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Choisir la méthode d'import</h3>
            <p>Comment souhaitez-vous importer vos données ?</p>
            <div className="modal-buttons">
              <button className="modal-button manual" onClick={() => document.getElementById('import-file-input').click()}>
                📁 Import Manuel
              </button>
              <button className="modal-button onedrive" onClick={handleOneDriveImport}>
                ☁️ Import depuis OneDrive
              </button>
              <button className="modal-button cancel" onClick={() => setShowImportModal(false)}>
                Annuler
              </button>
            </div>
            <div className="onedrive-info">
              <p><strong>Lien OneDrive:</strong></p>
              <a href={ONEDRIVE_URL} target="_blank" rel="noopener noreferrer">{ONEDRIVE_URL}</a>
            </div>
          </div>
        </div>
      )}

      <div className="date-range-selector">
        <div className="range-buttons">
          <button onClick={() => setDateRange('week')} className={`range-btn ${dateRange === 'week' ? 'active' : ''}`}>7 Days</button>
          <button onClick={() => setDateRange('14days')} className={`range-btn ${dateRange === '14days' ? 'active' : ''}`}>14 Days</button>
          <button onClick={() => setDateRange('30days')} className={`range-btn ${dateRange === '30days' ? 'active' : ''}`}>30 Days</button>
          <button onClick={() => setDateRange('90days')} className={`range-btn ${dateRange === '90days' ? 'active' : ''}`}>90 Days</button>
          <button onClick={() => setDateRange('all')} className={`range-btn ${dateRange === 'all' ? 'active' : ''}`}>All Time</button>
        </div>
      </div>

      <div className="averages-section">
        <div className="averages-grid">
          <div className="average-card">
            <h3>Performance Metrics</h3>
            <div className="average-item">
              <span className="average-label">Efficiency:</span>
              <span className="average-value">{averages.efficiency !== null ? `${averages.efficiency}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Productivity:</span>
              <span className="average-value">{averages.productivity !== null ? `${averages.productivity}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Happiness:</span>
              <span className="average-value">{averages.happiness !== null ? `${averages.happiness}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Pomodoros:</span>
              <span className="average-value">{averages.pomodoros !== null ? averages.pomodoros : 'N/A'}</span>
            </div>
          </div>
          <div className="average-card">
            <h3>Energy Levels</h3>
            <div className="average-item">
              <span className="average-label">Air:</span>
              <span className="average-value">{averages.air !== null ? `${averages.air}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Fire:</span>
              <span className="average-value">{averages.fire !== null ? `${averages.fire}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Water:</span>
              <span className="average-value">{averages.water !== null ? `${averages.water}%` : 'N/A'}</span>
            </div>
            <div className="average-item">
              <span className="average-label">Earth:</span>
              <span className="average-value">{averages.earth !== null ? `${averages.earth}%` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <>
          <div className="charts-container">
            <div className="chart-wrapper">
              <div className="chart-card">
                <div className="chart-container">
                  <Line 
                    data={{
                      labels: dates,
                      datasets: [
                        { label: 'Efficiency', data: filteredHistory.map(entry => entry.efficiency), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3 },
                        { label: 'Productivity', data: filteredHistory.map(entry => entry.productivity), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3 },
                        { label: 'Happiness', data: filteredHistory.map(entry => entry.happiness), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.3 },
                      ],
                    }} 
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="chart-wrapper">
              <div className="chart-card">
                <div className="chart-container">
                  <Bar 
                    data={{
                      labels: dates,
                      datasets: [{ label: 'Pomodoros', data: filteredHistory.map(entry => entry.pomodoros), backgroundColor: '#8b5cf6', borderColor: '#7c3aed' }],
                    }} 
                    options={pomodoroChartOptions} 
                  />
                </div>
              </div>
            </div>

            <div className="chart-wrapper">
              <div className="chart-card">
                <div className="chart-container">
                  <Line 
                    data={{
                      labels: dates,
                      datasets: [
                        { label: 'Air', data: filteredHistory.map(entry => entry.energy?.air), borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.1)', tension: 0.3 },
                        { label: 'Fire', data: filteredHistory.map(entry => entry.energy?.fire), borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', tension: 0.3 },
                        { label: 'Water', data: filteredHistory.map(entry => entry.energy?.water), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3 },
                        { label: 'Earth', data: filteredHistory.map(entry => entry.energy?.earth), borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', tension: 0.3 },
                      ],
                    }} 
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="insights-container">
            <div className="insights-column">
              <div className="insight-type victories-column">
                <h3 className="insights-title">✅ Victories</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.victory).map((entry, i) => (
                    <div key={i} className="insight-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="insight-content">{entry.victory || 'No victory recorded'}</div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="insight-type dreams-column">
                <h3 className="insights-title">💤 Dreams</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.loss).map((entry, i) => (
                    <div key={i} className="insight-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="insight-content">{entry.loss || 'No loss recorded'}</div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="insight-type insights-column">
                <h3 className="insights-title">🤔 Insights</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.insight).map((entry, i) => (
                    <div key={i} className="insight-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="insight-content">{entry.insight || 'No insight recorded'}</div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="insight-type todos-column">
                <h3 className="insights-title">📝 Todos</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.todos && e.todos.length > 0).map((entry, i) => (
                    <div key={i} className="insight-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="insight-content">
                        <ul>
                          {entry.todos.map((todo, j) => (
                            <li key={j} className={todo.completed ? 'completed' : ''}>
                              {todo.text || 'Untitled Task'}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW: Habits Section */}
              <div className="insight-type habits-column">
                <h3 className="insights-title">✅ Habits Tracker</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.habits && e.habits.length > 0).map((entry, i) => (
                    <div key={i} className="insight-item habits-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="habits-grid">
                        {entry.habits.map((habit, j) => {
                          const isCompleted = habit.completedByDate?.[entry.date] || false;
                          return (
                            <div key={j} className={`habit-stat ${isCompleted ? 'completed' : 'not-completed'}`}>
                              <span className="habit-status">{isCompleted ? '✅' : '❌'}</span>
                              <span className="habit-name">{habit.text || 'Unnamed Habit'}</span>
                            </div>
                          );
                        })}
                      </div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW: Most Important Task Section */}
              <div className="insight-type mit-column">
                <h3 className="insights-title">⭐ Most Important Task</h3>
                <div className="insights-list">
                  {filteredHistory.filter(e => e.mostImportantTask && e.mostImportantTask.trim()).map((entry, i) => (
                    <div key={i} className="insight-item mit-item">
                      <div className="insight-header">
                        <div className="insight-date">{formatDate(entry.date)}</div>
                        <button className="delete-btn" onClick={() => setConfirmDelete(entry.date)}>×</button>
                      </div>
                      <div className="mit-content">
                        <p className="mit-text">{entry.mostImportantTask}</p>
                      </div>
                      {confirmDelete === entry.date && (
                        <div className="delete-confirmation">
                          <p>Delete this entry?</p>
                          <button onClick={() => handleDeleteEntry(entry.date)}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)}>No</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredHistory.filter(e => e.mostImportantTask && e.mostImportantTask.trim()).length === 0 && (
                    <div className="empty-message-small">No MIT recorded</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <p className="empty-message">No data available for the selected date range.</p>
        </div>
      )}

      <input id="import-file-input" type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
    </div>
  );
}