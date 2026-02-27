import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { lazy, Suspense, ComponentType, useEffect, useCallback } from 'react';
import { useFullscreenContext } from '../App';

const gameComponents: Record<string, React.LazyExoticComponent<ComponentType>> = {
  'shadow-run': lazy(() => import('../components/games/ShadowRunGame')),
  'prism-jump': lazy(() => import('../components/games/PrismJumpGame')),
  'cyber-strike': lazy(() => import('../components/games/CyberStrikeGame')),
  'pixel-voyage': lazy(() => import('../components/games/PixelVoyageGame')),
  'arena-blitz': lazy(() => import('../components/games/ArenaBlitzGame')),
  'grid-wars': lazy(() => import('../components/games/GridWarsGame')),
  'rune-quest': lazy(() => import('../components/games/RuneQuestGame')),
  'voxel-realms': lazy(() => import('../components/games/VoxelRealmsGame')),
  'neon-kick': lazy(() => import('../components/games/NeonKickGame')),
  'stellar-assault': lazy(() => import('../components/games/StellarAssaultGame')),
  'neon-racers': lazy(() => import('../components/games/NeonRacersGame')),
};

const gameInfo: Record<string, { title: string; description: string; color: string }> = {
  'shadow-run': { title: 'Shadow Run', description: 'Endless runner through neon shadows', color: '#a855f7' },
  'prism-jump': { title: 'Prism Jump', description: 'Navigate a glowing ball through prismatic tunnels', color: '#22d3ee' },
  'cyber-strike': { title: 'Cyber Strike', description: 'Tactical cyber warfare shooter', color: '#f43f5e' },
  'pixel-voyage': { title: 'Pixel Voyage', description: 'Fly through pixel skies', color: '#4ade80' },
  'arena-blitz': { title: 'Arena Blitz', description: 'Fast-paced arena combat', color: '#fb923c' },
  'grid-wars': { title: 'Grid Wars', description: 'Strategic grid-based warfare', color: '#22d3ee' },
  'rune-quest': { title: 'Rune Quest', description: 'Ancient rune-powered magic combat', color: '#a855f7' },
  'voxel-realms': { title: 'Voxel Realms', description: 'Build and defend your voxel kingdom', color: '#4ade80' },
  'neon-kick': { title: 'Neon Kick', description: 'Neon-lit soccer action', color: '#facc15' },
  'stellar-assault': { title: 'Stellar Assault', description: 'Rhythm-based space shooter', color: '#f43f5e' },
  'neon-racers': { title: 'Neon Racers', description: 'High-speed neon racing', color: '#facc15' },
};

export default function GamePlayPage() {
  const { gameId } = useParams({ from: '/play/$gameId' });
  const navigate = useNavigate();
  const { isFullscreen, setIsFullscreen } = useFullscreenContext();
  const info = gameInfo[gameId] || { title: gameId, description: '', color: '#4ade80' };
  const GameComponent = gameComponents[gameId];

  // Keep context in sync with actual fullscreen state
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [setIsFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 text-muted-foreground hover:text-neon-green transition-colors font-arcade text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-arcade text-sm truncate" style={{ color: info.color, textShadow: `0 0 10px ${info.color}` }}>
            {info.title}
          </h1>
          <p className="text-muted-foreground text-xs font-rajdhani truncate">{info.description}</p>
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="flex items-center gap-2 text-muted-foreground hover:text-neon-green transition-colors font-arcade text-xs px-2 py-1 border border-border hover:border-neon-green rounded"
        >
          {isFullscreen ? (
            <>
              <Minimize className="w-4 h-4" />
              <span className="hidden sm:inline">EXIT</span>
            </>
          ) : (
            <>
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">FULLSCREEN</span>
            </>
          )}
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center bg-background p-2 overflow-auto">
        {GameComponent ? (
          <Suspense fallback={
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
              <p className="font-arcade text-neon-green text-sm animate-pulse">LOADING...</p>
            </div>
          }>
            <GameComponent />
          </Suspense>
        ) : (
          <div className="text-center">
            <p className="font-arcade text-destructive text-sm">GAME NOT FOUND</p>
            <p className="text-muted-foreground text-xs mt-2 font-rajdhani">Game ID: {gameId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
