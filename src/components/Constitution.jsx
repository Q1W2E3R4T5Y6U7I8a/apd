import React, { useEffect, useState } from "react";
import "./Constitution.scss";

// Default constitution data
const defaultConstitution = {
  "header": "Default Constitution - Modify me!",
  "sections": [
    {
      "element": "air",
      "title": "Air Element",
      "icon": "fas fa-wind",
      "principles": [
        "1. This is default air principle 1",
        "1.1 Default air principle 1.1",
        "1.2 Default air principle 1.2"
      ]
    },
    {
      "element": "fire",
      "title": "Fire Element",
      "icon": "fas fa-fire",
      "principles": [
        "2. This is default fire principle 1",
        "2.1 Default fire principle 2.1"
      ]
    }
  ]
};

// localStorage key
const CONSTITUTION_STORAGE_KEY = 'constitution-data';

function Constitution() {
  const [constitutionData, setConstitutionData] = useState(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    // Load constitution data on component mount
    loadConstitutionData();
    
    const sections = document.querySelectorAll(".element-section");
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.style.opacity = "1";
        section.style.transform = "translateY(0)";
      }, 300 * index);
    });

    const onScroll = () => {
      const scrollY = window.scrollY;
      const header = document.querySelector(".header");
      if (header) header.style.backgroundPositionY = `-${scrollY * 0.2}px`;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Save constitution data to localStorage
  const saveConstitutionToStorage = (data) => {
    try {
      localStorage.setItem(CONSTITUTION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving constitution to localStorage:', error);
    }
  };

  // Load constitution data from localStorage
  const loadConstitutionFromStorage = () => {
    try {
      const stored = localStorage.getItem(CONSTITUTION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading constitution from localStorage:', error);
      return null;
    }
  };

  // Load constitution data (priority: localStorage -> JSON file -> default)
  const loadConstitutionData = async () => {
    // First try to load from localStorage
    const storedData = loadConstitutionFromStorage();
    if (storedData) {
      setConstitutionData(storedData);
      return;
    }

    // If no localStorage data, try to load from JSON file
    try {
      const response = await fetch('/constitution.json');
      if (response.ok) {
        const data = await response.json();
        setConstitutionData(data);
        // Also save the loaded JSON data to localStorage for persistence
        saveConstitutionToStorage(data);
      } else {
        // If file doesn't exist, use default data
        setConstitutionData(defaultConstitution);
        saveConstitutionToStorage(defaultConstitution);
      }
    } catch (error) {
      console.error('Error loading constitution data:', error);
      // Use default data as fallback
      setConstitutionData(defaultConstitution);
      saveConstitutionToStorage(defaultConstitution);
    }
  };

  // Update constitution data and persist to localStorage
  const updateConstitutionData = (newData) => {
    setConstitutionData(newData);
    saveConstitutionToStorage(newData);
  };

  // Export constitution data as JSON file
  const exportConstitution = () => {
    const dataStr = JSON.stringify(constitutionData || defaultConstitution, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'constitution.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import constitution data from file
  const importConstitution = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        updateConstitutionData(data);
        alert('Constitution imported successfully! Data will persist after refresh.');
      } catch (error) {
        alert('Error importing constitution: Invalid JSON file');
        console.error('Error parsing JSON:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset input to allow importing same file again
    event.target.value = '';
  };

  // Open JSON editor with current data
  const openJsonEditor = () => {
    setJsonText(JSON.stringify(constitutionData, null, 2));
    setShowJsonEditor(true);
  };

  // Apply JSON changes
  const applyJsonChanges = () => {
    try {
      const data = JSON.parse(jsonText);
      updateConstitutionData(data);
      setShowJsonEditor(false);
      alert('JSON changes applied successfully!');
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
      console.error('Error parsing JSON:', error);
    }
  };

  // Close JSON editor without saving
  const closeJsonEditor = () => {
    setShowJsonEditor(false);
    setJsonText('');
  };

  if (!constitutionData) {
    return <div className="constitution loading">Loading Constitution...</div>;
  }

  return (
    <div className="constitution">
      <div className="header">
        <p>{constitutionData.header}</p>
      </div>

      {/* Import/Export Buttons */}
      <div className="import-export-buttons">
        <input
          type="file"
          id="import-file"
          accept=".json"
          onChange={importConstitution}
          style={{ display: 'none' }}
        />
        <button className="edit-json-btn" onClick={openJsonEditor}>
          <i className="fas fa-code"></i> Edit JSON
        </button>
      </div>

      {/* JSON Editor Modal */}
      {showJsonEditor && (
        <div className="json-editor-modal">
          <div className="json-editor-content">
            <div className="json-editor-header">
              <h3>Edit Constitution JSON</h3>
              <button className="close-button" onClick={closeJsonEditor}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="json-textarea"
              placeholder="Paste or edit your JSON here..."
              spellCheck="false"
            />
            <div className="json-editor-buttons">
              <button className="apply-btn" onClick={applyJsonChanges}>
                <i className="fas fa-check"></i> Apply Changes
              </button>
              <button className="cancel-btn" onClick={closeJsonEditor}>
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {constitutionData.sections.map((section, index) => (
          <section key={section.element} className={`element-section ${section.element}`}>
            <div className="element-header">
              <i className={section.icon}></i>
              <h2>{section.title}</h2>
            </div>
            <ul className="principle-list">
              {section.principles.map((principle, idx) => (
                <li key={idx}>{principle}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Constitution;