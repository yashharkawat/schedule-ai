import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { playBowl, playNewStep, playRestChime, playSessionDone, playCountdownBeep, playPrepareStart } from '../lib/sounds.js';
import { speak, stop as stopSpeech } from '../lib/tts.js';

const CIRCUMFERENCE = 2 * Math.PI * 52; // ~326.7

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtMin(totalMinRaw) {
  const totalMin = Math.round(totalMinRaw);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function ScheduleSession() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { schedules, schedule, settings, saveSettings, completeSession } = useStore();

  const sched = useMemo(() => {
    const all = schedules?.length > 0 ? schedules : (schedule ? [schedule] : []);
    return all.find(s => s.id === scheduleId) || null;
  }, [scheduleId, schedules, schedule]);

  const days = sched?.days || [];
  const restSeconds = sched?.restSeconds ?? 30;
  const prepareSeconds = settings.prepareSeconds ?? 5;
  const finalCount = settings.finalCount ?? 3;
  const soundEnabled = settings.soundsEnabled;
  const voiceEnabled = settings.voiceEnabled;
  const volume = settings.soundVolume;

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle, prepare, work, rest
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [doneNote, setDoneNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [showDayGrid, setShowDayGrid] = useState(true);

  const intervalRef = useRef(null);
  const stateRef = useRef({ stepIndex: 0, currentSet: 1, phase: 'idle', timeLeft: 0 });

  useEffect(() => {
    stateRef.current = { stepIndex, currentSet, phase, timeLeft };
  }, [stepIndex, currentSet, phase, timeLeft]);

  const day = days[selectedDayIndex];
  const steps = day?.steps || [];
  const step = steps[stepIndex];

  // Compute total exercises and time for header
  const totalExercises = days.reduce((a, d) => a + (d.steps || []).length, 0);

  // Initialize step to idle when day changes
  useEffect(() => {
    setStepIndex(0);
    setCurrentSet(1);
    setPhase('idle');
    setTimeLeft(steps[0] ? steps[0].durationMinutes * 60 : 0);
    setRunning(false);
    setCompletedSteps([]);
    setShowDone(false);
    clearInterval(intervalRef.current);
  }, [selectedDayIndex]);

  // Reset timeLeft when step changes in idle
  useEffect(() => {
    if (phase === 'idle' && step) {
      setTimeLeft(step.durationMinutes * 60);
    }
  }, [stepIndex, phase, step]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && settings.keepScreenOn) {
        const wl = await navigator.wakeLock.request('screen');
        setWakeLock(wl);
      }
    } catch {}
  };
  const releaseWakeLock = () => { try { wakeLock?.release(); } catch {} };

  const initStep = useCallback((idx, set = 1) => {
    const s = steps[idx];
    if (!s) return;
    const startPhase = prepareSeconds > 0 ? 'prepare' : 'work';
    const startTime = startPhase === 'prepare' ? prepareSeconds : s.durationMinutes * 60;
    setStepIndex(idx);
    setCurrentSet(set);
    setPhase(startPhase);
    setTimeLeft(startTime);
    if (startPhase === 'prepare' && soundEnabled) playPrepareStart(volume);
    if (startPhase === 'work' && voiceEnabled && s.instructions) {
      setTimeout(() => speak(`${s.title}. ${s.instructions}`, { rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName }), 500);
    }
  }, [steps, prepareSeconds, soundEnabled, voiceEnabled, volume, settings]);

  const onPhaseComplete = useCallback(() => {
    const { stepIndex: si, currentSet: cs, phase: ph } = stateRef.current;
    const currentStep = steps[si];
    if (!currentStep) return;
    const totalSets = currentStep.sets || 1;
    stopSpeech();

    if (ph === 'prepare') {
      if (soundEnabled) playNewStep(volume);
      if (voiceEnabled && currentStep.instructions) {
        setTimeout(() => speak(`${currentStep.title}. ${currentStep.instructions}`, { rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName }), 300);
      }
      setPhase('work');
      setTimeLeft(currentStep.durationMinutes * 60);
    } else if (ph === 'work') {
      if (soundEnabled) playBowl(volume);
      const isLastSet = cs >= totalSets;
      if (isLastSet) {
        setCompletedSteps(prev => [...prev, si]);
        const nextIdx = si + 1;
        if (nextIdx < steps.length) {
          setTimeout(() => {
            initStep(nextIdx);
            setRunning(true);
          }, 800);
        } else {
          setTimeout(() => {
            if (soundEnabled) playSessionDone(volume);
            releaseWakeLock();
            setRunning(false);
            setShowDone(true);
          }, 800);
        }
      } else {
        if (soundEnabled) playRestChime(volume);
        setPhase('rest');
        setTimeLeft(restSeconds);
      }
    } else if (ph === 'rest') {
      const nextSet = cs + 1;
      setCurrentSet(nextSet);
      setPhase('work');
      setTimeLeft(currentStep.durationMinutes * 60);
      if (soundEnabled) playNewStep(volume);
      if (voiceEnabled && currentStep.instructions) {
        setTimeout(() => speak(`Set ${nextSet}. ${currentStep.title}.`, { rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName }), 300);
      }
    }
  }, [steps, soundEnabled, voiceEnabled, volume, restSeconds, settings, initStep]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          const next = t - 1;
          if (next <= finalCount && next > 0 && soundEnabled) playCountdownBeep(volume);
          if (next <= 0) { clearInterval(intervalRef.current); onPhaseComplete(); return 0; }
          return next;
        });
      }, 1000);
      requestWakeLock();
    } else {
      clearInterval(intervalRef.current);
      releaseWakeLock();
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, onPhaseComplete, finalCount, soundEnabled, volume]);

  useEffect(() => () => { clearInterval(intervalRef.current); stopSpeech(); releaseWakeLock(); }, []);

  const handleStart = () => {
    if (phase === 'idle') {
      initStep(stepIndex);
      setShowDayGrid(false);
    }
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleSkip = () => {
    stopSpeech();
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompletedSteps(prev => [...prev, stepIndex]);
    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) {
      setStepIndex(nextIdx);
      setCurrentSet(1);
      setPhase('idle');
    } else {
      if (soundEnabled) playSessionDone(volume);
      releaseWakeLock();
      setShowDone(true);
    }
  };

  const handleBack = () => {
    if (stepIndex <= 0) return;
    stopSpeech();
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompletedSteps(prev => prev.filter(i => i !== stepIndex - 1));
    setStepIndex(stepIndex - 1);
    setCurrentSet(1);
    setPhase('idle');
  };

  const handleStepClick = (idx) => {
    if (running) return;
    stopSpeech();
    clearInterval(intervalRef.current);
    setStepIndex(idx);
    setCurrentSet(1);
    setPhase('idle');
  };

  const handleSpeakStep = () => {
    if (!step) return;
    speak(`${step.title}. ${step.instructions || ''}`, {
      rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName,
    });
  };

  const handleSaveFinish = async () => {
    setSaving(true);
    if (day) await completeSession(doneNote, day.id);
    navigate('/');
  };

  const handleChangeDay = () => {
    setShowDayGrid(true);
    setRunning(false);
    clearInterval(intervalRef.current);
    stopSpeech();
  };

  if (!sched) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] flex items-center justify-center">
        <p className="text-[#9a9486] dark:text-[#6a6458]">Schedule not found.</p>
      </div>
    );
  }

  // Done screen
  if (showDone) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 pt-16 pb-8 flex flex-col items-center text-center flex-1">
          <div className="w-20 h-20 bg-[#8b7355] rounded-full flex items-center justify-center mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-[#2c2a24] dark:text-[#e8e3d8] mb-2">Session complete!</h2>
          <p className="text-[#9a9486] dark:text-[#6a6458] mb-8">
            {day?.name} &middot; {steps.reduce((a, s) => a + s.durationMinutes * (s.sets || 1), 0)} min
          </p>
          <textarea
            className="w-full border border-[#e0dbd0] dark:border-[#3a3530] rounded-lg px-4 py-3 text-sm mb-5 bg-white dark:bg-[#262320] text-[#2c2a24] dark:text-[#e8e3d8] placeholder-[#9a9486] resize-none focus:outline-none"
            rows={3}
            placeholder="Add a note (optional)"
            value={doneNote}
            onChange={e => setDoneNote(e.target.value)}
          />
          <button
            onClick={handleSaveFinish}
            disabled={saving}
            className="w-full py-4 bg-[#3d3420] dark:bg-[#8b7355] text-white font-bold text-base rounded-xl disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            {saving ? 'Saving...' : 'Save & finish'}
          </button>
          <button onClick={() => navigate('/')} className="mt-4 text-[#9a9486] dark:text-[#6a6458] text-sm font-semibold">
            Skip
          </button>
        </div>
      </div>
    );
  }

  // Timer ring calculations
  const totalTime = step ? step.durationMinutes * 60 : 1;
  const displayTotal = phase === 'prepare' ? (prepareSeconds || 1) : phase === 'rest' ? (restSeconds || 1) : totalTime;
  const progress = displayTotal > 0 ? (displayTotal - timeLeft) / displayTotal : 0;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  const isRest = phase === 'rest';
  const totalSets = step?.sets || 1;

  return (
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] flex flex-col">
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto px-4">
          {/* Header */}
          <div className="text-center pt-5 pb-4 flex items-center justify-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="text-[#9a9486] dark:text-[#6a6458] p-1 flex items-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 className="text-lg font-bold text-[#2c2a24] dark:text-[#e8e3d8]">{sched.title}</h1>
          </div>
          <p className="text-[13px] text-[#9a9486] dark:text-[#6a6458] text-center mb-3">
            {days.length} day{days.length !== 1 ? 's' : ''} &middot; {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
          </p>

          {/* Sound row */}
          <div className="flex items-center justify-between bg-white dark:bg-[#262320] border border-[#e0dbd0] dark:border-[#3a3530] rounded-[10px] px-3.5 py-2.5 mb-3 text-[13px] text-[#5a5548] dark:text-[#9a9486]">
            <span className="font-medium">&#9834; Sounds</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => saveSettings({ soundsEnabled: true })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  soundEnabled
                    ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white border-[#3d3420] dark:border-[#8b7355]'
                    : 'bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] border-[#d4cfc4] dark:border-[#3a3530]'
                }`}
              >On</button>
              <button
                onClick={() => saveSettings({ soundsEnabled: false })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  !soundEnabled
                    ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white border-[#3d3420] dark:border-[#8b7355]'
                    : 'bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] border-[#d4cfc4] dark:border-[#3a3530]'
                }`}
              >Off</button>
            </div>
          </div>

          {/* Voice row */}
          <div className="flex items-center justify-between bg-white dark:bg-[#262320] border border-[#e0dbd0] dark:border-[#3a3530] rounded-[10px] px-3.5 py-2.5 mb-3 text-[13px] text-[#5a5548] dark:text-[#9a9486]">
            <span className="font-medium">&#127908; Voice</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => saveSettings({ voiceEnabled: true })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  voiceEnabled
                    ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white border-[#3d3420] dark:border-[#8b7355]'
                    : 'bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] border-[#d4cfc4] dark:border-[#3a3530]'
                }`}
              >On</button>
              <button
                onClick={() => saveSettings({ voiceEnabled: false })}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  !voiceEnabled
                    ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white border-[#3d3420] dark:border-[#8b7355]'
                    : 'bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] border-[#d4cfc4] dark:border-[#3a3530]'
                }`}
              >Off</button>
              <button
                onClick={() => navigate('/settings')}
                className="px-2 py-1 rounded-full text-xs font-semibold border border-[#d4cfc4] dark:border-[#3a3530] bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] ml-1"
              >&#9881;</button>
            </div>
          </div>

          {/* Day grid */}
          {showDayGrid && days.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {days.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`rounded-[10px] px-1.5 py-2.5 text-center border-[1.5px] transition-all ${
                    i === selectedDayIndex
                      ? 'bg-[#3d3420] dark:bg-[#8b7355] border-[#3d3420] dark:border-[#8b7355] text-white'
                      : 'bg-white dark:bg-[#262320] border-[#d4cfc4] dark:border-[#3a3530] text-[#2c2a24] dark:text-[#e8e3d8] hover:border-[#8b7355] dark:hover:border-[#8b7355]'
                  }`}
                >
                  <div className="text-[13px] font-semibold leading-tight">{d.name}</div>
                  <div className={`text-[10px] mt-0.5 ${i === selectedDayIndex ? 'opacity-65' : 'opacity-50'}`}>
                    {(d.steps || []).length} exercise{(d.steps || []).length !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Session card */}
          {step && (
            <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden mb-4">
              {/* Progress bar */}
              <div className="h-1 bg-[#e8e3d8] dark:bg-[#3a3530]">
                <div
                  className="h-full bg-[#8b7355] transition-all duration-400"
                  style={{ width: `${steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0}%` }}
                />
              </div>

              {/* Step info */}
              <div className="px-5 pt-5 pb-3 relative">
                <p className="text-[11px] text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider font-semibold mb-1.5">
                  Step {stepIndex + 1} of {steps.length}
                  {totalSets > 1 && ` · Set ${currentSet}/${totalSets}`}
                </p>
                <p className="text-xl font-bold text-[#2c2a24] dark:text-[#e8e3d8] leading-tight mb-2">
                  {step.title}
                  {isRest && <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1.5 align-middle bg-[#d4ead9] dark:bg-[#2a4036] text-[#3a6b4a] dark:text-[#7ab88e]">Rest</span>}
                  {phase === 'prepare' && <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1.5 align-middle bg-[#f0e0c0] dark:bg-[#4a3d28] text-[#8a6a2a] dark:text-[#c4a86a]">Prepare</span>}
                  {phase === 'work' && <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1.5 align-middle bg-[#e8dfc8] dark:bg-[#4a3d28] text-[#7a5e2a] dark:text-[#c4a86a]">Active</span>}
                </p>
                {step.instructions && (
                  <p className="text-sm text-[#5a5548] dark:text-[#9a9486] leading-relaxed">{step.instructions}</p>
                )}
                {voiceEnabled && step.instructions && (
                  <button
                    onClick={handleSpeakStep}
                    className="absolute right-5 top-5 bg-[#f0ece4] dark:bg-[#2e2b26] border border-[#d4cfc4] dark:border-[#3a3530] rounded-lg px-2.5 py-1 text-xs text-[#5a5548] dark:text-[#9a9486] flex items-center gap-1"
                  >
                    &#9654; Listen
                  </button>
                )}
              </div>

              {/* Timer section */}
              <div className="px-5 pt-4 pb-5 border-t border-[#f0ece4] dark:border-[#3a3530]">
                <div className="text-center mb-4">
                  {/* Timer ring */}
                  <div className="relative w-[120px] h-[120px] mx-auto mb-2.5">
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="60" cy="60" r="52" fill="none" className="stroke-[#f0ece4] dark:stroke-[#3a3530]" strokeWidth="6" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke="#8b7355"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeOffset}
                        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[26px] font-bold text-[#2c2a24] dark:text-[#e8e3d8] tracking-tight">
                      {fmtTime(timeLeft)}
                    </div>
                  </div>
                  <p className="text-xs text-[#9a9486] dark:text-[#6a6458]">
                    {phase === 'rest' ? 'Rest' : phase === 'prepare' ? 'Get ready' : `${fmtMin(step.durationMinutes)} exercise`}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex gap-2.5">
                  <button
                    onClick={handleBack}
                    disabled={stepIndex === 0 && phase === 'idle'}
                    className="flex-1 py-3 rounded-[10px] text-[15px] font-semibold transition-all active:scale-[0.97] bg-[#f0ece4] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] disabled:opacity-40"
                  >
                    &#8592; Back
                  </button>
                  <button
                    onClick={running ? handlePause : handleStart}
                    className="flex-1 py-3 rounded-[10px] text-[15px] font-semibold transition-all active:scale-[0.97] bg-[#3d3420] dark:bg-[#8b7355] text-white"
                  >
                    {running ? 'Pause' : phase === 'idle' ? 'Start' : 'Resume'}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-3 rounded-[10px] text-[15px] font-semibold transition-all active:scale-[0.97] bg-[#f8f5ef] dark:bg-[#262320] text-[#9a9486] dark:text-[#6a6458] border border-[#e0dbd0] dark:border-[#3a3530]"
                  >
                    Skip &#8594;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden mb-3">
            <div className="px-4 py-3.5 text-xs font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider border-b border-[#f0ece4] dark:border-[#3a3530]">
              Session steps
            </div>
            {steps.map((s, i) => {
              const isCurrent = i === stepIndex;
              const isDone = completedSteps.includes(i);
              return (
                <div
                  key={s.id}
                  onClick={() => handleStepClick(i)}
                  className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#fdf9f2] dark:bg-[#302a22] border-l-[3px] border-l-[#8b7355] border-b-[#f7f4ef] dark:border-b-[#2e2b26]'
                      : isDone
                        ? 'opacity-45 border-b-[#f7f4ef] dark:border-b-[#2e2b26]'
                        : 'border-b-[#f7f4ef] dark:border-b-[#2e2b26] hover:bg-[#faf7f2] dark:hover:bg-[#2e2b26]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    isCurrent
                      ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white'
                      : isDone
                        ? 'bg-[#d4ead9] dark:bg-[#2a4036] text-[#5a8a6e] dark:text-[#7ab88e]'
                        : 'bg-[#f0ece4] dark:bg-[#3a3530] text-[#9a9486] dark:text-[#6a6458]'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isCurrent || !isDone ? 'text-[#2c2a24] dark:text-[#e8e3d8]' : ''}`}>{s.title}</p>
                    <p className="text-xs text-[#9a9486] dark:text-[#6a6458] mt-0.5">
                      {fmtMin(s.durationMinutes * (s.sets || 1))}
                      {(s.sets || 1) > 1 && ` · ${s.sets} sets`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Change day button */}
          {!showDayGrid && days.length > 1 && (
            <div className="text-center mb-4">
              <button
                onClick={handleChangeDay}
                className="px-6 py-3 rounded-[10px] bg-[#f0ece4] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] text-[15px] font-semibold active:scale-[0.97] transition-transform"
              >
                &#8592; Change day
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
