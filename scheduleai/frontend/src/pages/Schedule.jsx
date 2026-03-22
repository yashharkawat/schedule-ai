import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

function fmtTime(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:00`;
}

export default function Schedule() {
  const navigate = useNavigate();
  const { schedule, log, streak, fetchSchedule, loading } = useStore();
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => { if (!schedule) fetchSchedule(); }, []);

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

  if (!schedule) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col items-center justify-center px-5 pb-24">
        <p className="text-[#0f2828] dark:text-white font-black text-xl mb-3">No schedule yet</p>
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
            <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest mb-0.5">My Schedule</p>
            <h1 className="text-white font-black text-xl">{schedule.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            {streak > 0 && <p className="text-[#6a9090] text-xs">🔥 {streak} day streak</p>}
            <p className="text-[#6a9090] text-xs">{schedule.restSeconds}s rest</p>
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
            Import new
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

        {/* Day cards */}
        <div className="space-y-0.5">
          {(schedule.days || []).map((day) => {
            const isToday = day.name === todayName;
            const done = todayLog(day);
            const totalMin = (day.steps || []).reduce((a, s) => a + s.durationMinutes * (s.sets || 1), 0);
            const stepCount = (day.steps || []).length;
            const avgSets = stepCount > 0
              ? Math.round((day.steps || []).reduce((a, s) => a + (s.sets || 1), 0) / stepCount)
              : 1;

            return (
              <div key={day.id} className="bg-[#dce8e8] dark:bg-[#1a3535] px-4 pt-4 pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[#0f2828] dark:text-white font-bold text-lg ${isToday ? 'underline decoration-[#f2c029] dark:decoration-[#f2c029]' : ''}`}>
                      {day.name}
                    </span>
                    {isToday && <span className="text-[#1a7070] dark:text-[#f2c029] text-[10px] font-bold uppercase tracking-wider">TODAY</span>}
                    {done && <span className="text-[#1a7070] dark:text-[#f2c029] text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-[#4a7272] dark:text-[#6a9090] text-sm font-mono">{fmtTime(totalMin)}</span>
                </div>

                {stepCount > 0 ? (
                  <div className="space-y-0.5 mb-3">
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                      <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">SETS</span>
                      {avgSets}x
                    </p>
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                      <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">EXERCISES</span>
                      {stepCount}
                    </p>
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">
                      <span className="text-[#0f2828] dark:text-white font-semibold text-xs uppercase tracking-wider mr-2">REST</span>
                      {String(Math.floor(schedule.restSeconds / 60)).padStart(2,'0')}:{String(schedule.restSeconds % 60).padStart(2,'0')}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#8aacac] dark:text-[#4a7070] text-sm mb-3">Rest day</p>
                )}

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

      <NavBar />
    </div>
  );
}
