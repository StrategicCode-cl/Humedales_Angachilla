'use client';

import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { ApiError, authApi } from '../lib/api';

export type AuthMode = 'login' | 'register' | 'forgot';

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: (user: User) => void;
  currentUser?: User | null;
  /** Rendered at the right of the title (the modal's close button) */
  headerAction?: React.ReactNode;
  titleId?: string;
}

const USERNAME_RE = /^[a-z0-9._]{3,30}$/;
const MIN_PASSWORD = 8;

export const inputClass =
  'w-full h-11 px-3 rounded-md bg-white border border-stone-300 text-base text-stone-900 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent aria-[invalid=true]:border-rose-600';
const labelClass = 'block text-sm font-semibold text-stone-800 mb-1';
const primaryButton =
  'w-full h-11 rounded-md bg-stone-950 hover:bg-stone-800 disabled:bg-stone-400 text-white text-base font-semibold transition-colors';
const linkButton = 'font-semibold text-stone-900 underline underline-offset-2 hover:text-emerald-800';

const TITLES: Record<AuthMode, { title: string; text: string }> = {
  login: { title: 'Iniciar sesión', text: 'Entra para ver tu perfil, tus pines y tus sugerencias.' },
  register: { title: 'Crear cuenta', text: 'Regístrate para publicar en la comunidad del humedal.' },
  forgot: { title: 'Recuperar contraseña', text: 'Te enviaremos un enlace para crear una nueva.' },
};

const normalizeUsername = (value: string) => value.trim().replace(/^@+/, '').toLowerCase();

