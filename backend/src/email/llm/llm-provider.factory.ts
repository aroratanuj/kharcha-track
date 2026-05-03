import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from './llm-provider.interface';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

@Injectable()
export class LLMProviderFactory {
  private readonly logger = new Logger(LLMProviderFactory.name);
  private providers = new Map<string, LLMProvider>();

  constructor(
    private groqProvider: GroqProvider,
    private ollamaProvider: OllamaProvider,
  ) {
    this.providers.set('groq', this.groqProvider);
    this.providers.set('ollama', this.ollamaProvider);
  }

  getProvider(name: string): LLMProvider | null {
    const provider = this.providers.get(name);
    if (!provider) {
      this.logger.warn(`Unknown LLM provider: ${name}`);
      return null;
    }
    if (!provider.isAvailable()) {
      this.logger.warn(`LLM provider "${name}" not available (missing API key / URL)`);
      return null;
    }
    return provider;
  }

  getAvailableProviders(): Array<{ name: string; available: boolean }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      available: provider.isAvailable(),
    }));
  }
}
