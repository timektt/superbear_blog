export default function OfflinePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you're not connected to the internet. 
          Some content may not be available right now.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}