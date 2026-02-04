import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface RangeStats {
  orders: number;
  revenue: number;
}

interface FunnelStats {
  created: number;
  whatsappOpened: number;
  whatsappLikelySent: number;
  confirmed: number;
  conversionRate: number;
  whatsappAbandonRate: number;
}

const buildRangeKey = (date: Date) => date.toISOString();

export const OrdersAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<RangeStats>({ orders: 0, revenue: 0 });
  const [weekStats, setWeekStats] = useState<RangeStats>({ orders: 0, revenue: 0 });
  const [monthStats, setMonthStats] = useState<RangeStats>({ orders: 0, revenue: 0 });
  const [funnel, setFunnel] = useState<FunnelStats>({
    created: 0,
    whatsappOpened: 0,
    whatsappLikelySent: 0,
    confirmed: 0,
    conversionRate: 0,
    whatsappAbandonRate: 0,
  });

  const ranges = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(startOfMonth.getDate() - 29);
    startOfMonth.setHours(0, 0, 0, 0);

    return {
      today: startOfToday,
      week: startOfWeek,
      month: startOfMonth,
    };
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const monthStart = buildRangeKey(ranges.month);
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status, total, created_at')
          .gte('created_at', monthStart)
          .is('deleted_at', null);

        if (ordersError) throw ordersError;

        const ordersData = orders || [];

        const inRange = (orderDate: string, start: Date) => {
          return new Date(orderDate) >= start;
        };

        const calcStats = (start: Date) => {
          const filtered = ordersData.filter((o) => inRange(o.created_at, start));
          return {
            orders: filtered.length,
            revenue: filtered
              .filter((o) => o.status !== 'cancelled')
              .reduce((sum, o) => sum + Number(o.total), 0),
          };
        };

        setTodayStats(calcStats(ranges.today));
        setWeekStats(calcStats(ranges.week));
        setMonthStats(calcStats(ranges.month));

        const { data: events, error: eventsError } = await supabase
          .from('order_events')
          .select('id, event_type, created_at')
          .gte('created_at', monthStart);

        if (eventsError) throw eventsError;

        const eventsData = events || [];
        const eventCount = (type: string) => eventsData.filter((e) => e.event_type === type).length;

        const createdCount = ordersData.length;
        const whatsappOpened = eventCount('whatsapp_window_opened');
        const whatsappLikelySent = eventCount('message_likely_sent');
        const confirmed = ordersData.filter((o) =>
          ['confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)
        ).length;

        const conversionRate = createdCount === 0 ? 0 : Math.round((confirmed / createdCount) * 100);
        const whatsappAbandonRate =
          whatsappOpened === 0
            ? 0
            : Math.max(0, Math.round(((whatsappOpened - whatsappLikelySent) / whatsappOpened) * 100));

        setFunnel({
          created: createdCount,
          whatsappOpened,
          whatsappLikelySent,
          confirmed,
          conversionRate,
          whatsappAbandonRate,
        });
      } catch (error) {
        console.error('Analytics fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [ranges]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>تحليلات الطلبات (آخر 30 يوم)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'اليوم', data: todayStats },
            { label: 'آخر 7 أيام', data: weekStats },
            { label: 'آخر 30 يوم', data: monthStats },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : item.data.orders}</p>
              <p className="text-sm text-muted-foreground">
                المبيعات: {isLoading ? '...' : item.data.revenue.toLocaleString('ar-EG')} ج.م
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="font-semibold mb-3">مسار التحويل</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>طلبات تم إنشاؤها</span>
                <span className="font-semibold text-foreground">{funnel.created}</span>
              </div>
              <div className="flex justify-between">
                <span>واتساب تم فتحه</span>
                <span className="font-semibold text-foreground">{funnel.whatsappOpened}</span>
              </div>
              <div className="flex justify-between">
                <span>رسائل مرجحة الإرسال</span>
                <span className="font-semibold text-foreground">{funnel.whatsappLikelySent}</span>
              </div>
              <div className="flex justify-between">
                <span>طلبات مؤكدة</span>
                <span className="font-semibold text-foreground">{funnel.confirmed}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="font-semibold mb-3">مؤشرات الأداء</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>معدل التحويل</span>
                <span className="font-semibold text-foreground">{funnel.conversionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>معدل إلغاء واتساب</span>
                <span className="font-semibold text-foreground">{funnel.whatsappAbandonRate}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                * يعتمد على أحداث واتساب المسجلة من المتجر.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
