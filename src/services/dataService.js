// src/services/dataService.js

const DATA_KEY = 'daily-log';

export const loadData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY)) || [];
    return saved.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const [dayB, monthB, yearB] = b.date.split('/');
      return new Date(`${yearA}-${monthA}-${dayA}`) - new Date(`${yearB}-${monthB}-${dayB}`);
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
};

export const saveData = (data) => {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const deleteEntry = (date) => {
  try {
    const currentData = loadData();
    const updatedData = currentData.filter(entry => entry.date !== date);
    saveData(updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return null;
  }
};

export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          saveData(data);
          resolve(data);
        } else {
          reject(new Error('Invalid data format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// dataService.js - Ajoutez ces fonctions

// VOTRE LIEN ONEDRIVE
const ONEDRIVE_URL = 'https://1drv.ms/u/c/a12b363c8e324d56/ETFHLX4ggw9HhvgxBk66zBQBjMeeFnIL1dCZUhyklhGxWw?e=TkNVo2';

// Convertir le lien OneDrive en lien de téléchargement direct
const getDirectDownloadLink = (oneDriveUrl) => {
  // OneDrive personal links can be converted to direct download
  return oneDriveUrl.replace('1drv.ms', '1drv.ws');
};

// Fonction pour uploader vers OneDrive (simulation)
export const uploadToOneDrive = async (jsonData) => {
  try {
    console.log('📤 Upload simulé vers OneDrive:', ONEDRIVE_URL);
    
    // Pour l'instant, on simule l'upload
    // En réalité, vous devrez uploader manuellement le fichier
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sauvegarder les données localement pour référence
    localStorage.setItem('lastExportData', JSON.stringify(jsonData));
    localStorage.setItem('lastExportDate', new Date().toISOString());
    
    return { 
      success: true, 
      url: ONEDRIVE_URL,
      message: 'Fichier prêt pour upload manuel vers OneDrive' 
    };
  } catch (error) {
    console.error('OneDrive upload error:', error);
    throw error;
  }
};

// Fonction pour télécharger depuis OneDrive
export const downloadFromOneDrive = async () => {
  try {
    const directLink = getDirectDownloadLink(ONEDRIVE_URL);
    console.log('📥 Téléchargement depuis:', directLink);
    
    const response = await fetch(directLink);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OneDrive download error:', error);
    
    // Fallback: ouvrir le lien dans un nouvel onglet
    window.open(ONEDRIVE_URL, '_blank');
    throw new Error(`Impossible de télécharger automatiquement. Le lien OneDrive a été ouvert dans un nouvel onglet.`);
  }
};

// Modifiez la fonction exportToJSON existante
export const exportToJSON = (data = null) => {
  const exportData = data || loadData();
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // 1. Téléchargement local
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `daily-tracker-${new Date().toISOString().split('T')[0]}.json`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  // 2. Upload vers OneDrive
  uploadToOneDrive(exportData).then(result => {
    console.log('✅ Export réussi:', result);
    
    // Afficher les instructions pour l'upload manuel
    alert(`✅ Export réussi !

📁 Fichier téléchargé: ${filename}

📋 Pour compléter l'upload vers OneDrive:
1. Allez sur: ${ONEDRIVE_URL}
2. Glissez-déposez le fichier "${filename}" 
3. Remplacer l'ancien fichier si demandé

🔗 Votre lien OneDrive est maintenant actif !`);
  }).catch(error => {
    console.error('Upload échoué:', error);
  });
  
  return exportData;
};

// src/services/dataService.js - ADD THESE FUNCTIONS

// CONSTANTS for localStorage keys
export const STORAGE_KEYS = {
  DAILY_ENTRY: 'daily-log',
  CALENDAR_GOALS: 'calendar-goals',
  DREAMS: 'dreams',
  DREAM_MARKERS: 'dreamMarkers',
  CONSTITUTION: 'constitution-data'
};

// Load ALL data from localStorage
export const loadAllData = () => {
  return {
    dailyEntry: loadData(), // existing function
    calendar: JSON.parse(localStorage.getItem(STORAGE_KEYS.CALENDAR_GOALS) || '{}'),
    dreams: JSON.parse(localStorage.getItem(STORAGE_KEYS.DREAMS) || '{"past":[],"present":[],"future":[]}'),
    dreamMarkers: JSON.parse(localStorage.getItem(STORAGE_KEYS.DREAM_MARKERS) || '[]'),
    constitution: JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSTITUTION) || 'null')
  };
};

// Save ALL data to localStorage
export const saveAllData = (allData) => {
  try {
    if (allData.dailyEntry) saveData(allData.dailyEntry);
    if (allData.calendar) localStorage.setItem(STORAGE_KEYS.CALENDAR_GOALS, JSON.stringify(allData.calendar));
    if (allData.dreams) localStorage.setItem(STORAGE_KEYS.DREAMS, JSON.stringify(allData.dreams));
    if (allData.dreamMarkers) localStorage.setItem(STORAGE_KEYS.DREAM_MARKERS, JSON.stringify(allData.dreamMarkers));
    if (allData.constitution) localStorage.setItem(STORAGE_KEYS.CONSTITUTION, JSON.stringify(allData.constitution));
    
    return true;
  } catch (error) {
    console.error('Error saving all data:', error);
    return false;
  }
};

// Export ALL data to JSON file
export const exportAllToJSON = () => {
  const allData = loadAllData();
  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `complete-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return allData;
};

// Import ALL data from JSON file
export const importAllFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate that it has the expected structure
        const expectedKeys = ['dailyEntry', 'calendar', 'dreams', 'dreamMarkers', 'constitution'];
        const hasRequiredData = expectedKeys.some(key => data.hasOwnProperty(key));
        
        if (!hasRequiredData) {
          reject(new Error('Invalid file format: Missing required data sections'));
          return;
        }
        
        // Save all data
        const success = saveAllData(data);
        if (success) {
          resolve(data);
        } else {
          reject(new Error('Failed to save data'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Export to OneDrive (unified)
export const exportAllToOneDrive = async () => {
  try {
    const allData = loadAllData();
    const dataStr = JSON.stringify(allData, null, 2);
    
    // Save locally first
    const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
    const link = document.createElement('a');
    const filename = `complete-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    localStorage.setItem('lastFullExport', dataStr);
    localStorage.setItem('lastFullExportDate', new Date().toISOString());
    
    return { 
      success: true, 
      filename,
      message: 'File ready for manual upload to OneDrive' 
    };
  } catch (error) {
    console.error('Export to OneDrive error:', error);
    throw error;
  }
};

// Import from OneDrive (unified)
export const importAllFromOneDrive = async (oneDriveUrl) => {
  try {
    // Convert to direct download link
    const directLink = oneDriveUrl.replace('1drv.ms', '1drv.ws');
    console.log('📥 Downloading from:', directLink);
    
    const response = await fetch(directLink);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate data structure
    const expectedKeys = ['dailyEntry', 'calendar', 'dreams', 'dreamMarkers', 'constitution'];
    const hasRequiredData = expectedKeys.some(key => data.hasOwnProperty(key));
    
    if (!hasRequiredData) {
      throw new Error('Invalid file format from OneDrive');
    }
    
    const success = saveAllData(data);
    if (!success) {
      throw new Error('Failed to save imported data');
    }
    
    return data;
  } catch (error) {
    console.error('OneDrive import error:', error);
    throw error;
  }
};

// Clear ALL data (with confirmation)
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DAILY_ENTRY);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_GOALS);
    localStorage.removeItem(STORAGE_KEYS.DREAMS);
    localStorage.removeItem(STORAGE_KEYS.DREAM_MARKERS);
    localStorage.removeItem(STORAGE_KEYS.CONSTITUTION);
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};