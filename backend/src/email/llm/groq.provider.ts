import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMExpenseResult } from './llm-provider.interface';
import Groq from 'groq-sdk';

@Injectable()
export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private readonly logger = new Logger(GroqProvider.name);
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }

  isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  async parseExpense(
    emailContent: string,
    subject: string,
    categoryList: string,
    model?: string,
  ): Promise<LLMExpenseResult> {
    const prompt = `Extract expense information from this bank transaction email. Respond ONLY with valid JSON:
{
  "amount": <number or 0 if not found>,
  "description": "<brief description including merchant/context>",
  "merchant": "<merchant name or empty string if unknown>",
  "date": "<YYYY-MM-DD or empty string if not found>",
  "accountSource": "<Credit Card, Bank Account/UPI, or Cash, or empty string>",
  "suggestedCategory": "<best match from: ${categoryList} or empty string>",
  "amountConfidence": "<high, medium, or low>",
  "descriptionConfidence": "<high, medium, or low>",
  "merchantConfidence": "<high, medium, or low>",
  "dateConfidence": "<high, medium, or low>",
  "accountSourceConfidence": "<high, medium, or low>",
  "categoryConfidence": "<high, medium, or low>"
}

Rules:
- amount: extract the transaction amount in numbers (no currency symbol). 0 if not found.
- description: use text around the amount, include merchant name
- merchant: extract where the transaction happened. Empty string if unknown.
- date: transaction date from email (DD-MM-YYYY or similar). Empty string if not found.
  - accountSource: "Credit Card" if credit card mentioned, "Bank Account/UPI" if UPI/debit card/bank mentioned, "Cash" if cash. Empty string if unsure.
- suggestedCategory: pick the most relevant category from the list. Empty string if unsure.
- For confidence: "high" = clearly stated in email, "medium" = likely but not explicit, "low" = guessed or not found.

Email content:
${emailContent.substring(0, 3000)}

Subject: ${subject || 'N/A'}`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: model || 'llama3-70b-8192',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (err: any) {
      this.logger.warn(`Groq parseExpense failed: ${err.message}`);
      return {};
    }
  }

  async suggestCategory(
    merchant: string,
    description: string,
    emailSnippet: string,
    categoryList: string,
    model?: string,
  ): Promise<string | null> {
    const prompt = `You are an expense categorizer. Given the transaction details below, pick the BEST matching category from this list: ${categoryList}

Transaction details:
Merchant: ${merchant}
Description: ${description}
Email snippet: ${emailSnippet.substring(0, 1000)}

Respond ONLY with the category name from the list. No explanation.`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: model || 'llama3-8b-8192',
        temperature: 0.1,
        max_tokens: 50,
      });

      return response.choices[0].message.content?.trim() || null;
    } catch (err: any) {
      this.logger.warn(`Groq suggestCategory failed: ${err.message}`);
      return null;
    }
  }
}
