import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMExpenseResult } from './llm-provider.interface';

@Injectable()
export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  isAvailable(): boolean {
    return !!process.env.OLLAMA_BASE_URL;
  }

  private async call(prompt: string, model: string, jsonMode = false): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: jsonMode ? 'json' : undefined,
          options: { temperature: 0.1 },
        }),
      });

      if (!res.ok) {
        this.logger.warn(`Ollama returned ${res.status}`);
        return null;
      }

      const data = await res.json() as any;
      return data.response || null;
    } catch (err: any) {
      this.logger.warn(`Ollama call failed: ${err.message}`);
      return null;
    }
  }

  async parseExpense(
    emailContent: string,
    subject: string,
    categoryList: string,
    model?: string,
  ): Promise<LLMExpenseResult> {
    const prompt = `Extract expense information from this bank transaction email. Respond ONLY with valid JSON:
{
  "amount": <number or 0>,
  "description": "<brief description of the transaction>",
  "date": "<YYYY-MM-DD or empty string>",
  "accountSource": "<Credit Card, Bank Account/UPI, or Cash, or empty string>",
  "suggestedCategory": "<best match from: ${categoryList} or empty string>",
  "amountConfidence": "<high, medium, or low>",
  "descriptionConfidence": "<high, medium, or low>",
  "dateConfidence": "<high, medium, or low>",
  "accountSourceConfidence": "<high, medium, or low>",
  "categoryConfidence": "<high, medium, or low>"
}

Rules:
- amount: extract the transaction amount in numbers (no currency symbol). 0 if not found.
- description: use text around the amount and transaction context from the email.
- date: transaction date from email. Empty string if not found.
- accountSource: "Credit Card" if credit card mentioned, "Bank Account/UPI" if UPI/debit card/net banking/NEFT/IMPS/Google Pay/PhonePe/Paytm/VPA handle mentioned, "Cash" if cash. Empty string if unsure.
- suggestedCategory: pick the most relevant category from the list. Empty string if unsure.

Email content:
${emailContent.substring(0, 3000)}

Subject: ${subject || 'N/A'}`;

    const response = await this.call(prompt, model || 'llama3.2', true);
    if (!response) return {};

    try {
      return JSON.parse(response);
    } catch {
      this.logger.warn('Ollama returned invalid JSON');
      return {};
    }
  }

  async suggestCategory(
    description: string,
    emailSnippet: string,
    categoryList: string,
    model?: string,
  ): Promise<string | null> {
    const prompt = `Pick the BEST matching category from this list: ${categoryList}

Description: ${description}
Email snippet: ${emailSnippet.substring(0, 1000)}

Respond ONLY with the category name. No explanation.`;

    return this.call(prompt, model || 'llama3.2', false);
  }
}
