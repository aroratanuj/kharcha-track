import crypto from 'crypto';
import { Controller, Post, Req, Body, HttpException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private emailService: EmailService,
    private emailSenderService: EmailSenderService,
  ) {}

  @Post('test-parse')
  async testParse(@Body() body: { email: string }) {
    if (!body.email || typeof body.email !== 'string') {
      throw new HttpException('Provide { "email": "raw email content" }', 400);
    }
    const result = await this.emailService.parseExpenseWithAI(body.email);
    return { parsed: result };
  }

  @Post('webhook')
  async handleMailgunWebhook(
    @Req() req: Request,
    @Body() body: any,
  ) {
    try {
      this.verifyMailgunSignature(req);

      const emailContent = body['body-plain'] || body['body-html'] || '';
      const subject = body.subject || '';
      const sender = body.sender || body.From || '';

      if (!sender) {
        return { success: false, message: 'No sender found in email' };
      }

      const digest = this.hashContent((subject + '|' + emailContent).substring(0, 5000));
      const existing = await this.emailService.findByDigest(digest);
      if (existing) {
        return { success: false, message: 'Duplicate email already processed', expenseId: existing };
      }

      const parsedExpense = await this.emailService.parseExpenseWithAI(emailContent);

      const userId = await this.emailService.findUserByEmail(sender);

      if (userId) {
        const result = await this.emailService.processEmail(emailContent, userId, subject, digest, parsedExpense);
        return { ...result, recognized: true };
      }

      const unassignedCount = await this.emailService.countUnassignedBySender(sender);
      if (unassignedCount >= 10) {
        return { success: false, message: 'Max unassigned drafts reached for this sender' };
      }

      const result = await this.emailService.processUnassignedEmail(emailContent, sender, subject, digest, parsedExpense);

      this.emailSenderService.sendWelcome(sender, sender, parsedExpense).catch(() => {});
      this.emailSenderService.sendAdminNotification(sender, parsedExpense).catch(() => {});

      return { ...result, recognized: false, welcomeSent: true };
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

  private hashContent(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}
