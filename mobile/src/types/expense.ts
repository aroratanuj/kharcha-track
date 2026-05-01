export enum ExpenseStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
}

export enum AccountSource {
  UPI = 'UPI',
  Card = 'Card',
  BankAccount = 'Bank Account',
  Cash = 'Cash',
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
  accountSource?: AccountSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
