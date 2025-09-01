'use client';

import { notFound } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Share2, 
  Heart, 
  Bookmark, 
  Clock, 
  Calendar,
  User,
  ArrowLeft,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
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
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 z-50">
      <div
        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ShareButtons({ article, baseUrl }: { article: any; baseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const articleUrl = addUtmParams(
    `${baseUrl}/news/${article.slug}`,
    'share_button'
  );
  const shareUrls = generateShareUrls(articleUrl, article.title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share this article
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <a
          href={shareUrls.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2] text-white rounded-xl hover:bg-[#1a8cd8] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2"
          aria-label="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
          <span className="font-medium">Twitter</span>
        </a>
        
        <a
          href={shareUrls.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4267B2] text-white rounded-xl hover:bg-[#365899] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#4267B2] focus:ring-offset-2"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
          <span className="font-medium">Facebook</span>
        </a>
        
        <a
          href={shareUrls.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0077B5] text-white rounded-xl hover:bg-[#005885] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-[#0077B5] focus:ring-offset-2"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
          <span className="font-medium">LinkedIn</span>
        </a>
        
        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Copy link to clipboard"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
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
      type="button"
      onClick={handleLike}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-offset-2 ${
        liked
          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 focus:ring-red-500'
          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 focus:ring-gray-500'
      }`}
      aria-label={`${liked ? 'Unlike' : 'Like'} this article`}
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      <span>{count > 0 ? count : 'Like'}</span>
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
      type="button"
      onClick={handleBookmark}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-offset-2 ${
        bookmarked
          ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30 focus:ring-yellow-500'
          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 focus:ring-gray-500'
      }`}
      aria-label={`${bookmarked ? 'Remove bookmark' : 'Bookmark'} this article`}
    >
      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
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
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <textarea
          placeholder="Write a thoughtful comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Posting...
            </>
          ) : (
            'Post Comment'
          )}
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {comment.authorName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              <div
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body) }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RelatedArticles({ currentArticleId }: { currentArticleId: string }) {
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock related articles for now
    const mockRelatedArticles = [
      {
        id: 'related-1',
        title: 'Understanding Modern Web Development',
        slug: 'understanding-modern-web-development',
        summary: 'A comprehensive guide to modern web development practices and tools.',
        image: '/placeholder-image.svg',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        author: { name: 'Jane Smith', slug: 'jane-smith' },
        category: { name: 'Development', slug: 'development' },
        readingTime: 8
      },
      {
        id: 'related-2',
        title: 'The Future of AI in Software Development',
        slug: 'future-of-ai-software-development',
        summary: 'Exploring how artificial intelligence is transforming the way we build software.',
        image: '/placeholder-image.svg',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        author: { name: 'Mike Johnson', slug: 'mike-johnson' },
        category: { name: 'AI', slug: 'ai' },
        readingTime: 12
      },
      {
        id: 'related-3',
        title: 'Building Scalable React Applications',
        slug: 'building-scalable-react-applications',
        summary: 'Best practices for creating maintainable and scalable React applications.',
        image: '/placeholder-image.svg',
        publishedAt: new Date(Date.now() - 259200000).toISOString(),
        author: { name: 'Sarah Wilson', slug: 'sarah-wilson' },
        category: { name: 'React', slug: 'react' },
        readingTime: 10
      }
    ];

    setTimeout(() => {
      setRelatedArticles(mockRelatedArticles);
      setLoading(false);
    }, 500);
  }, [currentArticleId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Related Articles
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group block bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 hover:scale-105"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  {article.category.name}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                {article.title}
              </h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {article.summary}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{article.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.readingTime} min read</span>
                </div>
              </div>
            </div>
          </Link>
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
      title: 'Building Modern Web Applications with Next.js and TypeScript',
      summary: 'A comprehensive guide to creating scalable, type-safe web applications using Next.js 15 and TypeScript. Learn best practices, performance optimization, and modern development patterns.',
      slug: params.slug,
      content: `
        <p>Modern web development has evolved significantly over the past few years, with frameworks like Next.js leading the charge in creating powerful, scalable applications. In this comprehensive guide, we'll explore how to build robust web applications using Next.js 15 and TypeScript.</p>
        
        <h2>Getting Started with Next.js 15</h2>
        <p>Next.js 15 introduces several groundbreaking features that make it easier than ever to build production-ready applications. The new App Router provides a more intuitive way to structure your application, while Server Components offer unprecedented performance benefits.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li><strong>App Router:</strong> A new paradigm for routing that leverages React Server Components</li>
          <li><strong>Server Components:</strong> Render components on the server for better performance</li>
          <li><strong>Streaming:</strong> Progressive loading of page content</li>
          <li><strong>Built-in SEO:</strong> Automatic optimization for search engines</li>
        </ul>
        
        <h2>TypeScript Integration</h2>
        <p>TypeScript provides type safety and better developer experience. When combined with Next.js, it creates a powerful development environment that catches errors early and provides excellent IntelliSense support.</p>
        
        <pre><code>// Example TypeScript interface
interface Article {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  author: {
    name: string;
    email: string;
  };
}</code></pre>
        
        <h2>Performance Optimization</h2>
        <p>Performance is crucial for modern web applications. Next.js provides several built-in optimizations:</p>
        
        <ul>
          <li>Automatic code splitting</li>
          <li>Image optimization with next/image</li>
          <li>Static site generation (SSG)</li>
          <li>Server-side rendering (SSR)</li>
        </ul>
        
        <p>By following these best practices and leveraging the power of Next.js and TypeScript, you can build applications that are not only performant but also maintainable and scalable.</p>
      `,
      author: { name: 'John Doe', slug: 'john-doe', avatar: '/placeholder-image.svg' },
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { name: 'Development', slug: 'development' },
      tags: [
        { name: 'Next.js', slug: 'nextjs' },
        { name: 'TypeScript', slug: 'typescript' },
        { name: 'React', slug: 'react' }
      ],
      readingTime: 15,
      image: '/placeholder-image.svg'
    };

    setTimeout(() => {
      setArticle(mockArticle);
      setLoading(false);
    }, 500);
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Back button skeleton */}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            
            {/* Header skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      {/* Article Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Featured Image */}
          {article.image && (
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags?.map((tag: any) => (
                    <Link
                      key={tag.slug}
                      href={`/tag/${tag.slug}`}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-8">
            {/* Category Badge */}
            <div className="mb-4">
              <Link
                href={`/category/${article.category?.slug || 'general'}`}
                className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                {article.category?.name || 'General'}
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white mb-6">
              {article.title}
            </h1>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                {article.summary}
              </p>
            )}

            {/* Author and Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {article.author?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <Link
                    href={`/authors/${article.author?.slug || 'unknown'}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {article.author?.name || 'Anonymous'}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={article.publishedAt}>
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                    {article.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{article.readingTime} min read</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 sm:ml-auto">
                <ReactionButton articleId={article.id} />
                <BookmarkButton articleId={article.id} />
              </div>
            </div>

            {/* Article Content */}
            <div className="mt-8 prose prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-img:rounded-xl prose-img:border prose-img:border-gray-200 dark:prose-img:border-gray-700 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ol:text-gray-700 dark:prose-ol:text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
          </div>
        </article>

        {/* Share Section */}
        <div className="mb-8">
          <ShareButtons article={article} baseUrl={baseUrl} />
        </div>

        {/* Related Articles */}
        <div className="mb-8">
          <RelatedArticles currentArticleId={article.id} />
        </div>

        {/* Comments Section */}
        <Comments articleId={article.id} />
      </div>
    </main>
  );
}
