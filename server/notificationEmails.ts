import { sendEmail } from './email';
import { storage } from './storage';
import { Notification } from '@shared/schema';

/**
 * Notification Email Service
 * 
 * This service helps generate and send email notifications
 * for various events in the system.
 */

interface EmailNotificationParams {
  notification: Notification;
  recipient?: {
    email: string;
    name?: string;
  };
}

/**
 * Send an email notification based on a system notification
 * This will fall back to console logging if SendGrid is not set up
 */
export async function sendNotificationEmail({ notification, recipient }: EmailNotificationParams): Promise<boolean> {
  try {
    // If notification is not user-specific and we don't have a recipient, we can't send an email
    if (!notification.userId && !recipient) {
      console.log('Cannot send email for global notification without recipient information');
      return false;
    }
    
    // If we don't have recipient info, try to find the user
    if (!recipient && notification.userId) {
      const user = await storage.getUser(notification.userId);
      if (!user || !user.email) {
        console.log(`Cannot send email: User ${notification.userId} not found or missing email`);
        return false;
      }
      
      recipient = {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      };
    }
    
    // Cannot send if we still don't have a recipient email
    if (!recipient || !recipient.email) {
      console.log('Cannot send email: No recipient email found');
      return false;
    }
    
    // Generate email content
    const emailContent = getEmailContentByType(notification);
    
    // Send the email
    return await sendEmail({
      to: recipient.email,
      subject: notification.title,
      text: emailContent.text,
      html: emailContent.html
    });
    
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

/**
 * Generate the email content based on notification type
 */
function getEmailContentByType(notification: Notification): { text: string, html: string } {
  const baseText = `${notification.message}\n\n`;
  let additionalText = '';
  
  // Add specific content based on notification type
  switch (notification.type) {
    case 'work_day':
      additionalText = 'Please sign up to participate if you can attend. Community garden success depends on member participation.';
      break;
    case 'payment':
      additionalText = 'Please ensure timely payment to maintain your garden plot membership.';
      break;
    case 'weather':
      additionalText = 'Please take appropriate measures to protect your plants.';
      break;
    case 'maintenance':
      additionalText = 'Your attention to this maintenance issue will help keep our garden in good condition.';
      break;
    case 'application':
      additionalText = 'Thank you for your interest in our community garden!';
      break;
    case 'event':
      additionalText = 'We hope to see you there!';
      break;
  }
  
  const text = baseText + additionalText;
  
  // Create HTML version with basic formatting
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">${notification.title}</h2>
      <p style="font-size: 16px; line-height: 1.5;">${notification.message}</p>
      <p style="font-size: 16px; line-height: 1.5;">${additionalText}</p>
      ${notification.actionLink ? `<p style="margin-top: 20px;"><a href="${notification.actionLink}" style="background-color: #2e7d32; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Details</a></p>` : ''}
      <p style="margin-top: 30px; font-size: 14px; color: #666;">This is an automated message from your Community Garden Management System. Please do not reply to this email.</p>
    </div>
  `;
  
  return { text, html };
}

/**
 * Send a work day notification email
 */
export async function sendWorkDayEmail(workDay: any, user: any): Promise<boolean> {
  const date = new Date(workDay.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  const notification = {
    id: 0, // Temporary ID, not used for sending
    title: 'Work Day Scheduled',
    message: `A new work day has been scheduled: "${workDay.title}" on ${formattedDate} from ${workDay.startTime} to ${workDay.endTime}.`,
    type: 'work_day' as const,
    priority: 'medium' as const,
    status: 'unread' as const,
    userId: user.id,
    isGlobal: false,
    relatedEntityType: 'work_day',
    relatedEntityId: workDay.id,
    createdAt: new Date(),
    readAt: null,
    expiresAt: null,
    actionLink: `/workdays/${workDay.id}`
  };
  
  return sendNotificationEmail({
    notification,
    recipient: {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`
    }
  });
}