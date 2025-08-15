import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_TEMPLATES,
  DEFAULT_DESIGN_CONFIG,
} from '../src/lib/email-templates';

const prisma = new PrismaClient();

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  try {
    // Create default templates
    for (const [key, templateData] of Object.entries(DEFAULT_TEMPLATES)) {
      console.log(`Creating template: ${templateData.name}`);

      // Check if template exists first
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: { name: templateData.name },
      });

      const template = existingTemplate
        ? await prisma.emailTemplate.update({
            where: { id: existingTemplate.id },
            data: {
              subject: templateData.subject,
              description: templateData.description,
              category: templateData.category,
              htmlContent: templateData.htmlContent,
              textContent: templateData.textContent,
              designConfig: DEFAULT_DESIGN_CONFIG,
              status: 'ACTIVE',
            },
          })
        : await prisma.emailTemplate.create({
            data: {
              name: templateData.name,
              subject: templateData.subject,
              description: templateData.description,
              category: templateData.category,
              htmlContent: templateData.htmlContent,
              textContent: templateData.textContent,
              designConfig: DEFAULT_DESIGN_CONFIG,
              status: 'ACTIVE',
              createdBy: 'system',
            },
          });

      // Create initial version if it doesn't exist
      const existingVersion = await prisma.templateVersion.findFirst({
        where: {
          templateId: template.id,
          version: 1,
        },
      });

      if (!existingVersion) {
        await prisma.templateVersion.create({
          data: {
            templateId: template.id,
            version: 1,
            htmlContent: templateData.htmlContent,
            textContent: templateData.textContent,
            designConfig: DEFAULT_DESIGN_CONFIG,
          },
        });
      }

      console.log(`✅ Created template: ${templateData.name}`);
    }

    console.log('🎉 Email templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedEmailTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedEmailTemplates;
