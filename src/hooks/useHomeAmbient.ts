import { useEffect, useMemo, useState } from 'react';

type WeatherMood = 'clear' | 'clouds' | 'rain' | 'storm' | 'mist' | 'snow' | 'unknown';
type AmbientMode = 'dawn' | 'day' | 'sunset' | 'night' | 'storm';

interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  weatherCode: number;
  label: string;
  mood: WeatherMood;
  isDay: boolean;
  locationLabel: string;
}

interface QuoteSnapshot {
  text: string;
  author: string;
  source: 'api' | 'fallback';
}

interface HomeAmbientState {
  now: Date;
  weather: WeatherSnapshot | null;
  quote: QuoteSnapshot;
  ambientMode: AmbientMode;
  greeting: string;
  subtitle: string;
  loadingWeather: boolean;
  refreshQuote: () => void;
}

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_COORDS = { latitude: 15.9129, longitude: 79.74, locationLabel: 'Studio Forecast' };

const QUOTE_FALLBACKS: QuoteSnapshot[] = [
  { text: 'Where words fail, music speaks.', author: 'Hans Christian Andersen', source: 'fallback' },
  { text: 'Music can change the world because it can change people.', author: 'Bono', source: 'fallback' },
  { text: 'Without music, life would be a mistake.', author: 'Friedrich Nietzsche', source: 'fallback' },
  { text: 'One good thing about music, when it hits you, you feel no pain.', author: 'Bob Marley', source: 'fallback' },
];

function getWeatherMeta(code: number): Pick<WeatherSnapshot, 'label' | 'mood'> {
  if (code === 0) return { label: 'Clear sky', mood: 'clear' };
  if ([1, 2, 3].includes(code)) return { label: 'Cloud cover', mood: 'clouds' };
  if ([45, 48].includes(code)) return { label: 'Misty air', mood: 'mist' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Rain moving through', mood: 'rain' };
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snowfall', mood: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunder weather', mood: 'storm' };
  return { label: 'Open skies', mood: 'unknown' };
}

function getAmbientMode(now: Date, weather: WeatherSnapshot | null): AmbientMode {
  if (weather?.mood === 'storm') return 'storm';
  const hours = now.getHours();
  if (hours < 7) return 'dawn';
  if (hours < 17) return 'day';
  if (hours < 20) return 'sunset';
  return 'night';
}

function getGreeting(now: Date) {
  const hours = now.getHours();
  if (hours < 6) return 'Night shift listening';
  if (hours < 12) return 'Good morning';
  if (hours < 17) return 'Good afternoon';
  if (hours < 21) return 'Good evening';
  return 'Late-night session';
}

function getSubtitle(mode: AmbientMode, weather: WeatherSnapshot | null) {
  const weatherLabel = weather?.label ?? 'your current vibe';

  switch (mode) {
    case 'dawn':
      return `Ease into the day with a softer set shaped around ${weatherLabel.toLowerCase()}.`;
    case 'day':
      return `Bright picks, quick access, and an active mix tuned to ${weatherLabel.toLowerCase()}.`;
    case 'sunset':
      return `Golden-hour listening with warmer textures and tracks that land smoothly.`;
    case 'storm':
      return `Moody playback mode is active. Let the room slow down while the mix takes over.`;
    default:
      return `A calmer, deeper stack for after-hours listening and repeat-worthy favorites.`;
  }
}

function getFallbackQuote(seed = Date.now()): QuoteSnapshot {
  return QUOTE_FALLBACKS[seed % QUOTE_FALLBACKS.length];
}

export function useHomeAmbient(): HomeAmbientState {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [quoteNonce, setQuoteNonce] = useState(0);
  const [quote, setQuote] = useState<QuoteSnapshot>(() => getFallbackQuote());
  const quoteDateKey = now.toDateString();
  const quoteDaySeed = now.getDate();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const updateWeather = async (latitude: number, longitude: number, locationLabel: string) => {
      try {
        const url = new URL(WEATHER_URL);
        url.searchParams.set('latitude', String(latitude));
        url.searchParams.set('longitude', String(longitude));
        url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day');
        url.searchParams.set('timezone', 'auto');

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);

        const data = await response.json();
        if (cancelled) return;

        const meta = getWeatherMeta(data.current?.weather_code ?? -1);
        setWeather({
          temperature: Math.round(data.current?.temperature_2m ?? 0),
          apparentTemperature: Math.round(data.current?.apparent_temperature ?? 0),
          windSpeed: Math.round(data.current?.wind_speed_10m ?? 0),
          weatherCode: data.current?.weather_code ?? -1,
          label: meta.label,
          mood: meta.mood,
          isDay: Boolean(data.current?.is_day),
          locationLabel,
        });
      } catch {
        if (!cancelled) {
          setWeather((current) => current ?? {
            temperature: 28,
            apparentTemperature: 30,
            windSpeed: 10,
            weatherCode: 1,
            label: 'Studio weather',
            mood: 'clear',
            isDay: new Date().getHours() >= 6 && new Date().getHours() < 18,
            locationLabel: 'Studio Forecast',
          });
        }
      } finally {
        if (!cancelled) setLoadingWeather(false);
      }
    };

    const fallbackFetch = () => updateWeather(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude, DEFAULT_COORDS.locationLabel);

    if (!navigator.geolocation) {
      fallbackFetch();
      return () => { cancelled = true; };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const guessedLabel = tz.includes('/') ? tz.split('/').at(-1)?.replace(/_/g, ' ') ?? 'Local weather' : 'Local weather';
        updateWeather(position.coords.latitude, position.coords.longitude, guessedLabel);
      },
      () => fallbackFetch(),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 1000 * 60 * 20 }
    );

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadQuote = async () => {
      try {
        const response = await fetch('https://dummyjson.com/quotes/random');
        if (!response.ok) throw new Error(`Quote request failed with ${response.status}`);
        const data = await response.json();
        if (cancelled) return;
        setQuote({
          text: data.quote ?? getFallbackQuote(quoteNonce).text,
          author: data.author ?? 'Unknown',
          source: 'api',
        });
      } catch {
        if (!cancelled) setQuote(getFallbackQuote(quoteNonce + quoteDaySeed));
      }
    };

    loadQuote();
    return () => { cancelled = true; };
  }, [quoteNonce, quoteDateKey, quoteDaySeed]);

  const ambientMode = useMemo(() => getAmbientMode(now, weather), [now, weather]);
  const greeting = useMemo(() => getGreeting(now), [now]);
  const subtitle = useMemo(() => getSubtitle(ambientMode, weather), [ambientMode, weather]);

  return {
    now,
    weather,
    quote,
    ambientMode,
    greeting,
    subtitle,
    loadingWeather,
    refreshQuote: () => setQuoteNonce((value) => value + 1),
  };
}
