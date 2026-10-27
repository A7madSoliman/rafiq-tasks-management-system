import { handleStatisticsRequest } from '@/features/statistics/server/statistics-api';

export async function POST(request: Request) {
  return handleStatisticsRequest(request, 'projects');
}
