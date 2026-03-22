import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';
import { api } from '../lib/api.js';
import { initVoices, speak } from '../lib/tts.js';

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#f2c029]' : 'bg-[#2e4e4e] dark:bg-[#2e4e4e]'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

function Stepper({ value, onDec, onInc, label }) {
  return (
    <div className="flex items-center justify-between px-5 py-5 border-b border-[#c4d8d8] dark:border-[#1e3838] last:border-0">
      <span className="text-[#0f2828] dark:text-white text-base font-semibold">{label}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={onDec}
          className="w-10 h-10 flex items-center justify-center bg-[#dce8e8] dark:bg-[#2c4848] text-[#0f2828] dark:text-white font-bold text-xl rounded-sm active:opacity-70"
        >
          −
        </button>
        <span className="text-[#0f2828] dark:text-white font-bold text-xl w-8 text-center">{value}</span>
        <button
          onClick={onInc}
          className="w-10 h-10 flex items-center justify-center bg-[#dce8e8] dark:bg-[#2c4848] text-[#0f2828] dark:text-white font-bold text-xl rounded-sm active:opacity-70"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Row({ label, sublabel, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838] last:border-0">
      <div>
        <p className="text-[#0f2828] dark:text-white text-base font-semibold">{label}</p>
        {sublabel && <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5">{sublabel}</p>}
      </div>
      {right && <div className="ml-4 flex-shrink-0">{right}</div>}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between px-5 pt-8 pb-2">
      <p className="text-[#0f2828] dark:text-white text-lg font-bold">{title}</p>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#4a7272] dark:text-[#4a7070]">
        <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
      </svg>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { settings, saveSettings, log, fetchLog } = useStore();
  const [voices, setVoices] = useState([]);
  const [notifStatus, setNotifStatus] = useState('');
  const [pushSub, setPushSub] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    initVoices(setVoices);
    fetchLog();
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(async sub => {
          if (sub) { setPushSub(sub); try { await api.subscribePush(sub.toJSON()); } catch {} }
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) { setNotifStatus('VAPID key not configured'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await api.subscribePush(sub.toJSON());
      setPushSub(sub);
      setNotifStatus('Push notifications enabled!');
      setTimeout(() => setNotifStatus(''), 3000);
    } catch (err) { setNotifStatus('Error: ' + err.message); }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (pushSub) { await api.unsubscribePush(pushSub.endpoint); await pushSub.unsubscribe(); setPushSub(null); }
      setNotifStatus('Unsubscribed');
      setTimeout(() => setNotifStatus(''), 3000);
    } catch (err) { setNotifStatus('Error: ' + err.message); }
  };

  const handleTestNotif = async () => {
    try { await api.testNotification(); setNotifStatus('Test sent!'); } catch (err) { setNotifStatus('Error: ' + err.message); }
    setTimeout(() => setNotifStatus(''), 3000);
  };

  const exportLog = () => {
    if (!log.length) return;
    const csv = ['date,dayId,completedSteps,totalSteps,durationMinutes,notes',
      ...log.map(l => `${new Date(l.completedAt).toISOString().split('T')[0]},${l.dayId || ''},${l.completedSteps},${l.totalSteps},${l.durationMinutes},"${(l.notes||'').replace(/"/g,'""')}"`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `scheduleai-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (showThemePicker) {
    return (
      <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020]">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-24">
          <button onClick={() => setShowThemePicker(false)} className="flex items-center gap-2 text-[#4a7272] dark:text-[#6a9090] mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Settings
          </button>
          <h1 className="text-[#0f2828] dark:text-white font-black text-3xl uppercase mb-8">THEMES</h1>
          {[
            { key: 'auto', label: 'AUTO (system settings)' },
            { key: 'dark', label: 'DARK' },
            { key: 'light', label: 'LIGHT' },
          ].map(({ key, label }) => (
            <div key={key} className="mb-6">
              <button
                onClick={() => saveSettings({ theme: key })}
                className="flex items-center gap-3 mb-3"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.theme === key ? 'border-[#f2c029]' : 'border-[#4a7272] dark:border-[#4a7070]'}`}>
                  {settings.theme === key && <div className="w-2.5 h-2.5 rounded-full bg-[#f2c029]" />}
                </div>
                <span className="text-[#0f2828] dark:text-white font-black text-lg uppercase tracking-wider">{label}</span>
              </button>
              <div className={`rounded-sm overflow-hidden border-2 ${settings.theme === key ? 'border-[#f2c029]' : 'border-[#c4d8d8] dark:border-[#2e4e4e]'}`}>
                {key === 'auto' ? (
                  <div className="flex h-20">
                    <div className="flex-1 bg-[#1a3535] flex flex-col justify-center px-3 gap-1">
                      <div className="h-2 bg-white/30 rounded-sm w-3/4" />
                      <div className="h-1.5 bg-white/20 rounded-sm" />
                      <div className="h-1.5 bg-white/20 rounded-sm" />
                    </div>
                    <div className="flex-1 bg-[#f0f5f5] flex flex-col justify-center px-3 gap-1">
                      <div className="h-2 bg-[#1a4545]/40 rounded-sm w-3/4" />
                      <div className="h-1.5 bg-[#1a4545]/25 rounded-sm" />
                      <div className="h-1.5 bg-[#1a4545]/25 rounded-sm" />
                    </div>
                  </div>
                ) : key === 'dark' ? (
                  <div className="h-20 bg-[#1a3535] flex flex-col justify-center px-3 gap-1">
                    <div className="h-2 bg-white/30 rounded-sm w-3/4" />
                    <div className="h-1.5 bg-white/20 rounded-sm" />
                    <div className="h-1.5 bg-white/20 rounded-sm" />
                    <div className="h-1.5 bg-white/20 rounded-sm" />
                  </div>
                ) : (
                  <div className="h-20 bg-[#f0f5f5] flex flex-col justify-center px-3 gap-1">
                    <div className="h-2 bg-[#1a4545]/40 rounded-sm w-3/4" />
                    <div className="h-1.5 bg-[#1a4545]/25 rounded-sm" />
                    <div className="h-1.5 bg-[#1a4545]/25 rounded-sm" />
                    <div className="h-1.5 bg-[#1a4545]/25 rounded-sm" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020]">
      {/* Top bar */}
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
        <span className="text-white/50 text-xs w-10 text-right">{Math.round(settings.soundVolume * 100)}%</span>
      </div>

      <div className="max-w-lg mx-auto pb-24 overflow-y-auto">

        {/* Session section */}
        <SectionHeader title="Session" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <Stepper
            label="Prepare countdown"
            value={settings.prepareSeconds ?? 5}
            onDec={() => saveSettings({ prepareSeconds: Math.max(0, (settings.prepareSeconds ?? 5) - 1) })}
            onInc={() => saveSettings({ prepareSeconds: Math.min(30, (settings.prepareSeconds ?? 5) + 1) })}
          />
          <Stepper
            label="Final count"
            value={settings.finalCount ?? 3}
            onDec={() => saveSettings({ finalCount: Math.max(0, (settings.finalCount ?? 3) - 1) })}
            onInc={() => saveSettings({ finalCount: Math.min(10, (settings.finalCount ?? 3) + 1) })}
          />
          <Row label="Skip last rest" sublabel="No rest after final set" right={<Toggle value={settings.skipLastRest ?? false} onChange={v => saveSettings({ skipLastRest: v })} />} />
        </div>

        {/* Sound section */}
        <SectionHeader title="Sound" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <Row label="Sounds enabled" right={<Toggle value={settings.soundsEnabled} onChange={v => saveSettings({ soundsEnabled: v })} />} />
        </div>

        {/* Voice section */}
        <SectionHeader title="Voice" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <Row label="Voice instructions" right={<Toggle value={settings.voiceEnabled} onChange={v => saveSettings({ voiceEnabled: v })} />} />
          <Row label="Auto-read on start" right={<Toggle value={settings.voiceAutoRead} onChange={v => saveSettings({ voiceAutoRead: v })} />} />
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <label className="text-[#4a7272] dark:text-[#6a9090] text-xs uppercase tracking-wider mb-2 block">Voice</label>
            <select
              className="w-full bg-[#c8d8d8] dark:bg-[#264040] text-[#0f2828] dark:text-white px-3 py-2 text-sm focus:outline-none"
              value={settings.voiceName}
              onChange={e => saveSettings({ voiceName: e.target.value })}
            >
              <option value="">Default</option>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#0f2828] dark:text-white text-sm font-semibold w-14">Speed</span>
              <input type="range" min="0.6" max="1.4" step="0.05" value={settings.voiceRate}
                onChange={e => saveSettings({ voiceRate: +e.target.value })}
                className="flex-1 bg-[#c8d8d8] dark:bg-[#264040]" style={{ accentColor: '#f2c029' }}
              />
              <span className="text-[#4a7272] dark:text-[#6a9090] text-xs w-8 text-right">{settings.voiceRate}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#0f2828] dark:text-white text-sm font-semibold w-14">Pitch</span>
              <input type="range" min="0.7" max="1.3" step="0.05" value={settings.voicePitch}
                onChange={e => saveSettings({ voicePitch: +e.target.value })}
                className="flex-1 bg-[#c8d8d8] dark:bg-[#264040]" style={{ accentColor: '#f2c029' }}
              />
              <span className="text-[#4a7272] dark:text-[#6a9090] text-xs w-8 text-right">{settings.voicePitch}</span>
            </div>
          </div>
          <div className="px-5 py-4">
            <button
              onClick={() => speak('This is a test of the voice instructions.', { rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName })}
              className="w-full py-3 bg-[#c8d8d8] dark:bg-[#264040] text-[#0f2828] dark:text-white font-semibold text-sm active:opacity-70 transition-opacity flex items-center justify-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Test voice
            </button>
          </div>
        </div>

        {/* Notifications section */}
        <SectionHeader title="Notifications" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <Row label="Enable reminders" sublabel="Add to home screen on iOS first" right={<Toggle value={settings.notifEnabled} onChange={v => saveSettings({ notifEnabled: v })} />} />
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <label className="text-[#4a7272] dark:text-[#6a9090] text-xs uppercase tracking-wider mb-2 block">Remind me at</label>
            <input
              type="time"
              className="bg-[#c8d8d8] dark:bg-[#264040] text-[#0f2828] dark:text-white px-3 py-2 text-sm focus:outline-none"
              value={settings.notifTime}
              onChange={e => saveSettings({ notifTime: e.target.value })}
            />
          </div>
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <label className="text-[#4a7272] dark:text-[#6a9090] text-xs uppercase tracking-wider mb-3 block">Days</label>
            <div className="flex gap-2 flex-wrap">
              {['mon','tue','wed','thu','fri','sat','sun'].map(d => {
                const active = (settings.notifDays || []).includes(d);
                return (
                  <button key={d} onClick={() => {
                    const days = active ? settings.notifDays.filter(x => x !== d) : [...(settings.notifDays || []), d];
                    saveSettings({ notifDays: days });
                  }} className={`px-3 py-1.5 text-xs font-bold uppercase transition-all active:opacity-70 ${active ? 'bg-[#f2c029] text-[#0e2020]' : 'bg-[#c8d8d8] dark:bg-[#264040] text-[#4a7272] dark:text-[#6a9090]'}`}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <label className="text-[#4a7272] dark:text-[#6a9090] text-xs uppercase tracking-wider mb-2 block">Message</label>
            <input
              className="w-full bg-[#c8d8d8] dark:bg-[#264040] text-[#0f2828] dark:text-white px-3 py-2 text-sm placeholder-[#8aacac] focus:outline-none"
              value={settings.notifMessage}
              onChange={e => saveSettings({ notifMessage: e.target.value })}
            />
          </div>
          {notifStatus && <p className="px-5 py-2 text-[#1a7070] dark:text-[#f2c029] text-xs">{notifStatus}</p>}
          <div className="px-5 py-4 flex gap-2">
            {pushSub ? (
              <button onClick={unsubscribeFromPush} className="flex-1 py-3 bg-[#c8d8d8] dark:bg-[#264040] text-[#4a7272] dark:text-[#6a9090] font-semibold text-sm active:opacity-70">Unsubscribe</button>
            ) : (
              <button onClick={subscribeToPush} className="flex-1 py-3 bg-[#f2c029] text-[#0e2020] font-bold text-sm active:opacity-70">Enable push</button>
            )}
            <button onClick={handleTestNotif} disabled={!pushSub} className="flex-1 py-3 bg-[#c8d8d8] dark:bg-[#264040] text-[#4a7272] dark:text-[#6a9090] font-semibold text-sm disabled:opacity-40 active:opacity-70">Test now</button>
          </div>
        </div>

        {/* Miscellaneous section */}
        <SectionHeader title="Miscellaneous" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <button onClick={() => setShowThemePicker(true)} className="w-full flex items-center justify-between px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <span className="text-[#0f2828] dark:text-white text-base font-semibold">Theme</span>
            <span className="text-[#4a7272] dark:text-[#6a9090] text-sm capitalize">{settings.theme || 'auto'}</span>
          </button>
          <Row label="Keep screen on" right={<Toggle value={settings.keepScreenOn} onChange={v => saveSettings({ keepScreenOn: v })} />} />
          <Row label="Keep server awake" sublabel="Pings backend every 8 min (Render)" right={<Toggle value={settings.keepAlive} onChange={v => saveSettings({ keepAlive: v })} />} />
        </div>

        {/* Schedule section */}
        <SectionHeader title="Schedule" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          <button onClick={() => navigate('/schedule/new')} className="w-full flex items-center justify-between px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <span className="text-[#0f2828] dark:text-white text-base font-semibold">Create new schedule</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#4a7272] dark:text-[#6a9090]" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => navigate('/schedule/import')} className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-[#0f2828] dark:text-white text-base font-semibold">Import from document</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#4a7272] dark:text-[#6a9090]" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Account section */}
        <SectionHeader title="Account" />
        <div className="bg-[#dce8e8] dark:bg-[#1a3535]">
          {user && (
            <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
              <p className="text-[#0f2828] dark:text-white font-semibold">{user.fullName || 'Signed in'}</p>
              <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5">{user.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          )}
          <div className="px-5 py-4 border-b border-[#c4d8d8] dark:border-[#1e3838]">
            <button onClick={exportLog} className="w-full py-3 bg-[#c8d8d8] dark:bg-[#264040] text-[#4a7272] dark:text-[#6a9090] font-semibold text-sm active:opacity-70">
              Export log ({log.length} sessions)
            </button>
          </div>
          {user && (
            <div className="px-5 py-4">
              <button
                onClick={() => signOut(() => navigate('/sign-in'))}
                className="w-full py-3 bg-red-900/30 text-red-400 font-semibold text-sm active:opacity-70"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
