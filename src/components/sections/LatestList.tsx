'use client';
import ArticleCard from '@/components/ui/ArticleCard';

interface LatestArticle {
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  slug?: string;
  snippet?: string;
}

interface LatestListProps {
  articles: LatestArticle[];
}

export default function LatestList({ articles }: LatestListProps) {
  // Ensure minimum 6 articles for TechCrunch fidelity
  const displayArticles = articles.slice(0, 10);

  return (
    <div className="space-y-6">
      {displayArticles.map((article, index) => (
        <ArticleCard
          key={index}
          title={article.title}
          category={article.category}
          author={article.author}
          date={article.date}
          imageUrl={article.imageUrl}
          slug={article.slug || `article-${index + 1}`}
          snippet={article.snippet}
          variant="list"
        />
      ))}
    </div>
  );
}
