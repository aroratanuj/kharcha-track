import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpensesQueryParams,
} from '@kts-workspace/shared-types';
import { expenseService } from '@kts-workspace/shared-api';

export function useExpenses(params?: ExpensesQueryParams) {
  const queryClient = useQueryClient();

  const {
    data: expenses,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseService.getExpenses(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const createExpenseMutation = useMutation({
    mutationFn: (request: CreateExpenseRequest) =>
      expenseService.createExpense(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateExpenseRequest }) =>
      expenseService.updateExpense(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const createExpense = async (request: CreateExpenseRequest) => {
    await createExpenseMutation.mutateAsync(request);
  };

  const updateExpense = async (id: string, request: UpdateExpenseRequest) => {
    await updateExpenseMutation.mutateAsync({ id, request });
  };

  const deleteExpense = async (id: string) => {
    await deleteExpenseMutation.mutateAsync(id);
  };

  return {
    expenses: expenses || [],
    isLoading,
    error,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    isCreating: createExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
  };
}

export function useExpense(id: string) {
  const queryClient = useQueryClient();

  const {
    data: expense,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expenseService.getExpenseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (request: UpdateExpenseRequest) =>
      expenseService.updateExpense(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateExpense = async (request: UpdateExpenseRequest) => {
    await updateExpenseMutation.mutateAsync(request);
  };

  return {
    expense,
    isLoading,
    error,
    refetch,
    updateExpense,
    isUpdating: updateExpenseMutation.isPending,
  };
}