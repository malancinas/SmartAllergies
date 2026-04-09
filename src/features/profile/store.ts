import { create } from 'zustand';

interface ProfileEditState {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
}

export const useProfileEditStore = create<ProfileEditState>((set) => ({
  editMode: false,
  setEditMode: (editMode) => set({ editMode }),
}));
