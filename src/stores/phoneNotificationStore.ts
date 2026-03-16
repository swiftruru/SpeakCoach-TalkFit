import { create } from 'zustand'

interface PhoneNotification {
  title: string
  body: string
}

interface PhoneNotificationState {
  notification: PhoneNotification | null
  show: (n: PhoneNotification) => void
  dismiss: () => void
}

export const usePhoneNotificationStore = create<PhoneNotificationState>((set) => ({
  notification: null,
  show: (n) => set({ notification: n }),
  dismiss: () => set({ notification: null }),
}))
