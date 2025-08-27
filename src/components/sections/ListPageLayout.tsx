import LatestList from '@/components/sections/LatestList';
import RightRail from '@/components/sections/RightRail';
import InBrief from '@/components/sections/InBrief';
import Pager from '@/components/pagination/Pager';
import { PublicListItem, PaginatedResult } from '@/lib/publicData';

interface ListPageLayoutProps {
  title: string;
  subtitle?: string;
  inBriefItems?: PublicListItem[];
  result: PaginatedResult;
  mostPopular: PublicListItem[];
  basePath: string;
  showInBrief?: boolean;
}

export default function ListPageLayout({
  title,
  subtitle,
  inBriefItems,
  result,
  mostPopular,
  basePath,
  showInBrief = false,
}: ListPageLayoutProps) {
  const { items, page, totalPages, total } = result;

  return (
    <>
      {/* In Brief Section - Only on /news */}
      {showInBrief && inBriefItems && inBriefItems.length > 0 && (
        <InBrief items={inBriefItems} />
      )}

      {/* Main Content */}
      <section className="bg-background py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
            {total > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {total} article{total !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No articles found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or browse other categories.
              </p>
            </div>
          ) : (
            /* Content Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Articles List - Left 8 cols */}
              <div className="lg:col-span-8">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <LatestList articles={items} />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pager
                      currentPage={page}
                      totalPages={totalPages}
                      basePath={basePath}
                    />
                  </div>
                )}
              </div>

              {/* Right Rail - Right 4 cols */}
              <div className="lg:col-span-4">
                <RightRail
                  title="Most Popular"
                  items={mostPopular.map((item) => ({
                    title: item.title,
                    category: item.category,
                    imageUrl: item.imageUrl,
                    slug: item.slug,
                    timeAgo: item.date,
                  }))}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
