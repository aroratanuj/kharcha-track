import { Injectable, Logger } from '@nestjs/common';
import { ExpenseParser, ParsedExpense } from './expense-parser.interface';
import { Confidence, FieldConfidence } from '../llm/llm-provider.interface';

@Injectable()
export class RegexParser implements ExpenseParser {
  readonly name = 'regex';
  private readonly logger = new Logger(RegexParser.name);

  async parse(
    emailContent: string,
    subject: string,
    _categoryList?: Array<{ id: string; name: string }>,
  ): Promise<ParsedExpense> {
    const text = this.preprocess([subject, emailContent].filter(Boolean).join('\n'));
    const amount = this.extractAmount(text);
    const date = this.extractDate(text);
    const merchant = this.extractMerchant(text);
    const description = this.buildDescription(merchant, amount, subject);
    const accountSource = this.extractAccountSource(text);

    const fieldConfidence: FieldConfidence = {
      amount: amount > 0 ? 'medium' : 'low',
      description: 'medium',
      merchant: merchant !== 'Unknown' ? 'medium' : 'low',
      date: 'medium',
      accountSource: accountSource ? 'medium' : 'low',
      category: 'low',
    };

    const overallConfidence = this.computeOverall(fieldConfidence);

    return {
      amount,
      description,
      merchant,
      date,
      accountSource,
      fieldConfidence,
      overallConfidence,
      parseMethod: 'regex',
    };
  }

  preprocess(text: string): string {
    return text
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
      .replace(/&nbsp;/g, ' ')
      .replace(/=3D/g, '=')
      .replace(/=\r\n/g, '')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/http[s]?:\/\/[^\s]+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  extractAmount(text: string): number {
    const match = text.match(/(?:Rs\.?|INR|₹|\$)\s*(\d[\d,.]*\d|\d)/i);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }

  extractDate(text: string): string {
    const monthNameMatch = text.match(
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
    );
    if (monthNameMatch) {
      const months: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      };
      const m = months[monthNameMatch[2].substring(0, 3).toLowerCase()];
      const d = parseInt(monthNameMatch[1]);
      const y = parseInt(monthNameMatch[3]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const dateMatch = text.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
    if (dateMatch) {
      let y = parseInt(dateMatch[3]);
      if (y < 100) y += 2000;
      const m = parseInt(dateMatch[2]);
      const d = parseInt(dateMatch[1]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  extractMerchant(text: string): string {
    const patterns = [
      /at\s+(?:Upi\s+)?([A-Z][A-Za-z\s.]+?)(?:\s+is\s+Approved|\s+is\s+Declined|\.|\s*$)/im,
      /at\s+([A-Z][A-Za-z\s.]+?)(?:\s+on\s+\d|\s+for\s+INR|\s+for\s+Rs|\.|\s*$)/im,
      /merchant[:\s]+([A-Z][A-Za-z0-9\s.]+?)(?:\s*$|\n|\.)/im,
      /paid\s+to\s+([A-Z][A-Za-z\s.]+?)(?:\s+on|\s+for|\.|\s*$)/im,
      /to\s+([A-Z][A-Za-z0-9\s.]+?)\s+(?:via|using|on|for)\s/i,
    ];
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        const extracted = m[1].trim().replace(/\s+/g, ' ');
        if (extracted.length >= 2 && extracted.length <= 80) return extracted;
      }
    }
    return 'Unknown';
  }

  extractAccountSource(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (/credit\s*card/.test(lower)) return 'Credit Card';
    if (/\bupi\b/.test(lower)) return 'UPI';
    if (/debit\s*card|bank\s*account|savings\s*account|current\s*account/.test(lower)) return 'Bank Account';
    if (/\bcash\b/.test(lower)) return 'Cash';
    return undefined;
  }

  buildDescription(merchant: string, amount: number, subject?: string): string {
    let description = 'Expense from email';
    if (subject && subject.length > 3) {
      description = subject.replace(/^(Fwd?:?\s*|Re:\s*)/i, '').trim();
    }
    if (merchant !== 'Unknown') description = merchant;
    if (amount > 0) description += ` - INR ${amount}`;
    return description;
  }

  computeOverall(fc: FieldConfidence): Confidence {
    const vals = Object.values(fc);
    if (vals.every((c) => c === 'high')) return 'high';
    if (vals.every((c) => c === 'low')) return 'low';
    return 'medium';
  }
}
