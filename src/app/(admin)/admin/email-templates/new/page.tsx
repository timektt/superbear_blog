import { Metadata } from 'next';
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor';

export const metadata: Metadata = {
  title: 'Create Email Template - Admin Dashboard',
  description: 'Create a new email template for newsletters and campaigns',
};

export default function NewEmailTemplatePage() {
  return <EmailTemplateEditor />;
}
