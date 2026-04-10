import React, { useEffect, useState } from "react";
import "./Constitution.scss";

// Default constitution data
const defaultConstitution = {
  "header": "The Elemental Constitution",
  "sections": [
    {
      "element": "air",
      "title": "Air Element",
      "icon": "fas fa-wind",
      "principles": [
        "Freedom of thought"
      ]
    },
    {
      "element": "fire",
      "title": "Fire Element",
      "icon": "fas fa-fire",
      "principles": [
        "Pursue passion and purpose",
      ]
    },
    {
      "element": "water",
      "title": "Water Element",
      "icon": "fas fa-water",
      "principles": [
        "Flow with life's currents",
      ]
    },
    {
      "element": "earth",
      "title": "Earth Element",
      "icon": "fas fa-mountain",
      "principles": [
        "Build strong foundations",
      ]
    },
    {
      "element": "principles",
      "title": "Principles",
      "icon": "fas fa-seedling",
      "principles": [
        "Small actions compound",
        "Consistency over intensity"
      ]
    }
  ]
};



// localStorage key
const CONSTITUTION_STORAGE_KEY = 'constitution-data';

function Constitution() {
  const [constitutionData, setConstitutionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    loadConstitutionData();
  }, []);

  const saveConstitutionToStorage = (data) => {
    try {
      localStorage.setItem(CONSTITUTION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving constitution:', error);
    }
  };

  const loadConstitutionFromStorage = () => {
    try {
      const stored = localStorage.getItem(CONSTITUTION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading constitution:', error);
      return null;
    }
  };

  const loadConstitutionData = async () => {
    const storedData = loadConstitutionFromStorage();
    if (storedData) {
      setConstitutionData(storedData);
      return;
    }
    setConstitutionData(defaultConstitution);
    saveConstitutionToStorage(defaultConstitution);
  };

  const exportConstitution = () => {
    const dataStr = JSON.stringify(constitutionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `constitution_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importConstitution = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setConstitutionData(data);
        saveConstitutionToStorage(data);
        alert('✓ Constitution imported successfully!');
      } catch (error) {
        alert('✗ Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default constitution? All changes will be lost.')) {
      setConstitutionData(defaultConstitution);
      saveConstitutionToStorage(defaultConstitution);
    }
  };

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(constitutionData)));
    setIsEditing(true);
  };

  const saveEdits = () => {
    setConstitutionData(editData);
    saveConstitutionToStorage(editData);
    setIsEditing(false);
    setEditData(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const updateHeader = (value) => {
    setEditData({ ...editData, header: value });
  };

  const updateSectionTitle = (sectionIndex, value) => {
    const updatedSections = [...editData.sections];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], title: value };
    setEditData({ ...editData, sections: updatedSections });
  };

  const updateSectionIcon = (sectionIndex, value) => {
    const updatedSections = [...editData.sections];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], icon: value };
    setEditData({ ...editData, sections: updatedSections });
  };

  const updatePrinciple = (sectionIndex, principleIndex, value) => {
    const updatedSections = [...editData.sections];
    const updatedPrinciples = [...updatedSections[sectionIndex].principles];
    updatedPrinciples[principleIndex] = value;
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], principles: updatedPrinciples };
    setEditData({ ...editData, sections: updatedSections });
  };

  const addPrinciple = (sectionIndex) => {
    const updatedSections = [...editData.sections];
    const updatedPrinciples = [...updatedSections[sectionIndex].principles, "New principle..."];
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], principles: updatedPrinciples };
    setEditData({ ...editData, sections: updatedSections });
  };

  const deletePrinciple = (sectionIndex, principleIndex) => {
    const updatedSections = [...editData.sections];
    const updatedPrinciples = updatedSections[sectionIndex].principles.filter((_, i) => i !== principleIndex);
    updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], principles: updatedPrinciples };
    setEditData({ ...editData, sections: updatedSections });
  };

  // Add new element/section
  const addNewElement = () => {
    const newElement = {
      element: `element_${Date.now()}`,
      title: "New Element",
      icon: "fas fa-star",
      principles: ["Enter first principle..."]
    };
    setEditData({
      ...editData,
      sections: [...editData.sections, newElement]
    });
  };

  // Delete entire section
  const deleteSection = (sectionIndex) => {
    if (window.confirm('Delete this entire section?')) {
      const updatedSections = editData.sections.filter((_, i) => i !== sectionIndex);
      setEditData({ ...editData, sections: updatedSections });
    }
  };

  if (!constitutionData) {
    return <div className="constitution loading">Loading Constitution...</div>;
  }

  const displayData = isEditing ? editData : constitutionData;

  return (
    <div className="constitution">
      <div className="header">
        {isEditing ? (
          <input
            type="text"
            value={displayData.header}
            onChange={(e) => updateHeader(e.target.value)}
            className="edit-header-input"
          />
        ) : (
          <p>{displayData.header}</p>
        )}
      </div>

      <div className="toolbar">
        {!isEditing ? (
          <>
            <button className="toolbar-btn edit-btn" onClick={startEditing}>
              <i className="fas fa-pen"></i> Edit Constitution
            </button>
            <button className="toolbar-btn reset-btn" onClick={resetToDefault}>
              <i className="fas fa-undo"></i> Reset
            </button>
          </>
        ) : (
          <>
            <button className="toolbar-btn save-btn" onClick={saveEdits}>
              <i className="fas fa-check"></i> Save Changes
            </button>
            <button className="toolbar-btn cancel-btn" onClick={cancelEditing}>
              <i className="fas fa-times"></i> Cancel
            </button>
            <button className="toolbar-btn add-element-btn" onClick={addNewElement}>
              <i className="fas fa-plus"></i> Add Element
            </button>
          </>
        )}
      </div>

      <div className="container">
        {displayData.sections.map((section, sectionIdx) => (
          <section key={section.element} className={`element-section ${section.element}`}>
            <div className="element-header">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(sectionIdx, e.target.value)}
                    className="edit-title-input"
                  />
                  <button
                    onClick={() => deleteSection(sectionIdx)}
                    className="delete-section-btn"
                    title="Delete section"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </>
              ) : (
                <>
                  <i className={section.icon}></i>
                  <h2>{section.title}</h2>
                </>
              )}
            </div>

            <ul className="principle-list">
              {section.principles.map((principle, principleIdx) => (
                <li key={principleIdx}>
                  {isEditing ? (
                    <div className="edit-principle-row">
                      <input
                        type="text"
                        value={principle}
                        onChange={(e) => updatePrinciple(sectionIdx, principleIdx, e.target.value)}
                        className="edit-principle-input"
                      />
                      <button
                        onClick={() => deletePrinciple(sectionIdx, principleIdx)}
                        className="delete-principle-btn"
                        title="Delete principle"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ) : (
                    principle
                  )}
                </li>
              ))}
            </ul>

            {isEditing && (
              <div className="section-actions">
                <button onClick={() => addPrinciple(sectionIdx)} className="add-principle-btn">
                  <i className="fas fa-plus"></i> Add Principle
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

    </div>
  );
}

export default Constitution;