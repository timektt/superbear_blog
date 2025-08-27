import { Metadata } from 'next';
import CampaignList from '@/components/admin/CampaignList';

export const metadata: Metadata = {
  title: 'Email Campaigns - Admin Dashboard',
  description: 'Manage email campaigns and newsletters',
};

export default function CampaignsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CampaignList />
    </div>
  );
}
