'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  ChevronDown,
  X
} from 'lucide-react';
import { WetlandWeatherData, WetlandWeatherAlert } from '../types';
import { fetchWetlandWeather } from '../services/weatherService';

interface WetlandWeatherWidgetProps {
  onFocusCoordinates?: (coords: [number, number]) => void;
}

const REFRESH_MS = 15 * 60 * 1000;

const SEVERITY: Record<WetlandWeatherAlert['severity'], { label: string; dot: string; rank: number }> = {
  warning: { label: 'Alerta', dot: 'bg-rose-600', rank: 0 },
  caution: { label: 'Precaución', dot: 'bg-amber-500', rank: 1 },
  info: { label: 'Información', dot: 'bg-sky-600', rank: 2 },
  good: { label: 'Recomendación', dot: 'bg-emerald-600', rank: 3 }
};

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const cardinal = (deg: number) => CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

const PHONE_QUERY = '(max-width: 639px)';
const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

const decimal = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

function WeatherIcon({ code, isDay = true, className }: { code: number; isDay?: boolean; className: string }) {
  const props = { className, strokeWidth: 1.75, 'aria-hidden': true } as const;
  if (code === 0) return isDay ? <Sun {...props} /> : <Moon {...props} />;
  if (code === 1 || code === 2) return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
  if (code === 45 || code === 48) return <CloudFog {...props} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle {...props} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain {...props} />;
  if ([71, 73, 75, 85, 86].includes(code)) return <CloudSnow {...props} />;
  if (code >= 95) return <CloudLightning {...props} />;
  return <Cloud {...props} />;
}

function freshness(data: WetlandWeatherData) {
  if (!data.fetchedAt) return `a las ${data.updatedAt}`;
  const at = new Date(data.fetchedAt);
  const time = at.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (at.toDateString() === new Date().toDateString()) return `a las ${time}`;
  return `el ${at.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} a las ${time}`;
}

