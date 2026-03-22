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
    <div className="min-h-screen bg-[#0e2020] flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="text-white font-black text-3xl mb-2">ScheduleAI</h1>
        <p className="text-[#6a9090] text-sm">Your AI-powered workout scheduler</p>
      </div>
      <div className="bg-[#1a3535] rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-6">
        <p className="text-white font-semibold text-base">Sign in to continue</p>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {}}
          useOneTap
          theme="filled_black"
          shape="rectangular"
          size="large"
          width="280"
        />
      </div>
    </div>
  );
}
