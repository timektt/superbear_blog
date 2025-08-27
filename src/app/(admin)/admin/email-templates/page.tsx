import { Metadata } from 'next';
import EmailTemplateList from '@/components/admin/EmailTemplateList';

export const metadata: Metadata = {
  title: 'Email Templates - Admin Dashboard',
  description: 'Manage email templates for newsletters and campaigns',
};

export default function EmailTemplatesPage() {
  return <EmailTemplateList />;
}
