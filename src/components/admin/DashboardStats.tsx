'use client';

import { useAdminStats } from '@/lib/hooks/useAdminStats';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  iconBg: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, iconBg, loading }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 ${iconBg} rounded-md flex items-center justify-center`}
            >
              <span className="text-white text-sm font-medium">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const { stats, loading, error } = useAdminStats();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading statistics
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Articles"
          value={stats?.articles.total || 0}
          icon="A"
          iconBg="bg-indigo-500"
          loading={loading}
        />
        <StatCard
          title="Published"
          value={stats?.articles.byStatus.PUBLISHED || 0}
          icon="P"
          iconBg="bg-green-500"
          loading={loading}
        />
        <StatCard
          title="Drafts"
          value={stats?.articles.byStatus.DRAFT || 0}
          icon="D"
          iconBg="bg-yellow-500"
          loading={loading}
        />
        <StatCard
          title="Archived"
          value={stats?.articles.byStatus.ARCHIVED || 0}
          icon="X"
          iconBg="bg-gray-500"
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Articles created (7 days)
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-6 rounded"></div>
                  ) : (
                    stats?.activity.articlesCreatedLast7Days || 0
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Articles published (7 days)
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-6 rounded"></div>
                  ) : (
                    stats?.activity.articlesPublishedLast7Days || 0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Top Categories
            </h3>
            <div className="mt-5">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between">
                      <div className="bg-gray-200 h-4 w-20 rounded"></div>
                      <div className="bg-gray-200 h-4 w-6 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : stats?.categories.length ? (
                <div className="space-y-2">
                  {stats.categories.slice(0, 5).map((category) => (
                    <div
                      key={category.id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600">
                        {category.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {category.articleCount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No categories yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Authors */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Top Authors
          </h3>
          <div className="mt-5">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="bg-gray-200 h-4 w-24 rounded"></div>
                    <div className="bg-gray-200 h-4 w-6 rounded"></div>
                  </div>
                ))}
              </div>
            ) : stats?.authors.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.authors.slice(0, 6).map((author) => (
                  <div
                    key={author.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{author.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {author.articleCount} articles
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No authors yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
