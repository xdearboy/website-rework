import { formatTime } from '@/shared/lib/formatDate';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Cloud, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

gsap.registerPlugin(useGSAP);

const COORDINATES = { latitude: 56.8587, longitude: 35.9176 };

const formatClock = (date: Date) => formatTime(date, { timeZone: 'Europe/Moscow' });

interface WeatherState {
  temperatureRounded: number;
  codeKey: string;
}

function weatherCodeKey(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 85 && code <= 86) return 'snowfall';
  if (code >= 95) return 'thunderstorm';
  return 'unknown';
}

export default function TimeWeatherWidget() {
  const { t } = useTranslation('footer');
  const [time, setTime] = useState(() => formatClock(new Date()));
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const clockRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        if (reduceMotion) return;

        const colons = gsap.utils.toArray<HTMLElement>('[data-clock-colon]', clockRef.current);
        if (colons.length === 0) return;

        gsap.to(colons, {
          opacity: 0.25,
          duration: 0.5,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      return () => mm.revert();
    },
    { scope: clockRef }
  );

  useEffect(() => {
    const controller = new AbortController();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${COORDINATES.latitude}&longitude=${COORDINATES.longitude}&current=temperature_2m,weather_code`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const current = data?.current;
        if (!current || typeof current.temperature_2m !== 'number') {
          throw new Error('unexpected weather response');
        }
        setWeather({
          temperatureRounded: Math.round(current.temperature_2m),
          codeKey: weatherCodeKey(current.weather_code),
        });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('Weather fetch error:', err);
          setWeatherError(true);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="min-w-0 text-sm sm:text-right">
      <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-foreground sm:justify-end">
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{t('timeWeather.city')}</span>
        <span className="shrink-0 text-muted-foreground">·</span>
        <span ref={clockRef} className="shrink-0 whitespace-nowrap tabular-nums">
          {time.split(/(:)/).map((part, index) => {
            const key = `${part === ':' ? 'colon' : 'segment'}-${index}`;
            return part === ':' ? (
              <span key={key} data-clock-colon className="text-primary">
                :
              </span>
            ) : (
              <span key={key}>{part}</span>
            );
          })}
        </span>
      </div>
      {!weatherError && weather && (
        <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-muted-foreground sm:justify-end">
          <Cloud className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {weather.temperatureRounded > 0 ? '+' : ''}
            {weather.temperatureRounded}°C, {t(`timeWeather.weatherCodes.${weather.codeKey}`)}
          </span>
        </div>
      )}
    </div>
  );
}
