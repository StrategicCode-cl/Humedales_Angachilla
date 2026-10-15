'use client';

import React, { useState } from 'react';
import { Compass, X } from 'lucide-react';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none';

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

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-stone-900 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display text-stone-900">
                {mode === 'login' ? 'Iniciar Sesión' : 'Registro de Visitante'}
              </h3>
              <p className="text-xs text-stone-500">Santuario Humedal Angachilla</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Status */}
        {currentUser && (
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-emerald-500"
              />
              <div>
                <p className="text-xs font-bold text-stone-900 leading-tight">
                  {currentUser.name}
                </p>
                <span className="text-[10px] text-stone-500">
                  {currentUser.role === 'admin' ? '🛡️ Guardaparque (Admin)' : '🌿 Visitante / Vecino'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Activo
            </span>
          </div>
        )}

        {/* Registration / Login Form */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              {mode === 'login' ? 'Ingresa con tus datos' : 'Registrar nueva cuenta'}
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              {mode === 'login' ? '¿Crear cuenta?' : '¿Ya tienes cuenta?'}
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Ej: Sofía Cárdenas"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu.correo@ejemplo.cl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-bold shadow transition-colors"
            >
              {isSubmitting
                ? 'Procesando…'
                : mode === 'login' ? 'Ingresar a la Plataforma' : 'Crear Cuenta y Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
