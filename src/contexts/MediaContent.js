import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MediaContext = createContext();

export const useMedia = () => useContext(MediaContext);

// Timer music tracks
const TIMER_MUSIC_TRACKS = [
  { id: 1, title: "Timer Music 1", src: "/timer_music_1.mp3", element: "fire" },
  { id: 2, title: "Timer Music 2", src: "/timer_music_2.mp3", element: "air" },
  { id: 3, title: "Timer Music 3", src: "/timer_music_3.mp3", element: "water" },
  { id: 4, title: "Timer Music 4", src: "/timer_music_4.mp3", element: "earth" },
  { id: 5, title: "Timer Music 5", src: "/timer_music_5.mp3", element: "fire" },
];

// Helper function to get audio path
const getAudioPath = (src) => {
  if (window && window.electronAPI) return src;
  if (process.env.PUBLIC_URL) return `${process.env.PUBLIC_URL}${src}`;
  if (window.location.protocol === 'file:') return src.replace(/^\//, '');
  return src;
};

export const MediaProvider = ({ children }) => {
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pomodoroDuration, setPomodoroDuration] = useState(45);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const timerRef = useRef(null);
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startPomodoro = (duration) => {
    const durationInMinutes = typeof duration === 'number' ? duration : pomodoroDuration;
    const durationInSeconds = durationInMinutes * 60;
    setIsPomodoroActive(true);
    setTimeLeft(durationInSeconds);
    setTimerEndTime(Date.now() + durationInSeconds * 1000);
    if (typeof duration === 'number') setPomodoroDuration(duration);
  };

  const cancelPomodoro = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPomodoroActive(false);
    setTimeLeft(0);
    setTimerEndTime(null);
    document.title = 'Daily Entry';
  };

  // Play random timer music on pomodoro completion
  const playRandomTimerMusic = async () => {
    if (isMuted) return;
    
    // Stop current music if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Pick random track from TIMER_MUSIC_TRACKS
    const randomIndex = Math.floor(Math.random() * TIMER_MUSIC_TRACKS.length);
    const track = TIMER_MUSIC_TRACKS[randomIndex];
    
    // Fix path for Electron packaged app
    let audioSrc = track.src;
    if (window.location.protocol === 'file:') {
      audioSrc = track.src.replace(/^\//, '');
    }
    
    try {
      const audio = new Audio(audioSrc);
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume;
      
      await audio.play();
      audioRef.current = audio;
      setCurrentTrack(track);
      setIsPlaying(true);
      console.log(`🎵 Playing: ${track.title}`);
    } catch (error) {
      console.error('Failed to play timer music:', error);
    }
  };

  useEffect(() => {
    if (isPomodoroActive && timerEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((timerEndTime - now) / 1000));
        setTimeLeft(remaining);
        document.title = `${formatTime(remaining)} - Pomodoro`;
        
        if (remaining === 0) {
          clearInterval(timerRef.current);
          setIsPomodoroActive(false);
          setTimerEndTime(null);
          document.title = 'Daily Entry';
          window.lastPomodoroCompleted = true;
          // Play random timer music on completion
          playRandomTimerMusic();
        }
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPomodoroActive, timerEndTime, isMuted, volume]);

  // Play track function (for meditation section)
  const playTrack = async (track) => {
    // Stop current music if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audio = new Audio(getAudioPath(track.src));
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    
    try {
      await audio.play();
      audioRef.current = audio;
      setCurrentTrack(track);
      setIsPlaying(true);
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <MediaContext.Provider value={{
      isPomodoroActive,
      timeLeft,
      pomodoroDuration,
      setPomodoroDuration,
      startPomodoro,
      cancelPomodoro,
      formatTime,
      currentTrack,
      isPlaying,
      volume,
      isMuted,
      setIsMuted,
      playTrack,
      stopMusic,
      togglePlayPause,
      handleVolumeChange,
    }}>
      {children}
    </MediaContext.Provider>
  );
};