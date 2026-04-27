import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Code, PlaySquare, Music } from 'lucide-react';

const TRACKS = [
  {
    id: 1,
    title: 'Neon Synthwave Journey',
    artist: 'AI Generator Alpha',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12'
  },
  {
    id: 2,
    title: 'Cyberpunk Nights',
    artist: 'AI Generator Beta',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '7:05'
  },
  {
    id: 3,
    title: 'Digital Horizon',
    artist: 'AI Generator Gamma',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '5:44'
  }
];

// -- GAME CONSTANTS --
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2; // Decrease interval by 2ms per food

function SnakeGame({ isPlayingMusic }: { isPlayingMusic: boolean }) {
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  // Keep track of the pending direction to avoid quick reverse death
  const directionRef = useRef(direction);
  
  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const { x: dx, y: dy } = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (dy === 0) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (dy === 0) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (dx === 0) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (dx === 0) directionRef.current = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newDirection = directionRef.current;
        setDirection(newDirection);
        
        const newHead = {
          x: (head.x + newDirection.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + newDirection.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check self-collision
        if (prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setSpeed(s => Math.max(50, s - SPEED_INCREMENT));
          
          // Generate new food that's not on the snake
          let newFood;
          while (true) {
            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE)
            };
            // eslint-disable-next-line no-loop-func
            if (!newSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
          }
          setFood(newFood);
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [food, isGameOver, isPaused, speed]);

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-zinc-800/60 bg-zinc-950/40 backdrop-blur-md rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.1)] w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <PlaySquare className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            NEON SNAKE
          </h2>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Score</span>
          <span className="text-2xl font-black text-green-400 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
            {score.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      <div className="relative p-1 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner">
        <div 
          className="grid gap-px bg-zinc-900 overflow-hidden relative"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: 'min(100%, 400px)',
            aspectRatio: '1/1',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`w-full h-full rounded-[1px] transition-colors duration-100 ${
                  isHead 
                    ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,1)] z-10' 
                    : isBody 
                    ? 'bg-green-600/80' 
                    : isFood 
                    ? 'bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.8)] animate-pulse' 
                    : 'bg-zinc-950'
                }`}
              />
            );
          })}

          {/* Overlays */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
              <h3 className="text-3xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">SYSTEM FAILURE</h3>
              <p className="text-zinc-400 mb-6 font-mono text-sm">Final Score: {score}</p>
              <button 
                onClick={resetGame}
                className="px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all font-bold tracking-wider rounded-lg border border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                REBOOT SEQUENCE
              </button>
            </div>
          )}
          
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <h3 className="text-2xl font-black text-green-500 tracking-[0.2em] drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse">PAUSED</h3>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-6 flex items-center justify-between text-xs font-mono text-zinc-500">
        <span>Use WASD or Arrows</span>
        <span>Space to Pause</span>
      </div>
    </div>
  );
}

function MusicPlayer({ onPlayingStateChange }: { onPlayingStateChange: (isPlaying: boolean) => void }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    onPlayingStateChange(isPlaying);
  }, [isPlaying, onPlayingStateChange]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  // When track changes, play if playing state is true
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
    }
  }, [currentTrackIndex]); // Only run on track index change

  // Handle playing state updates properly across component renders
  useEffect(() => {
    if (audioRef.current && isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex flex-col p-6 w-full max-w-sm border border-fuchsia-500/30 bg-zinc-950/60 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.15)] relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/5 to-blue-600/5 pointer-events-none" />
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleTrackEnd}
        preload="auto"
      />

      <div className="flex items-center gap-4 mb-8">
        <div className="relative w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
          <div className={`absolute inset-0 bg-gradient-to-tr from-fuchsia-600/20 to-blue-600/20 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
          <Music className={`w-8 h-8 ${isPlaying ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-zinc-600'}`} />
        </div>
        
        <div className="flex flex-col overflow-hidden">
          <div className="text-xs font-mono text-fuchsia-400 mb-1 tracking-wider uppercase flex items-center gap-2">
            <span>Now Playing</span>
            {isPlaying && (
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-fuchsia-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-2 bg-fuchsia-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-4 bg-fuchsia-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
          <h3 className="font-bold text-white truncate text-lg tracking-tight" title={currentTrack.title}>
            {currentTrack.title}
          </h3>
          <p className="text-zinc-400 text-sm truncate" title={currentTrack.artist}>
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1.5 rounded-full mb-6 overflow-hidden cursor-pointer shadow-inner relative group/bar"
           onClick={(e) => {
             if (audioRef.current) {
               const rect = e.currentTarget.getBoundingClientRect();
               const val = (e.clientX - rect.left) / rect.width;
               audioRef.current.currentTime = val * audioRef.current.duration;
             }
           }}>
        <div 
          className="h-full bg-gradient-to-r from-fuchsia-500 to-blue-500 relative transition-all duration-100 shadow-[0_0_10px_rgba(217,70,239,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={toggleMute}
          className="p-2 text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800 rounded-lg"
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={prevTrack}
            className="p-3 text-zinc-300 hover:text-fuchsia-400 transition-colors hover:bg-fuchsia-500/10 rounded-full"
            aria-label="Previous track"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center bg-zinc-100 text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-full hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <div className="ml-1">
                <Play className="w-6 h-6 fill-current" />
              </div>
            )}
          </button>
          
          <button 
            onClick={nextTrack}
            className="p-3 text-zinc-300 hover:text-fuchsia-400 transition-colors hover:bg-fuchsia-500/10 rounded-full"
            aria-label="Next track"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        <div className="w-9" /> {/* Spacer for alignment */}
      </div>

      {/* Playlist Preview */}
      <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
        {TRACKS.map((track, i) => (
          <div 
            key={track.id} 
            onClick={() => {
              setCurrentTrackIndex(i);
              setIsPlaying(true);
            }}
            className={`flex items-center justify-between text-sm p-2 rounded-lg cursor-pointer transition-colors ${
              i === currentTrackIndex 
                ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs ${i === currentTrackIndex ? 'text-fuchsia-500' : 'text-zinc-600'}`}>0{i + 1}</span>
              <span className="truncate max-w-[150px] font-medium">{track.title}</span>
            </div>
            <span className="font-mono text-xs opacity-60">{track.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-fuchsia-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Glows */}
        <div className={`absolute top-0 right-[20%] w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[120px] transition-opacity duration-1000 ${isPlayingMusic ? 'opacity-100 mix-blend-screen' : 'opacity-30'}`} />
        <div className={`absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-green-600/15 rounded-full blur-[150px] transition-opacity duration-1000 ${isPlayingMusic ? 'opacity-100 mix-blend-screen' : 'opacity-40'}`} />
        <div className={`absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] transition-opacity duration-1000 ${isPlayingMusic ? 'opacity-100 mix-blend-screen' : 'opacity-20'}`} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col pt-8 sm:pt-12 px-4 pb-12 overflow-y-auto">
        <header className="flex items-center justify-center gap-3 mb-12 flex-shrink-0">
          <Code className="w-8 h-8 text-fuchsia-500" />
          <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-fuchsia-400 to-blue-400 tracking-tight drop-shadow-sm">
            TERMINAL_ARCADE
          </h1>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 xl:gap-16">
          <SnakeGame isPlayingMusic={isPlayingMusic} />
          <MusicPlayer onPlayingStateChange={setIsPlayingMusic} />
        </main>
      </div>
    </div>
  );
}

