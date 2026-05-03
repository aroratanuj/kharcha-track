import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from '../schemas/system-config.schema';

export interface AppSettings {
  aiEnabled: boolean;
  aiProvider: string;
  llmModel: string;
}

const DEFAULTS: AppSettings = {
  aiEnabled: true,
  aiProvider: 'groq',
  llmModel: 'llama3-70b-8192',
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache: AppSettings = { ...DEFAULTS };

  constructor(
    @InjectModel(SystemConfig.name)
    private configModel: Model<SystemConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.loadSettings();
  }

  private async loadSettings() {
    try {
      const configs = await this.configModel.find().lean();
      for (const c of configs) {
        if (c.key in DEFAULTS) {
          (this.cache as any)[c.key] = c.value;
        }
      }
      this.logger.log(`Settings loaded: AI=${this.cache.aiEnabled}, provider=${this.cache.aiProvider}`);
    } catch (err: any) {
      this.logger.warn(`Failed to load settings: ${err.message}, using defaults`);
    }
  }

  async getAll(): Promise<AppSettings> {
    return { ...this.cache };
  }

  async get<T extends keyof AppSettings>(key: T): Promise<AppSettings[T]> {
    return this.cache[key];
  }

  async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    for (const [key, value] of Object.entries(partial)) {
      if (!(key in DEFAULTS)) continue;
      await this.configModel.findOneAndUpdate(
        { key },
        { value, key },
        { upsert: true, new: true },
      );
      (this.cache as any)[key] = value;
    }
    this.logger.log(`Settings updated: ${JSON.stringify(partial)}`);
    return { ...this.cache };
  }
}
