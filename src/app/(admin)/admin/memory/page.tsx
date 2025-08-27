/**
 * Memory Optimization Admin Page
 * Provides comprehensive memory monitoring and optimization controls
 */

import { Metadata } from 'next';
import MemoryOptimizationDashboard from '@/components/admin/MemoryOptimizationDashboard';

export const metadata: Metadata = {
  title: 'Memory Optimization - Admin Dashboard',
  description: 'Monitor and optimize system memory usage',
};

export default function MemoryOptimizationPage() {
  return (
    <div className="container mx-auto">
      <MemoryOptimizationDashboard />
    </div>
  );
}
