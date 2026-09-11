import { create } from 'zustand';

interface ConfigState {
  darkMode: boolean;
  soundEnabled: boolean;
  warningThresholdKg: number;
  tareWeightPerBagKg: number;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  setWarningThreshold: (val: number) => void;
  setTareWeight: (val: number) => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  darkMode: localStorage.getItem('canlua_dark') === 'true',
  soundEnabled: localStorage.getItem('canlua_sound') !== 'false',
  warningThresholdKg: Number(localStorage.getItem('canlua_warn_kg')) || 200,
  tareWeightPerBagKg: Number(localStorage.getItem('canlua_tare_kg')) || 0.2,

  toggleDarkMode: () => {
    const next = !get().darkMode;
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('canlua_dark', String(next));
    set({ darkMode: next });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    localStorage.setItem('canlua_sound', String(next));
    set({ soundEnabled: next });
  },

  setWarningThreshold: (val) => {
    localStorage.setItem('canlua_warn_kg', String(val));
    set({ warningThresholdKg: val });
  },

  setTareWeight: (val) => {
    localStorage.setItem('canlua_tare_kg', String(val));
    set({ tareWeightPerBagKg: val });
  },
}));
