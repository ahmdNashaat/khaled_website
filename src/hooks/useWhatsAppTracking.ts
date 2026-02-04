import { useCallback, useEffect, useRef, useState } from 'react';
import { trackWhatsAppEvent } from '@/services/orderService';
import { WhatsAppEventType } from '@/types';

export interface WhatsAppTrackingOptions {
  likelySentThresholdMs?: number;
}

export function useWhatsAppTracking(options: WhatsAppTrackingOptions = {}) {
  const { likelySentThresholdMs = 15000 } = options;
  const [orderId, setOrderId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const track = useCallback(
    async (event: WhatsAppEventType, metadata?: Record<string, any>) => {
      if (!orderId) return;
      try {
        await trackWhatsAppEvent({ orderId, userId, event, metadata });
      } catch (error) {
        // Swallow tracking errors to avoid blocking checkout UX.
        console.warn('WhatsApp tracking failed:', error);
      }
    },
    [orderId, userId]
  );

  const startTracking = useCallback(
    async (nextOrderId: string, nextUserId: string | null) => {
      setOrderId(nextOrderId);
      setUserId(nextUserId);
      startedAtRef.current = Date.now();
      await track('whatsapp_button_clicked', { source: 'checkout' });
      await track('whatsapp_window_opened', { target: 'new_tab' });
    },
    [track]
  );

  useEffect(() => {
    if (!orderId) return;

    const handleReturn = async () => {
      const startedAt = startedAtRef.current;
      if (!startedAt) return;
      const elapsedMs = Date.now() - startedAt;

      await track('user_returned_from_whatsapp', { elapsedMs });

      if (elapsedMs >= likelySentThresholdMs) {
        await track('message_likely_sent', { elapsedMs });
      } else {
        await track('whatsapp_abandoned', { elapsedMs });
      }
    };

    window.addEventListener('focus', handleReturn, { once: true });
    return () => window.removeEventListener('focus', handleReturn);
  }, [orderId, likelySentThresholdMs, track]);

  return { startTracking, track };
}
