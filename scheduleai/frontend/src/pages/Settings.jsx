import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';
import { api } from '../lib/api.js';
import { initVoices, speak } from '../lib/tts.js';

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#3d3420] dark:bg-[#8b7355]' : 'bg-[#e0dbd0] dark:bg-[#3a3530]'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function Row({ label, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0ece4] dark:border-[#3a3530] last:border-0">
      <span className="text-[15px] font-medium text-[#2c2a24] dark:text-[#e8e3d8]">{label}</span>
      {right && <div className="ml-4 flex-shrink-0">{right}</div>}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { settings, saveSettings } = useStore();
  const [voices, setVoices] = useState([]);
  const [notifStatus, setNotifStatus] = useState('');
  const [pushSub, setPushSub] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    initVoices(setVoices);
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

  if (showThemePicker) {
    return (
      <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714]">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <button onClick={() => setShowThemePicker(false)} className="flex items-center gap-2 text-[#9a9486] dark:text-[#6a6458] mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Settings
          </button>
          <h1 className="text-[#2c2a24] dark:text-[#e8e3d8] font-bold text-2xl mb-8">Themes</h1>
          {[
            { key: 'auto', label: 'Auto (system)' },
            { key: 'dark', label: 'Dark' },
            { key: 'light', label: 'Light' },
          ].map(({ key, label }) => (
            <div key={key} className="mb-5">
              <button onClick={() => saveSettings({ theme: key })} className="flex items-center gap-3 mb-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.theme === key ? 'border-[#8b7355]' : 'border-[#9a9486] dark:border-[#6a6458]'}`}>
                  {settings.theme === key && <div className="w-2.5 h-2.5 rounded-full bg-[#8b7355]" />}
                </div>
                <span className="text-[#2c2a24] dark:text-[#e8e3d8] font-bold text-base">{label}</span>
              </button>
              <div className={`rounded-2xl overflow-hidden border-2 ${settings.theme === key ? 'border-[#8b7355]' : 'border-[#e0dbd0] dark:border-[#3a3530]'}`}>
                {key === 'auto' ? (
                  <div className="flex h-16">
                    <div className="flex-1 bg-[#1a1714] flex flex-col justify-center px-3 gap-1">
                      <div className="h-2 bg-white/20 rounded w-3/4" /><div className="h-1.5 bg-white/10 rounded" />
                    </div>
                    <div className="flex-1 bg-[#f4f1eb] flex flex-col justify-center px-3 gap-1">
                      <div className="h-2 bg-[#2c2a24]/20 rounded w-3/4" /><div className="h-1.5 bg-[#2c2a24]/10 rounded" />
                    </div>
                  </div>
                ) : key === 'dark' ? (
                  <div className="h-16 bg-[#1a1714] flex flex-col justify-center px-3 gap-1">
                    <div className="h-2 bg-white/20 rounded w-3/4" /><div className="h-1.5 bg-white/10 rounded" /><div className="h-1.5 bg-white/10 rounded" />
                  </div>
                ) : (
                  <div className="h-16 bg-[#f4f1eb] flex flex-col justify-center px-3 gap-1">
                    <div className="h-2 bg-[#2c2a24]/20 rounded w-3/4" /><div className="h-1.5 bg-[#2c2a24]/10 rounded" /><div className="h-1.5 bg-[#2c2a24]/10 rounded" />
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
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714]">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 overflow-y-auto">
        <h1 className="text-[22px] font-bold text-[#2c2a24] dark:text-[#e8e3d8] mb-2">Settings</h1>

        {/* Sound */}
        <p className="text-[11px] font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider pt-5 pb-2">Sound</p>
        <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden">
          <Row label="Sounds" right={<Toggle value={settings.soundsEnabled} onChange={v => saveSettings({ soundsEnabled: v })} />} />
        </div>

        {/* Voice */}
        <p className="text-[11px] font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider pt-5 pb-2">Voice</p>
        <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden">
          <Row label="Voice instructions" right={<Toggle value={settings.voiceEnabled} onChange={v => saveSettings({ voiceEnabled: v })} />} />
          <div className="px-4 pb-3.5 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <label className="text-[11px] text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider mb-1 block">Voice</label>
            <select
              className="w-full bg-[#faf7f2] dark:bg-[#2e2b26] text-[#2c2a24] dark:text-[#e8e3d8] px-2 py-1.5 text-[13px] border border-[#d4cfc4] dark:border-[#3a3530] rounded-lg focus:outline-none"
              value={settings.voiceName}
              onChange={e => saveSettings({ voiceName: e.target.value })}
            >
              <option value="">Default</option>
              {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </select>
          </div>
          <div className="px-4 py-3.5 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] text-[#9a9486] dark:text-[#6a6458] w-12 flex-shrink-0">Speed</span>
              <input type="range" min="0.6" max="1.4" step="0.05" value={settings.voiceRate}
                onChange={e => saveSettings({ voiceRate: +e.target.value })}
                className="flex-1" style={{ accentColor: '#8b7355' }}
              />
              <span className="text-[12px] text-[#5a5548] dark:text-[#9a9486] w-8 text-right">{settings.voiceRate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#9a9486] dark:text-[#6a6458] w-12 flex-shrink-0">Pitch</span>
              <input type="range" min="0.7" max="1.3" step="0.05" value={settings.voicePitch}
                onChange={e => saveSettings({ voicePitch: +e.target.value })}
                className="flex-1" style={{ accentColor: '#8b7355' }}
              />
              <span className="text-[12px] text-[#5a5548] dark:text-[#9a9486] w-8 text-right">{settings.voicePitch}</span>
            </div>
          </div>
          <button
            onClick={() => speak('This is a test of the voice instructions.', { rate: settings.voiceRate, pitch: settings.voicePitch, voiceName: settings.voiceName })}
            className="w-full py-2.5 bg-[#f0ece4] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] font-semibold text-[13px] flex items-center justify-center gap-2"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Test voice
          </button>
        </div>

        {/* Notifications */}
        <p className="text-[11px] font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider pt-5 pb-2">Notifications</p>
        <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pushSub ? 'bg-[#5a8a6e] dark:bg-[#7ab88e]' : 'bg-[#b85c38] dark:bg-[#c47a5a]'}`} />
            <span className="text-[13px] font-medium text-[#5a5548] dark:text-[#9a9486]">
              {pushSub ? 'Push notifications active' : 'Push notifications inactive'}
            </span>
          </div>
          <Row label="Enable reminders" right={<Toggle value={settings.notifEnabled} onChange={v => saveSettings({ notifEnabled: v })} />} />
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <span className="text-[15px] font-medium text-[#2c2a24] dark:text-[#e8e3d8]">Remind at</span>
            <input
              type="time"
              className="bg-[#faf7f2] dark:bg-[#2e2b26] text-[#2c2a24] dark:text-[#e8e3d8] px-2.5 py-1.5 text-[14px] border border-[#d4cfc4] dark:border-[#3a3530] rounded-lg focus:outline-none"
              value={settings.notifTime}
              onChange={e => saveSettings({ notifTime: e.target.value })}
            />
          </div>
          <div className="px-4 pt-1 pb-3.5 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <p className="text-[11px] text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider mb-2">Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {['mon','tue','wed','thu','fri','sat','sun'].map(d => {
                const active = (settings.notifDays || []).includes(d);
                return (
                  <button key={d} onClick={() => {
                    const days = active ? settings.notifDays.filter(x => x !== d) : [...(settings.notifDays || []), d];
                    saveSettings({ notifDays: days });
                  }} className={`px-2.5 py-1.5 text-[11px] font-bold uppercase rounded-full border transition-all active:scale-95 ${
                    active
                      ? 'bg-[#3d3420] dark:bg-[#8b7355] text-white border-[#3d3420] dark:border-[#8b7355]'
                      : 'bg-[#f0ece4] dark:bg-[#2e2b26] text-[#9a9486] dark:text-[#6a6458] border-[#e0dbd0] dark:border-[#3a3530]'
                  }`}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          {notifStatus && <p className="px-4 py-2 text-[#5a8a6e] dark:text-[#7ab88e] text-xs">{notifStatus}</p>}
          <div className="flex gap-2 px-4 py-3">
            {pushSub ? (
              <button onClick={unsubscribeFromPush} className="flex-1 py-2.5 rounded-[10px] border border-[#e0dbd0] dark:border-[#3a3530] bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] font-semibold text-[13px] active:scale-[0.97] transition-transform">Unsubscribe</button>
            ) : (
              <button onClick={subscribeToPush} className="flex-1 py-2.5 rounded-[10px] bg-[#3d3420] dark:bg-[#8b7355] text-white font-semibold text-[13px] active:scale-[0.97] transition-transform">Enable push</button>
            )}
            <button onClick={handleTestNotif} disabled={!pushSub} className="flex-1 py-2.5 rounded-[10px] border border-[#e0dbd0] dark:border-[#3a3530] bg-[#f8f5ef] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] font-semibold text-[13px] disabled:opacity-40 active:scale-[0.97] transition-transform">Test notification</button>
          </div>
        </div>

        {/* Miscellaneous */}
        <p className="text-[11px] font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider pt-5 pb-2">Miscellaneous</p>
        <div className="bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden">
          <button onClick={() => setShowThemePicker(true)} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#f0ece4] dark:border-[#3a3530]">
            <span className="text-[15px] font-medium text-[#2c2a24] dark:text-[#e8e3d8]">Theme</span>
            <span className="text-[14px] text-[#9a9486] dark:text-[#6a6458] capitalize">{settings.theme || 'auto'} &#8250;</span>
          </button>
          <Row label="Keep screen on" right={<Toggle value={settings.keepScreenOn} onChange={v => saveSettings({ keepScreenOn: v })} />} />
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
