import { Injectable, Logger } from '@nestjs/common';
import { ExpenseParser, ParsedExpense } from './expense-parser.interface';
import { RegexParser } from './regex.parser';
import { LLMProvider } from '../llm/llm-provider.interface';
import { LLMProviderFactory } from '../llm/llm-provider.factory';
import { Confidence, FieldConfidence, LLMExpenseResult } from '../llm/llm-provider.interface';

@Injectable()
export class AIParser implements ExpenseParser {
  readonly name = 'ai';
  private readonly logger = new Logger(AIParser.name);

  constructor(
    private regexParser: RegexParser,
    private llmFactory: LLMProviderFactory,
  ) {}

  async parse(
    emailContent: string,
    subject: string,
    categoryList: Array<{ id: string; name: string }>,
    providerName?: string,
    modelName?: string,
  ): Promise<ParsedExpense> {
    const preprocessed = this.regexParser.preprocess(
      [subject, emailContent].filter(Boolean).join('\n'),
    );
    const regexResult = await this.regexParser.parse(preprocessed, subject);
    const catNames = categoryList.map((c) => c.name).join(', ');

    const provider = providerName
      ? this.llmFactory.getProvider(providerName)
      : this.llmFactory.getProvider('groq');

    if (!provider) {
      this.logger.warn('No LLM provider available, using regex only');
      return { ...regexResult, parseMethod: 'regex' };
    }

    this.logger.log(`Using LLM provider: ${provider.name}`);
    let llmResult: LLMExpenseResult = {};
    let llmSuccess = false;

    try {
      llmResult = await provider.parseExpense(preprocessed, subject, catNames, modelName);
      llmSuccess = Object.keys(llmResult).length > 0;
    } catch (err: any) {
      this.logger.warn(`LLM failed (${err.message}), falling back to regex`);
    }

    return this.mergeResults(llmResult, llmSuccess, regexResult, categoryList);
  }

  private mergeResults(
    llm: LLMExpenseResult,
    llmSuccess: boolean,
    regex: ParsedExpense,
    categories: Array<{ id: string; name: string }>,
  ): ParsedExpense {
    const needsRegex = (conf?: Confidence, hasValue?: any) =>
      !hasValue || !conf || conf === 'low' || conf === 'medium';

    const amount = needsRegex(llm.amountConfidence, llm.amount && llm.amount > 0)
      ? regex.amount
      : llm.amount || 0;

    const description = needsRegex(llm.descriptionConfidence, llm.description)
      ? regex.description
      : llm.description || regex.description;

    const date = needsRegex(llm.dateConfidence, llm.date)
      ? regex.date
      : (llm.date || regex.date);

    const accountSource = needsRegex(llm.accountSourceConfidence, llm.accountSource)
      ? regex.accountSource
      : (llm.accountSource || regex.accountSource);

    const catMatch = llm.suggestedCategory
      ? categories.find((c) => c.name.toLowerCase() === llm.suggestedCategory!.toLowerCase())
      : undefined;

    const fieldConfidence: FieldConfidence = {
      amount: amount > 0 ? (llm.amountConfidence || 'medium') : 'low',
      description: llm.descriptionConfidence || 'medium',
      date: llm.dateConfidence || 'medium',
      accountSource: accountSource ? (llm.accountSourceConfidence || 'medium') : 'low',
      category: catMatch ? (llm.categoryConfidence || 'medium') : 'low',
    };

    if (!llmSuccess) {
      Object.keys(fieldConfidence).forEach((k) => {
        fieldConfidence[k as keyof FieldConfidence] = 'medium';
      });
      if (amount <= 0) fieldConfidence.amount = 'low';
      if (!accountSource) fieldConfidence.accountSource = 'low';
    }

    const overallConfidence = this.computeOverall(fieldConfidence);

    const usedRegex = !llmSuccess || [
      needsRegex(llm.amountConfidence, llm.amount),
      needsRegex(llm.descriptionConfidence, llm.description),
      needsRegex(llm.dateConfidence, llm.date),
    ].some(Boolean);

    return {
      amount,
      description,
      date,
      accountSource,
      suggestedCategoryId: catMatch?.id,
      suggestedCategoryName: catMatch?.name,
      fieldConfidence,
      overallConfidence,
      parseMethod: llmSuccess ? (usedRegex ? 'mixed' : 'ai') : 'regex',
    };
  }

  private computeOverall(fc: FieldConfidence): Confidence {
    const vals = Object.values(fc);
    if (vals.every((c) => c === 'high')) return 'high';
    if (vals.every((c) => c === 'low')) return 'low';
    return 'medium';
  }
}
