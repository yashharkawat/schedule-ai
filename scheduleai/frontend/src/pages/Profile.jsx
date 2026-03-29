import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

const DOC_KEY = 'scheduleai-doc';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { log, fetchLog, streak } = useStore();
  const [tab, setTab] = useState('progress');
  const [docText, setDocText] = useState(() => localStorage.getItem(DOC_KEY) || '');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => { fetchLog(); }, []);

  const saveDoc = () => { localStorage.setItem(DOC_KEY, draft); setDocText(draft); setEditMode(false); };
  const startEdit = () => { setDraft(docText); setEditMode(true); };

  const grouped = {};
  (log || []).forEach(entry => {
    const date = new Date(entry.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  });

  return (
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-[#1a1714] flex flex-col">
      {/* Profile header */}
      <div className="bg-[#3d3420] dark:bg-[#262320] px-4 py-6 border-b border-transparent dark:border-[#3a3530]">
        <div className="max-w-lg mx-auto flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#8b7355] flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">{user?.name || 'You'}</p>
            <p className="text-[#b0a898] dark:text-[#6a6458] text-[13px] mt-0.5">{user?.email}</p>
            <p className="text-[#b0a898] dark:text-[#6a6458] text-[12px] mt-0.5">
              {streak > 0 ? `\uD83D\uDD25 ${streak} day streak` : 'No streak yet'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Account section */}
        <div className="max-w-lg mx-auto">
          <p className="text-[11px] font-semibold text-[#9a9486] dark:text-[#6a6458] uppercase tracking-wider px-4 pt-5 pb-2">Account</p>
          <div className="mx-4 bg-white dark:bg-[#262320] rounded-2xl border border-[#e0dbd0] dark:border-[#3a3530] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] font-medium text-[#2c2a24] dark:text-[#e8e3d8]">Email</span>
              <span className="text-[14px] text-[#9a9486] dark:text-[#6a6458]">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => { signOut(); navigate('/sign-in'); }}
            className="block mx-4 mt-3 w-[calc(100%-32px)] py-3 bg-white dark:bg-[#262320] border border-[#e0dbd0] dark:border-[#3a3530] rounded-[10px] text-[#b85c38] dark:text-[#c47a5a] font-semibold text-[14px] text-center hover:bg-[#fdf5f2] dark:hover:bg-[#2e2520] transition-colors active:scale-[0.97]"
          >
            Sign out
          </button>

          {/* Tabs */}
          <div className="flex mx-4 mt-5 bg-white dark:bg-[#262320] rounded-t-2xl border border-[#e0dbd0] dark:border-[#3a3530] border-b-0 overflow-hidden">
            {[['progress', 'Progress'], ['doc', 'Document']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-[14px] font-semibold transition-colors border-b-2 ${
                  tab === key
                    ? 'text-[#2c2a24] dark:text-[#e8e3d8] border-[#8b7355]'
                    : 'text-[#9a9486] dark:text-[#6a6458] border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Progress tab */}
          {tab === 'progress' && (
            <div className="mx-4 bg-white dark:bg-[#262320] border border-[#e0dbd0] dark:border-[#3a3530] border-t-0 rounded-b-2xl overflow-hidden">
              {Object.keys(grouped).length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-[#9a9486] dark:text-[#6a6458]">No sessions logged yet.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([date, entries]) => (
                  <div key={date} className="px-4 pt-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9a9486] dark:text-[#6a6458] mb-2">{date}</p>
                    {entries.map(e => (
                      <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-[#f0ece4] dark:border-[#3a3530] last:border-0">
                        <div>
                          <p className="text-[14px] font-semibold text-[#2c2a24] dark:text-[#e8e3d8]">{e.day?.name ?? 'Session'}</p>
                          <p className="text-[12px] text-[#9a9486] dark:text-[#6a6458] mt-0.5">
                            {e.completedSteps}/{e.totalSteps} exercises &middot; {e.durationMinutes} min
                          </p>
                        </div>
                        <p className="text-[15px] font-extrabold text-[#8b7355]">{e.durationMinutes}m</p>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Document tab */}
          {tab === 'doc' && (
            <div className="mx-4 bg-white dark:bg-[#262320] border border-[#e0dbd0] dark:border-[#3a3530] border-t-0 rounded-b-2xl overflow-hidden p-4">
              {!docText && !editMode ? (
                <div className="py-12 text-center">
                  <p className="text-[14px] text-[#9a9486] dark:text-[#6a6458]">No document uploaded yet.</p>
                </div>
              ) : editMode ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#2c2a24] dark:text-[#e8e3d8] font-bold">Edit Document</p>
                    <div className="flex gap-2">
                      <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm text-[#9a9486] font-semibold">Cancel</button>
                      <button onClick={saveDoc} className="px-3 py-1.5 text-sm bg-[#3d3420] dark:bg-[#8b7355] text-white font-bold rounded-lg">Save</button>
                    </div>
                  </div>
                  <textarea
                    className="w-full min-h-[50vh] bg-[#faf7f2] dark:bg-[#2e2b26] text-[#2c2a24] dark:text-[#e8e3d8] text-sm leading-relaxed px-3 py-3 border border-[#e0dbd0] dark:border-[#3a3530] rounded-lg focus:outline-none resize-none font-mono"
                    value={draft} onChange={e => setDraft(e.target.value)} autoFocus
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#2c2a24] dark:text-[#e8e3d8] font-bold">Document</p>
                    <button onClick={startEdit} className="px-3 py-1.5 text-sm bg-[#f0ece4] dark:bg-[#2e2b26] text-[#5a5548] dark:text-[#9a9486] font-semibold rounded-lg">Edit</button>
                  </div>
                  <pre className="text-[#2c2a24] dark:text-[#e8e3d8]/80 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-[#faf7f2] dark:bg-[#2e2b26] rounded-lg p-4">{docText}</pre>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <NavBar />
    </div>
  );
}
