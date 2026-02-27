import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { createContext, useContext, useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import GamePlayPage from './pages/GamePlayPage';

// Fullscreen context
interface FullscreenContextType {
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
}

export const FullscreenContext = createContext<FullscreenContextType>({
  isFullscreen: false,
  setIsFullscreen: () => {},
});

export function useFullscreenContext() {
  return useContext(FullscreenContext);
}

function RootLayout() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state when user presses Escape or browser exits fullscreen
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      <div className="min-h-screen flex flex-col bg-background">
        {!isFullscreen && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!isFullscreen && <Footer />}
      </div>
    </FullscreenContext.Provider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const gamePlayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play/$gameId',
  component: GamePlayPage,
});

const routeTree = rootRoute.addChildren([homeRoute, gamePlayRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
