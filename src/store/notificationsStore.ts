import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAll: () => void;
  updateUnreadCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifications) => {
        set({ notifications });
        get().updateUnreadCount();
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }));
        get().updateUnreadCount();
      },

      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
        }));
        get().updateUnreadCount();
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        }));
        get().updateUnreadCount();
      },

      deleteNotification: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
        get().updateUnreadCount();
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updateUnreadCount: () => {
        const count = get().notifications.filter((n) => !n.is_read).length;
        set({ unreadCount: count });
      },
    }),
    {
      name: 'mazaq-notifications',
    }
  )
);
