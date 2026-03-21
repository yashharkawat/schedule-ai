import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import useStore from '../store/useStore.js';
import NavBar from '../components/NavBar.jsx';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { schedule, loading } = useStore();

  useEffect(() => {
    if (schedule) navigate('/schedule');
  }, [schedule]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1eb] dark:bg-gray-950 flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-5 pt-16 pb-28 flex flex-col">

        {/* Header */}
        <div className="mb-10">
          <div className="w-14 h-14 bg-[#3d3420] dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mb-5 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f4f1eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#2c2a24] dark:text-gray-50 mb-2">
            {user?.firstName ? `Hey, ${user.firstName}` : 'Welcome'}
          </h1>
          <p className="text-[#7a7060] dark:text-gray-400 text-base leading-relaxed">
            Build your weekly schedule and run guided timed sessions.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/schedule/import')}
            className="w-full group bg-[#3d3420] dark:bg-[#3d3420] text-white rounded-2xl p-5 text-left hover:bg-[#2c2412] active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-base mb-1">Import from document</div>
                <div className="text-[#c9b99a] text-sm">Upload PDF or DOCX — AI extracts your schedule</div>
              </div>
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center ml-4 flex-shrink-0 group-hover:bg-white/15 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/schedule/new')}
            className="w-full group bg-white dark:bg-gray-800/60 border border-[#e0dbd0] dark:border-gray-700 text-[#2c2a24] dark:text-gray-100 rounded-2xl p-5 text-left hover:border-[#8b7355] dark:hover:border-amber-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-base mb-1">Build manually</div>
                <div className="text-[#7a7060] dark:text-gray-400 text-sm">Create your schedule day by day</div>
              </div>
              <div className="w-9 h-9 bg-[#f4f1eb] dark:bg-gray-700 rounded-xl flex items-center justify-center ml-4 flex-shrink-0 group-hover:bg-[#e8e2d8] dark:group-hover:bg-gray-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <NavBar />
    </div>
  );
}
