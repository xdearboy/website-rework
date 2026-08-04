import type { StackItem } from '@/features/home/types';

export interface UsesSection {
  titleKey: string;
  items: StackItem[];
}

export const usesSections: UsesSection[] = [
  {
    titleKey: 'sections.hardware',
    items: [
      {
        name: 'десктоп — rtx 5060 ti, ryzen 5 5600, 16 гб ram crucial ballistix @ 3733 мгц, 1 тб ssd + 500 гб hdd',
      },
      { name: 'ноутбук — macbook air 13" m5 (2026)' },
    ],
  },
  {
    titleKey: 'sections.os',
    items: [
      { name: 'десктоп — windows 11 (твикнутая)' },
      { name: 'ноутбук — macos tahoe 26' },
      { name: 'серверы — debian / linux', url: 'https://www.debian.org' },
    ],
  },
  {
    titleKey: 'sections.editor',
    items: [
      { name: 'neovim (lazy.nvim)', url: 'https://neovim.io' },
      { name: 'vs code', url: 'https://code.visualstudio.com' },
      { name: 'alacritty', url: 'https://alacritty.org' },
      { name: 'tmux', url: 'https://github.com/tmux/tmux' },
      { name: 'zsh + starship (vi mode)', url: 'https://starship.rs' },
      { name: 'yazi / eza / bat / fd' },
      { name: 'delta / lazygit', url: 'https://github.com/jesseduffield/lazygit' },
      { name: 'zoxide / fzf-tab / atuin / direnv / tldr' },
      { name: 'дотфайлы (полный конфиг)', url: 'https://github.com/xdearboy/dotfiles' },
    ],
  },
  {
    titleKey: 'sections.homelab',
    items: [
      { name: 'docker & docker compose', url: 'https://www.docker.com' },
      { name: 'kubernetes (k3s)', url: 'https://k3s.io' },
      { name: 'proxmox', url: 'https://www.proxmox.com' },
      { name: 'nginx / haproxy' },
      { name: 'ansible', url: 'https://www.ansible.com' },
      { name: 'terraform / opentofu', url: 'https://opentofu.org' },
      { name: "cert-manager (let's encrypt)", url: 'https://cert-manager.io' },
    ],
  },
  {
    titleKey: 'sections.browser',
    items: [
      { name: 'firefox', url: 'https://www.mozilla.org/firefox/' },
      {
        name: 'расширения: zeroblur, wappalyzer, foxyproxy, vot (voice over translation)',
      },
    ],
  },
];
