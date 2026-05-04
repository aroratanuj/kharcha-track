export type Confidence = 'high' | 'medium' | 'low';

export interface FieldConfidence {
  amount: Confidence;
  description: Confidence;
  date: Confidence;
  accountSource: Confidence;
  category: Confidence;
}

export interface LLMExpenseResult {
  amount?: number;
  description?: string;
  date?: string;
  accountSource?: string;
  suggestedCategory?: string;
  amountConfidence?: Confidence;
  descriptionConfidence?: Confidence;
  dateConfidence?: Confidence;
  accountSourceConfidence?: Confidence;
  categoryConfidence?: Confidence;
}

export interface LLMProvider {
  readonly name: string;

  isAvailable(): boolean;

  parseExpense(
    emailContent: string,
    subject: string,
    categoryList: string,
    model?: string,
  ): Promise<LLMExpenseResult>;

  suggestCategory(
    description: string,
    emailSnippet: string,
    categoryList: string,
    model?: string,
  ): Promise<string | null>;
}
