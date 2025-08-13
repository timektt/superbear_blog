'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const headings = article.querySelectorAll('h2, h3, h4');
    const tocItems: TOCItem[] = [];

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`;
      if (!heading.id) {
        heading.id = id;
      }

      tocItems.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
      });
    });

    setToc(tocItems);

    // Intersection Observer for active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
    }
  };

  if (toc.length === 0) return null;

  return (
    <>
      {/* Mobile TOC Toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-card text-card-foreground border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Table of Contents
        </button>
        
        {isOpen && (
          <div className="mt-2 p-4 bg-card border border-border rounded-lg">
            <nav>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToHeading(item.id)}
                      className={`block w-full text-left text-sm hover:text-primary transition-colors ${
                        item.level === 3 ? 'pl-4' : item.level === 4 ? 'pl-8' : ''
                      } ${activeId === item.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop TOC */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-card-foreground mb-3 text-sm">Table of Contents</h3>
          <nav>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`block w-full text-left text-sm hover:text-primary transition-colors ${
                      item.level === 3 ? 'pl-3' : item.level === 4 ? 'pl-6' : ''
                    } ${activeId === item.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}