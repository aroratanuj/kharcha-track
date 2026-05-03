import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from './email.service';
import { EmailSenderService } from './email-sender.service';
import { ImapFlow } from 'imapflow';
import crypto from 'crypto';

@Injectable()
export class ImapMonitorService {
  private readonly logger = new Logger(ImapMonitorService.name);
  private isRunning = false;

  constructor(
    private emailService: EmailService,
    private emailSenderService: EmailSenderService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollInbox() {
    if (this.isRunning) return;

    const host = process.env.IMAP_HOST;
    const user = process.env.IMAP_USER;
    const pass = process.env.IMAP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(`IMAP not configured: HOST=${!!host}, USER=${!!user}, PASS=${!!pass}`);
      return;
    }

    this.logger.log(`IMAP polling ${user}@${host}...`);
    this.isRunning = true;

    try {
      const client = new ImapFlow({
        host,
        port: parseInt(process.env.IMAP_PORT || '993', 10),
        auth: { user, pass },
        secure: true,
        logger: false,
      });

      client.on('error', (err: any) => {
        this.logger.error(`IMAP connection error: ${err.message}`);
      });

      await client.connect();

      const lock = await client.getMailboxLock('INBOX');
      const searchResult = await client.search({ unseen: true } as any);
      const messages: number[] = Array.isArray(searchResult) ? searchResult : [];

      if (messages && messages.length > 0) {
        this.logger.log(`Found ${messages.length} unread email(s)`);
      }

      if (!messages || messages.length === 0) {
        lock.release();
        await client.logout();
        return;
      }

      for (const seq of messages) {
        try {
          const message: any = await client.fetchOne(seq, {
            source: true,
            envelope: true,
          });

          const envelope = message.envelope;
          const sender = envelope?.from?.[0]?.address || '';
          const subject = envelope?.subject || '';
          const date = envelope?.date || '';

          const rawSource = (message.source as Buffer).toString();

          this.logger.log(`--- EMAIL FETCHED ---`);
          this.logger.log(`From: ${sender}`);
          this.logger.log(`Subject: ${subject}`);
          this.logger.log(`Date: ${date}`);
          this.logger.log(`Raw source length: ${rawSource.length} bytes`);

          const body = this.extractPlainText(rawSource);

          this.logger.log(`Extracted body (${body.length} chars, first 2000):\n${body.substring(0, 2000)}`);

          if (!sender || !body || body.trim().length < 5) {
            this.logger.warn(`Skipping email - no sender or empty body`);
            await client.messageFlagsAdd(seq, ['\\Seen']);
            continue;
          }

          const digest = this.hashContent(
            (subject + '|' + body).substring(0, 5000),
          );
          const existing = await this.emailService.findByDigest(digest);

          if (existing) {
            await client.messageFlagsAdd(seq, ['\\Seen']);
            this.logger.log(`Duplicate email skipped: ${subject}`);
            continue;
          }

          const parsedExpense = await this.emailService.parseExpenseWithAI(
            body,
            subject,
          );

          this.logger.log(`Parsed result: ${JSON.stringify(parsedExpense, null, 2)}`);

          const userId = await this.emailService.findUserByEmail(sender);

          if (userId) {
            await this.emailService.processEmail(
              body,
              userId,
              subject,
              digest,
              parsedExpense,
            );
            this.logger.log(
              `Draft created for ${sender}: INR ${parsedExpense.amount || 0} | ${parsedExpense.description || subject} | ${parsedExpense.accountSource || 'N/A'}`,
            );
          } else {
            const unassignedCount =
              await this.emailService.countUnassignedBySender(sender);
            if (unassignedCount >= 10) {
              this.logger.warn(
                `Max unassigned reached for ${sender}, skipping`,
              );
            } else {
              await this.emailService.processUnassignedEmail(
                body,
                sender,
                subject,
                digest,
                parsedExpense,
              );
              this.emailSenderService
                .sendWelcome(sender, sender, parsedExpense)
                .catch(() => {});
              this.emailSenderService
                .sendAdminNotification(sender, parsedExpense)
                .catch(() => {});
              this.logger.log(
                `Unassigned draft created from ${sender}: INR ${parsedExpense.amount || 0} | ${parsedExpense.description || subject}`,
              );
            }
          }

          this.logger.log(`--- EMAIL DONE ---\n`);
          await client.messageFlagsAdd(seq, ['\\Seen']);
        } catch (err: any) {
          this.logger.error(`Failed to process email: ${err.message}`);
        }
      }

      lock.release();
      await client.logout();
    } catch (err: any) {
      this.logger.error(`IMAP poll failed: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  private extractPlainText(source: string): string {
    const headerEnd = source.indexOf('\r\n\r\n');
    let body = headerEnd === -1 ? source : source.substring(headerEnd + 4);

    const textPlainMatch = body.match(/Content-Type:\s*text\/plain[^\r\n]*\r\n(?:[\s\S]*?\r\n)?\r\n([\s\S]*?)(?=\r\n--|\r\nContent-Type:)/i);
    if (textPlainMatch && textPlainMatch[1]) {
      body = textPlainMatch[1];
    } else {
      const textHtmlMatch = body.match(/Content-Type:\s*text\/html[^\r\n]*\r\n(?:[\s\S]*?\r\n)?\r\n([\s\S]*?)(?=\r\n--|\z)/i);
      if (textHtmlMatch && textHtmlMatch[1]) {
        body = textHtmlMatch[1];
        body = body
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<\/div>/gi, '\n')
          .replace(/<\/tr>/gi, '\n')
          .replace(/<\/li>/gi, '\n')
          .replace(/<\/h[1-6]>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ');
      }
    }

    body = body
      .replace(/=\r\n/g, '')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\r\n/g, '\n')
      .replace(/http[s]?:\/\/[^\s]+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return body;
  }

  private hashContent(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}
