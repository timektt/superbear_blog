// Mock data for the redesigned homepage

export const mockFeaturedArticle = {
  title: 'OpenAI launches GPT-5 with real-time voice + vision',
  summary:
    'Next-gen LLM adds multimodal reasoning, memory, and real-time assistant capabilities.',
  category: 'AI',
  author: 'Tech Writer',
  date: 'Aug 6, 2025',
  imageUrl:
    'https://images.unsplash.com/photo-1527443224154-9c6c2e3f1f2a?w=1200&h=600&fit=crop',
  slug: 'openai-gpt5-launch',
};

export const mockTopHeadlines = [
  {
    title: 'DeepMind unveils AlphaFold 3',
    timeAgo: '4h ago',
    slug: 'deepmind-alphafold-3',
  },
  {
    title: 'GitHub Copilot adds Team Sync',
    timeAgo: '6h ago',
    slug: 'github-copilot-team-sync',
  },
  {
    title: 'Anthropic ships Claude 3.5 Turbo',
    timeAgo: '8h ago',
    slug: 'anthropic-claude-35-turbo',
  },
  {
    title: 'Vercel introduces Edge Runtimes 2.0',
    timeAgo: '12h ago',
    slug: 'vercel-edge-runtimes-2',
  },
  {
    title: 'Nvidia tops $4T market cap',
    timeAgo: '1d ago',
    slug: 'nvidia-4t-market-cap',
  },
];

export const mockNewsArticles = [
  {
    title: 'GitHub Copilot adds team collaboration features',
    category: 'DevTools',
    author: 'Jane Doe',
    date: 'Aug 6, 2025',
    imageUrl: '/mock/copilot.jpg',
    slug: 'github-copilot-collaboration',
    summary:
      'New features enable real-time code sharing and synchronized development workflows across distributed teams.',
  },
  {
    title: 'Vercel announces Edge Runtime 2.0 with WebAssembly support',
    category: 'DevTools',
    author: 'Mike Johnson',
    date: 'Aug 5, 2025',
    imageUrl: '/mock/vercel-edge.jpg',
    slug: 'vercel-edge-runtime-2',
    summary:
      'The updated runtime brings native WASM support and 50% faster cold starts for serverless functions.',
  },
  {
    title: 'Meta releases Llama 3.1 with 405B parameters',
    category: 'AI',
    author: 'Dr. Lisa Wang',
    date: 'Aug 5, 2025',
    imageUrl: '/mock/llama-31.jpg',
    slug: 'meta-llama-31-release',
    summary:
      'The largest open-source language model to date challenges proprietary alternatives with state-of-the-art performance.',
  },
  {
    title: 'Supabase raises $80M Series B for open-source Firebase alternative',
    category: 'Startups',
    author: 'Tom Rodriguez',
    date: 'Aug 4, 2025',
    imageUrl: '/mock/supabase-funding.jpg',
    slug: 'supabase-series-b-funding',
    summary:
      'The PostgreSQL-based platform continues rapid growth as developers seek Firebase alternatives.',
  },
  {
    title: 'Rust Foundation launches security audit program',
    category: 'Open Source',
    author: 'Alex Kim',
    date: 'Aug 4, 2025',
    imageUrl: '/mock/rust-security.jpg',
    slug: 'rust-security-audit-program',
    summary:
      'New initiative will provide free security audits for critical Rust crates in the ecosystem.',
  },
  {
    title: 'Docker Desktop 5.0 brings multi-architecture builds',
    category: 'DevTools',
    author: 'Chris Taylor',
    date: 'Aug 3, 2025',
    imageUrl: '/mock/docker-5.jpg',
    slug: 'docker-desktop-5-release',
    summary:
      'Native support for ARM64 and x86 builds simplifies cross-platform development workflows.',
  },
];

