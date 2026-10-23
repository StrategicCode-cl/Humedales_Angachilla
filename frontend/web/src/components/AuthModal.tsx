'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { AuthForm, AuthMode } from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User) => void;
  initialMode?: AuthMode;
}

// Sign-in in place, for actions that need a session (like, comment, sign up for an activity).
// The same form lives at /ingresar, /registro and /restablecer-clave for links from outside the app.
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Each opening starts on the requested mode, not on the one left last time
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setMode(initialMode);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/70"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={e => e.stopPropagation()}
        className="bg-white text-stone-900 w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-lg sm:rounded-lg shadow-xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <AuthForm
          mode={mode}
          onModeChange={setMode}
          currentUser={currentUser}
          onSuccess={user => {
            onUserChange(user);
            onClose();
          }}
          headerAction={
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 -mr-1 -mt-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          }
        />
      </div>
    </div>
  );
};
