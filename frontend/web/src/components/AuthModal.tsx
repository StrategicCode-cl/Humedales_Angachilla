'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  ShieldCheck,
  LogIn,
  Compass,
  X,
  Sparkles,
  Check,
  UserPlus
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storageService, DEFAULT_ADMIN, DEFAULT_VISITOR } from '../services/storageService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  if (!isOpen) return null;

  const handleQuickLogin = (preset: User) => {
    storageService.setCurrentUser(preset);
    onUserChange(preset);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const registered = storageService.registerUser(
      name || email.split('@')[0],
      email,
      role
    );
    onUserChange(registered);
    onClose();
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
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Status */}
        {currentUser && (
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
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

        {/* Quick Demo Access Buttons */}
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
            Acceso Rápido con 1 Clic
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin(DEFAULT_ADMIN)}
              className="p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Guardaparque</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80 mt-1 truncate">
                Moderar sugerencias, avisos y fotos
              </p>
            </button>

            <button
              onClick={() => handleQuickLogin(DEFAULT_VISITOR)}
              className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Visitante</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                  USUARIO
                </span>
              </div>
              <p className="text-[10px] text-emerald-800/80 mt-1 truncate">
                Navegar rutas y subir fotos/sugerencias
              </p>
            </button>
          </div>
        </div>

        {/* Custom Registration / Login Form */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              {mode === 'login' ? 'O ingresa con tus datos' : 'Registrar nueva cuenta'}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
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
                  placeholder="Ej: Sofía Cárdenas"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                placeholder="tu.correo@ejemplo.cl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Rol de la Cuenta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'user'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    🌿 Visitante Común
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'admin'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    🛡️ Guardaparque (Admin)
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow transition-colors"
            >
              {mode === 'login' ? 'Ingresar a la Plataforma' : 'Crear Cuenta y Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
