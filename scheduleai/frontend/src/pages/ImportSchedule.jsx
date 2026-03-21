import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractText } from '../lib/parseDoc.js';
import { api } from '../lib/api.js';
import useStore from '../store/useStore.js';

const ACCEPTED = '.pdf,.docx';

export default function ImportSchedule() {
  const navigate = useNavigate();
  const { fetchSchedule } = useStore();
  const inputRef = useRef();

  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | extracting | analyzing | preview | saving | error
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // parsed schedule from AI

  const processFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.');
      setStatus('error');
      return;
    }

    setError('');
    setStatus('extracting');
    try {
      const text = await extractText(file);
      if (!text || text.trim().length < 20) {
        throw new Error('Could not extract readable text from this file.');
      }

      setStatus('analyzing');
      const schedule = await api.importScheduleFromAI(text);
      setPreview(schedule);
      setStatus('preview');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    processFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      await fetchSchedule();
      navigate('/schedule');
    } catch {
      navigate('/schedule');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError('');
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const totalExercises = preview?.days?.reduce((a, d) => a + (d.steps?.length || 0), 0) || 0;
  const activeDays = preview?.days?.filter(d => d.steps?.length > 0) || [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-[#9a9486] hover:text-[#3d3420] dark:text-gray-400 text-sm">
          ← Back
        </button>
        <h1 className="flex-1 text-xl font-bold text-[#2c2a24] dark:text-gray-100">Import from document</h1>
      </div>

      {/* Drop zone */}
      {status === 'idle' && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
              ${dragging
                ? 'border-[#8b7355] bg-[#f7f2e8] dark:bg-gray-700'
                : 'border-[#d4cfc4] dark:border-gray-600 hover:border-[#8b7355] hover:bg-[#faf7f2] dark:hover:bg-gray-750'
              }`}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold text-[#2c2a24] dark:text-gray-100 mb-1">Drop your document here</p>
            <p className="text-sm text-[#9a9486] dark:text-gray-400">or tap to choose a file</p>
            <p className="text-xs text-[#b0a898] dark:text-gray-500 mt-3">PDF or DOCX</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileInput}
          />
          <p className="text-xs text-center text-[#9a9486] dark:text-gray-400 mt-4">
            AI will read your document and extract a weekly schedule automatically.
          </p>
        </>
      )}

      {/* Loading states */}
      {(status === 'extracting' || status === 'analyzing' || status === 'saving') && (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="font-medium text-[#2c2a24] dark:text-gray-100">
            {status === 'extracting' && 'Reading document...'}
            {status === 'analyzing' && 'AI is analyzing your schedule...'}
            {status === 'saving' && 'Saving...'}
          </p>
          <p className="text-sm text-[#9a9486] dark:text-gray-400 mt-1">
            {status === 'analyzing' && 'This may take a few seconds'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="font-semibold text-[#2c2a24] dark:text-gray-100 mb-2">Could not parse document</p>
          <p className="text-sm text-red-500 mb-6">{error}</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#3d3420] text-white rounded-2xl font-semibold hover:bg-[#2c2412] active:scale-95 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Preview */}
      {status === 'preview' && preview && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#e0dbd0] dark:border-gray-700 p-5 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[#9a9486] dark:text-gray-400 uppercase tracking-wider mb-1">Schedule found</p>
                <h2 className="text-xl font-bold text-[#2c2a24] dark:text-gray-100">{preview.title}</h2>
                {preview.description && (
                  <p className="text-sm text-[#5a5548] dark:text-gray-300 mt-1">{preview.description}</p>
                )}
              </div>
              <div className="text-2xl">✓</div>
            </div>

            <div className="flex gap-4 text-sm mb-5">
              <div className="text-center">
                <div className="font-bold text-lg text-[#3d3420] dark:text-amber-400">{activeDays.length}</div>
                <div className="text-[#9a9486] dark:text-gray-400 text-xs">days</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-[#3d3420] dark:text-amber-400">{totalExercises}</div>
                <div className="text-[#9a9486] dark:text-gray-400 text-xs">exercises</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-[#3d3420] dark:text-amber-400">{preview.restSeconds || 30}s</div>
                <div className="text-[#9a9486] dark:text-gray-400 text-xs">rest</div>
              </div>
            </div>

            <div className="space-y-2">
              {activeDays.map((day) => {
                const mins = day.steps?.reduce((a, s) => a + (s.durationMinutes || 0), 0) || 0;
                return (
                  <div key={day.name} className="flex items-center justify-between py-2 border-t border-[#f0ece4] dark:border-gray-700 first:border-0">
                    <div>
                      <span className="font-medium text-sm text-[#2c2a24] dark:text-gray-100">{day.name}</span>
                      <span className="text-xs text-[#9a9486] dark:text-gray-400 ml-2">
                        {day.steps?.length} exercise{day.steps?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-[#9a9486] dark:text-gray-400">{mins} min</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 bg-[#3d3420] text-white rounded-2xl font-semibold text-base hover:bg-[#2c2412] active:scale-95 transition-all mb-3"
          >
            Use this schedule →
          </button>
          <button
            onClick={reset}
            className="w-full py-3 text-sm text-[#9a9486] dark:text-gray-400 hover:text-[#3d3420] dark:hover:text-gray-100 transition-colors"
          >
            Try a different file
          </button>
        </div>
      )}
    </div>
  );
}
