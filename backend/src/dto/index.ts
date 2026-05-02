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

const ALLOWED_UPDATE_FIELDS = ['amount', 'description', 'merchantName', 'date', 'categoryId', 'accountSource', 'notes'];

export class UpdateExpenseDto {
  [ALLOWED_UPDATE_FIELDS[0] as string]?: number;
  [ALLOWED_UPDATE_FIELDS[1] as string]?: string;
  [ALLOWED_UPDATE_FIELDS[2] as string]?: string;
  [ALLOWED_UPDATE_FIELDS[3] as string]?: string;
  [ALLOWED_UPDATE_FIELDS[4] as string]?: string;
  [ALLOWED_UPDATE_FIELDS[5] as string]?: string;
  [ALLOWED_UPDATE_FIELDS[6] as string]?: string;
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

const ALLOWED_CATEGORY_FIELDS = ['name', 'color', 'icon'];

export class UpdateCategoryDto {
  [ALLOWED_CATEGORY_FIELDS[0] as string]?: string;
  [ALLOWED_CATEGORY_FIELDS[1] as string]?: string;
  [ALLOWED_CATEGORY_FIELDS[2] as string]?: string;
}

export class BulkConfirmDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  ids: string[];
}
