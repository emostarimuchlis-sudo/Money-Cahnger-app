import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/recent');
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid="notification-bell"
          className="relative p-2 text-[#FEF3C7] hover:text-[#D4AF37] transition-colors duration-300 rounded-lg hover:bg-white/5"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-card border border-white/10 text-[#FEF3C7] p-0">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold text-[#D4AF37]">{t('notifications')}</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#D4AF37]/20">
                    <Bell size={16} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#D4AF37]">{notif.title}</p>
                    <p className="text-sm text-[#FEF3C7] mt-1">{notif.message}</p>
                    <p className="text-xs text-[#6EE7B7] mt-2">
                      {format(new Date(notif.timestamp), 'dd MMM yyyy HH:mm', { locale: localeId })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#6EE7B7]">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;