export const PasswordInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
> = ({ invalid, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={visible ? 'text' : 'password'} aria-invalid={invalid || undefined} className={`${inputClass} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </span>
  );
};

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <span id={id} className="mt-1 block text-sm text-rose-700">
      {message}
    </span>
  ) : null;

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onModeChange,
  onSuccess,
  currentUser,
  headerAction,
  titleId = 'auth-title',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ value: string; available: boolean; reason?: string } | null>(null);

  // Live check of the username while it is typed (format here, availability on the server)
  const cleanUsername = normalizeUsername(username);
  useEffect(() => {
    if (mode !== 'register' || !USERNAME_RE.test(cleanUsername)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      authApi
        .usernameAvailable(cleanUsername)
        .then(r => !cancelled && setUsernameStatus({ value: cleanUsername, ...r }))
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, cleanUsername]);

  const usernameHint = (() => {
    if (!cleanUsername) return null;
    if (!USERNAME_RE.test(cleanUsername)) {
      return { ok: false, text: 'Entre 3 y 30 caracteres: letras minúsculas, números, punto o guion bajo.' };
    }
    if (usernameStatus?.value !== cleanUsername) return null;
    return usernameStatus.available
      ? { ok: true, text: 'Disponible' }
      : { ok: false, text: usernameStatus.reason ?? 'No disponible' };
  })();

  const switchMode = (next: AuthMode) => {
    setError(null);
    setFieldErrors({});
    setForgotSent(false);
    setPassword('');
    // Carry what was typed: an email in the login box becomes the register email and back
    if (next === 'register' && identifier.includes('@') && !email) setEmail(identifier);
    if (next !== 'register' && !identifier && (email || username)) setIdentifier(email || username);
    onModeChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (mode === 'register' && usernameHint && !usernameHint.ok) {
      setFieldErrors({ username: usernameHint.text });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'forgot') {
        await authApi.forgotPassword(identifier.trim());
        setForgotSent(true);
        return;
      }
      const user =
        mode === 'login'
          ? await authApi.login(identifier.trim(), password)
          : await authApi.register({
              name: name.trim(),
              lastName: lastName.trim() || undefined,
              username: cleanUsername,
              email: email.trim(),
              password,
            });
      setPassword('');
      onSuccess(user);
    } catch (err) {
      if (err instanceof ApiError && err.field) setFieldErrors({ [err.field]: err.message });
      else setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { title, text } = TITLES[mode];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-xl font-semibold tracking-tight text-stone-950">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-stone-600">{text}</p>
        </div>
        {headerAction}
      </div>

      {currentUser && mode !== 'forgot' && (
        <p className="mt-4 px-3 py-2 rounded-md bg-stone-100 text-sm text-stone-700">
          Sesión activa como <strong className="font-semibold text-stone-900">{currentUser.name}</strong>. Si ingresas con otra
          cuenta, la reemplaza.
        </p>
      )}

      {mode === 'forgot' && forgotSent ? (
        <div className="mt-5">
          <p className="rounded-md bg-stone-100 px-3 py-3 text-[15px] leading-relaxed text-stone-800">
            Si existe una cuenta con esos datos, te enviamos un correo con un enlace para crear una nueva contraseña. El
            enlace vence en 60 minutos; revisa también la carpeta de spam.
          </p>
          <button type="button" onClick={() => switchMode('login')} className={`mt-5 ${primaryButton}`}>
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate={mode === 'register'}>
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Nombre</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="given-name"
                    placeholder="Sofía"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>
                    Apellido <span className="font-normal text-stone-500">(opcional)</span>
                  </span>
                  <input
                    type="text"
                    maxLength={100}
                    autoComplete="family-name"
                    placeholder="Cárdenas"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Nombre de usuario</span>
                <span className="relative block">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-stone-500" aria-hidden="true">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={31}
                    placeholder="sofia.cardenas"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/^@+/, '').toLowerCase())}
                    aria-invalid={!!fieldErrors.username || (usernameHint ? !usernameHint.ok : undefined)}
                    aria-describedby="username-hint"
                    className={`${inputClass} pl-7`}
                  />
                </span>
                <span id="username-hint" className="mt-1 block text-sm" aria-live="polite">
                  {fieldErrors.username ? (
                    <span className="text-rose-700">{fieldErrors.username}</span>
                  ) : usernameHint ? (
                    <span className={`inline-flex items-center gap-1 ${usernameHint.ok ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {usernameHint.ok && <Check className="w-4 h-4" />}
                      {usernameHint.text}
                    </span>
                  ) : (
                    <span className="text-stone-600">Así te verán en la comunidad. También sirve para iniciar sesión.</span>
                  )}
                </span>
              </label>

              <label className="block">
                <span className={labelClass}>Correo electrónico</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu.correo@ejemplo.cl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  aria-invalid={!!fieldErrors.email || undefined}
                  aria-describedby="email-error"
                  className={inputClass}
                />
                <FieldError id="email-error" message={fieldErrors.email} />
              </label>
            </>
          )}

          {mode !== 'register' && (
            <label className="block">
              <span className={labelClass}>Correo o nombre de usuario</span>
              <input
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="tu.correo@ejemplo.cl o @usuario"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <label htmlFor="auth-password" className="text-sm font-semibold text-stone-800">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-950">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <PasswordInput
                id="auth-password"
                required
                minLength={mode === 'register' ? MIN_PASSWORD : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                invalid={!!fieldErrors.password}
                aria-describedby={mode === 'register' ? 'password-hint' : undefined}
              />
              {mode === 'register' &&
                (fieldErrors.password ? (
                  <FieldError id="password-hint" message={fieldErrors.password} />
                ) : (
                  <span id="password-hint" className="mt-1 block text-sm text-stone-600">
                    Mínimo {MIN_PASSWORD} caracteres.
                  </span>
                ))}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-rose-800 bg-rose-50 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={primaryButton}>
            {isSubmitting
              ? 'Un momento…'
              : mode === 'login'
              ? 'Ingresar'
              : mode === 'register'
              ? 'Crear cuenta'
              : 'Enviar enlace'}
          </button>
        </form>
      )}

      {!(mode === 'forgot' && forgotSent) && (
        <p className="mt-4 text-sm text-stone-600 text-center">
          {mode === 'login' && (
            <>
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => switchMode('register')} className={linkButton}>
                Crear una
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => switchMode('login')} className={linkButton}>
                Iniciar sesión
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              ¿La recordaste?{' '}
              <button type="button" onClick={() => switchMode('login')} className={linkButton}>
                Volver a iniciar sesión
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
};
