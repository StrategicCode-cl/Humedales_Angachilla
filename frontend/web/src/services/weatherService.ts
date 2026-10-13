import { WetlandWeatherData, WetlandWeatherAlert, DayForecast } from '../types';

// Valdivia - Humedal Angachilla coordinates
const LATITUDE = -39.8515;
const LONGITUDE = -73.2260;

// WMO Weather interpretation table (Spanish localized for southern Chile / Valdivia)
export function interpretWeatherCode(code: number, isDay: boolean = true): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: isDay ? 'Despejado' : 'Noche despejada', icon: isDay ? '☀️' : '🌙' };
    case 1:
      return { label: isDay ? 'Mayormente despejado' : 'Mayormente despejado', icon: isDay ? '🌤️' : '🌙' };
    case 2:
      return { label: 'Parcialmente nublado', icon: '⛅' };
    case 3:
      return { label: 'Nublado / Cubierto', icon: '☁️' };
    case 45:
    case 48:
      return { label: 'Niebla sobre el humedal', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { label: 'Llovizna valdiviana', icon: '🌦️' };
    case 56:
    case 57:
      return { label: 'Llovizna helada', icon: '🌨️' };
    case 61:
      return { label: 'Lluvia ligera', icon: '🌧️' };
    case 63:
      return { label: 'Lluvia moderada', icon: '🌧️' };
    case 65:
      return { label: 'Lluvia intensa valdiviana', icon: '🌧️' };
    case 66:
    case 67:
      return { label: 'Lluvia helada', icon: '🧊' };
    case 71:
    case 73:
    case 75:
      return { label: 'Aguanieve o nieve', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { label: 'Chubascos de agua', icon: '🌧️' };
    case 85:
    case 86:
      return { label: 'Chubascos de aguanieve', icon: '🌨️' };
    case 95:
      return { label: 'Tormenta eléctrica', icon: '⛈️' };
    case 96:
    case 99:
      return { label: 'Tormenta con granizo', icon: '⛈️' };
    default:
      return { label: 'Nublado', icon: '☁️' };
  }
}

