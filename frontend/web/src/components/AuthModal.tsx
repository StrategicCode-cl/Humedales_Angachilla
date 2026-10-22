'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

const inputClass =
  'w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPassword('');
        setError(null);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = mode === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password);
      onUserChange(user);
      setName('');
      setEmail('');
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/70"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={e => e.stopPropagation()}
        className="bg-white text-stone-900 w-full sm:max-w-sm rounded-t-lg sm:rounded-lg shadow-xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="auth-title" className="text-xl font-semibold tracking-tight">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className="mt-0.5 text-sm text-stone-600">
              {mode === 'login'
                ? 'Entra para ver tu perfil, tus pines y tus sugerencias.'
                : 'Regístrate para publicar en la comunidad del humedal.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 -mr-1 -mt-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser && (
          <p className="mt-4 px-3 py-2 rounded-md bg-stone-100 text-sm text-stone-700">
            Sesión activa como <strong className="font-semibold text-stone-900">{currentUser.name}</strong>. Si ingresas con otra
            cuenta, la reemplaza.
          </p>
        )}

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="block text-sm font-semibold text-stone-800 mb-1">Nombre</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Sofía Cárdenas"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          <label className="block">
            <span className="block text-sm font-semibold text-stone-800 mb-1">Correo electrónico</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tu.correo@ejemplo.cl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-stone-800 mb-1">Contraseña</span>
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              aria-describedby={mode === 'register' ? 'password-hint' : undefined}
              className={inputClass}
            />
            {mode === 'register' && (
              <span id="password-hint" className="mt-1 block text-sm text-stone-600">
                Mínimo 8 caracteres.
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-400 text-white text-base font-semibold transition-colors"
          >
            {isSubmitting ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-600 text-center">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button type="button" onClick={toggleMode} className="font-semibold text-stone-900 underline underline-offset-2">
            {mode === 'login' ? 'Crear una' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};