// Mock data for different categories
export const mockCategoryArticles = {
  ai: [
    {
      title: "Google's Gemini Ultra beats GPT-4 in reasoning benchmarks",
      category: 'AI',
      author: 'Dr. Emily Zhang',
      date: 'Aug 6, 2025',
      imageUrl: '/mock/gemini-ultra.jpg',
      slug: 'google-gemini-ultra-benchmarks',
      summary:
        'New evaluation shows significant improvements in mathematical and logical reasoning tasks.',
    },
    {
      title: 'Stability AI releases SDXL Turbo for real-time image generation',
      category: 'AI',
      author: 'Mark Stevens',
      date: 'Aug 5, 2025',
      imageUrl: '/mock/sdxl-turbo.jpg',
      slug: 'stability-ai-sdxl-turbo',
      summary:
        'One-step diffusion model generates high-quality images in under 100ms on consumer hardware.',
    },
  ],
  devtools: [
    {
      title: 'VS Code 2025 introduces AI-powered debugging assistant',
      category: 'DevTools',
      author: 'Rachel Green',
      date: 'Aug 6, 2025',
      imageUrl: '/mock/vscode-ai-debug.jpg',
      slug: 'vscode-ai-debugging-assistant',
      summary:
        'Integrated AI helps developers identify and fix bugs with contextual suggestions and explanations.',
    },
    {
      title: 'JetBrains Fleet goes open source with plugin ecosystem',
      category: 'DevTools',
      author: 'David Park',
      date: 'Aug 5, 2025',
      imageUrl: '/mock/jetbrains-fleet.jpg',
      slug: 'jetbrains-fleet-open-source',
      summary:
        'The next-generation IDE opens its platform to community developers and third-party extensions.',
    },
  ],
};

// Placeholder image URLs (these would be replaced with actual images)
export const placeholderImages = {
  '/mock/gpt5.jpg':
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
  '/mock/copilot.jpg':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
  '/mock/vercel-edge.jpg':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
  '/mock/llama-31.jpg':
    'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=800&h=600&fit=crop',
  '/mock/supabase-funding.jpg':
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
  '/mock/rust-security.jpg':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
  '/mock/docker-5.jpg':
    'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=600&fit=crop',
  '/mock/gemini-ultra.jpg':
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
  '/mock/sdxl-turbo.jpg':
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop',
  '/mock/vscode-ai-debug.jpg':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
  '/mock/jetbrains-fleet.jpg':
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
};

// TechCrunch-style mock data
export const mockLatestArticles = [
  {
    title:
      "Security flaws in a carmaker's web portal exposed 100,000+ customer records",
    category: 'Security',
    author: 'Sarah Chen',
    date: '2h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    slug: 'carmaker-security-breach',
    snippet:
      "Researchers discovered multiple vulnerabilities in the automotive company's customer portal that could have allowed unauthorized access to personal data.",
  },
  {
    title:
      "Microsoft's new AI model can generate code from natural language descriptions",
    category: 'AI',
    author: 'Alex Rodriguez',
    date: '4h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    slug: 'microsoft-ai-code-generation',
    snippet:
      "The company's latest language model demonstrates impressive capabilities in translating plain English requirements into functional code across multiple programming languages.",
  },
  {
    title:
      'Stripe launches new fraud detection system powered by machine learning',
    category: 'Fintech',
    author: 'Jennifer Kim',
    date: '6h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    slug: 'stripe-fraud-detection-ml',
    snippet:
      "The payment processor's advanced ML system can identify suspicious transactions with 99.5% accuracy while reducing false positives by 40%.",
  },
  {
    title:
      'Google Cloud announces new serverless computing platform for edge deployments',
    category: 'Cloud',
    author: 'David Park',
    date: '8h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
    slug: 'google-cloud-edge-serverless',
    snippet:
      'The new platform enables developers to deploy functions closer to users with sub-10ms latency and automatic scaling capabilities.',
  },
  {
    title: "Tesla's Full Self-Driving beta now uses end-to-end neural networks",
    category: 'Automotive',
    author: 'Maria Gonzalez',
    date: '10h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
    slug: 'tesla-fsd-neural-networks',
    snippet:
      'The electric vehicle maker has completely rewritten its autonomous driving software to use a single neural network for all driving decisions.',
  },
  {
    title:
      'GitHub introduces AI-powered code review assistant for enterprise teams',
    category: 'DevTools',
    author: 'Tom Wilson',
    date: '12h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    slug: 'github-ai-code-review',
    snippet:
      'The new feature automatically reviews pull requests, suggests improvements, and identifies potential security vulnerabilities before code is merged.',
  },
  {
    title: "Meta's new VR headset features 4K per eye and pancake lenses",
    category: 'VR/AR',
    author: 'Lisa Chang',
    date: '14h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=400&h=300&fit=crop',
    slug: 'meta-vr-headset-4k',
    snippet:
      'The next-generation Quest headset promises significantly improved visual clarity and a 30% reduction in weight compared to previous models.',
  },
  {
    title:
      'OpenAI partners with major universities to advance AI safety research',
    category: 'AI',
    author: 'Dr. Robert Lee',
    date: '16h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    slug: 'openai-university-ai-safety',
    snippet:
      'The collaboration will focus on developing new techniques for AI alignment and creating safer, more reliable artificial intelligence systems.',
  },
];

