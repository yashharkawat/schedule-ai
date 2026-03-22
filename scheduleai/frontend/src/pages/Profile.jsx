import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

const DOC_KEY = 'scheduleai-doc';

export default function Profile() {
  const { user } = useUser();
  const { log, fetchLog, streak } = useStore();
  const [tab, setTab] = useState('progress'); // 'progress' | 'doc'
  const [docText, setDocText] = useState(() => localStorage.getItem(DOC_KEY) || '');
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => { fetchLog(); }, []);

  const saveDoc = () => {
    localStorage.setItem(DOC_KEY, draft);
    setDocText(draft);
    setEditMode(false);
  };

  const startEdit = () => {
    setDraft(docText);
    setEditMode(true);
  };

  // Group log by date
  const grouped = {};
  (log || []).forEach(entry => {
    const date = new Date(entry.completedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(entry);
  });

  return (
    <div className="min-h-screen bg-[#f0f5f5] dark:bg-[#0e2020] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a3535] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f2c029] flex items-center justify-center text-[#0e2020] font-black text-base">
            {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">{user?.fullName || 'You'}</p>
            <p className="text-[#6a9090] text-xs">{streak > 0 ? `🔥 ${streak} day streak` : 'No streak yet'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#dce8e8] dark:bg-[#1a3535]">
        {[['progress', 'Progress'], ['doc', 'Document']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              tab === key
                ? 'text-[#0f2828] dark:text-[#f2c029] border-b-2 border-[#f2c029]'
                : 'text-[#4a7272] dark:text-[#6a9090]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">

        {/* Progress tab */}
        {tab === 'progress' && (
          <div>
            {Object.keys(grouped).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <p className="text-[#4a7272] dark:text-[#6a9090] text-sm">No sessions logged yet.</p>
                <p className="text-[#8aacac] dark:text-[#4a7070] text-xs mt-1">Complete a session and save it to track progress.</p>
              </div>
            ) : (
              <div className="space-y-0.5 mt-0.5">
                {Object.entries(grouped).map(([date, entries]) => (
                  <div key={date} className="bg-[#dce8e8] dark:bg-[#1a3535] px-4 py-3">
                    <p className="text-[#4a7272] dark:text-[#6a9090] text-xs font-bold uppercase tracking-widest mb-2">{date}</p>
                    {entries.map(e => (
                      <div key={e.id} className="flex items-start justify-between py-2 border-b border-[#c4d8d8] dark:border-[#264040] last:border-0">
                        <div>
                          <p className="text-[#0f2828] dark:text-white font-semibold text-sm">{e.day?.name ?? 'Session'}</p>
                          <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5">
                            {e.completedSteps}/{e.totalSteps} exercises · {e.durationMinutes} min
                          </p>
                          {e.notes && <p className="text-[#4a7272] dark:text-[#6a9090] text-xs mt-0.5 italic">"{e.notes}"</p>}
                        </div>
                        <p className="text-[#1a7070] dark:text-[#f2c029] font-black text-sm">{e.durationMinutes}m</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Document tab */}
        {tab === 'doc' && (
          <div className="px-4 pt-4">
            {!docText && !editMode ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-[#4a7272] dark:text-[#6a9090] text-sm mb-1">No document uploaded yet.</p>
                <p className="text-[#8aacac] dark:text-[#4a7070] text-xs">Import a schedule from a document first.</p>
              </div>
            ) : editMode ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#0f2828] dark:text-white font-bold">Edit Document</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-1.5 text-sm text-[#4a7272] dark:text-[#6a9090] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDoc}
                      className="px-4 py-1.5 text-sm bg-[#f2c029] text-[#0e2020] font-bold rounded-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full min-h-[60vh] bg-[#dce8e8] dark:bg-[#1a3535] text-[#0f2828] dark:text-white text-sm leading-relaxed px-3 py-3 focus:outline-none resize-none rounded-sm font-mono"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  autoFocus
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#0f2828] dark:text-white font-bold">Document</p>
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#dce8e8] dark:bg-[#264040] text-[#1a7070] dark:text-[#f2c029] font-semibold rounded-sm"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
                <div className="bg-[#dce8e8] dark:bg-[#1a3535] rounded-sm px-4 py-4">
                  <pre className="text-[#0f2828] dark:text-white/80 text-xs leading-relaxed whitespace-pre-wrap font-sans">{docText}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
