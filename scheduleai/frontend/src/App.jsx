import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import useStore from './store/useStore.js';
import Home from './pages/Home.jsx';
import ScheduleSession from './pages/ScheduleSession.jsx';
import Session from './pages/Session.jsx';
import Settings from './pages/Settings.jsx';
import ScheduleEditor from './pages/ScheduleEditor.jsx';
import ImportSchedule from './pages/ImportSchedule.jsx';
import Profile from './pages/Profile.jsx';
import SignIn from './pages/SignIn.jsx';

function AuthGuard({ children }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App() {
  const { isSignedIn } = useAuth();
  const { settings, fetchSchedule, fetchSchedules, fetchSettings, fetchLog, fetchStreak } = useStore();

  useEffect(() => {
    if (isSignedIn) {
      fetchSettings();
      fetchSchedule();
      fetchSchedules();
      fetchLog();
      fetchStreak();
    }
  }, [isSignedIn]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('button, [role="button"], a, input[type="range"]')) {
        navigator.vibrate?.(8);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  useEffect(() => {
    const apply = (theme) => {
      if (theme === 'auto') {
        document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    };
    apply(settings.theme);
    if (settings.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => document.documentElement.classList.toggle('dark', e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] text-[#2c2a24] dark:text-[#e8e3d8]">
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/play/:scheduleId" element={<AuthGuard><ScheduleSession /></AuthGuard>} />
          <Route path="/session/:dayId" element={<AuthGuard><Session /></AuthGuard>} />
          <Route path="/schedule" element={<Navigate to="/" replace />} />
          <Route path="/schedule/new" element={<AuthGuard><ScheduleEditor /></AuthGuard>} />
          <Route path="/schedule/import" element={<AuthGuard><ImportSchedule /></AuthGuard>} />
          <Route path="/schedule/edit/:scheduleId" element={<AuthGuard><ScheduleEditor /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
