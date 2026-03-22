import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../lib/auth.jsx';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSuccess = (credentialResponse) => {
    const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    signIn(credentialResponse.credential, {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f2f2f5] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.06)] px-8 pt-8 pb-7">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-[#f0f0f5] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c6c8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 className="text-[#1a1a2e] font-semibold text-xl mb-1">Sign in to ScheduleAI</h1>
            <p className="text-[#747494] text-sm">Welcome back! Please sign in to continue</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e8e8f0]" />
            <span className="text-xs text-[#a0a0b8] font-medium">Continue with</span>
            <div className="flex-1 h-px bg-[#e8e8f0]" />
          </div>

          {/* Google button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {}}
              useOneTap
              theme="outline"
              shape="rectangular"
              size="large"
              width="320"
              text="continue_with"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#a0a0b8] mt-5">
          Secured by Google OAuth
        </p>
      </div>
    </div>
  );
}
