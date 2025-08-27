'use client';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from '@/lib/seo/jsonld';
import { generateShareUrls, addUtmParams } from '@/lib/sharing/utm';
import {
  getStoredEmailHash,
  createEmailHash,
  setStoredEmailHash,
} from '@/lib/reactions/store';
import { getStoredBookmarks, setStoredBookmarks } from '@/lib/bookmarks/store';
import { sanitizeHtml } from '@/lib/comments/store';

interface Props {
  params: { slug: string };
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
      <div
        className="h-full bg-primary transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ShareButtons({ article, baseUrl }: { article: any; baseUrl: string }) {
  const articleUrl = addUtmParams(
    `${baseUrl}/news/${article.slug}`,
    'share_button'
  );
  const shareUrls = generateShareUrls(articleUrl, article.title);

  return (
    <div className="flex space-x-4 py-4">
      <a
        href={shareUrls.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        aria-label="Share on Twitter"
      >
        Twitter
      </a>
      <a
        href={shareUrls.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        aria-label="Share on Facebook"
      >
        Facebook
      </a>
      <a
        href={shareUrls.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        aria-label="Share on LinkedIn"
      >
        LinkedIn
      </a>
    </div>
  );
}

function ReactionButton({ articleId }: { articleId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?articleId=${articleId}`)
      .then((res) => res.json())
      .then((data) => setCount(data.count || 0))
      .catch(() => {});
  }, [articleId]);

  const handleLike = async () => {
    let emailHash = getStoredEmailHash();
    if (!emailHash) {
      const email = prompt('Enter your email to like this article:');
      if (!email) return;
      emailHash = createEmailHash(email);
      setStoredEmailHash(emailHash);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, emailHash }),
      });

      const data = await res.json();
      setLiked(data.liked);
      setCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
        liked
          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-muted text-muted-foreground'
      } hover:bg-red-50 dark:hover:bg-red-900/30`}
      aria-label={`${liked ? 'Unlike' : 'Like'} this article`}
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}

function BookmarkButton({ articleId }: { articleId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bookmarks = getStoredBookmarks();
    setBookmarked(bookmarks.includes(articleId));
  }, [articleId]);

  const handleBookmark = async () => {
    let emailHash = getStoredEmailHash();
    if (!emailHash) {
      const email = prompt('Enter your email to bookmark this article:');
      if (!email) return;
      emailHash = createEmailHash(email);
      setStoredEmailHash(emailHash);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, emailHash }),
      });

      const data = await res.json();
      setBookmarked(data.bookmarked);

      const bookmarks = getStoredBookmarks();
      if (data.bookmarked) {
        setStoredBookmarks([...bookmarks, articleId]);
      } else {
        setStoredBookmarks(bookmarks.filter((id) => id !== articleId));
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
        bookmarked
          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
          : 'bg-muted text-muted-foreground'
      } hover:bg-yellow-50 dark:hover:bg-yellow-900/30`}
      aria-label={`${bookmarked ? 'Remove bookmark' : 'Bookmark'} this article`}
    >
      <span>{bookmarked ? '🔖' : '📑'}</span>
      <span>{bookmarked ? 'Saved' : 'Save'}</span>
    </button>
  );
}

function Comments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?articleId=${articleId}`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    let emailHash = getStoredEmailHash();
    if (!emailHash) {
      const email = prompt('Enter your email (for notifications):');
      if (!email) return;
      emailHash = createEmailHash(email);
      setStoredEmailHash(emailHash);
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          body: newComment,
          authorName,
          authorEmailHash: emailHash,
        }),
      });

      if (res.ok) {
        setNewComment('');
        // Refresh comments
        const updatedRes = await fetch(`/api/comments?articleId=${articleId}`);
        const updatedData = await updatedRes.json();
        setComments(updatedData.comments || []);
      }
    } catch {
      // Handle error silently
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded"></div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full p-3 border border-input bg-background text-foreground rounded focus:ring-2 focus:ring-ring focus:border-ring"
          required
        />
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border border-input bg-background text-foreground rounded h-24 focus:ring-2 focus:ring-ring focus:border-ring"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 bg-gray-50 rounded">
            <div className="font-semibold">{comment.authorName}</div>
            <div className="text-sm text-gray-500 mb-2">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArticlePage({ params }: Props) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  useEffect(() => {
    // Mock article for now since we don't have the proper fetcher
    const mockArticle = {
      id: params.slug,
      title: 'Sample Article',
      summary: 'This is a sample article for testing the enhanced features.',
      slug: params.slug,
      content:
        '<p>This is the article content with enhanced features like reactions, bookmarks, and comments.</p>',
      author: { name: 'John Doe', slug: 'john-doe' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setArticle(mockArticle);
    setLoading(false);
  }, [params.slug]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateArticleJsonLd(article, baseUrl)),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbJsonLd([
              { name: 'Home', url: baseUrl },
              { name: 'News', url: `${baseUrl}/news` },
              { name: article.title, url: `${baseUrl}/news/${article.slug}` },
            ])
          ),
        }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground mb-4">
              {article.title}
            </h1>
            {article.summary && (
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                {article.summary}
              </p>
            )}
            {article.author && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground border-t border-border pt-4">
                <div className="flex items-center space-x-2">
                  <span>By</span>
                  <a
                    href={`/authors/${article.author.slug || 'unknown'}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {article.author.name}
                  </a>
                </div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString()}
                </time>
              </div>
            )}
          </header>

          <div className="prose prose-base md:prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-img:rounded-xl prose-img:border prose-img:border-border prose-a:text-primary prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </article>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="flex space-x-4 py-4 border-t">
          <ReactionButton articleId={article.id} />
          <BookmarkButton articleId={article.id} />
        </div>

        <ShareButtons article={article} baseUrl={baseUrl} />
        <Comments articleId={article.id} />
      </div>
    </main>
  );
}
