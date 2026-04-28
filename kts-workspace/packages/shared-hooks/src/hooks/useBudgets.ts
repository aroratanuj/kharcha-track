import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '@kts-workspace/shared-types';
import { budgetService } from '@kts-workspace/shared-api';

export function useBudgets() {
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetService.getBudgets(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createBudgetMutation = useMutation({
    mutationFn: (request: CreateBudgetRequest) =>
      budgetService.createBudget(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateBudgetRequest }) =>
      budgetService.updateBudget(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const createBudget = async (request: CreateBudgetRequest) => {
    await createBudgetMutation.mutateAsync(request);
  };

  const updateBudget = async (id: string, request: UpdateBudgetRequest) => {
    await updateBudgetMutation.mutateAsync({ id, request });
  };

  const deleteBudget = async (id: string) => {
    await deleteBudgetMutation.mutateAsync(id);
  };

  return {
    budgets: budgets || [],
    isLoading,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
  };
}

export function useBudget(id: string) {
  const queryClient = useQueryClient();

  const {
    data: budget,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['budgets', id],
    queryFn: () => budgetService.getBudgetById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateBudgetMutation = useMutation({
    mutationFn: (request: UpdateBudgetRequest) =>
      budgetService.updateBudget(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const updateBudget = async (request: UpdateBudgetRequest) => {
    await updateBudgetMutation.mutateAsync(request);
  };

  return {
    budget,
    isLoading,
    error,
    refetch,
    updateBudget,
    isUpdating: updateBudgetMutation.isPending,
  };
}