export const WetlandWeatherWidget: React.FC<WetlandWeatherWidgetProps> = () => {
  const [weather, setWeather] = useState<WetlandWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isPhone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);

  const loadWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      setWeather(await fetchWetlandWeather());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // First load and a refresh every 15 minutes; the state updates land after the request
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeatherData();
    const interval = setInterval(loadWeatherData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadWeatherData]);

  // Close with Escape or a click outside the panel
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsExpanded(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setIsExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [isExpanded]);

  const chipClass =
    'h-10 px-3 rounded-md bg-white text-stone-900 shadow-sm flex items-center gap-2 text-sm font-semibold';

  if (!weather) {
    return loading ? (
      <div id="weather-widget-loading" className={`${chipClass} text-stone-600 font-normal`} role="status">
        <span className="w-8 h-4 rounded-sm bg-stone-200" aria-hidden="true" />
        Cargando clima…
      </div>
    ) : failed ? (
      <button type="button" onClick={loadWeatherData} className={`${chipClass} hover:bg-stone-100`}>
        <span className="font-normal text-stone-600">Clima no disponible.</span> Reintentar
      </button>
    ) : null;
  }

  const notices = weather.wetlandAlerts
    .filter(a => a.severity !== 'good')
    .sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank);
  const recommendations = weather.wetlandAlerts.filter(a => a.severity === 'good');
  const urgent = notices.filter(a => a.severity === 'warning' || a.severity === 'caution');
  const today = weather.dailyForecast[0];

  const panelContent = (
    <>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h2 id="weather-title" className="text-base font-semibold">Clima en el humedal</h2>
          <p className="text-sm text-stone-600">
            {weather.isCached ? 'Sin conexión: datos guardados ' : 'Actualizado '}
            {freshness(weather)}
            {' · '}
            <button
              id="refresh-weather-button"
              type="button"
              onClick={loadWeatherData}
              disabled={loading}
              className="font-semibold text-stone-900 underline underline-offset-2 disabled:text-stone-500 disabled:no-underline"
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </p>
        </div>
        <button
          id="close-weather-details-button"
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-label="Cerrar clima"
          className="w-8 h-8 -mr-1 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Now */}
      <div className="px-4 pt-4 flex items-center gap-4">
        <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="w-10 h-10 text-stone-700 shrink-0" />
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{weather.temperature}°</span>
            <span className="text-base text-stone-800">{weather.weatherLabel}</span>
          </p>
          <p className="text-sm text-stone-600 tabular-nums">
            Sensación {weather.apparentTemperature}°
            {today && ` · Máx ${today.maxTemp}° · Mín ${today.minTemp}°`}
          </p>
        </div>
      </div>

      <dl className="mx-4 mt-4 grid grid-cols-4 border border-stone-200 rounded-md divide-x divide-stone-200">
        <div className="px-2 py-2">
          <dt className="text-xs text-stone-600">Humedad</dt>
          <dd className="text-base font-semibold tabular-nums">{weather.humidity} %</dd>
        </div>
        <div className="px-2 py-2">
          <dt className="text-xs text-stone-600">Viento</dt>
          <dd className="text-base font-semibold tabular-nums whitespace-nowrap">
            {weather.windSpeed} <span className="text-xs font-normal text-stone-600">km/h {cardinal(weather.windDirection)}</span>
          </dd>
        </div>
        <div className="px-2 py-2">
          <dt className="text-xs text-stone-600">Lluvia</dt>
          <dd className="text-base font-semibold tabular-nums whitespace-nowrap">
            {decimal.format(weather.precipitation)} <span className="text-xs font-normal text-stone-600">mm</span>
          </dd>
        </div>
        <div className="px-2 py-2">
          <dt className="text-xs text-stone-600">Índice UV</dt>
          <dd className="text-base font-semibold tabular-nums">{decimal.format(weather.uvIndex)}</dd>
        </div>
      </dl>

      {/* Conditions for the visit */}
      <section className="px-4 pt-5" aria-labelledby="weather-notices">
        <h3 id="weather-notices" className="text-sm font-semibold">Para tu visita</h3>
        <ul className="mt-1 divide-y divide-stone-200">
          {[...notices, ...recommendations].map(alert => (
            <li key={alert.id} className="py-2.5 flex items-start gap-2.5">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEVERITY[alert.severity].dot}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-950">
                  <span className="sr-only">{SEVERITY[alert.severity].label}: </span>
                  {alert.title}
                </p>
                <p className="text-sm text-stone-700 leading-snug">{alert.message}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Next days */}
      {weather.dailyForecast.length > 0 && (
        <section className="px-4 pt-3 pb-3" aria-labelledby="weather-forecast">
          <div className="flex items-baseline justify-between">
            <h3 id="weather-forecast" className="text-sm font-semibold">Próximos días</h3>
            <span className="text-xs text-stone-600">Prob. lluvia · Máx / Mín</span>
          </div>
          <table className="mt-1 w-full text-sm">
            <tbody className="divide-y divide-stone-200">
              {weather.dailyForecast.map(day => (
                <tr key={day.date}>
                  <th scope="row" className="py-2 pr-2 text-left font-semibold w-12">{day.dayName}</th>
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <WeatherIcon code={day.weatherCode} className="w-4 h-4 text-stone-600 shrink-0" />
                      <span className="truncate text-stone-700">{day.weatherLabel}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-stone-600 whitespace-nowrap w-14">{day.rainProb} %</td>
                  <td className="py-2 text-right tabular-nums whitespace-nowrap w-16">
                    <span className="font-semibold">{day.maxTemp}°</span>
                    <span className="text-stone-500"> / {day.minTemp}°</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="px-4 py-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600">
        Pronóstico de modelo, no de una estación en el humedal. Datos de{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-stone-900">
          Open-Meteo
        </a>{' '}
        (CC BY 4.0).
      </p>
    </>
  );

  const panelProps = {
    id: 'weather-details-card',
    ref: panelRef,
    role: 'dialog',
    'aria-labelledby': 'weather-title'
  } as const;

  return (
    <div id="wetland-weather-container" ref={rootRef} className={`relative ${isExpanded ? 'z-30' : 'z-20'}`}>
      <button
        id="toggle-weather-button"
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        aria-expanded={isExpanded}
        aria-controls="weather-details-card"
        className={`${chipClass} hover:bg-stone-100 active:scale-[0.98] transition-transform`}
      >
        <WeatherIcon code={weather.weatherCode} isDay={weather.isDay} className="w-5 h-5 text-stone-700" />
        <span className="tabular-nums">{weather.temperature}°</span>
        <span className="hidden sm:inline font-normal text-stone-600 max-w-[10rem] truncate">{weather.weatherLabel}</span>
        {urgent.length > 0 && (
          <span className="flex items-center gap-1.5 font-normal text-stone-700">
            <span className={`w-2 h-2 rounded-full ${SEVERITY[urgent[0].severity].dot}`} aria-hidden="true" />
            {urgent.length === 1 ? '1 aviso' : `${urgent.length} avisos`}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded &&
        (isPhone ? (
          // Phone: a bottom sheet above the app's bottom bar, outside the map's clipping
          createPortal(
            <div className="fixed inset-0 z-[70] flex items-end bg-stone-950/40" onClick={() => setIsExpanded(false)}>
              <div
                {...panelProps}
                aria-modal="true"
                onClick={e => e.stopPropagation()}
                className="w-full max-h-[85vh] overflow-y-auto overscroll-contain bg-white text-stone-900 rounded-t-lg shadow-lg pb-[env(safe-area-inset-bottom)]"
              >
                {panelContent}
              </div>
            </div>,
            document.body
          )
        ) : (
          // Tablet and desktop: a popover inside the map, which clips at its own height (58vh / full screen)
          <div
            {...panelProps}
            className="absolute top-12 left-0 w-[22rem] max-h-[calc(58vh-4.5rem)] lg:max-h-[min(40rem,calc(100vh-5.5rem))] overflow-y-auto overscroll-contain bg-white text-stone-900 border border-stone-200 rounded-lg shadow-lg z-40"
          >
            {panelContent}
          </div>
        ))}
    </div>
  );
};
