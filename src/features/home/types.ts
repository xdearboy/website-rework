export type StackItem = {
  name: string;
  url?: string;
};

export type LanguageItem = StackItem & {
  years: number;
};

export type TechnologyCategories = Record<string, StackItem[]>;

export type ContactLink = {
  labelKey: string;
  href: string;
};

export type ExplorePage = {
  labelKey: string;
  to: string;
};
