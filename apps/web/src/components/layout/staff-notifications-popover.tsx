import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api-client';

export function StaffNotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.getUnreadNotificationCount(),
    refetchInterval: 15000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => api.getNotifications(),
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = countData?.unreadCount ?? 0;
  const notifications = notificationsData?.items ?? [];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-stone-600 transition hover:bg-stone-200/70 hover:text-stone-900 focus:outline-none"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-stone-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No notifications to display
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition hover:bg-stone-50 ${
                    !n.isRead ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-bold text-stone-900">{n.title}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-stone-400">
                      <Clock className="h-3 w-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{n.message}</p>

                  <div className="mt-2.5 flex items-center justify-between">
                    {n.linkUrl ? (
                      <Link
                        to={n.linkUrl}
                        onClick={() => {
                          if (!n.isRead) markReadMutation.mutate(n.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="text-[10px] text-stone-500 hover:text-stone-800"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