export const mockRightRailItems = [
  {
    title: 'Why every startup should consider remote-first from day one',
    category: 'Startups',
    imageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&h=150&fit=crop',
    slug: 'startup-remote-first',
    timeAgo: '2h ago',
  },
  {
    title: 'The rise of AI-powered development tools',
    category: 'AI',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=150&fit=crop',
    slug: 'ai-development-tools',
    timeAgo: '4h ago',
  },
  {
    title: 'How to build a scalable microservices architecture',
    category: 'DevTools',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=150&fit=crop',
    slug: 'microservices-architecture',
    timeAgo: '6h ago',
  },
  {
    title: 'The future of quantum computing in enterprise',
    category: 'Technology',
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=150&fit=crop',
    slug: 'quantum-computing-enterprise',
    timeAgo: '8h ago',
  },
  {
    title: 'Open source sustainability: funding the future',
    category: 'Open Source',
    imageUrl:
      'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=200&h=150&fit=crop',
    slug: 'open-source-sustainability',
    timeAgo: '10h ago',
  },
];

export const mockStorylinesItems = [
  {
    title: "Apple's M4 chip benchmarks leak ahead of official announcement",
    category: 'Hardware',
    imageUrl:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=150&fit=crop',
    slug: 'apple-m4-chip-benchmarks',
  },
  {
    title: 'Zoom acquires AI transcription startup for $500M',
    category: 'M&A',
    imageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&h=150&fit=crop',
    slug: 'zoom-ai-transcription-acquisition',
  },
  {
    title: 'New JavaScript framework promises 10x faster builds',
    category: 'DevTools',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=150&fit=crop',
    slug: 'javascript-framework-fast-builds',
  },
  {
    title: 'Cybersecurity firm raises $200M Series C round',
    category: 'Funding',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=150&fit=crop',
    slug: 'cybersecurity-series-c-funding',
  },
  {
    title: 'NASA selects SpaceX for Mars sample return mission',
    category: 'Space',
    imageUrl:
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=200&h=150&fit=crop',
    slug: 'spacex-mars-sample-return',
  },
  {
    title: "Google's quantum computer achieves new milestone",
    category: 'Quantum',
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=150&fit=crop',
    slug: 'google-quantum-milestone',
  },
];

export const mockStartupsFeatured = {
  title:
    "Y Combinator's Winter 2025 batch includes record number of AI startups",
  category: 'Startups',
  author: 'Emma Thompson',
  date: '1h ago',
  imageUrl:
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
  slug: 'yc-winter-2025-ai-startups',
  snippet:
    "The accelerator's latest cohort features 127 companies, with 45% focused on artificial intelligence applications across various industries.",
};

export const mockStartupsSide = [
  {
    title: 'Fintech startup Ramp valued at $8.1B in latest funding round',
    category: 'Fintech',
    author: 'Michael Brown',
    date: '3h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
    slug: 'ramp-8b-valuation',
    snippet:
      'The corporate card and expense management company raised $300M in Series D funding.',
  },
  {
    title: 'Healthcare AI startup secures $150M to expand diagnostic tools',
    category: 'HealthTech',
    author: 'Dr. Amanda White',
    date: '5h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    slug: 'healthcare-ai-150m-funding',
    snippet:
      "The company's AI can detect early-stage diseases from medical imaging with 95% accuracy.",
  },
];

