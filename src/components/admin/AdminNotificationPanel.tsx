import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const AdminNotificationPanel = () => {
  const { notifications, unreadCount } = useNotifications();

  const recentNotifications = notifications
    .filter((n) => n.type === 'new_order')
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          الإشعارات الأخيرة
          {unreadCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({unreadCount} غير مقروء)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentNotifications.length === 0 ? (
          <p className="text-muted-foreground text-sm">لا توجد إشعارات جديدة</p>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </span>
                  {notification.order_number && (
                    <span className="text-xs font-mono text-primary">
                      #{notification.order_number}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
