import { Metadata } from 'next';
import CampaignForm from '@/components/admin/CampaignForm';

export const metadata: Metadata = {
  title: 'Create Campaign - Admin Dashboard',
  description: 'Create a new email campaign',
};

export default function NewCampaignPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CampaignForm />
    </div>
  );
}