export const mockPodcastItems = [
  {
    title: 'The Future of AI with Sam Altman',
    description:
      "OpenAI's CEO discusses the roadmap for artificial general intelligence and the challenges ahead.",
    imageUrl:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop',
    slug: 'sam-altman-future-ai',
    category: 'AI',
  },
  {
    title: 'Building Scalable Startups',
    description:
      'Learn from successful founders about the key strategies for scaling technology companies.',
    imageUrl:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop',
    slug: 'building-scalable-startups',
    category: 'Startups',
  },
  {
    title: 'Open Source Sustainability',
    description:
      'Exploring new models for funding and maintaining critical open source infrastructure.',
    imageUrl:
      'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop',
    slug: 'open-source-sustainability-podcast',
    category: 'Open Source',
  },
  {
    title: 'The Developer Experience Revolution',
    description:
      'How modern tools are transforming the way developers build and deploy applications.',
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop',
    slug: 'developer-experience-revolution',
    category: 'DevTools',
  },
];
// DB-Safe Mode Mock Data (structured for database compatibility)
export const MOCK_FEATURED = {
  id: 'mock-featured-1',
  title: 'OpenAI launches GPT-5 with real-time voice + vision',
  summary: 'Next-gen LLM adds multimodal reasoning, memory, and live assistant capabilities.',
  slug: 'gpt5-rt-voice-vision',
  author: { name: 'SuperBear Reporter', id: 'mock-author-1' },
  date: 'Aug 6, 2025',
  createdAt: new Date('2025-08-06'),
  publishedAt: new Date('2025-08-06'),
  updatedAt: new Date('2025-08-06'),
  category: { name: 'AI', id: 'mock-cat-ai', slug: 'ai' },
  imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
  status: 'PUBLISHED' as const,
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'OpenAI has announced the release of GPT-5, featuring groundbreaking real-time voice and vision capabilities that represent a significant leap forward in AI technology.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'The new model introduces multimodal reasoning, persistent memory, and live assistant capabilities that enable more natural and contextual interactions.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is mock content displayed when running in DB-safe mode. Configure DATABASE_URL to load real articles from your database.',
        },
      ],
    },
  ],
  tags: [
    { name: 'AI', id: 'tag-ai', slug: 'ai' },
    { name: 'OpenAI', id: 'tag-openai', slug: 'openai' },
    { name: 'GPT-5', id: 'tag-gpt5', slug: 'gpt-5' },
  ],
};

export const MOCK_TOP_HEADLINES = [
  {
    title: 'DeepMind unveils AlphaFold 3',
    timeAgo: '4h ago',
    slug: 'alphafold-3',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    title: 'GitHub Copilot adds Team Sync',
    timeAgo: '6h ago',
    slug: 'copilot-team-sync',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    title: 'Anthropic ships Claude 3.5 Turbo',
    timeAgo: '8h ago',
    slug: 'claude-3-5-turbo',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    title: 'Vercel introduces Edge 2.0',
    timeAgo: '12h ago',
    slug: 'vercel-edge-2',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    title: 'Nvidia tops $4T market cap',
    timeAgo: '1d ago',
    slug: 'nvidia-4t',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export const MOCK_LATEST = [
  {
    id: 'mock-latest-1',
    title: 'GitHub Copilot adds team collaboration',
    category: 'DevTools',
    author: 'Jane Doe',
    date: 'Aug 6, 2025',
    slug: 'copilot-collab',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    snippet: 'Real-time pair programming and shared context for teams.',
    tags: ['AI', 'Developer Tools'],
    status: 'PUBLISHED' as const,
    createdAt: new Date('2025-08-06'),
  },
  {
    id: 'mock-latest-2',
    title: 'Vercel releases Edge Runtimes 2.0',
    category: 'Open Source',
    author: 'Alex Kim',
    date: 'Aug 6, 2025',
    slug: 'vercel-edge-2',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
    snippet: 'Faster cold starts and streaming primitives.',
    tags: ['Edge', 'Serverless'],
    status: 'PUBLISHED' as const,
    createdAt: new Date('2025-08-06'),
  },
  {
    id: 'mock-latest-3',
    title: 'Meta licenses Llama 3.1 (400B)',
    category: 'AI',
    author: 'Sam Lee',
    date: 'Aug 5, 2025',
    slug: 'llama-3-1-400b',
    imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400&h=300&fit=crop',
    snippet: 'Bigger pretraining set and strong evals.',
    tags: ['LLM', 'Research'],
    status: 'PUBLISHED' as const,
    createdAt: new Date('2025-08-05'),
  },
];

export const MOCK_ARTICLE = {
  ...MOCK_FEATURED,
  updatedAt: new Date('2025-08-06'),
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is a mock article displayed when running in DB-safe mode.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Configure DATABASE_URL in your .env file to load real articles from your database.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'The site is currently running without database connectivity, using static mock data for demonstration purposes.',
        },
      ],
    },
  ],
};