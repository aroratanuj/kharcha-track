import { useQuery } from '@tanstack/react-query';
import type { ExpenseAnalytics } from '@kts-workspace/shared-types';
import { analyticsService } from '@kts-workspace/shared-api';

export function useExpenseAnalytics(startDate?: string, endDate?: string) {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'expenses', { startDate, endDate }],
    queryFn: () => analyticsService.getExpenseAnalytics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Analytics can be loaded immediately
  });

  return {
    analytics,
    isLoading,
    error,
    refetch,
  };
}