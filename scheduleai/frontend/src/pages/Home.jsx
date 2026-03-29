import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';
import { api } from '../lib/api.js';

function fmtTime(totalMinRaw) {
  const totalMin = Math.round(totalMinRaw);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function Home() {
  const navigate = useNavigate();
  const { schedule, schedules, loading, fetchSchedules } = useStore();
  const [deleting, setDeleting] = useState(null);

  const allSchedules = schedules?.length > 0 ? schedules : (schedule ? [schedule] : []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this schedule?')) return;
    setDeleting(id);
    try {
      await api.deleteSchedule(id);
      await fetchSchedules();
    } catch (err) { alert('Failed to delete: ' + err.message); }
    setDeleting(null);
  };

  if (loading && !schedule && schedules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1eb] dark:bg-[#1a1714]">
        <div className="w-8 h-8 border-2 border-[#e0dbd0] dark:border-[#3a3530] border-t-[#8b7355] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] flex flex-col">
      <div className="flex-1 pb-24 overflow-y-auto">
        {/* Header */}
        <div className="max-w-lg mx-auto px-4 pt-8 pb-0">
          <h1 className="text-[22px] font-bold text-[#2c2a24] dark:text-[#e8e3d8]">ScheduleAI</h1>
          <p className="text-[13px] text-[#9a9486] dark:text-[#6a6458] mt-1">Your workout schedules</p>
        </div>

        {/* Create buttons */}
        <div className="max-w-lg mx-auto px-4 mt-4 flex gap-2">
          <button
            onClick={() => navigate('/schedule/new')}
            className="flex-1 py-3.5 bg-[#3d3420] dark:bg-[#8b7355] text-white font-semibold text-sm rounded-[10px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Schedule
          </button>
          <button
            onClick={() => navigate('/schedule/import')}
            className="flex-1 py-3.5 bg-[#f0ece4] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] font-semibold text-sm rounded-[10px] border border-[#e0dbd0] dark:border-[#3a3530] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
        </div>

        {/* Schedule list */}
        {allSchedules.length === 0 && !loading ? (
          <div className="max-w-lg mx-auto text-center py-20 px-6">
            <p className="text-[16px] font-semibold text-[#5a5548] dark:text-[#9a9486] mb-2">No schedules yet</p>
            <p className="text-[14px] text-[#9a9486] dark:text-[#6a6458]">Create or import a schedule to get started.</p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-4 mt-5 space-y-3">
            {allSchedules.map((sched) => {
              const days = sched.days || [];
              const totalExercises = days.reduce((a, d) => a + (d.steps || []).length, 0);
              const totalMin = days.reduce((a, d) => a + (d.steps || []).reduce((b, s) => b + s.durationMinutes * (s.sets || 1), 0), 0);

              return (
                <div
                  key={sched.id}
                  className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden hover:border-[#8b7355] dark:hover:border-[#8b7355] transition-colors"
                >
                  <button
                    onClick={() => navigate(`/play/${sched.id}`)}
                    className="w-full text-left px-4 pt-4 pb-3 active:scale-[0.98] transition-transform"
                  >
                    <h3 className="text-[18px] font-bold text-[#2c2a24] dark:text-[#e8e3d8] leading-tight">{sched.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[13px] text-[#9a9486] dark:text-[#6a6458]">{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}</span>
                      <span className="text-[13px] text-[#9a9486] dark:text-[#6a6458]">{fmtTime(totalMin)}</span>
                      <span className="text-[13px] text-[#9a9486] dark:text-[#6a6458]">{days.length} day{days.length !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                  <div className="flex items-center justify-end gap-1 px-3 pb-3 border-t border-[#f0ece4] dark:border-[#3a3530] pt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/schedule/edit/${sched.id}`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[#5a5548] dark:text-[#9a9486] text-[13px] font-semibold rounded-lg hover:bg-[#f0ece4] dark:hover:bg-[#2e2b26] transition-colors active:scale-[0.97]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, sched.id)}
                      disabled={deleting === sched.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[#b85c38] dark:text-[#c47a5a] text-[13px] font-semibold rounded-lg hover:bg-[#f0ece4] dark:hover:bg-[#2e2b26] transition-colors disabled:opacity-40 active:scale-[0.97]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      {deleting === sched.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NavBar />
    </div>
  );
}
