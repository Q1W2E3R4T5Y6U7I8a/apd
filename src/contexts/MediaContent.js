import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MediaContext = createContext();

export const useMedia = () => useContext(MediaContext);

export const MediaProvider = ({ children }) => {
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pomodoroDuration, setPomodoroDuration] = useState(45);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const timerRef = useRef(null);
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

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
          if (!isMuted) {
            const beep = new Audio('/notification.mp3');
            beep.play().catch(console.log);
          }
        }
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPomodoroActive, timerEndTime, isMuted]);

  const playTrack = async (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audio = new Audio(track.src);
    audio.loop = true;
    audio.volume = volume;
    
    try {
      await audio.play();
      audioRef.current = audio;
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play track:', error);
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
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
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