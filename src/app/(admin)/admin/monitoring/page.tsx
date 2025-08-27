/**
 * Admin monitoring dashboard page
 */

import { Metadata } from 'next';
import MonitoringDashboard from '@/components/admin/MonitoringDashboard';

export const metadata: Metadata = {
  title: 'System Monitoring - Admin Dashboard',
  description: 'Monitor system performance, health, and request metrics',
};

export default function MonitoringPage() {
  return <MonitoringDashboard />;
}
