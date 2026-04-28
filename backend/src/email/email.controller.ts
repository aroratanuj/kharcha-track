import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('webhook')
  async handleMailgunWebhook(
    @Body() body: any,
    @Req() req: Request,
  ) {
    // Verify Mailgun signature (implement in production)
    // const signature = req.headers['signature'];
    // const timestamp = req.headers['timestamp'];
    // const token = req.headers['token'];

    try {
      const emailContent = body['body-plain'] || body['body-html'] || '';
      const senderEmail = body.from || '';

      // Extract user ID from email (you'll need to implement user lookup)
      // For now, we'll use a default or extract from sender
      const userId = await this.getUserIdFromEmail(senderEmail);

      if (!userId) {
        return {
          success: false,
          message: 'User not found for this email address',
        };
      }

      const result = await this.emailService.processEmail(emailContent, userId);

      return result;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getUserIdFromEmail(email: string): Promise<string | null> {
    // TODO: Implement user lookup by email
    // For now, return null - you'll need to query the database
    // to find the user associated with this email
    return null;
  }
}
