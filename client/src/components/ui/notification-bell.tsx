import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'event' | 'work_day' | 'payment' | 'weather' | 'maintenance' | 'application';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  userId: number | null;
  isGlobal: boolean;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  expiresAt: string | null;
  createdAt: string;
  readAt: string | null;
  actionLink: string | null;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({ 
    queryKey: ['/api/notifications'],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({ 
    queryKey: ['/api/notifications/unread/count'],
    refetchInterval: 60000, // Refetch every minute
  });

  const unreadCount = unreadData?.count || 0;
  
  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, 'PATCH');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not mark notification as read",
        variant: "destructive"
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', 'PATCH');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not mark notifications as read",
        variant: "destructive"
      });
    }
  };

  // Delete a notification
  const deleteNotification = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete notification",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return 'event';
      case 'work_day':
        return 'event_available';
      case 'payment':
        return 'payments';
      case 'weather':
        return 'wb_sunny';
      case 'maintenance':
        return 'build';
      case 'application':
        return 'description';
      default:
        return 'notifications';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-300 hover:text-white focus:outline-none"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? <BellRing className="h-6 w-6 text-black" /> : <Bell className="h-6 w-6 text-black" />}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg overflow-hidden z-50 border border-gray-700">
          <div className="py-2 px-3 bg-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-4 text-center text-gray-400">Loading notifications...</div>
            ) : error ? (
              <div className="py-4 text-center text-gray-400">Error loading notifications</div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <span className="material-icons text-3xl mb-2">notifications_none</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={cn(
                      "p-3 hover:bg-gray-700 relative",
                      notification.status === 'unread' ? 'bg-gray-800' : 'bg-transparent'
                    )}
                  >
                    <div className="flex items-start">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3", getPriorityColor(notification.priority))}>
                        <span className="material-icons text-white">{getTypeIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white">{notification.title}</h4>
                          <div className="flex space-x-1">
                            {notification.status === 'unread' && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-gray-400 hover:text-white focus:outline-none"
                                aria-label="Mark as read"
                              >
                                <span className="material-icons text-sm">check</span>
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-500 focus:outline-none"
                              aria-label="Delete notification"
                            >
                              <span className="material-icons text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                        <div className="mt-2 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                        {notification.actionLink && (
                          <a
                            href={notification.actionLink}
                            className="mt-2 text-sm text-primary hover:text-primary/80 inline-flex items-center"
                          >
                            View details
                            <span className="material-icons text-sm ml-1">arrow_forward</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {notification.status === 'unread' && (
                      <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {notifications && notifications.length > 0 && (
            <div className="p-2 bg-gray-800 text-center">
              <a href="/notifications" className="text-xs text-primary hover:text-primary/80">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}