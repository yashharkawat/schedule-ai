import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

function fmtTime(totalMinRaw) {
  const totalMin = Math.round(totalMinRaw);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:00`;
}

export default function Schedule() {
  const navigate = useNavigate();
  const { schedule, schedules, log, streak, fetchSchedule, fetchSchedules, loading } = useStore();
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (schedules.length === 0 && !schedule) fetchSchedule();
    fetchSchedules();
  }, []);

  const allSchedules = schedules.length > 0 ? schedules : (schedule ? [schedule] : []);

  const todayLog = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return log.find(l => l.dayId === day.id && new Date(l.completedAt).toISOString().split('T')[0] === today);
  };

  if (loading && allSchedules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f5] dark:bg-[#0e2020]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (allSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col items-center justify-center px-5 pb-24">
        <p className="text-[#0f2828] dark:text-white font-black text-xl mb-3">No schedules yet</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-[#f2c029] text-[#0e2020] font-bold active:opacity-70 transition-opacity"
        >
          Get started
        </button>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a3535] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest mb-0.5">My Schedules</p>
            <h1 className="text-white font-black text-xl">{allSchedules.length} schedule{allSchedules.length !== 1 ? 's' : ''}</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            {streak > 0 && <p className="text-[#6a9090] text-xs">🔥 {streak} day streak</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 pb-24 overflow-y-auto">
        {/* Action buttons */}
        <div className="flex gap-0.5 mb-0.5 mt-0.5">
          <button
            onClick={() => navigate('/schedule/import')}
            className="flex-1 py-3.5 bg-[#dce8e8] dark:bg-[#1a3535] text-[#1a7070] dark:text-[#f2c029] font-bold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button
            onClick={() => navigate('/schedule/new')}
            className="flex-1 py-3.5 bg-[#dce8e8] dark:bg-[#1a3535] text-[#4a7272] dark:text-[#6a9090] font-bold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Build new
          </button>
        </div>

        {/* Schedule list */}
        <div className="space-y-2 px-0 mt-2">
          {allSchedules.map((sched) => {
            const isOpen = expanded[sched.id] !== false; // default open
            const days = sched.days || [];
            const totalMin = days.flatMap(d => d.steps || []).reduce((a, s) => a + (s.durationMinutes || 0), 0);

            return (
              <div key={sched.id} className="bg-[#dce8e8] dark:bg-[#1a3535]">
                {/* Schedule header */}
                <button
                  onClick={() => setExpanded(e => ({ ...e, [sched.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <p className="text-[#0f2828] dark:text-white font-black text-base">{sched.title}</p>
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5">{days.filter(d => (d.steps||[]).length > 0).length} active days · {fmtTime(totalMin)}</p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className={`text-[#4a7272] dark:text-[#6a9090] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Days */}
                {isOpen && (
                  <div className="border-t border-[#c4d8d8] dark:border-[#264040]">
                    {days.map((day) => {
                      const isToday = day.name === todayName;
                      const done = todayLog(day);
                      const stepCount = (day.steps || []).length;
                      const dayMin = (day.steps || []).reduce((a, s) => a + (s.durationMinutes || 0), 0);

                      return (
                        <div key={day.id} className="flex items-center justify-between px-4 py-3 border-b border-[#c4d8d8] dark:border-[#264040] last:border-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[#0f2828] dark:text-white font-semibold text-sm ${isToday ? 'underline decoration-[#f2c029]' : ''}`}>
                                {day.name}
                              </span>
                              {isToday && <span className="text-[10px] text-[#f2c029] font-bold uppercase tracking-wider">TODAY</span>}
                              {done && <span className="text-[#f2c029] text-xs">✓</span>}
                            </div>
                            {stepCount > 0 && (
                              <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5">{stepCount} exercise{stepCount !== 1 ? 's' : ''} · {fmtTime(dayMin)}</p>
                            )}
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
                            <span className="text-[#8aacac] dark:text-[#4a7070] text-xs">Rest</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