// Generate wetland alerts based on real environmental conditions
export function generateWetlandAlerts(
  temp: number,
  humidity: number,
  precipitation: number,
  precipProb: number,
  windSpeed: number,
  weatherCode: number,
  uvIndex: number
): WetlandWeatherAlert[] {
  const alerts: WetlandWeatherAlert[] = [];

  // 1. Rain / Slippery wooden footbridges alert
  if (precipitation > 0.5 || precipProb > 60 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    alerts.push({
      id: 'alert-slippery-boardwalks',
      severity: precipitation > 3 ? 'warning' : 'caution',
      category: 'resbaladizo',
      title: 'Pasarelas de madera resbaladizas',
      message: `Presencia de ${precipitation > 2 ? 'lluvia activa' : 'humedad/llovizna'}. Camina con calzado con agarre por las pasarelas del estero y evita correr.`,
      iconType: 'footsteps'
    });
  }

  // 2. Fog / Low visibility on wetland lagoons and channels
  if (weatherCode === 45 || weatherCode === 48 || (humidity > 90 && windSpeed < 10)) {
    alerts.push({
      id: 'alert-fog-visibility',
      severity: 'info',
      category: 'avistamiento',
      title: 'Bruma matinal sobre los meandros',
      message: 'Niebla densa sobre los espejos de agua. Excelente para escuchar cantos de chucaos y ranitas; usa binoculares para aves en el agua.',
      iconType: 'fog'
    });
  }

  // 3. High wind alert affecting kayaking and open viewpoints
  if (windSpeed > 22) {
    alerts.push({
      id: 'alert-high-wind',
      severity: 'warning',
      category: 'viento',
      title: 'Viento costero activo en el río',
      message: `Ráfagas de ${Math.round(windSpeed)} km/h generan oleaje en el cauce del Angachilla. Se desaconseja navegar en kayak sin chaleco salvavidas reglamentario.`,
      iconType: 'wind'
    });
  }

  // 4. Tidal influence / estuary water level
  if (precipitation > 4 || (humidity > 85 && [63, 65, 81, 82].includes(weatherCode))) {
    alerts.push({
      id: 'alert-tide-waterlevel',
      severity: 'caution',
      category: 'marea',
      title: 'Crecida estuarina en estero',
      message: 'Marea alta y aporte de precipitaciones elevan el nivel del agua en bordes de pasarelas del sector sur.',
      iconType: 'waves'
    });
  }

  // 5. High UV index on wetland water reflection
  if (uvIndex >= 6) {
    alerts.push({
      id: 'alert-uv-reflection',
      severity: 'caution',
      category: 'uv',
      title: `Índice UV Alto (${Math.round(uvIndex)}) en espejo de agua`,
      message: 'La superficie del agua multiplica la radiación ultravioleta. Utiliza gorro legionario, gafas de sol y protector solar FPS 50+.',
      iconType: 'sun'
    });
  }

  // 6. Ideal birdwatching window (if calm conditions)
  if (windSpeed < 14 && precipitation < 0.5 && weatherCode !== 95) {
    alerts.push({
      id: 'alert-good-birding',
      severity: 'good',
      category: 'avistamiento',
      title: 'Condición óptima para avistamiento',
      message: 'Viento suave y aguas calmas. Horario propicio para avistar cisnes de cuello negro, hualas, martines pescadores y coipos.',
      iconType: 'bird'
    });
  }

  // Fallback info alert if none triggered
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-general-visit',
      severity: 'good',
      category: 'general',
      title: 'Condiciones favorables en el sendero',
      message: 'Sendero y miradores del humedal habilitados para recorrido normal y fotografía.',
      iconType: 'check'
    });
  }

  return alerts;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export async function fetchWetlandWeather(): Promise<WetlandWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=uv_index,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSantiago`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Error en API meteorológica: ${res.statusText}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    const temp = Math.round(current.temperature_2m ?? 14);
    const apparentTemp = Math.round(current.apparent_temperature ?? temp);
    const humidity = Math.round(current.relative_humidity_2m ?? 78);
    const windSpeed = Math.round(current.wind_speed_10m ?? 8);
    const windDirection = Math.round(current.wind_direction_10m ?? 210);
    const precipitation = current.precipitation ?? 0;
    const weatherCode = current.weather_code ?? 2;
    const isDay = current.is_day === 1;

    // UV index from current hour or first hour
    const currentHourIndex = new Date().getHours();
    const uvIndex = hourly.uv_index ? Math.max(0, hourly.uv_index[currentHourIndex] ?? 3) : 3;
    const precipitationProbability = hourly.precipitation_probability
      ? (hourly.precipitation_probability[currentHourIndex] ?? daily.precipitation_probability_max?.[0] ?? 20)
      : 20;

    const weatherInfo = interpretWeatherCode(weatherCode, isDay);

    // Build 4-day forecast
    const dailyForecast: DayForecast[] = [];
    if (daily.time && Array.isArray(daily.time)) {
      for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr + 'T12:00:00');
        const dayName = i === 0 ? 'Hoy' : DAY_NAMES[dateObj.getDay()];
        const code = daily.weather_code?.[i] ?? 2;
        const wInfo = interpretWeatherCode(code, true);

        dailyForecast.push({
          date: dateStr,
          dayName,
          maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? 16),
          minTemp: Math.round(daily.temperature_2m_min?.[i] ?? 8),
          rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 10),
          weatherCode: code,
          weatherLabel: wInfo.label
        });
      }
    }

    const alerts = generateWetlandAlerts(
      temp,
      humidity,
      precipitation,
      precipitationProbability,
      windSpeed,
      weatherCode,
      uvIndex
    );

    const weatherData: WetlandWeatherData = {
      temperature: temp,
      apparentTemperature: apparentTemp,
      humidity,
      windSpeed,
      windDirection,
      precipitation,
      precipitationProbability,
      uvIndex: Math.round(uvIndex * 10) / 10,
      weatherCode,
      weatherLabel: weatherInfo.label,
      isDay,
      updatedAt: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      dailyForecast,
      wetlandAlerts: alerts
    };

    // Cache locally for offline/fallback
    try {
      localStorage.setItem('angachilla_weather_cache', JSON.stringify(weatherData));
    } catch {
      // ignore quota errors
    }

    return weatherData;
  } catch (error) {
    console.warn('Fallo al obtener clima en vivo, usando datos de respaldo:', error);
    
    // Check localStorage cache
    const cached = localStorage.getItem('angachilla_weather_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // continue to mock fallback
      }
    }

    // Default Valdivian temperate rainforest wetland fallback
    const fallbackAlerts = generateWetlandAlerts(14, 82, 0.4, 40, 9, 2, 4);
    return {
      temperature: 14,
      apparentTemperature: 13,
      humidity: 82,
      windSpeed: 9,
      windDirection: 210,
      precipitation: 0.2,
      precipitationProbability: 35,
      uvIndex: 4.1,
      weatherCode: 2,
      weatherLabel: 'Parcialmente nublado',
      isDay: true,
      updatedAt: 'Reciente',
      dailyForecast: [
        { date: '2026-09-21', dayName: 'Hoy', maxTemp: 16, minTemp: 8, rainProb: 35, weatherCode: 2, weatherLabel: 'Parcialmente nublado' },
        { date: '2026-09-22', dayName: 'Mañana', maxTemp: 14, minTemp: 9, rainProb: 65, weatherCode: 61, weatherLabel: 'Lluvia ligera' },
        { date: '2026-09-23', dayName: 'Mié', maxTemp: 15, minTemp: 7, rainProb: 20, weatherCode: 1, weatherLabel: 'Mayormente despejado' },
        { date: '2026-09-24', dayName: 'Jue', maxTemp: 17, minTemp: 8, rainProb: 15, weatherCode: 0, weatherLabel: 'Despejado' }
      ],
      wetlandAlerts: fallbackAlerts
    };
  }
}
