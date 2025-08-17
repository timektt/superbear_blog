import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Admin',
  description: 'View detailed analytics and performance metrics for articles',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <AnalyticsDashboard />
    </div>
  );
}