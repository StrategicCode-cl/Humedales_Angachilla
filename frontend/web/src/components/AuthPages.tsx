'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { ApiError, authApi } from '../lib/api';
import { pathForTab } from '../lib/tabs';
import { AuthForm, AuthMode, PasswordInput } from './AuthForm';
import { AngachillaIcon } from './AngachillaIcon';
import { useApp } from './AppShell';

const MODE_PATH: Record<AuthMode, string> = {
  login: '/ingresar',
  register: '/registro',
  forgot: '/ingresar?recuperar=1',
};

// Only same-site paths: "/mapa" yes, "//otro.sitio" or "https://..." no
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

const readParam = (name: string) =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name);

const PageFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-[calc(100dvh-8rem)] flex items-start sm:items-center justify-center px-4 py-8 sm:py-12">
    <div className="w-full max-w-md">
      <Link href={pathForTab('avisos')} className="mb-5 inline-flex items-center gap-2.5 text-stone-900">
        <AngachillaIcon className="w-10 h-10 rounded-[23%] ring-1 ring-stone-200" />
        <span className="text-sm font-semibold">Humedal Angachilla</span>
      </Link>
      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-7">{children}</div>
    </div>
  </div>
);

export const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode: routeMode }) => {
  const router = useRouter();
  const { currentUser, signIn } = useApp();
  const [mode, setMode] = useState<AuthMode>(() => (readParam('recuperar') ? 'forgot' : routeMode));
  const [next] = useState(() => safeNext(readParam('next')));

  const changeMode = (m: AuthMode) => {
    setMode(m);
    // Keep the address in step with the form, without adding history entries
    const query = next !== '/' ? `${MODE_PATH[m].includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}` : '';
    router.replace(MODE_PATH[m] + query, { scroll: false });
  };

  return (
    <PageFrame>
      <AuthForm
        mode={mode}
        onModeChange={changeMode}
        currentUser={currentUser}
        onSuccess={user => {
          signIn(user);
          router.push(next);
        }}
      />
    </PageFrame>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const { signIn } = useApp();
  const [token] = useState(() => readParam('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    try {
      signIn(await authApi.resetPassword(token, password));
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <PageFrame>
        <h1 className="text-xl font-semibold tracking-tight text-stone-950">Enlace incompleto</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-700">
          Este enlace no trae el código para cambiar la contraseña. Ábrelo directamente desde el correo, o pide uno nuevo.
        </p>
        <Link
          href="/ingresar?recuperar=1"
          className="mt-5 flex items-center justify-center h-11 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-base font-semibold"
        >
          Pedir un enlace nuevo
        </Link>
      </PageFrame>
    );
  }

  if (done) {
    return (
      <PageFrame>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-950">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          Contraseña actualizada
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-stone-700">Ya iniciaste sesión con tu nueva contraseña.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-5 w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 text-white text-base font-semibold"
        >
          Ir al inicio
        </button>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <h1 className="text-xl font-semibold tracking-tight text-stone-950">Elige una nueva contraseña</h1>
      <p className="mt-0.5 text-sm text-stone-600">Úsala desde ahora para iniciar sesión.</p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-stone-800 mb-1">
            Nueva contraseña
          </label>
          <PasswordInput
            id="new-password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            aria-describedby="new-password-hint"
          />
          <span id="new-password-hint" className="mt-1 block text-sm text-stone-600">
            Mínimo 8 caracteres.
          </span>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-stone-800 mb-1">
            Repite la contraseña
          </label>
          <PasswordInput
            id="confirm-password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            invalid={!!confirm && confirm !== password}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">
            {error}{' '}
            {error.includes('venció') && (
              <Link href="/ingresar?recuperar=1" className="font-semibold underline underline-offset-2">
                Pedir otro
              </Link>
            )}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-400 text-white text-base font-semibold"
        >
          {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </PageFrame>
  );
};
