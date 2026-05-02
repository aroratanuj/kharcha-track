export enum ExpenseStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
}

export interface AccountSourceOption {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  merchantName?: string;
  date: string;
  status: ExpenseStatus;
  categoryId?: string;
  category?: Category;
  userId: string;
  accountSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
