// App.jsx - Modified Finance handling to open in new tab
import React, { useState, useEffect } from 'react';
import DailyEntry from './components/DailyEntry';
import Calendar from './components/Calendar';
import Statistics from './components/Statistics';
import './App.scss';
import Dreams from './components/Dreams'; 
import Constitution from './components/Constitution';
import ImportExport from './components/ImportExport';

function App() {
  const [page, setPage] = useState('daily');
  const [financeLink, setFinanceLink] = useState(() => {
    const saved = localStorage.getItem('financeLink');
    return saved || '';
  });
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [tempFinanceLink, setTempFinanceLink] = useState('');

  // Check if finance link exists on first load
  useEffect(() => {
    if (!financeLink) {
      // Don't auto-open modal, wait for user to click Finance button
    }
  }, [financeLink]);

  const handleFinanceClick = () => {
    if (!financeLink) {
      // First time - ask for link
      setTempFinanceLink('');
      setShowFinanceModal(true);
    } else {
      // Has link - open in new tab
      window.open(financeLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleChangeLink = () => {
    setTempFinanceLink(financeLink);
    setShowFinanceModal(true);
  };

  const saveFinanceLink = () => {
    if (tempFinanceLink.trim()) {
      let link = tempFinanceLink.trim();
      
      // Add https:// if no protocol specified
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      
      localStorage.setItem('financeLink', link);
      setFinanceLink(link);
      setShowFinanceModal(false);
      
      // If we're saving for the first time, open the link
      if (!financeLink) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        // If changing link, ask if they want to open it
        const shouldNavigate = window.confirm('Link updated! Do you want to open it now?');
        if (shouldNavigate) {
          window.open(link, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  const clearFinanceLink = () => {
    if (window.confirm('Are you sure you want to remove your Finance link?')) {
      localStorage.removeItem('financeLink');
      setFinanceLink('');
      setShowFinanceModal(false);
      alert('Finance link removed. You will be asked to set it again next time.');
    }
  };

  return (
    <div className="app-container">
      <nav className="main-nav">
        <div className="nav-container">
          <button 
            onClick={() => setPage('daily')}
            className={`nav-button ${page === 'daily' ? 'active' : ''}`}
          >
            <span className="nav-icon">✍️</span>
            <span className="nav-text">Daily Journal</span>
          </button>
          <button 
            onClick={() => setPage('goals')}
            className={`nav-button ${page === 'goals' ? 'active' : ''}`}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Calendar</span>
          </button>
          <button 
            onClick={() => setPage('stats')}
            className={`nav-button ${page === 'stats' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Statistics</span>
          </button>
          <button 
            onClick={() => setPage('dreams')}
            className={`nav-button ${page === 'dreams' ? 'active' : ''}`}
          >
            <span className="nav-icon">✨</span>
            <span className="nav-text">Dreams</span>
          </button>
          
          {/* Finance Button with Link Management */}
          <div className="finance-button-group">
            <button
              onClick={handleFinanceClick}
              className={`nav-button ${financeLink ? 'has-link' : ''}`}
            >
              <span className="nav-icon">💰</span>
              <span className="nav-text">Finance</span>
            </button>
            {financeLink && (
              <button
                onClick={handleChangeLink}
                className="change-link-button"
                title="Change Finance Link"
              >
                ⚙️
              </button>
            )}
          </div>

          <button 
            onClick={() => setPage('constitution')}
            className={`nav-button ${page === 'constitution' ? 'active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Constitution</span>
          </button>

          <button 
            onClick={() => setPage('importexport')}
            className={`nav-button ${page === 'importexport' ? 'active' : ''}`}
          >
            <span className="nav-icon">🔄</span>
            <span className="nav-text">Backup</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        {page === 'dreams' && <Dreams />}
        {page === 'daily' && <DailyEntry />}
        {page === 'goals' && <Calendar />}
        {page === 'stats' && <Statistics />}
        {page === 'constitution' && <Constitution />}
        {page === 'importexport' && <ImportExport />}
      </main>

      {/* Finance Link Modal */}
      {showFinanceModal && (
        <div className="modal-overlay" onClick={() => setShowFinanceModal(false)}>
          <div className="modal-content finance-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{!financeLink ? 'Set Your Finance Link' : 'Change Finance Link'}</h3>
            
            <div className="input-group">
              <label className="input-label">Finance Link:</label>
              <input
                type="text"
                value={tempFinanceLink}
                onChange={(e) => setTempFinanceLink(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-link"
                className="finance-link-input"
                autoFocus
              />
              <p className="input-hint">Example: docs.google.com/spreadsheets/d/your-sheet-id</p>
            </div>

            <div className="modal-buttons">
              <button onClick={saveFinanceLink} className="save-link-btn">
                {!financeLink ? 'Save & Open' : 'Update Link'}
              </button>
              {financeLink && (
                <button onClick={clearFinanceLink} className="clear-link-btn">
                  Remove Link
                </button>
              )}
              <button onClick={() => setShowFinanceModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>

            {financeLink && (
              <div className="current-link-info">
                <span className="info-icon">ℹ️</span>
                <span>Current link: </span>
                <a href={financeLink} target="_blank" rel="noopener noreferrer" className="current-link">
                  {financeLink.length > 50 ? financeLink.substring(0, 50) + '...' : financeLink}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;