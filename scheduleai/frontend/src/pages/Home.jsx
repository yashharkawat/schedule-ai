import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

function TopBar({ settings, saveSettings, onMenu }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#1a3535]">
      <button
        onClick={() => saveSettings({ soundsEnabled: !settings.soundsEnabled })}
        className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
      >
        {settings.soundsEnabled ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        )}
      </button>
      <input
        type="range" min="0" max="1" step="0.05"
        value={settings.soundVolume}
        onChange={e => saveSettings({ soundVolume: +e.target.value })}
        className="flex-1 bg-[#2a4545]"
        style={{ accentColor: '#ffffff' }}
      />
      <button onClick={onMenu} className="flex-shrink-0 text-white/60 hover:text-white transition-colors px-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
    </div>
  );
}

function fmtTime(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:00`;
}

export default function Home() {
  const navigate = useNavigate();
  const { schedule, log, streak, loading, settings, saveSettings } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const todayLog = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return log.find(l => l.dayId === day.id && new Date(l.completedAt).toISOString().split('T')[0] === today);
  };

  if (loading && !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f5] dark:bg-[#0e2020]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // NO SCHEDULE
  if (!schedule) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col">
        <TopBar settings={settings} saveSettings={saveSettings} onMenu={() => navigate('/settings')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
          <p className="text-[#4a7272] dark:text-[#6a9090] text-sm font-bold uppercase tracking-widest mb-3">ScheduleAI</p>
          <h1 className="text-[#0f2828] dark:text-white text-2xl font-black mb-2 text-center">No schedule yet</h1>
          <p className="text-[#4a7272] dark:text-[#6a9090] text-sm text-center mb-10 leading-relaxed">
            Create a weekly workout schedule and run guided timed sessions.
          </p>
          <button
            onClick={() => navigate('/schedule/import')}
            className="w-full py-4 bg-[#f2c029] text-[#0e2020] font-bold text-base rounded-sm mb-3 active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import from document
          </button>
          <button
            onClick={() => navigate('/schedule/new')}
            className="w-full py-4 bg-[#1a3535] text-white font-bold text-base rounded-sm active:opacity-80 transition-opacity"
          >
            Build manually
          </button>
        </div>
        <NavBar />
      </div>
    );
  }

  const todayDay = (schedule.days || []).find(d => d.name === todayName);
  const allDays = schedule.days || [];

  return (
    <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col">
      <TopBar settings={settings} saveSettings={saveSettings} onMenu={() => setShowMenu(true)} />

      <div className="flex-1 pb-24 overflow-y-auto">

        {/* TODAY section */}
        {todayDay && (() => {
          const totalMin = (todayDay.steps || []).reduce((a, s) => a + s.durationMinutes * (s.sets || 1), 0);
          const stepCount = (todayDay.steps || []).length;
          const done = todayLog(todayDay);
          return (
            <div className="px-4 pt-5 pb-0">
              <p className="text-[#4a7272] dark:text-[#6a9090] text-xs font-bold uppercase tracking-widest mb-1">Today</p>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-[#0f2828] dark:text-white text-2xl font-black">{todayDay.name}</h2>
                {done && <span className="text-[#1a7070] dark:text-[#f2c029] text-xs font-bold uppercase tracking-widest">✓ Done</span>}
                {streak > 0 && <span className="text-[#4a7272] dark:text-[#6a9090] text-xs">🔥 {streak}</span>}
              </div>
              <div className="bg-[#dce8e8] dark:bg-[#1a3535] mb-4">
                <div className="px-4 py-4">
                  <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">{stepCount} exercise{stepCount !== 1 ? 's' : ''} · {totalMin} min</p>
                </div>
                <button
                  onClick={() => stepCount > 0 && navigate(`/session/${todayDay.id}`)}
                  disabled={stepCount === 0}
                  className={`w-full py-4 font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-70 ${
                    stepCount === 0
                      ? 'bg-[#c4d8d8] dark:bg-[#2a4040] text-[#8aacac]'
                      : 'bg-[#f2c029] text-[#0e2020]'
                  }`}
                >
                  {stepCount > 0 && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                  {stepCount === 0 ? 'No exercises' : 'START'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* YOUR SCHEDULE header */}
        <div className="px-4 mt-2 mb-3 flex items-center justify-between">
          <p className="text-[#0f2828] dark:text-white font-black text-xl uppercase tracking-wide">Your Schedule</p>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/schedule/new')} className="text-[#4a7272] dark:text-[#6a9090] p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={() => navigate('/schedule/import')}
              className="border border-[#4a7272] dark:border-[#4a7070] px-3 py-1 rounded-full text-[#4a7272] dark:text-[#6a9090] text-xs font-bold flex items-center gap-1"
            >
              + ADD
            </button>
          </div>
        </div>

        {/* Day preset cards */}
        <div className="space-y-0.5">
          {allDays.map((day) => {
            const totalMin = (day.steps || []).reduce((a, s) => a + s.durationMinutes * (s.sets || 1), 0);
            const stepCount = (day.steps || []).length;
            const isToday = day.name === todayName;
            const done = todayLog(day);
            const avgSets = stepCount > 0 ? Math.round((day.steps || []).reduce((a, s) => a + (s.sets || 1), 0) / stepCount) : 1;

            return (
              <div key={day.id} className="bg-[#dce8e8] dark:bg-[#1a3535] px-4 pt-4 pb-0">
                {/* Card header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[#0f2828] dark:text-white font-bold text-lg leading-tight ${isToday ? 'underline decoration-[#f2c029]' : ''}`}>
                      {day.name}
                    </span>
                    {done && <span className="text-[#1a7070] dark:text-[#f2c029] text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-[#4a7272] dark:text-[#6a9090] text-sm font-mono">{fmtTime(totalMin)}</span>
                </div>

                {/* Card details */}
                {stepCount > 0 ? (
                  <div className="space-y-0.5 mb-3">
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                      <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">EXERCISES</span>
                      {stepCount}
                    </p>
                    {avgSets > 1 && (
                      <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                        <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">SETS</span>
                        {avgSets}x avg
                      </p>
                    )}
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                      <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">REST</span>
                      {schedule.restSeconds}s
                    </p>
                  </div>
                ) : (
                  <p className="text-[#8aacac] dark:text-[#4a7070] text-sm mb-3">Rest day</p>
                )}

                {/* Card actions */}
                <div className="flex items-center justify-between border-t border-[#c4d8d8] dark:border-[#264040] py-3">
                  <div className="flex items-center gap-5">
                    <button className="text-[#8aacac] dark:text-[#4a7070]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                      </svg>
                    </button>
                    <button className="text-[#8aacac] dark:text-[#4a7070]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  </div>
                  {stepCount > 0 ? (
                    <button
                      onClick={() => navigate(`/session/${day.id}`)}
                      className="text-[#1a7070] dark:text-[#f2c029] font-bold text-sm flex items-center gap-1.5 active:opacity-70 transition-opacity"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      START
                    </button>
                  ) : (
                    <span className="text-[#8aacac] dark:text-[#4a7070] text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute top-12 right-2 bg-[#264040] dark:bg-[#264040] rounded-lg shadow-xl py-1 min-w-48" onClick={e => e.stopPropagation()}>
            {[
              { label: 'Settings', action: () => { setShowMenu(false); navigate('/settings'); } },
              { label: 'New Schedule', action: () => { setShowMenu(false); navigate('/schedule/new'); } },
              { label: 'Import Schedule', action: () => { setShowMenu(false); navigate('/schedule/import'); } },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="w-full text-left px-5 py-3.5 text-white text-base hover:bg-white/10 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
}
