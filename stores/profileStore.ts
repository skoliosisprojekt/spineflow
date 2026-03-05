import { create } from 'zustand';

interface UserProfile {
  surgery: "none" | "partial" | "full" | "vbt" | "rods";
  curveType: "thoracic" | "lumbar" | "thoracolumbar" | "scurve" | "unsure";
  goal: "muscle" | "strength" | "posture" | "pain";
  experience: "beginner" | "intermediate" | "advanced";
  bodyType: "hardgainer" | "normal" | "softgainer";
  equipment: string[];
  language: string;
  theme: "system" | "light" | "dark";
  units: "kg" | "lbs";
  hasCompletedOnboarding: boolean;
  hasAcceptedConsent: boolean;
}

interface ProfileStore {
  profile: Partial<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
  setOnboardingComplete: () => void;
  setConsentAccepted: () => void;
}

const defaultProfile: Partial<UserProfile> = {
  surgery: "none",
  curveType: "thoracic",
  goal: "muscle",
  experience: "beginner",
  bodyType: "normal",
  equipment: [],
  language: "en",
  theme: "system",
  units: "kg",
  hasCompletedOnboarding: false,
  hasAcceptedConsent: false,
};

export const useProfileStore = create<ProfileStore>()(
  (set) => ({
    profile: defaultProfile,
    updateProfile: (updates) =>
      set((state) => ({
        profile: { ...state.profile, ...updates },
      })),
    resetProfile: () => set({ profile: defaultProfile }),
    setOnboardingComplete: () =>
      set((state) => ({
        profile: { ...state.profile, hasCompletedOnboarding: true },
      })),
    setConsentAccepted: () =>
      set((state) => ({
        profile: { ...state.profile, hasAcceptedConsent: true },
      })),
  })
);
