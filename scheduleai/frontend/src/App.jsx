import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import useStore from './store/useStore.js';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
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
    if (!settings.keepAlive) return;
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const id = setInterval(() => {
      fetch(`${BASE}/health`).catch(() => {});
    }, 8 * 60 * 1000);
    return () => clearInterval(id);
  }, [settings.keepAlive]);

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
      <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] text-[#0f2828] dark:text-white">
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/schedule" element={<AuthGuard><Schedule /></AuthGuard>} />
          <Route path="/schedule/new" element={<AuthGuard><ScheduleEditor /></AuthGuard>} />
          <Route path="/schedule/import" element={<AuthGuard><ImportSchedule /></AuthGuard>} />
          <Route path="/schedule/edit/:scheduleId" element={<AuthGuard><ScheduleEditor /></AuthGuard>} />
          <Route path="/session/:dayId" element={<AuthGuard><Session /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
