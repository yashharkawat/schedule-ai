import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import useStore from '../store/useStore.js';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function emptyStep(index) {
  return { _id: `step-${Date.now()}-${index}`, title: '', durationMinutes: 3, instructions: '', sets: 3 };
}

function fmtMmSs(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
}

function TimeStepper({ label, valueSec, onDec, onInc }) {
  return (
    <div className="py-5">
      <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest text-center mb-3">{label}</p>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onDec}
          className="w-12 h-12 flex items-center justify-center bg-[#2c4848] text-white font-bold text-2xl rounded-sm active:opacity-70"
        >
          −
        </button>
        <span className="text-white font-light text-3xl min-w-[7rem] text-center tabular-nums">{fmtMmSs(valueSec)}</span>
        <button
          onClick={onInc}
          className="w-12 h-12 flex items-center justify-center bg-[#2c4848] text-white font-bold text-2xl rounded-sm active:opacity-70"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CountStepper({ label, value, onDec, onInc }) {
  return (
    <div className="py-5">
      <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest text-center mb-3">{label}</p>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onDec}
          className="w-12 h-12 flex items-center justify-center bg-[#2c4848] text-white font-bold text-2xl rounded-sm active:opacity-70"
        >
          −
        </button>
        <span className="text-white font-light text-4xl min-w-[3rem] text-center tabular-nums">{value}</span>
        <button
          onClick={onInc}
          className="w-12 h-12 flex items-center justify-center bg-[#2c4848] text-white font-bold text-2xl rounded-sm active:opacity-70"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ScheduleEditor() {
  const navigate = useNavigate();
  const { fetchSchedule } = useStore();

  const [title, setTitle] = useState('');
  const [restSeconds, setRestSeconds] = useState(30);
  const [days, setDays] = useState(
    DEFAULT_DAYS.map((name, i) => ({ _id: `day-${i}`, name, steps: [] }))
  );
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [saving, setSaving] = useState(false);

  const addStep = (di) => {
    const newDays = [...days];
    const step = emptyStep(newDays[di].steps.length);
    newDays[di] = { ...newDays[di], steps: [...newDays[di].steps, step] };
    setDays(newDays);
    setExpandedStep(step._id);
  };

  const removeStep = (di, si) => {
    const newDays = [...days];
    const steps = [...newDays[di].steps];
    steps.splice(si, 1);
    newDays[di] = { ...newDays[di], steps };
    setDays(newDays);
    setExpandedStep(null);
  };

  const updateStep = (di, si, field, value) => {
    const newDays = [...days];
    const steps = [...newDays[di].steps];
    steps[si] = { ...steps[si], [field]: value };
    newDays[di] = { ...newDays[di], steps };
    setDays(newDays);
  };

  const handleSave = async () => {
    if (!title.trim()) { alert('Please enter a schedule name.'); return; }
    setSaving(true);
    try {
      await api.importSchedule({
        title: title.trim(),
        restSeconds: Number(restSeconds) || 30,
        days: days.map(day => ({
          name: day.name,
          steps: day.steps.map(step => ({
            title: step.title || 'Exercise',
            durationMinutes: Number(step.durationMinutes) || 3,
            instructions: step.instructions || null,
            sets: Number(step.sets) || 1,
          })),
        })),
      });
      await fetchSchedule();
      navigate('/schedule');
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute total time
  const totalSec = days.reduce((acc, day) =>
    acc + day.steps.reduce((a, s) => a + (Number(s.durationMinutes) || 0) * 60 * (Number(s.sets) || 1), 0) + (day.steps.length > 1 ? (day.steps.length - 1) * restSeconds : 0), 0
  );
  const totalMin = Math.floor(totalSec / 60);
  const totalS = totalSec % 60;

  return (
    <div className="min-h-screen bg-[#0e2020] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a3535]">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition-colors p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <p className="text-white font-bold text-base">New Schedule</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[#f2c029] font-bold text-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          {saving ? 'Saving...' : 'SAVE'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Schedule name */}
        <div className="px-5 pt-6 pb-4">
          <div className="border border-[#4a7070] px-4 py-3">
            <label className="text-[#6a9090] text-xs uppercase tracking-widest block mb-1">Schedule Name</label>
            <input
              className="w-full bg-transparent text-white text-base placeholder-[#4a7070] focus:outline-none"
              placeholder="e.g. Morning Routine"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </div>

        {/* Rest between exercises */}
        <div className="px-5 border-b border-[#1e3838]">
          <TimeStepper
            label="Rest between exercises"
            valueSec={restSeconds}
            onDec={() => setRestSeconds(s => Math.max(0, s - 5))}
            onInc={() => setRestSeconds(s => Math.min(300, s + 5))}
          />
        </div>

        {/* Days */}
        <div className="mt-2">
          {days.map((day, di) => {
            const totalMin = day.steps.reduce((a, s) => a + (Number(s.durationMinutes) || 0) * (Number(s.sets) || 1), 0);
            const isOpen = expandedDay === di;

            return (
              <div key={day._id} className="border-b border-[#1e3838]">
                {/* Day header */}
                <button
                  onClick={() => { setExpandedDay(isOpen ? null : di); setExpandedStep(null); }}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1a3535] transition-colors"
                >
                  <span className="text-white font-semibold text-base">{day.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#6a9090] text-sm">
                      {day.steps.length > 0 ? `${day.steps.length} ex · ${totalMin} min` : 'Empty'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-[#4a7070] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                {/* Day content */}
                {isOpen && (
                  <div className="bg-[#0a1818]">
                    {day.steps.map((step, si) => {
                      const isStepOpen = expandedStep === step._id;
                      return (
                        <div key={step._id} className="border-b border-[#1e3838]">
                          {/* Step header */}
                          <button
                            onClick={() => setExpandedStep(isStepOpen ? null : step._id)}
                            className="w-full flex items-center justify-between px-5 py-4"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-[#4a7070] text-xs font-bold">#{si + 1}</span>
                              <span className="text-white text-sm truncate">{step.title || 'Untitled'}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[#6a9090] text-xs">{step.sets || 1}x · {step.durationMinutes}min</span>
                              <button
                                onClick={e => { e.stopPropagation(); removeStep(di, si); }}
                                className="text-red-500/50 hover:text-red-500 transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          </button>

                          {/* Step detail */}
                          {isStepOpen && (
                            <div className="px-5 pb-5">
                              {/* Exercise name */}
                              <div className="border border-[#4a7070] px-4 py-3 mb-1">
                                <label className="text-[#6a9090] text-xs uppercase tracking-widest block mb-1">Exercise Name</label>
                                <input
                                  className="w-full bg-transparent text-white text-base placeholder-[#4a7070] focus:outline-none"
                                  placeholder="e.g. Palming"
                                  value={step.title}
                                  onChange={e => updateStep(di, si, 'title', e.target.value)}
                                />
                              </div>

                              {/* PREPARE - global setting, just show */}
                              <div className="py-4 border-b border-[#1e3838]">
                                <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest text-center mb-1">Prepare</p>
                                <p className="text-[#4a7070] text-center text-sm">Global setting</p>
                              </div>

                              {/* SETS */}
                              <div className="border-b border-[#1e3838]">
                                <CountStepper
                                  label="Sets"
                                  value={step.sets || 1}
                                  onDec={() => updateStep(di, si, 'sets', Math.max(1, (step.sets || 1) - 1))}
                                  onInc={() => updateStep(di, si, 'sets', Math.min(20, (step.sets || 1) + 1))}
                                />
                              </div>

                              {/* WORK */}
                              <div className="border-b border-[#1e3838]">
                                <TimeStepper
                                  label="Work"
                                  valueSec={(Number(step.durationMinutes) || 1) * 60}
                                  onDec={() => updateStep(di, si, 'durationMinutes', Math.max(1, (Number(step.durationMinutes) || 1) - 1))}
                                  onInc={() => updateStep(di, si, 'durationMinutes', Math.min(60, (Number(step.durationMinutes) || 1) + 1))}
                                />
                              </div>

                              {/* REST - global setting */}
                              <div className="py-4 border-b border-[#1e3838]">
                                <p className="text-[#6a9090] text-xs font-bold uppercase tracking-widest text-center mb-1">Rest</p>
                                <p className="text-[#4a7070] text-center text-sm">Global setting ({restSeconds}s)</p>
                              </div>

                              {/* Description */}
                              <div className="border border-[#4a7070] px-4 py-3 mt-3">
                                <label className="text-[#6a9090] text-xs uppercase tracking-widest block mb-1">Description</label>
                                <textarea
                                  className="w-full bg-transparent text-white text-sm placeholder-[#4a7070] focus:outline-none resize-none"
                                  rows={2}
                                  placeholder="Instructions (optional)"
                                  value={step.instructions}
                                  onChange={e => updateStep(di, si, 'instructions', e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add exercise */}
                    <button
                      onClick={() => addStep(di)}
                      className="w-full py-4 text-[#f2c029] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
                    >
                      + ADD EXERCISE
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom: total */}
      <div className="border-t border-[#1e3838] bg-[#0a1818] px-5 py-4 flex items-center justify-between">
        <span className="text-[#6a9090] text-xs font-bold uppercase tracking-widest">TOTAL</span>
        <span className="text-white font-bold text-base">
          {String(Math.floor(totalSec / 60)).padStart(2,'0')}:{String(totalSec % 60).padStart(2,'0')}
        </span>
      </div>
    </div>
  );
}
