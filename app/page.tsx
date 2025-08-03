import PublicLayout from '@/components/layout/PublicLayout';

export default function Home() {
  return (
    <PublicLayout>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SuperBear Blog
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Filtered, in-depth tech content for developers, AI builders, and tech
          entrepreneurs
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI & LLM News
            </h3>
            <p className="text-gray-600">
              Stay updated with the latest developments in artificial
              intelligence and large language models.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dev Tools & Open Source
            </h3>
            <p className="text-gray-600">
              Discover new developer tools and open source projects that can
              boost your productivity.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Startup & VC Tracking
            </h3>
            <p className="text-gray-600">
              Get insights into the startup ecosystem and venture capital
              trends.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
