// src/components/ImportExport.jsx
import React, { useState } from 'react';
import { 
  exportAllToJSON, 
  importAllFromJSON, 
  exportAllToOneDrive,
  importAllFromOneDrive,
  clearAllData,
  loadAllData
} from '../services/dataService';
import './ImportExport.scss';

const ImportExport = () => {
  const [syncStatus, setSyncStatus] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOneDriveInput, setShowOneDriveInput] = useState(false);
  const [oneDriveUrl, setOneDriveUrl] = useState('https://1drv.ms/u/c/a12b363c8e324d56/ETFHLX4ggw9HhvgxBk66zBQBjMeeFnIL1dCZUhyklhGxWw?e=TkNVo2');

  const handleExportAll = () => {
    try {
      exportAllToJSON();
      setSyncStatus('✅ All data exported successfully!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setSyncStatus('❌ Error exporting data');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleExportToOneDrive = async () => {
    try {
      setSyncStatus('📤 Preparing export for OneDrive...');
      const result = await exportAllToOneDrive();
      setSyncStatus(`✅ ${result.message}`);
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (error) {
      console.error('OneDrive export error:', error);
      setSyncStatus('❌ Error exporting to OneDrive');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleImportFromFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSyncStatus('📥 Importing from file...');
    importAllFromJSON(file)
      .then(() => {
        setSyncStatus('✅ All data imported successfully! Refresh to see changes.');
        setTimeout(() => {
          setSyncStatus('');
          window.location.reload(); // Refresh to load all data
        }, 2000);
      })
      .catch(error => {
        console.error('Import error:', error);
        setSyncStatus(`❌ Error: ${error.message}`);
        setTimeout(() => setSyncStatus(''), 3000);
      });
  };

  const handleImportFromOneDrive = async () => {
    if (!oneDriveUrl.trim()) {
      setSyncStatus('❌ Please enter a OneDrive URL');
      return;
    }

    try {
      setSyncStatus('📥 Importing from OneDrive...');
      await importAllFromOneDrive(oneDriveUrl);
      setSyncStatus('✅ All data imported from OneDrive! Refresh to see changes.');
      setTimeout(() => {
        setSyncStatus('');
        window.location.reload(); // Refresh to load all data
      }, 2000);
    } catch (error) {
      console.error('OneDrive import error:', error);
      setSyncStatus(`❌ Error: ${error.message}`);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  const handleClearAllData = () => {
    if (clearAllData()) {
      setSyncStatus('🗑️ All data cleared! Refresh to start fresh.');
      setShowClearConfirm(false);
      setTimeout(() => {
        setSyncStatus('');
        window.location.reload();
      }, 2000);
    } else {
      setSyncStatus('❌ Error clearing data');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handlePreviewData = () => {
    const data = loadAllData();
    console.log('📊 Current data:', data);
    alert(`Current data summary:
📝 Daily Entries: ${data.dailyEntry?.length || 0}
📅 Calendar Goals: ${Object.keys(data.calendar || {}).length}
✨ Dreams: ${data.dreams?.past?.length || 0} past, ${data.dreams?.present?.length || 0} present, ${data.dreams?.future?.length || 0} future
📍 Dream Markers: ${data.dreamMarkers?.length || 0}
📜 Constitution: ${data.constitution ? '✓ Loaded' : 'Not loaded'}`);
  };

  return (
    <div className="import-export-container">
      <div className="import-export-card">
        {/* Export Section */}
        <div className="section">
          <h3>📤 Export Data</h3>
          <div className="button-group">
            <button onClick={handleExportAll} className="btn btn-primary">
              💾 Export to JSON File
            </button>
            <button onClick={handlePreviewData} className="btn btn-info">
              🔍 Preview Data
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="section">
          <h3>📥 Import Data</h3>
          <div className="button-group">
            <label className="btn btn-secondary">
              📁 Import from JSON File
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportFromFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {showOneDriveInput && (
            <div className="oneDrive-input-group">
              <input
                type="text"
                value={oneDriveUrl}
                onChange={(e) => setOneDriveUrl(e.target.value)}
                placeholder="Enter OneDrive sharing link"
                className="oneDrive-input"
              />
              <button onClick={handleImportFromOneDrive} className="btn btn-small btn-onedrive">
                Import
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="section danger-zone">
          <div className="button-group">
            {!showClearConfirm ? (
              <button 
                onClick={() => setShowClearConfirm(true)} 
                className="btn btn-danger"
              >
                🗑️ Clear ALL Data
              </button>
            ) : (
              <div className="confirm-box">
                <p>Are you sure? This will erase ALL your data!</p>
                <div className="confirm-buttons">
                  <button onClick={handleClearAllData} className="btn btn-danger-small">
                    Yes, Delete Everything
                  </button>
                  <button onClick={() => setShowClearConfirm(false)} className="btn btn-secondary-small">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {syncStatus && (
          <div className={`status-message ${syncStatus.includes('✅') ? 'success' : 'error'}`}>
            {syncStatus}
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportExport;