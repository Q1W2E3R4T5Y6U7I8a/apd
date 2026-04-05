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
import OnboardingPopup from './components/OnboardingPopup'; 

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
          <OnboardingPopup onClose={() => setShowOnboarding(false)} />
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
          className="minimal-btn info-btn"
          onClick={handleInfoClick}
          title="About APD"
        >
          ℹ️
        </button>
      </div>
      <Terminal />

    </MediaProvider>  
  );
}

export default App;