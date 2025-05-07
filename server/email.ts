import { MailService } from '@sendgrid/mail';

/**
 * Email service configuration
 * 
 * This service uses SendGrid to send emails. If SENDGRID_API_KEY is not
 * provided, it will fallback to console.log for development environments.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

// Initialize SendGrid if API key is available
const mailService = new MailService();
const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (sendgridApiKey) {
  mailService.setApiKey(sendgridApiKey);
  console.log('SendGrid email service initialized');
} else {
  console.log('SENDGRID_API_KEY not provided, using console log for emails');
}

/**
 * Send an email using SendGrid
 * Falls back to console.log if SENDGRID_API_KEY is not provided
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const defaultEmail = 'noreply@communitygarden.org';
  const from = options.from || defaultEmail;
  
  try {
    // If SendGrid API key is not available, log the email content
    if (!sendgridApiKey) {
      console.log('==== EMAIL NOTIFICATION ====');
      console.log('From:', from);
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text);
      console.log('===========================');
      return true;
    }
    
    // Use SendGrid to send the email
    await mailService.send({
      to: options.to,
      from: from,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    });
    
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
