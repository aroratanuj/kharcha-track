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

          const body = this.extractPlainText(
            (message.source as Buffer).toString(),
          );

          if (!sender || !body) {
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
              `Draft created for ${sender}: ${parsedExpense.amount || 0} - ${subject}`,
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
                `Unassigned draft created from ${sender}: ${subject}`,
              );
            }
          }

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
    const bodyStart = source.indexOf('\r\n\r\n');
    if (bodyStart === -1) return source;
    return source.substring(bodyStart).replace(/\r\n/g, '\n');
  }

  private hashContent(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }
}
