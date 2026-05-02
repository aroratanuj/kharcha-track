import { IsEmail, IsString, IsOptional, IsNumber, IsEnum, IsDateString, MinLength, MaxLength, IsArray } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateExpenseDto {
  @IsNumber()
  amount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  merchantName?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(['draft', 'confirmed'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

const ALLOWED_UPDATE_FIELDS = ['amount', 'description', 'merchantName', 'date', 'categoryId', 'accountSource', 'notes'] as const;

export class UpdateExpenseDto {
  amount?: number;
  description?: string;
  merchantName?: string;
  date?: string;
  categoryId?: string;
  accountSource?: string;
  notes?: string;
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;
}

const ALLOWED_CATEGORY_FIELDS = ['name', 'color', 'icon'] as const;

export class UpdateCategoryDto {
  name?: string;
  color?: string;
  icon?: string;
}

export class BulkConfirmDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  ids: string[];
}
