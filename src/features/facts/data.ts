import type { FactGroup } from './types';

// first commit of this repo, drives the "uptime" counter
export const SITE_BIRTH = '2026-04-15T11:50:48+03:00';

export const OWNER_TIME_ZONE = 'Europe/Moscow';

export const factGroups: FactGroup[] = [
  {
    titleKey: 'groups.identity',
    facts: [
      { labelKey: 'rows.name', value: { type: 'text', text: 'Арсений' } },
      { labelKey: 'rows.aliases', value: { type: 'text', text: 'сеня / арсдев / дево' } },
      {
        labelKey: 'rows.handle',
        value: { type: 'link', key: 'values.handle', href: 'https://github.com/xdearboy' },
      },
      { labelKey: 'rows.role', value: { type: 'i18n', key: 'values.role' } },
      {
        labelKey: 'rows.company',
        value: { type: 'redacted', key: 'values.company', mask: '████████████' },
      },
      { labelKey: 'rows.city', value: { type: 'i18n', key: 'values.city' } },
      {
        labelKey: 'rows.birthday',
        value: { type: 'redacted', key: 'values.birthday', mask: '██.██.████' },
      },
      { labelKey: 'rows.zodiac', value: { type: 'i18n', key: 'values.zodiac' } },
      { labelKey: 'rows.timezone', value: { type: 'text', text: 'UTC+3 · Europe/Moscow' } },
      { labelKey: 'rows.languages', value: { type: 'i18n', key: 'values.languages' } },
    ],
  },
  {
    titleKey: 'groups.body',
    facts: [
      { labelKey: 'rows.height', value: { type: 'text', text: '179 см' } },
      { labelKey: 'rows.weight', value: { type: 'text', text: '60 кг' } },
      { labelKey: 'rows.eyes', value: { type: 'i18n', key: 'values.eyes' } },
      { labelKey: 'rows.relationship', value: { type: 'i18n', key: 'values.relationship' } },
      { labelKey: 'rows.tshirt', value: { type: 'text', text: 'M' } },
      { labelKey: 'rows.sport', value: { type: 'i18n', key: 'values.sport' } },
      { labelKey: 'rows.drinks', value: { type: 'i18n', key: 'values.drinks' } },
      { labelKey: 'rows.badHabits', value: { type: 'i18n', key: 'values.badHabits' } },
    ],
  },
  {
    titleKey: 'groups.runtime',
    facts: [
      { labelKey: 'rows.localTime', value: { type: 'live', id: 'localTime' } },
      {
        labelKey: 'rows.metricTime',
        value: { type: 'live', id: 'metricTime' },
        hintKey: 'hints.metricTime',
      },
      { labelKey: 'rows.yearProgress', value: { type: 'meter', id: 'yearProgress' } },
      { labelKey: 'rows.siteUptime', value: { type: 'live', id: 'siteUptime' } },
      { labelKey: 'rows.sessionTime', value: { type: 'live', id: 'sessionTime' } },
      { labelKey: 'rows.build', value: { type: 'live', id: 'build' } },
    ],
  },
  {
    titleKey: 'groups.setup',
    facts: [
      { labelKey: 'rows.laptop', value: { type: 'text', text: 'macbook air 13" m5 (2026)' } },
      {
        labelKey: 'rows.desktop',
        value: { type: 'text', text: 'ryzen 5 5600 · rtx 5060 ti · 16 гб @ 3733' },
      },
      { labelKey: 'rows.os', value: { type: 'i18n', key: 'values.os' } },
      {
        labelKey: 'rows.editor',
        value: { type: 'link', key: 'values.editor', href: 'https://neovim.io' },
      },
      { labelKey: 'rows.shell', value: { type: 'text', text: 'zsh + starship, vi mode' } },
      { labelKey: 'rows.terminal', value: { type: 'text', text: 'alacritty + tmux' } },
      {
        labelKey: 'rows.dotfiles',
        value: {
          type: 'link',
          key: 'values.dotfiles',
          href: 'https://github.com/xdearboy/dotfiles',
        },
      },
      { labelKey: 'rows.color', value: { type: 'swatch', key: 'values.color', hex: '#cba6f7' } },
      { labelKey: 'rows.uses', value: { type: 'route', key: 'values.uses', to: '/uses' } },
    ],
  },
  {
    titleKey: 'groups.infra',
    facts: [
      { labelKey: 'rows.cluster', value: { type: 'i18n', key: 'values.cluster' } },
      { labelKey: 'rows.ingress', value: { type: 'text', text: 'haproxy + modsecurity' } },
      {
        labelKey: 'rows.observability',
        value: { type: 'text', text: 'prometheus · grafana · loki' },
      },
      { labelKey: 'rows.storage', value: { type: 'text', text: 'longhorn' } },
    ],
  },
  {
    titleKey: 'groups.human',
    facts: [
      { labelKey: 'rows.networking', value: { type: 'i18n', key: 'values.networking' } },
      {
        labelKey: 'rows.telegram',
        value: { type: 'link', key: 'values.telegram', href: 'https://t.me/Ox000000F' },
      },
      { labelKey: 'rows.photo', value: { type: 'route', key: 'values.photo', to: '/gallery' } },
      { labelKey: 'rows.health', value: { type: 'route', key: 'values.health', to: '/wpw' } },
      {
        labelKey: 'rows.music',
        value: { type: 'link', key: 'values.music', href: 'https://www.last.fm/user/xdearboy' },
      },
      {
        labelKey: 'rows.guestbook',
        value: { type: 'route', key: 'values.guestbook', to: '/guestbook' },
      },
    ],
  },
];
