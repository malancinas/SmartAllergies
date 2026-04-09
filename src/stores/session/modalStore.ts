import { create } from 'zustand';

interface ModalState {
  activeModal: string | null;
  modalProps: Record<string, unknown>;
}

interface ModalActions {
  openModal: (name: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState & ModalActions>((set) => ({
  activeModal: null,
  modalProps: {},

  openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),
}));
