export enum AppAppearance {
  Standard = 'standard',
  Youth = 'youth',
  Vip = 'vip',
}

interface AppearancePreset {
  pageBackground: string;
  topbarBackground: string;
  foreground: string;
  accent: string;
  navigationHover: string;
  navigationActive: string;
}

const appearancePresets: Record<AppAppearance, AppearancePreset> = {
  [AppAppearance.Standard]: {
    pageBackground: '#f5efe8',
    topbarBackground: 'linear-gradient(110deg, #f2e4dc 0%, #f2bea0 60%, #efd39d 100%)',
    foreground: '#452e29',
    accent: '#874021',
    navigationHover: 'rgba(255, 255, 255, 0.3)',
    navigationActive: 'rgba(255, 255, 255, 0.65)',
  },
  [AppAppearance.Youth]: {
    pageBackground: '#faf0f6',
    topbarBackground: 'linear-gradient(110deg, #e7c9f5 0%, #f7bacd 55%, #ffcea4 100%)',
    foreground: '#45253e',
    accent: '#8f255d',
    navigationHover: 'rgba(255, 255, 255, 0.3)',
    navigationActive: 'rgba(255, 255, 255, 0.65)',
  },
  [AppAppearance.Vip]: {
    pageBackground: '#eeeae3',
    topbarBackground: 'linear-gradient(110deg, #25242a 0%, #39322f 65%, #554537 100%)',
    foreground: '#fff1d9',
    accent: '#f4cc89',
    navigationHover: 'rgba(255, 241, 217, 0.08)',
    navigationActive: 'rgba(255, 241, 217, 0.16)',
  },
};

export function getAppearancePreset(appearance: AppAppearance): AppearancePreset {
  return Object.prototype.hasOwnProperty.call(appearancePresets, appearance)
    ? appearancePresets[appearance]
    : appearancePresets[AppAppearance.Standard];
}
