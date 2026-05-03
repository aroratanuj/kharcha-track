import { Confidence, FieldConfidence } from '../llm/llm-provider.interface';

export interface ParsedExpense {
  amount: number;
  description: string;
  merchant: string;
  date: string;
  accountSource?: string;
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  fieldConfidence: FieldConfidence;
  overallConfidence: Confidence;
  parseMethod: 'ai' | 'regex' | 'mixed';
}

export interface ExpenseParser {
  readonly name: string;

  parse(
    emailContent: string,
    subject: string,
    categoryList: Array<{ id: string; name: string }>,
  ): Promise<ParsedExpense>;
}
