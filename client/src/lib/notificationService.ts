import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: 'event' | 'work_day' | 'payment' | 'weather' | 'maintenance' | 'application';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId?: number | null;
  isGlobal?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  expiresAt?: Date;
  actionLink?: string;
}

/**
 * Service for creating and managing notifications
 */
export const NotificationService = {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await apiRequest('/api/notifications', 'POST', {
        ...params,
        priority: params.priority || 'medium',
        isGlobal: params.isGlobal || false,
        expiresAt: params.expiresAt ? params.expiresAt.toISOString() : null
      });
      
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Create a notification for a work day event
   */
  async createWorkDayNotification(workDay: any, recipientId?: number) {
    const date = new Date(workDay.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    return this.createNotification({
      title: 'Work Day Scheduled',
      message: `A new work day has been scheduled: "${workDay.title}" on ${formattedDate} from ${workDay.startTime} to ${workDay.endTime}.`,
      type: 'work_day',
      priority: 'medium',
      userId: recipientId,
      isGlobal: !recipientId,
      relatedEntityType: 'work_day',
      relatedEntityId: workDay.id,
      actionLink: `/workdays/${workDay.id}`
    });
  },

  /**
   * Create a notification for a payment due
   */
  async createPaymentNotification(payment: any) {
    const dueDate = new Date(payment.dueDate);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return this.createNotification({
      title: 'Payment Due',
      message: `Your payment of $${payment.amount} for plot ${payment.plotId} is due by ${formattedDate}.`,
      type: 'payment',
      priority: 'high',
      userId: payment.userId,
      relatedEntityType: 'payment',
      relatedEntityId: payment.id,
      actionLink: `/payments`
    });
  },

  /**
   * Create a notification for application status changes
   */
  async createApplicationStatusNotification(application: any, status: string) {
    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (status === 'approved') {
      title = 'Application Approved';
      message = 'Your garden plot application has been approved! Please check your email for details.';
      priority = 'high';
    } else if (status === 'rejected') {
      title = 'Application Status Update';
      message = 'Your garden plot application status has been updated. Please login to view the details.';
      priority = 'medium';
    } else {
      title = 'Application Received';
      message = 'Your application has been received and is under review.';
      priority = 'low';
    }

    return this.createNotification({
      title,
      message,
      type: 'application',
      priority,
      userId: application.userId,
      relatedEntityType: 'application',
      relatedEntityId: application.id,
      actionLink: `/applications/${application.id}`
    });
  },

  /**
   * Create a weather alert notification
   */
  async createWeatherAlertNotification(alert: string, severity: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    return this.createNotification({
      title: 'Weather Alert',
      message: alert,
      type: 'weather',
      priority: severity,
      isGlobal: true
    });
  },

  /**
   * Create a maintenance notification
   */
  async createMaintenanceNotification(title: string, message: string, isGlobal: boolean = true) {
    return this.createNotification({
      title,
      message,
      type: 'maintenance',
      priority: 'medium',
      isGlobal
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number) {
    try {
      const result = await apiRequest(`/api/notifications/${notificationId}/read`, 'PATCH');
      
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const result = await apiRequest('/api/notifications/read-all', 'PATCH');
      
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number) {
    try {
      const result = await apiRequest(`/api/notifications/${notificationId}`, 'DELETE');
      
      // Invalidate queries to refresh notification data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
      
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};