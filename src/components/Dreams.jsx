import React, { useState, useEffect, useRef } from 'react';
import { Draggable, Droppable, DragDropContext } from 'react-beautiful-dnd';
import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Dreams.scss';

// Fix for default markers in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const Dreams = () => {
  // State management
  const [dreams, setDreams] = useState(() => {
    const savedDreams = localStorage.getItem('dreams');
    return savedDreams ? JSON.parse(savedDreams) : {
      past: [],
      present: [],
      future: []
    };
  });
  
  const [markers, setMarkers] = useState(() => {
    const savedMarkers = localStorage.getItem('dreamMarkers');
    return savedMarkers ? JSON.parse(savedMarkers) : [];
  });
  
  const [newDream, setNewDream] = useState({ content: '', date: '', category: 'art', column: 'present' });
  const [newMarker, setNewMarker] = useState({ content: '', status: 'future', category: 'art' });
  const [editingDream, setEditingDream] = useState(null);
  const [editingMarker, setEditingMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const mapRef = useRef(null);

  // Function to extract and parse date from content like "Description (2019)" or "Description (2019 April)"
  const extractDateFromContent = (content) => {
    if (!content) return { sortValue: Infinity, original: '', isValidFormat: false };
    
    // Match patterns like (2019) or (2019 April) or (2024 March)
    const dateMatch = content.match(/\((\d{4})(?:\s+([a-zA-Z]+))?\)/);
    
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const monthName = dateMatch[2] ? dateMatch[2].toLowerCase() : null;
      
      if (monthName) {
        const months = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthIndex = months.indexOf(monthName);
        if (monthIndex !== -1) {
          return { 
            sortValue: year + (monthIndex + 1) / 12,
            original: `(${year} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`,
            isValidFormat: true
          };
        }
      } else {
        // Just year format
        return { 
          sortValue: year,
          original: `(${year})`,
          isValidFormat: true
        };
      }
    }
    
    // Invalid format - push to bottom
    return { 
      sortValue: Infinity, 
      original: '',
      isValidFormat: false
    };
  };

  // Function to sort markers by date
  const sortMarkersByDate = (markerList) => {
    return [...markerList].sort((a, b) => {
      const dateA = extractDateFromContent(a.content);
      const dateB = extractDateFromContent(b.content);
      
      // Both have valid format dates
      if (dateA.isValidFormat && dateB.isValidFormat) {
        // For markers, we'll sort future first (descending) since they're all in one list
        return dateB.sortValue - dateA.sortValue;
      }
      
      // Only A has valid format
      if (dateA.isValidFormat && !dateB.isValidFormat) {
        return -1;
      }
      
      // Only B has valid format
      if (!dateA.isValidFormat && dateB.isValidFormat) {
        return 1;
      }
      
      // Neither has valid format - keep original order
      return 0;
    });
  };

  // Function to parse date and get sortable value for dreams
  const parseDateForSorting = (dateString) => {
    if (!dateString || !dateString.trim()) return { sortValue: Infinity, original: dateString };
    
    const cleanDate = dateString.trim();
    
    // Check for "YYYY" format
    if (/^\d{4}$/.test(cleanDate)) {
      return { 
        sortValue: parseInt(cleanDate), 
        original: dateString,
        isValidFormat: true
      };
    }
    
    // Check for "YYYY Month" format
    const monthMatch = cleanDate.match(/^(\d{4})\s+([a-zA-Z]+)$/);
    if (monthMatch) {
      const year = parseInt(monthMatch[1]);
      const monthName = monthMatch[2].toLowerCase();
      const months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthIndex = months.indexOf(monthName);
      if (monthIndex !== -1) {
        return { 
          sortValue: year + (monthIndex + 1) / 12,
          original: dateString,
          isValidFormat: true
        };
      }
    }
    
    // Invalid format - push to bottom
    return { 
      sortValue: Infinity, 
      original: dateString,
      isValidFormat: false
    };
  };

  // Function to sort dreams by date
  const sortDreamsByDate = (dreamList, column) => {
    return [...dreamList].sort((a, b) => {
      const dateA = parseDateForSorting(a.date);
      const dateB = parseDateForSorting(b.date);
      
      // Both have valid format dates
      if (dateA.isValidFormat && dateB.isValidFormat) {
        if (column === 'past') {
          // For past, show most recent first (descending)
          return dateB.sortValue - dateA.sortValue;
        } else {
          // For present/future, show closest first (ascending)
          return dateA.sortValue - dateB.sortValue;
        }
      }
      
      // Only A has valid format
      if (dateA.isValidFormat && !dateB.isValidFormat) {
        return -1;
      }
      
      // Only B has valid format
      if (!dateA.isValidFormat && dateB.isValidFormat) {
        return 1;
      }
      
      // Neither has valid format - keep original order
      return 0;
    });
  };

  const exportToJson = () => {
    const data = { dreams, markers };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dreams_data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.dreams && data.markers) {
          setDreams(data.dreams);
          setMarkers(data.markers);
        } else {
          alert('Invalid JSON format');
        }
      } catch (error) {
        alert('Error parsing JSON');
      }
    };
    reader.readAsText(file);
  };

