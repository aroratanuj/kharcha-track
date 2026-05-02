import crypto from 'crypto';
import { Controller, Post, Req, Res, Body, RawBodyRequest, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private emailService: EmailService) {}

  @Post('webhook')
  async handleMailgunWebhook(
    @Req() req: Request,
    @Body() body: any,
  ) {
    try {
      this.verifyMailgunSignature(req);

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
      this.logger.error('Webhook processing failed: ' + error.message);
      return { success: false, error: 'Internal processing error' };
    }
  }

  private verifyMailgunSignature(req: Request) {
    const signature = (req.body as any).signature;
    if (!signature || !signature.timestamp || !signature.token) {
      throw new HttpException('Missing signature', 401);
    }

    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      throw new HttpException('Mailgun not configured', 500);
    }

    const expectedSig = crypto
      .createHmac('sha256', apiKey)
      .update(signature.timestamp + signature.token)
      .digest('hex');

    if (signature.signature !== expectedSig) {
      throw new HttpException('Invalid webhook signature', 401);
    }
  }
}

function hashContent(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}
