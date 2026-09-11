export type LiveFactId = 'localTime' | 'metricTime' | 'siteUptime' | 'sessionTime' | 'build';

export type MeterId = 'yearProgress';

export type FactValue =
  | { type: 'text'; text: string }
  | { type: 'i18n'; key: string }
  | { type: 'link'; key: string; href: string }
  | { type: 'route'; key: string; to: string }
  | { type: 'live'; id: LiveFactId }
  | { type: 'meter'; id: MeterId }
  | { type: 'swatch'; key: string; hex: string }
  | { type: 'redacted'; key: string; mask: string };

export interface Fact {
  labelKey: string;
  value: FactValue;
  hintKey?: string;
}

export interface FactGroup {
  titleKey: string;
  facts: Fact[];
}
