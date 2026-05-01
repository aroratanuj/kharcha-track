import crypto from 'crypto';
import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

function hashContent(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('webhook')
  async handleMailgunWebhook(@Body() body: any) {
    try {
      const emailContent = body['body-plain'] || body['body-html'] || '';
      const subject = body.subject || '';

      const recipient = body.recipient || body.to || '';
      let userId = null;

      const plusMatch = recipient.match(/^expense\+(.+)@/i);
      if (plusMatch) {
        userId = plusMatch[1];
      }

      if (!userId) {
        const subMatch = subject.match(/expense\+(.+)@/i);
        if (subMatch) {
          userId = subMatch[1];
        }
      }

      if (!userId) {
        return { success: false, message: 'No user ID found in recipient address' };
      }

      const digest = hashContent((subject + '|' + emailContent).substring(0, 5000));
      const existing = await this.emailService.findByDigest(digest);
      if (existing) {
        return { success: false, message: 'Duplicate email already processed', expenseId: existing };
      }

      const result = await this.emailService.processEmail(emailContent, userId, subject, digest);
      return result;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return { success: false, error: error.message };
    }
  }
}