const AddMarkerOnClick = ({ isAddingMarker, addMarker }) => {
  const map = useMapEvent('click', (e) => {
    if (isAddingMarker) {
      addMarker(e);
    }
  });
  return null;
};

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('dreams', JSON.stringify(dreams));
    localStorage.setItem('dreamMarkers', JSON.stringify(markers));
  }, [dreams, markers]);

  // Dream CRUD operations
  const addDream = () => {
    if (!newDream.content.trim()) return;
    
    const dream = {
      id: Date.now(),
      content: newDream.content,
      date: newDream.date,
      category: newDream.category,
    };
    
    setDreams(prev => ({
      ...prev,
      [newDream.column]: [...prev[newDream.column], dream]
    }));
    
    setNewDream({ content: '', date: '', category: 'art', column: 'present' });
  };

  const updateDream = () => {
    if (!editingDream) return;
    
    // Find which column the dream is currently in
    let currentColumn = null;
    for (const col of ['past', 'present', 'future']) {
      if (dreams[col].some(d => d.id === editingDream.id)) {
        currentColumn = col;
        break;
      }
    }
    
    const targetColumn = editingDream.column;
    
    // If column changed, move the dream to the new column
    if (currentColumn && currentColumn !== targetColumn) {
      setDreams(prev => {
        // Remove from current column
        const updatedDreams = { ...prev };
        updatedDreams[currentColumn] = updatedDreams[currentColumn].filter(d => d.id !== editingDream.id);
        
        // Add to target column with updated data
        const { column, ...dreamWithoutColumn } = editingDream;
        updatedDreams[targetColumn] = [...updatedDreams[targetColumn], dreamWithoutColumn];
        
        return updatedDreams;
      });
    } else {
      // Just update the dream in place
      setDreams(prev => {
        const updatedDreams = { ...prev };
        Object.keys(updatedDreams).forEach(column => {
          updatedDreams[column] = updatedDreams[column].map(dream => 
            dream.id === editingDream.id ? { ...editingDream, column: undefined } : dream
          );
        });
        return updatedDreams;
      });
    }
    
    setEditingDream(null);
  };

  const deleteDream = (id) => {
    setDreams(prev => {
      const updatedDreams = { ...prev };
      Object.keys(updatedDreams).forEach(column => {
        updatedDreams[column] = updatedDreams[column].filter(dream => dream.id !== id);
      });
      return updatedDreams;
    });
  };

  // Marker CRUD operations
  const addMarker = (e) => {
    if (!newMarker.content.trim()) return;
    
    const marker = {
      id: Date.now(),
      content: newMarker.content,
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      status: newMarker.status,
      category: newMarker.category
    };
    
    setMarkers(prev => [...prev, marker]);
    setNewMarker({ content: '', status: 'future', category: 'art' });
    setIsAddingMarker(false);
  };

  const updateMarker = () => {
    if (!editingMarker) return;
    
    setMarkers(prev => 
      prev.map(marker => marker.id === editingMarker.id ? editingMarker : marker)
    );
    
    setEditingMarker(null);
  };

  const deleteMarker = (id) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  // Drag and drop handlers
  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;
    
    const sourceDreams = [...dreams[sourceCol]];
    const destDreams = [...dreams[destCol]];
    const [movedDream] = sourceDreams.splice(result.source.index, 1);
    
    // When moving to past, add completed property
    if (destCol === 'past') {
      movedDream.completed = false;
    } else if (movedDream.completed) {
      // Remove completed property if moving out of past
      delete movedDream.completed;
    }
    
    destDreams.splice(result.destination.index, 0, movedDream);
    
    setDreams(prev => ({
      ...prev,
      [sourceCol]: sourceDreams,
      [destCol]: destDreams
    }));
  };

  // Map event handlers
  const handleMapClick = (e) => {
    if (isAddingMarker && newMarker.content.trim()) {
      addMarker(e);
    }
  };

  const toggleDreamCompletion = (id) => {
    setDreams(prev => {
      const updatedDreams = { ...prev };
      updatedDreams.past = updatedDreams.past.map(dream => 
        dream.id === id ? { ...dream, completed: !dream.completed } : dream
      );
      return updatedDreams;
    });
  };

  // Filter dreams by category
  const filterDreams = (dreamList) => {
    if (filterCategory === 'all') return dreamList;
    return dreamList.filter(dream => dream.category === filterCategory);
  };

  // Category icons
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'freedom': return '🕊️';
      case 'love': return '❤️';
      case 'art': return '🎨';
      default: return '🌍';
    }
  };

  // Marker icons
  const getMarkerIcon = (status) => {
    const color = status === 'completed' ? '#4CAF50' : 
                 status === 'present' ? '#FFC107' : '#F44336';
    return createCustomIcon(color);
  };

  const startAddingMarker = () => {
    if (!newMarker.content.trim()) {
      alert('Please enter a description for the marker first!');
      return;
    }
    setIsAddingMarker(true);
  };

  const cancelAddingMarker = () => {
    setIsAddingMarker(false);
    setNewMarker({ content: '', status: 'future', category: 'art' });
  };

  // Helper function to find current column of a dream
  const getDreamColumn = (dreamId) => {
    for (const col of ['past', 'present', 'future']) {
      if (dreams[col].some(d => d.id === dreamId)) {
        return col;
      }
    }
    return 'present';
  };

  return (
    <div className="dreams-app">
      <header className="app-header">
        <h1>Dream Tracker</h1>
        <div className="pillars">
          <div className="pillar freedom">🕊️ Freedom</div>
          <div className="pillar love">❤️ Love</div>
          <div className="pillar art">🎨 Art</div>
        </div>
      </header>

      <div className="dream-board">
        <div className="app-controls">
          <div className="category-filter">
            <label>Filter by Category:</label>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="freedom">Freedom</option>
              <option value="love">Love</option>
              <option value="art">Art</option>
            </select>
          </div>
        </div>

        <div className="dream-form">
          <h3>Add New Dream</h3>
          <input
            type="text"
            placeholder="Dream content"
            value={newDream.content}
            onChange={(e) => setNewDream({...newDream, content: e.target.value})}
          />
          <input
            type="text"
            placeholder="Date (e.g., '2025' or '2025 April' or 'Description (2025)')"
            value={newDream.date}
            onChange={(e) => setNewDream({...newDream, date: e.target.value})}
          />
          <select
            value={newDream.category}
            onChange={(e) => setNewDream({...newDream, category: e.target.value})}
          >
            <option value="freedom">Freedom</option>
            <option value="love">Love</option>
            <option value="art">Art</option>
          </select>
          <select
            value={newDream.column}
            onChange={(e) => setNewDream({...newDream, column: e.target.value})}
          >
            <option value="past">Past</option>
            <option value="present">Present</option>
            <option value="future">Future</option>
          </select>
          <button onClick={addDream}>Add Dream</button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="dreams-grid">
            {['past', 'present', 'future'].map((column) => (
              <div key={column} className="dream-column">
                <h2>
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                  {column === 'past' && ' '}
                </h2>
                <Droppable droppableId={column}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="dream-list"
                    >
                      {sortDreamsByDate(filterDreams(dreams[column]), column).map((dream, index) => (
                        <Draggable key={dream.id} draggableId={dream.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`dream-card ${dream.category} ${
                                column === 'past' && dream.completed ? 'completed' : ''
                              }`}
                            >
                              <div className="dream-header">
                                <span className="dream-category">
                                  {getCategoryIcon(dream.category)}
                                </span>
                                <span className="dream-date">{dream.date}</span>
                                {column === 'past' && (
                                  <button 
                                    className={`completion-toggle ${dream.completed ? 'completed' : ''}`}
                                    onClick={() => toggleDreamCompletion(dream.id)}
                                  >
                                    {dream.completed ? '✓' : '✗'}
                                  </button>
                                )}
                                <div className="dream-actions">
                                  <button onClick={() => {
                                    // Find current column and set it in editing state
                                    const currentColumn = getDreamColumn(dream.id);
                                    setEditingDream({ 
                                      ...dream, 
                                      column: currentColumn 
                                    });
                                  }}>✏️</button>
                                  <button onClick={() => deleteDream(dream.id)}>🗑️</button>
                                </div>
                              </div>
                              <div className="dream-content">
                                <p>{dream.content}</p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Map Section - Always visible below dreams */}
      <div className="dream-map-section">
        <div className="map-controls">
          <div className="marker-form">
            <h3>Add Map Marker</h3>
            <input
              type="text"
              placeholder="Dream location description (e.g., Visit Paris (2025))"
              value={newMarker.content}
              onChange={(e) => setNewMarker({...newMarker, content: e.target.value})}
            />
            <select
              value={newMarker.status}
              onChange={(e) => setNewMarker({...newMarker, status: e.target.value})}
            >
              <option value="future">Future (Red)</option>
              <option value="present">In Progress (Yellow)</option>
              <option value="completed">Completed (Green)</option>
            </select>
            <select
              value={newMarker.category}
              onChange={(e) => setNewMarker({...newMarker, category: e.target.value})}
            >
              <option value="freedom">Freedom</option>
              <option value="love">Love</option>
              <option value="art">Art</option>
            </select>
            <div className="marker-buttons">
              {!isAddingMarker ? (
                <button 
                  className="start-add-marker"
                  onClick={startAddingMarker}
                  disabled={!newMarker.content.trim()}
                >
                  Start Adding Marker
                </button>
              ) : (
                <div className="adding-marker-mode">
                  <span className="adding-text">Click on map to place marker</span>
                  <button 
                    className="cancel-add-marker"
                    onClick={cancelAddingMarker}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="marker-list">
            <h3>Your Dream Locations</h3>
            <div className="marker-items">
              {sortMarkersByDate(markers).map(marker => (
                <div key={marker.id} className="marker-item" onClick={() => {
                  setEditingMarker(marker);
                  setMapCenter([marker.lat, marker.lng]);
                  if (mapRef.current) {
                    mapRef.current.flyTo([marker.lat, marker.lng], 8);
                  }
                }}>
                  <div className="marker-status" style={{
                    backgroundColor: marker.status === 'completed' ? '#4CAF50' : 
                                  marker.status === 'present' ? '#FFC107' : '#F44336'
                  }}></div>
                  <div className="marker-content">
                    <strong>{marker.content}</strong>
                    <small>{marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</small>
                    <span className="marker-category">{getCategoryIcon(marker.category)}</span>
                  </div>
                  <button 
                    className="delete-marker"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMarker(marker.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`map-container ${isAddingMarker ? 'adding-marker' : ''}`}>
          {isAddingMarker && (
            <div className="map-overlay-message">
              Click anywhere on the map to place your marker
            </div>
          )}
          <MapContainer 
            center={mapCenter} 
            zoom={3} 
            style={{ height: '500px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {markers.map(marker => (
              <Marker 
                key={marker.id} 
                position={[marker.lat, marker.lng]} 
                icon={getMarkerIcon(marker.status)}
                eventHandlers={{
                  click: () => {
                    setEditingMarker(marker);
                    setMapCenter([marker.lat, marker.lng]);
                  }
                }}
              >
                <Popup>
                  <div className="marker-popup">
                    <h4>{marker.content}</h4>
                    <p>Status: {marker.status}</p>
                    <p>Category: {marker.category} {getCategoryIcon(marker.category)}</p>
                    <button onClick={() => setEditingMarker(marker)}>Edit</button>
                  </div>
                </Popup>
              </Marker>
            ))}
            <AddMarkerOnClick isAddingMarker={isAddingMarker} addMarker={addMarker} />
          </MapContainer>
        </div>
      </div>

      {/* Edit Dream Modal - UPDATED with column selector */}
      {editingDream && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Dream</h3>
            <input
              type="text"
              value={editingDream.content}
              onChange={(e) => setEditingDream({...editingDream, content: e.target.value})}
              placeholder="Dream content"
            />
            <input
              type="text"
              value={editingDream.date || ''}
              onChange={(e) => setEditingDream({...editingDream, date: e.target.value})}
              placeholder="Date (e.g., '2025' or '2025 April' or 'Description (2025)')"
            />
            <select
              value={editingDream.category}
              onChange={(e) => setEditingDream({...editingDream, category: e.target.value})}
            >
              <option value="freedom">Freedom 🕊️</option>
              <option value="love">Love ❤️</option>
              <option value="art">Art 🎨</option>
            </select>
            
            {/* NEW: Column selector for dreams */}
            <div className="form-group">
              <label className="modal-label">Dream Stage:</label>
              <select
                value={editingDream.column || 'present'}
                onChange={(e) => setEditingDream({...editingDream, column: e.target.value})}
                className="modal-select"
              >
                <option value="past">Past</option>
                <option value="present">Present</option>
                <option value="future">Future</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button onClick={updateDream} className="save-btn">Save Changes</button>
              <button onClick={() => setEditingDream(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Marker Modal */}
      {editingMarker && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Location Dream</h3>
            <input
              type="text"
              value={editingMarker.content}
              onChange={(e) => setEditingMarker({...editingMarker, content: e.target.value})}
              placeholder="e.g., Visit Paris (2025)"
            />
            <select
              value={editingMarker.status}
              onChange={(e) => setEditingMarker({...editingMarker, status: e.target.value})}
            >
              <option value="future">Future (Red)</option>
              <option value="present">In Progress (Yellow)</option>
              <option value="completed">Completed (Green)</option>
            </select>
            <select
              value={editingMarker.category}
              onChange={(e) => setEditingMarker({...editingMarker, category: e.target.value})}
            >
              <option value="freedom">Freedom 🕊️</option>
              <option value="love">Love ❤️</option>
              <option value="art">Art 🎨</option>
            </select>
            <div className="modal-actions">
              <button onClick={updateMarker}>Save</button>
              <button onClick={() => setEditingMarker(null)}>Cancel</button>
              <button className="delete" onClick={() => {
                deleteMarker(editingMarker.id);
                setEditingMarker(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dreams;