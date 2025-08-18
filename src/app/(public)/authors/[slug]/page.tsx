import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { generatePersonJsonLd } from '@/lib/seo/jsonld';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prisma = getSafePrismaClient();
  if (!prisma) return { title: 'Author Not Found' };
  
  try {
    const author = await prisma.user.findUnique({
      where: { id: params.slug }, // Using ID as slug for now
    });
    
    if (!author) return { title: 'Author Not Found' };
    
    return {
      title: `${author.name} - SuperBear Blog`,
      description: author.bio || `Articles by ${author.name}`,
    };
  } catch {
    return { title: 'Author Not Found' };
  }
}

export default async function AuthorPage({ params }: Props) {
  const prisma = getSafePrismaClient();
  if (!prisma) notFound();
  
  try {
    const author = await prisma.user.findUnique({
      where: { id: params.slug },
    });
    
    if (!author) notFound();
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    return (
      <main className="container mx-auto px-4 py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generatePersonJsonLd(author, baseUrl)),
          }}
        />
        
        <div className="max-w-2xl mx-auto text-center">
          {author.avatar && (
            <img src={author.avatar} alt={author.name} className="w-32 h-32 rounded-full mx-auto mb-6" />
          )}
          <h1 className="text-4xl font-bold mb-4">{author.name}</h1>
          <p className="text-lg text-gray-600 mb-6">{author.bio || 'No bio available'}</p>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}