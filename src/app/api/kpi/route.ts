import { NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';

export const GET = withAuth(async (_request, user, dataStorage) => {
  try {
    const container = await import('../../services/service-container').then(m => m.ServiceContainer.getInstance());
    const kpiService = await container.getKpiService();
    const kpiData = await kpiService.getAllKpis(user.id);

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}, { requiredRole: 'admin' });