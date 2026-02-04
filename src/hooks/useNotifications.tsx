import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationsStore } from '@/store/notificationsStore';
import { useAuth } from './useAuth';
import { Notification } from '@/types';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.log('Audio play failed:', e));
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setNotifications(data as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user, setNotifications]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);

        if (error) throw error;
        markAsRead(notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [markAsRead]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      markAllAsRead();
      toast.success('تم وضع علامة مقروء على جميع الإشعارات');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user, markAllAsRead]);

  const deleteNotificationPermanently = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        if (error) throw error;
        deleteNotification(notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [deleteNotification]
  );

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          addNotification(newNotification);

          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });

          playNotificationSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, addNotification, playNotificationSound]);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationPermanently,
  };
};
