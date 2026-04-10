import React, { useState, useEffect } from 'react';
import DailyEntry from './components/DailyEntry';
import Calendar from './components/Calendar';
import Statistics from './components/Statistics';
import './App.scss';
import Dreams from './components/Dreams'; 
import Constitution from './components/Constitution';
import ImportExport from './components/ImportExport';
import { MediaProvider } from './contexts/MediaContent';
import Terminal from './components/Terminal'; 
import OnBoardingPopUp from './components/OnBoardingPopUp'; 

function App() {
  const [page, setPage] = useState('daily');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [financeLink, setFinanceLink] = useState(() => {
    const saved = localStorage.getItem('financeLink');
    return saved || '';
  });
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [tempFinanceLink, setTempFinanceLink] = useState('');

  useEffect(() => {
    // No auto-open
  }, [financeLink]);

  // ========== ELECTRON FOCUS FIX ==========
  useEffect(() => {
    // Fix for Electron contentEditable focus loss
    let lastFocusedEditor = null;
    
    const saveFocusedEditor = () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.contentEditable === 'true') {
        lastFocusedEditor = activeElement;
      }
    };
    
    const restoreEditorFocus = () => {
      if (lastFocusedEditor && document.body.contains(lastFocusedEditor)) {
        // Check if something else stole focus (like a toolbar button)
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'BUTTON') {
          setTimeout(() => {
            lastFocusedEditor.focus();
            // Restore cursor position
            const selection = window.getSelection();
            if (selection && selection.rangeCount === 0 && lastFocusedEditor.innerText) {
              const range = document.createRange();
              range.selectNodeContents(lastFocusedEditor);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }, 10);
        }
      }
    };
    
    // Prevent toolbar buttons from stealing focus completely
    const preventToolbarFocusSteal = (e) => {
      if (e.target.tagName === 'BUTTON' && e.target.closest('.toolbar')) {
        e.preventDefault();
        // Execute button action without stealing focus
        setTimeout(() => {
          if (lastFocusedEditor) {
            lastFocusedEditor.focus();
          }
        }, 0);
      }
    };
    
    // Handle click outside to save last editor
    const handleGlobalClick = (e) => {
      const target = e.target;
      if (target && target.contentEditable === 'true') {
        lastFocusedEditor = target;
      } else if (target && target.tagName === 'BUTTON') {
        // If clicking a button, restore focus to last editor after
        setTimeout(() => {
          if (lastFocusedEditor && document.body.contains(lastFocusedEditor)) {
            lastFocusedEditor.focus();
          }
        }, 50);
      }
    };
    
    // Fix for drag operations that steal focus
    const preventDragSteal = (e) => {
      if (e.target && e.target.contentEditable === 'true') {
        e.dataTransfer.effectAllowed = 'none';
        e.preventDefault();
      }
    };
    
    document.addEventListener('focusin', saveFocusedEditor);
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('mousedown', preventToolbarFocusSteal, true);
    document.addEventListener('dragstart', preventDragSteal);
    
    return () => {
      document.removeEventListener('focusin', saveFocusedEditor);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mousedown', preventToolbarFocusSteal, true);
      document.removeEventListener('dragstart', preventDragSteal);
    };
  }, []);
  
  // Keyboard shortcut to force focus refresh (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+R to refresh editor focus
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        const editors = document.querySelectorAll('[contentEditable="true"]');
        if (editors.length > 0) {
          const lastEditor = editors[editors.length - 1];
          lastEditor.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(lastEditor);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          console.log('Focus refreshed on editor');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // ========== END ELECTRON FOCUS FIX ==========

  const handleFinanceClick = () => {
    if (!financeLink) {
      setTempFinanceLink('');
      setShowFinanceModal(true);
    } else {
      window.open(financeLink, '_blank', 'noopener,noreferrer');
    }
    setMobileMenuOpen(false);
  };

  const handleChangeLink = () => {
    setTempFinanceLink(financeLink);
    setShowFinanceModal(true);
    setMobileMenuOpen(false);
  };

  const saveFinanceLink = () => {
    if (tempFinanceLink.trim()) {
      let link = tempFinanceLink.trim();
      
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      
      localStorage.setItem('financeLink', link);
      setFinanceLink(link);
      setShowFinanceModal(false);
      
      if (!financeLink) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
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
      alert('Finance link removed.');
    }
  };

  useEffect(() => {
    const hasSeen = localStorage.getItem('apd_onboarding_seen');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

   const handleInfoClick = () => {
    setShowOnboarding(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setMobileMenuOpen(false);
  };

  // Navigation items configuration
  const navItems = [
    { id: 'daily', icon: '✍️', text: 'Daily Journal' },
    { id: 'goals', icon: '📅', text: 'Calendar' },
    { id: 'stats', icon: '📊', text: 'Statistics' },
    { id: 'dreams', icon: '✨', text: 'Dreams' },
    { id: 'constitution', icon: '📝', text: 'Constitution' },
    { id: 'importexport', icon: '🔄', text: 'Backup' },
  ];

  return (
    <MediaProvider>
      <div className="app-container">
         {showOnboarding && (
          <OnBoardingPopUp onClose={() => setShowOnboarding(false)} />
        )}

        <nav className="main-nav">
          {/* Desktop navigation */}
          <div className="nav-container">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`nav-button ${page === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.text}</span>
              </button>
            ))}
            
            {/* Finance Button */}
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

            {/* Mobile menu button */}
            <button 
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span>{mobileMenuOpen ? '✕' : '☰'}</span>
              <span className="nav-text">Menu</span>
            </button>
          </div>

          {/* Mobile dropdown menu */}
          <div className={`mobile-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`nav-button ${page === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.text}</span>
              </button>
            ))}
            
            {/* Finance in mobile menu */}
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
      <div className="bottom-buttons">
        <button 
          className="minimal-btn info-button"
          onClick={handleInfoClick}
          title="About APD"
        >
          ℹ
        </button>
      </div>
      <Terminal />

    </MediaProvider>  
  );
}

export default App;