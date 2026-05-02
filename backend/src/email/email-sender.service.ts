import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  private get domain(): string {
    return process.env.MAILGUN_DOMAIN || '';
  }

  private get apiKey(): string {
    return process.env.MAILGUN_API_KEY || '';
  }

  async sendWelcome(to: string, senderEmail: string, parsedExpense: any): Promise<void> {
    if (!this.apiKey || !this.domain) {
      this.logger.warn('Mailgun not configured, skipping welcome email');
      return;
    }

    const appUrl = process.env.APP_URL || 'http://localhost:8081';
    const subject = parsedExpense?.description
      ? `Welcome to Kharcha-Track! We received your expense: ${parsedExpense.description}`
      : 'Welcome to Kharcha-Track!';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7f7f7;">
  <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #007AFF; padding: 30px 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 28px;">Kharcha-Track</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px;">Expense Tracker</p>
    </div>
    <div style="padding: 30px 20px;">
      <h2 style="color: #333; margin-top: 0;">Welcome! We received your expense email.</h2>
      <p style="color: #555; line-height: 1.6;">
        We noticed you sent an expense to our system, but we couldn't find your account.
        Here's what we extracted from your email:
      </p>
      ${parsedExpense ? `
      <div style="background: #f0f7ff; border-left: 4px solid #007AFF; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px; color: #333;"><strong>Description:</strong> ${parsedExpense.description || 'N/A'}</p>
        <p style="margin: 0 0 8px; color: #333;"><strong>Amount:</strong> ₹${parsedExpense.amount || 0}</p>
        <p style="margin: 0 0 8px; color: #333;"><strong>Merchant:</strong> ${parsedExpense.merchant || 'N/A'}</p>
        <p style="margin: 0; color: #333;"><strong>Date:</strong> ${parsedExpense.date || 'N/A'}</p>
      </div>
      ` : ''}
      <p style="color: #555; line-height: 1.6;">
        Your expense has been saved as a draft and will be assigned to your account once you register.
        Here's what Kharcha-Track does:
      </p>
      <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
        <li><strong>Track expenses effortlessly</strong> — Just forward receipt emails to our inbox</li>
        <li><strong>AI-powered parsing</strong> — We automatically extract amount, merchant, and date</li>
        <li><strong>Review & confirm</strong> — Review AI-extracted drafts and confirm with one tap</li>
        <li><strong>Smart insights</strong> — See spending patterns by category, month, and more</li>
        <li><strong>Budget tracking</strong> — Set limits and stay on top of your spending</li>
      </ul>
      <h3 style="color: #333;">How it works:</h3>
      <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
        <li>Register for an account using the link below</li>
        <li>Forward any expense receipt email to our inbox</li>
        <li>Open the app to review AI-extracted draft expenses</li>
        <li>Confirm drafts to add them to your monthly expenses</li>
      </ol>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}" style="display: inline-block; background: #007AFF; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
          Register / Login to Kharcha-Track
        </a>
      </div>
      <p style="color: #888; font-size: 13px; text-align: center;">
        After registering, your pending drafts will be assigned to your account automatically.<br>
        If you need help, reply to this email.
      </p>
    </div>
    <div style="background: #f7f7f7; padding: 16px 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #aaa; font-size: 12px;">Kharcha-Track — Smart Expense Tracking</p>
    </div>
  </div>
</body>
</html>`;

    await this.sendMail(to, subject, html);
  }

  async sendAdminNotification(senderEmail: string, parsedExpense: any): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      this.logger.warn('ADMIN_NOTIFICATION_EMAIL not set, skipping admin notification');
      return;
    }
    if (!this.apiKey || !this.domain) {
      this.logger.warn('Mailgun not configured, skipping admin notification');
      return;
    }

    const subject = `[Kharcha-Track] New unrecognized sender: ${senderEmail}`;
    const now = new Date().toISOString();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7f7f7;">
  <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #FF9500; padding: 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">New Unregistered Sender</h1>
    </div>
    <div style="padding: 20px;">
      <p style="color: #555; line-height: 1.6;">
        A new expense email was received from an unregistered sender. A welcome email has been sent to them.
      </p>
      <div style="background: #fff8f0; border-left: 4px solid #FF9500; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px; color: #333;"><strong>Sender:</strong> ${senderEmail}</p>
        <p style="margin: 0 0 8px; color: #333;"><strong>Received:</strong> ${now}</p>
        ${parsedExpense ? `
        <p style="margin: 0 0 8px; color: #333;"><strong>Expense:</strong> ${parsedExpense.description || 'N/A'} — ₹${parsedExpense.amount || 0}</p>
        <p style="margin: 0 0 8px; color: #333;"><strong>Merchant:</strong> ${parsedExpense.merchant || 'N/A'}</p>
        <p style="margin: 0; color: #333;"><strong>Confidence:</strong> ${parsedExpense.confidence || 'N/A'}</p>
        ` : ''}
      </div>
      <p style="color: #555; line-height: 1.6;">
        The expense has been stored as <strong>unassigned</strong>. You can assign it to a user from the admin panel once they register.
      </p>
    </div>
  </div>
</body>
</html>`;

    await this.sendMail(adminEmail, subject, html);
  }

  private sendMail(to: string, subject: string, html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const auth = 'Basic ' + Buffer.from('api:' + this.apiKey).toString('base64');
      const formData = new URLSearchParams();
      formData.append('from', `Kharcha-Track <postmaster@${this.domain}>`);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', html);

      const options = {
        hostname: 'api.mailgun.net',
        path: `/v3/${this.domain}/messages`,
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData.toString()),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.logger.log(`Email sent to ${to}: ${res.statusCode}`);
            resolve();
          } else {
            this.logger.error(`Failed to send email to ${to}: ${res.statusCode} - ${body}`);
            reject(new Error(`Mailgun ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
        reject(err);
      });

      req.write(formData.toString());
      req.end();
    });
  }
}
