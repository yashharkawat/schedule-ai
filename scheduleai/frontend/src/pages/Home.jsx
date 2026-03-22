import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';
import { api } from '../lib/api.js';

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

function fmtTime(totalMinRaw) {
  const totalMin = Math.round(totalMinRaw);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:00`;
}

function NumStepper({ value, onDec, onInc, min = 0, max = 99 }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onDec} disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center bg-[#dce8e8] dark:bg-[#2c4848] text-[#0f2828] dark:text-white font-bold text-lg rounded-sm disabled:opacity-30 active:opacity-60">−</button>
      <span className="text-[#0f2828] dark:text-white font-bold text-lg w-8 text-center tabular-nums">{value}</span>
      <button onClick={onInc} disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center bg-[#dce8e8] dark:bg-[#2c4848] text-[#0f2828] dark:text-white font-bold text-lg rounded-sm disabled:opacity-30 active:opacity-60">+</button>
    </div>
  );
}

function fmtMmSs(min, sec) {
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { schedule, schedules, log, streak, loading, settings, saveSettings, fetchSchedules } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showQS, setShowQS] = useState(false);
  const [qsSaving, setQSSaving] = useState(false);

  // Quickstart state
  const [qsTitle, setQsTitle] = useState('Exercise');
  const [qsSets, setQsSets] = useState(3);
  const [qsWorkMin, setQsWorkMin] = useState(5);
  const [qsWorkSec, setQsWorkSec] = useState(0);
  const [qsRestSec, setQsRestSec] = useState(30);
  // Save to schedule pickers
  const [qsStep, setQsStep] = useState('config'); // 'config' | 'save'
  const [qsPickedSched, setQsPickedSched] = useState(null);
  const [qsPickedDay, setQsPickedDay] = useState(null);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const openQS = () => { setQsStep('config'); setQsPickedSched(null); setQsPickedDay(null); setShowQS(true); };
  const closeQS = () => setShowQS(false);

  const startNow = () => {
    localStorage.setItem('scheduleai-quickstart', JSON.stringify({
      title: qsTitle, sets: qsSets, workMinutes: qsWorkMin, workSeconds: qsWorkSec, restSeconds: qsRestSec,
    }));
    setShowQS(false);
    navigate('/session/quickstart');
  };

  const saveToSchedule = async () => {
    if (!qsPickedDay) return;
    setQSSaving(true);
    try {
      const durationMinutes = qsWorkMin + qsWorkSec / 60;
      await api.createStep(qsPickedDay, { title: qsTitle, durationMinutes: Math.max(1, Math.round(durationMinutes)), sets: qsSets, instructions: '' });
      await fetchSchedules();
      setShowQS(false);
    } catch (e) { alert('Failed to save: ' + e.message); }
    setQSSaving(false);
  };

  // Aggregate all days across all schedules, fall back to single schedule
  const allSchedules = schedules?.length > 0 ? schedules : (schedule ? [schedule] : []);
  const allDays = allSchedules.flatMap(s => (s.days || []).map(d => ({ ...d, scheduleTitle: s.title, restSeconds: s.restSeconds ?? 30 })));

  const todayLog = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return log.find(l => l.dayId === day.id && new Date(l.completedAt).toISOString().split('T')[0] === today);
  };

  if (loading && !schedule && schedules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f5f5] dark:bg-[#0e2020]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // NO SCHEDULE
  if (allDays.length === 0 && !loading) {
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

  const todayDay = allDays.find(d => d.name === todayName);

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
                  <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">{stepCount} exercise{stepCount !== 1 ? 's' : ''} · {fmtTime(totalMin)}</p>
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

        {/* QUICK START */}
        <div className="px-4 mt-3 mb-1">
          <button
            onClick={openQS}
            className="w-full py-3.5 bg-[#dce8e8] dark:bg-[#1a3535] border border-dashed border-[#4a7272] dark:border-[#4a7070] text-[#4a7272] dark:text-[#6a9090] font-bold text-sm flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            QUICK START
          </button>
        </div>

        {/* Ad banner (configurable) */}
        {settings.showAds && (
          <div className="mx-4 mt-3 mb-1 bg-[#dce8e8] dark:bg-[#1a3535] border border-[#c4d8d8] dark:border-[#264040] px-4 py-3 flex items-center justify-center">
            <p className="text-[#8aacac] dark:text-[#4a7070] text-xs text-center">[ Advertisement ]</p>
          </div>
        )}

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
                  <div>
                    {allSchedules.length > 1 && (
                      <p className="text-[#6a9090] text-[10px] uppercase tracking-widest font-bold mb-0.5">{day.scheduleTitle}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-[#0f2828] dark:text-white font-bold text-lg leading-tight ${isToday ? 'underline decoration-[#f2c029]' : ''}`}>
                        {day.name}
                      </span>
                      {done && <span className="text-[#1a7070] dark:text-[#f2c029] text-xs font-bold">✓</span>}
                    </div>
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
                      {day.restSeconds ?? 30}s
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

      {/* Quick Start sheet */}
      {showQS && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={closeQS}>
          <div className="bg-[#f0f5f5] dark:bg-[#1a3535] rounded-t-2xl px-5 pt-4 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#c4d8d8] dark:bg-[#264040] rounded-full mx-auto mb-5" />

            {qsStep === 'config' && (
              <>
                <p className="text-[#0f2828] dark:text-white font-black text-xl mb-5">Quick Start</p>

                {/* Title */}
                <div className="mb-5">
                  <p className="text-[#4a7272] dark:text-[#6a9090] text-xs font-bold uppercase tracking-widest mb-2">Exercise name</p>
                  <input
                    className="w-full bg-[#dce8e8] dark:bg-[#264040] text-[#0f2828] dark:text-white px-3 py-2.5 text-base focus:outline-none"
                    value={qsTitle}
                    onChange={e => setQsTitle(e.target.value)}
                    placeholder="Exercise"
                  />
                </div>

                {/* Sets */}
                <div className="flex items-center justify-between py-4 border-b border-[#c4d8d8] dark:border-[#264040]">
                  <p className="text-[#0f2828] dark:text-white font-semibold">Sets</p>
                  <NumStepper value={qsSets} min={1} max={20} onDec={() => setQsSets(v => Math.max(1,v-1))} onInc={() => setQsSets(v => Math.min(20,v+1))} />
                </div>

                {/* Work */}
                <div className="flex items-center justify-between py-4 border-b border-[#c4d8d8] dark:border-[#264040]">
                  <div>
                    <p className="text-[#0f2828] dark:text-white font-semibold">Work</p>
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-xs">{fmtMmSs(qsWorkMin, qsWorkSec)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[#4a7272] dark:text-[#6a9090] text-[10px] mb-1">MIN</p>
                      <NumStepper value={qsWorkMin} min={0} max={60} onDec={() => setQsWorkMin(v => Math.max(0,v-1))} onInc={() => setQsWorkMin(v => Math.min(60,v+1))} />
                    </div>
                    <div className="text-center">
                      <p className="text-[#4a7272] dark:text-[#6a9090] text-[10px] mb-1">SEC</p>
                      <NumStepper value={qsWorkSec} min={0} max={55} onDec={() => setQsWorkSec(v => Math.max(0,v-5))} onInc={() => setQsWorkSec(v => Math.min(55,v+5))} />
                    </div>
                  </div>
                </div>

                {/* Rest */}
                <div className="flex items-center justify-between py-4 border-b border-[#c4d8d8] dark:border-[#264040]">
                  <div>
                    <p className="text-[#0f2828] dark:text-white font-semibold">Rest</p>
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-xs">{qsRestSec}s</p>
                  </div>
                  <NumStepper value={qsRestSec} min={0} max={120} onDec={() => setQsRestSec(v => Math.max(0,v-5))} onInc={() => setQsRestSec(v => Math.min(120,v+5))} />
                </div>

                <button
                  onClick={startNow}
                  disabled={qsWorkMin === 0 && qsWorkSec === 0}
                  className="w-full mt-5 py-4 bg-[#f2c029] text-[#0e2020] font-bold text-base active:opacity-70 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Start now
                </button>
                <button
                  onClick={() => { setQsPickedSched(null); setQsPickedDay(null); setQsStep('save'); }}
                  className="w-full mt-3 py-3 text-[#4a7272] dark:text-[#6a9090] font-semibold text-sm active:opacity-70"
                >
                  Save to schedule
                </button>
              </>
            )}

            {qsStep === 'save' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setQsStep('config')} className="text-[#4a7272] dark:text-[#6a9090]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <p className="text-[#0f2828] dark:text-white font-black text-xl">Save to schedule</p>
                </div>
                {allSchedules.length === 0 ? (
                  <p className="text-[#4a7272] dark:text-[#6a9090] text-sm text-center py-8">No schedules yet. Create one first.</p>
                ) : (
                  <>
                    {allSchedules.map(sched => (
                      <div key={sched.id} className="mb-3">
                        <p className="text-[#0f2828] dark:text-white font-bold text-sm mb-1 px-1">{sched.title}</p>
                        {(sched.days || []).map(day => (
                          <button
                            key={day.id}
                            onClick={() => { setQsPickedSched(sched.id); setQsPickedDay(day.id); }}
                            className={`w-full flex items-center justify-between px-4 py-3 mb-0.5 text-left transition-colors ${
                              qsPickedDay === day.id
                                ? 'bg-[#f2c029] text-[#0e2020]'
                                : 'bg-[#dce8e8] dark:bg-[#264040] text-[#0f2828] dark:text-white'
                            }`}
                          >
                            <span className="font-semibold text-sm">{day.name}</span>
                            <span className="text-xs opacity-60">{(day.steps||[]).length} exercises</span>
                          </button>
                        ))}
                      </div>
                    ))}
                    <button
                      onClick={saveToSchedule}
                      disabled={!qsPickedDay || qsSaving}
                      className="w-full mt-4 py-4 bg-[#f2c029] text-[#0e2020] font-bold text-base active:opacity-70 disabled:opacity-40"
                    >
                      {qsSaving ? 'Saving...' : 'Add to day'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

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
