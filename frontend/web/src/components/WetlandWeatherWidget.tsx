'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSun,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Thermometer,
  ShieldAlert,
  Info,
  Waves,
  Footprints,
  Compass,
  X
} from 'lucide-react';
import { WetlandWeatherData, WetlandWeatherAlert } from '../types';
import { fetchWetlandWeather } from '../services/weatherService';

interface WetlandWeatherWidgetProps {
  onFocusCoordinates?: (coords: [number, number]) => void;
}

export const WetlandWeatherWidget: React.FC<WetlandWeatherWidgetProps> = () => {
  const [weather, setWeather] = useState<WetlandWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'forecast'>('alerts');

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const data = await fetchWetlandWeather();
      setWeather(data);
    } catch (err) {
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
    // Auto-refresh every 15 minutes
    const interval = setInterval(loadWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather && loading) {
    return (
      <div
        id="weather-widget-loading"
        className="bg-stone-900/90 backdrop-blur-md border border-stone-700/60 rounded-2xl px-3.5 py-2 text-stone-200 text-xs flex items-center space-x-2 shadow-xl"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Consultando clima del humedal...</span>
      </div>
    );
  }

  if (!weather) return null;

  // Determine top alert
  const topAlert = weather.wetlandAlerts.find(a => a.severity === 'warning') ||
    weather.wetlandAlerts.find(a => a.severity === 'caution') ||
    weather.wetlandAlerts[0];

  const hasUrgentAlert = weather.wetlandAlerts.some(a => a.severity === 'warning' || a.severity === 'caution');

  // Choose weather icon
  const getWeatherIcon = (code: number, isDay: boolean = true) => {
    if (code === 0 || code === 1) {
      return isDay ? <Sun className="w-5 h-5 text-amber-400" /> : <CloudSun className="w-5 h-5 text-indigo-300" />;
    }
    if (code === 2) {
      return <CloudSun className="w-5 h-5 text-sky-400" />;
    }
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return <CloudRain className="w-5 h-5 text-blue-400" />;
    }
    return <Cloud className="w-5 h-5 text-stone-300" />;
  };

  const getAlertBadgeColor = (severity: WetlandWeatherAlert['severity']) => {
    switch (severity) {
      case 'warning':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'caution':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'info':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'good':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const getAlertIcon = (category: WetlandWeatherAlert['category']) => {
    switch (category) {
      case 'resbaladizo':
        return <Footprints className="w-4 h-4 text-amber-400" />;
      case 'marea':
        return <Waves className="w-4 h-4 text-sky-400" />;
      case 'viento':
        return <Wind className="w-4 h-4 text-indigo-400" />;
      case 'uv':
        return <Sun className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div id="wetland-weather-container" className="relative z-20">
      {/* --- COMPACT FLOATING BAR (ON MAP) --- */}
      <div className="flex items-center space-x-1.5">
        <button
          id="toggle-weather-button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-2xl shadow-xl border backdrop-blur-md transition-all active:scale-95 ${
            hasUrgentAlert
              ? 'bg-stone-900/95 border-amber-500/40 text-stone-100 hover:border-amber-400 hover:bg-stone-900'
              : 'bg-stone-900/90 border-stone-700/60 text-stone-100 hover:bg-stone-900 hover:border-emerald-500/40'
          }`}
          title="Ver clima en tiempo real y alertas de sendero"
        >
          {/* Weather Icon & Temp */}
          <div className="flex items-center space-x-1.5">
            {getWeatherIcon(weather.weatherCode, weather.isDay)}
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              {weather.temperature}°C
            </span>
          </div>

          {/* Condition text (hidden on small mobile screens to keep HUD clean) */}
          <span className="hidden sm:inline text-xs text-stone-300 font-medium border-l border-stone-700 pl-2 max-w-[130px] truncate">
            {weather.weatherLabel}
          </span>

          {/* Alert pill */}
          {topAlert && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getAlertBadgeColor(
                topAlert.severity
              )}`}
            >
              {topAlert.severity === 'warning' || topAlert.severity === 'caution' ? (
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400" />
              )}
              <span className="hidden md:inline">{topAlert.title}</span>
              <span className="md:hidden">
                {weather.wetlandAlerts.length > 1 ? `${weather.wetlandAlerts.length} avisos` : topAlert.title}
              </span>
            </span>
          )}

          {/* Toggle chevron */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-stone-400 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400 ml-1" />
          )}
        </button>

        {/* Quick Refresh Icon Button */}
        <button
          id="refresh-weather-button"
          onClick={loadWeatherData}
          disabled={loading}
          className="p-2 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700/60 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
          title="Actualizar datos meteorológicos en vivo"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* --- EXPANDED DETAILS CARD MODAL / POPUP --- */}
      {isExpanded && (
        <div
          id="weather-details-card"
          className="absolute top-12 left-0 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-stone-900/98 backdrop-blur-xl border border-stone-700/80 rounded-3xl p-4 shadow-2xl text-stone-100 mt-2 z-40 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-stone-800 pb-3 mb-3">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Estación Meteorológica
                </span>
                <span className="text-[10px] text-stone-400">Valdivia, CL</span>
              </div>
              <h3 className="text-base font-black text-white mt-1">Humedal Angachilla</h3>
              <p className="text-[11px] text-stone-400 flex items-center gap-1">
                <span>Actualizado {weather.updatedAt} hrs</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Open-Meteo API</span>
              </p>
            </div>

            <button
              id="close-weather-details-button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Big Metric */}
          <div className="flex items-center justify-between bg-stone-800/60 border border-stone-700/50 rounded-2xl p-3.5 mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700">
                {getWeatherIcon(weather.weatherCode, weather.isDay)}
              </div>
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-black text-white">{weather.temperature}°C</span>
                  <span className="text-xs text-stone-400">
                    ST: <strong className="text-stone-200">{weather.apparentTemperature}°C</strong>
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-300 mt-0.5">{weather.weatherLabel}</p>
              </div>
            </div>

            <div className="text-right text-[11px] text-stone-400 space-y-0.5">
              <div>
                Max: <span className="text-stone-200 font-bold">{weather.dailyForecast[0]?.maxTemp}°</span> / Min:{' '}
                <span className="text-stone-200 font-bold">{weather.dailyForecast[0]?.minTemp}°</span>
              </div>
              <div className="text-sky-300 font-medium">Lluvia: {weather.precipitationProbability}%</div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3 text-center">
            <div className="bg-stone-800/40 border border-stone-700/40 rounded-xl p-2">
              <div className="flex justify-center text-blue-400 mb-1">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-400 block">Humedad</span>
              <span className="text-xs font-bold text-stone-100">{weather.humidity}%</span>
            </div>

            <div className="bg-stone-800/40 border border-stone-700/40 rounded-xl p-2">
              <div className="flex justify-center text-emerald-400 mb-1">
                <Wind className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-400 block">Viento</span>
              <span className="text-xs font-bold text-stone-100">{weather.windSpeed} km/h</span>
            </div>

            <div className="bg-stone-800/40 border border-stone-700/40 rounded-xl p-2">
              <div className="flex justify-center text-sky-400 mb-1">
                <CloudRain className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-400 block">Lluvia</span>
              <span className="text-xs font-bold text-stone-100">{weather.precipitation} mm</span>
            </div>

            <div className="bg-stone-800/40 border border-stone-700/40 rounded-xl p-2">
              <div className="flex justify-center text-amber-400 mb-1">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-400 block">Índice UV</span>
              <span className="text-xs font-bold text-stone-100">{weather.uvIndex}</span>
            </div>
          </div>

          {/* Tabs Selector: Alertas vs Pronóstico */}
          <div className="flex rounded-xl bg-stone-800/80 p-1 mb-3 border border-stone-700/60">
            <button
              id="weather-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Alertas Humedal ({weather.wetlandAlerts.length})</span>
            </button>
            <button
              id="weather-tab-forecast"
              onClick={() => setActiveTab('forecast')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'forecast'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>Pronóstico 4 Días</span>
            </button>
          </div>

          {/* TAB 1: WETLAND SPECIFIC ALERTS & VISITATION RECOMMENDATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {weather.wetlandAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-xl border flex items-start space-x-2.5 ${getAlertBadgeColor(
                    alert.severity
                  )}`}
                >
                  <div className="p-1.5 rounded-lg bg-stone-900/60 border border-stone-700 flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{alert.title}</h4>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-stone-900/80 border border-stone-700">
                        {alert.severity === 'warning'
                          ? 'Alerta'
                          : alert.severity === 'caution'
                          ? 'Precaución'
                          : alert.severity === 'good'
                          ? 'Óptimo'
                          : 'Información'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: MULTI-DAY FORECAST */}
          {activeTab === 'forecast' && (
            <div className="space-y-1.5">
              {weather.dailyForecast.map(item => (
                <div
                  key={item.date}
                  className="flex items-center justify-between bg-stone-800/50 hover:bg-stone-800/80 border border-stone-700/40 rounded-xl px-3 py-2 text-xs transition-colors"
                >
                  <div className="w-16 font-bold text-stone-200">{item.dayName}</div>
                  <div className="flex items-center space-x-2 flex-1 justify-center">
                    {getWeatherIcon(item.weatherCode)}
                    <span className="text-stone-300 text-[11px] truncate max-w-[120px]">
                      {item.weatherLabel}
                    </span>
                  </div>
                  <div className="w-24 text-right flex items-center justify-end space-x-2">
                    <span className="text-[10px] text-sky-400 font-semibold">{item.rainProb}% ☔</span>
                    <span className="font-extrabold text-white">
                      {item.maxTemp}° / <span className="text-stone-400 font-normal">{item.minTemp}°</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-emerald-400" />
              Santuario de la Naturaleza Angachilla
            </span>
            <button
              onClick={loadWeatherData}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              Refrescar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
