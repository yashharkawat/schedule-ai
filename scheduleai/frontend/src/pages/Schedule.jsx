import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

export default function Schedule() {
  const navigate = useNavigate();
  const { schedule, log, streak, fetchSchedule, loading } = useStore();
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    if (!schedule) fetchSchedule();
  }, []);

  if (loading && !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1eb] dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] dark:bg-gray-950 flex flex-col items-center justify-center px-5 pb-24">
        <div className="w-16 h-16 bg-[#e8e2d8] dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-[#2c2a24] dark:text-gray-100">No schedule yet</h2>
        <p className="text-[#7a7060] dark:text-gray-400 mb-8 text-center">Create your first schedule to get started.</p>
        <button onClick={() => navigate('/')}
          className="px-8 py-3.5 bg-[#3d3420] text-white rounded-2xl font-semibold hover:bg-[#2c2412] active:scale-95 transition-all shadow-sm">
          Get started
        </button>
        <NavBar />
      </div>
    );
  }

  const todayLog = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return log.find(l => l.dayId === day.id && new Date(l.completedAt).toISOString().split('T')[0] === today);
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-5 pt-8 pb-28">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-3">
            <h1 className="text-2xl font-bold text-[#2c2a24] dark:text-gray-50 truncate">{schedule.title}</h1>
            {schedule.description && (
              <p className="text-sm text-[#7a7060] dark:text-gray-400 mt-1 truncate">{schedule.description}</p>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-base">🔥</span>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{streak} day streak</span>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-[#e0dbd0] dark:border-gray-700 text-[#5a5548] dark:text-gray-300 rounded-xl text-sm font-medium hover:border-[#8b7355] dark:hover:border-amber-700 active:scale-95 transition-all shadow-sm"
          >
            + New
          </button>
        </div>

        {/* Day cards */}
        <div className="space-y-3">
          {(schedule.days || []).map((day) => {
            const isToday = day.name === todayName;
            const done = todayLog(day);
            const totalMin = (day.steps || []).reduce((a, s) => a + s.durationMinutes, 0);
            const stepCount = (day.steps || []).length;

            return (
              <div
                key={day.id}
                className={`bg-white dark:bg-gray-800/80 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isToday
                    ? 'border-[#8b7355] dark:border-amber-700/60 shadow-md'
                    : 'border-[#e8e2d8] dark:border-gray-700/60'
                }`}
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#2c2a24] dark:text-gray-100 text-base">{day.name}</h3>
                        {isToday && (
                          <span className="text-[10px] font-bold bg-[#3d3420] text-white px-2 py-0.5 rounded-full tracking-wide uppercase">
                            Today
                          </span>
                        )}
                        {done && (
                          <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full tracking-wide uppercase flex items-center gap-1">
                            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3"/>
                            </svg>
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9a9486] dark:text-gray-400 mt-1">
                        {stepCount} exercise{stepCount !== 1 ? 's' : ''} · {totalMin} min
                      </p>
                    </div>
                  </div>

                  {/* Start button */}
                  <button
                    onClick={() => navigate(`/session/${day.id}`)}
                    disabled={stepCount === 0}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                      stepCount === 0
                        ? 'bg-[#f0ece4] dark:bg-gray-700 text-[#b0a898] dark:text-gray-500 cursor-not-allowed'
                        : isToday
                        ? 'bg-[#3d3420] dark:bg-[#3d3420] text-white hover:bg-[#2c2412] shadow-sm'
                        : 'bg-[#f4f1eb] dark:bg-gray-700 text-[#3d3420] dark:text-amber-400 hover:bg-[#ede8df] dark:hover:bg-gray-600'
                    }`}
                  >
                    {stepCount === 0 ? 'No exercises' : (
                      <>
                        Start session
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </>
                    )}
                  </button>
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
