import type { StatusPhases } from '@/features/status/useStatus';
import { useTranslation } from 'react-i18next';

const PHASES = ['resolve', 'connect', 'tls', 'processing'] as const;

export default function LatencyBar({ phases }: { phases: StatusPhases }) {
  const { t } = useTranslation('status');

  const parts = PHASES.map((phase) => ({ phase, value: phases[phase] ?? 0 })).filter(
    (part) => part.value > 0
  );

  if (parts.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.65rem] text-muted-foreground">
      {parts.map((part) => (
        <span key={part.phase}>
          {t(`phases.${part.phase}`)} <span className="tabular-nums">{part.value}</span>
        </span>
      ))}
    </div>
  );
}
