// Mock data for the redesigned homepage

export const mockFeaturedArticle = {
  title: "OpenAI launches GPT-5 with real-time voice + vision",
  summary: "The next-generation LLM supports multimodal reasoning, memory, and real-time assistant use cases, marking a significant leap in AI capabilities.",
  category: "AI",
  imageUrl: "/mock/gpt5.jpg",
  slug: "openai-gpt5-launch",
  author: "Sarah Chen",
  date: "Aug 6, 2025"
};

export const mockTopHeadlines = [
  {
    title: "DeepMind reveals AlphaFold 3 with protein interaction prediction",
    slug: "deepmind-alphafold-3",
    category: "AI"
  },
  {
    title: "Microsoft open-sources Orca-Mini for edge computing",
    slug: "microsoft-orca-mini-open-source",
    category: "Open Source"
  },
  {
    title: "Anthropic shows Claude 3.5 Turbo with 200K context window",
    slug: "anthropic-claude-35-turbo",
    category: "AI"
  },
  {
    title: "GitHub Copilot gets team sync mode for collaborative coding",
    slug: "github-copilot-team-sync",
    category: "DevTools"
  },
  {
    title: "Nvidia hits $4T market cap on AI chip demand surge",
    slug: "nvidia-4t-market-cap",
    category: "Startups"
  }
];

export const mockNewsArticles = [
  {
    title: "GitHub Copilot adds team collaboration features",
    category: "DevTools",
    author: "Jane Doe",
    date: "Aug 6, 2025",
    imageUrl: "/mock/copilot.jpg",
    slug: "github-copilot-collaboration",
    summary: "New features enable real-time code sharing and synchronized development workflows across distributed teams."
  },
  {
    title: "Vercel announces Edge Runtime 2.0 with WebAssembly support",
    category: "DevTools",
    author: "Mike Johnson",
    date: "Aug 5, 2025",
    imageUrl: "/mock/vercel-edge.jpg",
    slug: "vercel-edge-runtime-2",
    summary: "The updated runtime brings native WASM support and 50% faster cold starts for serverless functions."
  },
  {
    title: "Meta releases Llama 3.1 with 405B parameters",
    category: "AI",
    author: "Dr. Lisa Wang",
    date: "Aug 5, 2025",
    imageUrl: "/mock/llama-31.jpg",
    slug: "meta-llama-31-release",
    summary: "The largest open-source language model to date challenges proprietary alternatives with state-of-the-art performance."
  },
  {
    title: "Supabase raises $80M Series B for open-source Firebase alternative",
    category: "Startups",
    author: "Tom Rodriguez",
    date: "Aug 4, 2025",
    imageUrl: "/mock/supabase-funding.jpg",
    slug: "supabase-series-b-funding",
    summary: "The PostgreSQL-based platform continues rapid growth as developers seek Firebase alternatives."
  },
  {
    title: "Rust Foundation launches security audit program",
    category: "Open Source",
    author: "Alex Kim",
    date: "Aug 4, 2025",
    imageUrl: "/mock/rust-security.jpg",
    slug: "rust-security-audit-program",
    summary: "New initiative will provide free security audits for critical Rust crates in the ecosystem."
  },
  {
    title: "Docker Desktop 5.0 brings multi-architecture builds",
    category: "DevTools",
    author: "Chris Taylor",
    date: "Aug 3, 2025",
    imageUrl: "/mock/docker-5.jpg",
    slug: "docker-desktop-5-release",
    summary: "Native support for ARM64 and x86 builds simplifies cross-platform development workflows."
  }
];

// Mock data for different categories
export const mockCategoryArticles = {
  ai: [
    {
      title: "Google's Gemini Ultra beats GPT-4 in reasoning benchmarks",
      category: "AI",
      author: "Dr. Emily Zhang",
      date: "Aug 6, 2025",
      imageUrl: "/mock/gemini-ultra.jpg",
      slug: "google-gemini-ultra-benchmarks",
      summary: "New evaluation shows significant improvements in mathematical and logical reasoning tasks."
    },
    {
      title: "Stability AI releases SDXL Turbo for real-time image generation",
      category: "AI",
      author: "Mark Stevens",
      date: "Aug 5, 2025",
      imageUrl: "/mock/sdxl-turbo.jpg",
      slug: "stability-ai-sdxl-turbo",
      summary: "One-step diffusion model generates high-quality images in under 100ms on consumer hardware."
    }
  ],
  devtools: [
    {
      title: "VS Code 2025 introduces AI-powered debugging assistant",
      category: "DevTools",
      author: "Rachel Green",
      date: "Aug 6, 2025",
      imageUrl: "/mock/vscode-ai-debug.jpg",
      slug: "vscode-ai-debugging-assistant",
      summary: "Integrated AI helps developers identify and fix bugs with contextual suggestions and explanations."
    },
    {
      title: "JetBrains Fleet goes open source with plugin ecosystem",
      category: "DevTools",
      author: "David Park",
      date: "Aug 5, 2025",
      imageUrl: "/mock/jetbrains-fleet.jpg",
      slug: "jetbrains-fleet-open-source",
      summary: "The next-generation IDE opens its platform to community developers and third-party extensions."
    }
  ]
};

// Placeholder image URLs (these would be replaced with actual images)
export const placeholderImages = {
  "/mock/gpt5.jpg": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
  "/mock/copilot.jpg": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
  "/mock/vercel-edge.jpg": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
  "/mock/llama-31.jpg": "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=800&h=600&fit=crop",
  "/mock/supabase-funding.jpg": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop",
  "/mock/rust-security.jpg": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
  "/mock/docker-5.jpg": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=600&fit=crop",
  "/mock/gemini-ultra.jpg": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
  "/mock/sdxl-turbo.jpg": "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop",
  "/mock/vscode-ai-debug.jpg": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
  "/mock/jetbrains-fleet.jpg": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop"
};