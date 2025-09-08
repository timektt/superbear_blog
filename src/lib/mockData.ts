// Mock data for TechCrunch-style homepage

export const mockFeaturedArticle = {
  title:
    "Security flaws in a carmaker's web portal left thousands of cars vulnerable to remote attacks",
  summary:
    'Researchers discovered critical vulnerabilities that could allow attackers to remotely unlock doors, start engines, and track vehicle locations across multiple car manufacturers.',
  category: 'Security',
  author: 'Sarah Chen',
  date: 'Aug 17, 2025',
  imageUrl:
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&h=600&fit=crop&auto=format',
  slug: 'car-security-vulnerabilities',
};

export const mockTopHeadlines = [
  {
    title: 'OpenAI announces GPT-5 with breakthrough reasoning capabilities',
    timeAgo: '2h ago',
    slug: 'openai-gpt5-announcement',
  },
  {
    title: "Meta's new AI model outperforms GPT-4 on coding benchmarks",
    timeAgo: '4h ago',
    slug: 'meta-ai-coding-model',
  },
  {
    title: 'GitHub Copilot Enterprise reaches 1M developers',
    timeAgo: '6h ago',
    slug: 'github-copilot-milestone',
  },
  {
    title: 'Anthropic raises $4B Series C led by Google',
    timeAgo: '8h ago',
    slug: 'anthropic-funding-round',
  },
  {
    title: "Tesla's FSD Beta shows 40% improvement in city driving",
    timeAgo: '12h ago',
    slug: 'tesla-fsd-improvement',
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
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=480&q=80',
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
  summary:
    'Next-gen LLM adds multimodal reasoning, memory, and live assistant capabilities.',
  slug: 'gpt5-rt-voice-vision',
  author: { name: 'SuperBear Reporter', id: 'mock-author-1' },
  date: 'Aug 6, 2025',
  createdAt: new Date('2025-08-06'),
  publishedAt: new Date('2025-08-06'),
  updatedAt: new Date('2025-08-06'),
  category: { name: 'AI', id: 'mock-cat-ai', slug: 'ai' },
  imageUrl:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80',
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
    imageUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=480&q=80',
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
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=480&q=80',
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
    imageUrl:
      'https://images.unsplash.com/photo-1677756119517-756a188d2d94?auto=format&fit=crop&w=480&q=80',
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

// Comprehensive realistic tech news articles for magazine layout
export const mockArticles = [
  {
    id: '1',
    title: 'OpenAI Releases GPT-5: Revolutionary Breakthrough in AI Reasoning',
    excerpt: 'The latest language model demonstrates unprecedented capabilities in complex problem-solving and multi-step reasoning tasks.',
    content: 'OpenAI has unveiled GPT-5, marking a significant leap forward in artificial intelligence capabilities. The new model shows remarkable improvements in mathematical reasoning, code generation, and multi-step problem solving. Early benchmarks indicate a 40% improvement over GPT-4 in complex reasoning tasks, with particular strength in scientific and mathematical domains. The model also introduces new safety features and alignment techniques developed through extensive red-teaming efforts.',
    slug: 'openai-gpt-5-breakthrough',
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    category: { id: '1', name: 'AI', slug: 'ai' },
    author: { id: '1', name: 'Sarah Chen', slug: 'sarah-chen' },
    publishedAt: new Date('2025-01-15T10:00:00Z'),
    readingTime: 8,
    featured: true,
    featureRank: 1,
    tags: ['AI', 'OpenAI', 'GPT-5', 'Machine Learning']
  },
  {
    id: '2',
    title: 'Meta Unveils Next-Gen VR Headset with Neural Interface',
    excerpt: 'The new device promises to revolutionize virtual reality with direct brain-computer interaction capabilities.',
    content: 'Meta has announced its most ambitious VR project yet, introducing the Quest Pro 3 with experimental neural interface technology. The headset features 4K per eye displays, pancake lenses for reduced weight, and a breakthrough brain-computer interface that can detect basic intentions and emotions. The neural interface uses non-invasive sensors to read electrical activity from the scalp, enabling hands-free navigation and enhanced immersion. Meta plans to begin developer previews in Q3 2025.',
    slug: 'meta-neural-vr-headset',
    coverUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800',
    category: { id: '2', name: 'Hardware', slug: 'hardware' },
    author: { id: '2', name: 'Alex Rodriguez', slug: 'alex-rodriguez' },
    publishedAt: new Date('2025-01-14T14:30:00Z'),
    readingTime: 6,
    featured: true,
    featureRank: 2,
    tags: ['VR', 'Meta', 'Neural Interface', 'Hardware']
  },
  {
    id: '3',
    title: 'GitHub Copilot Enterprise Reaches 1 Million Developers',
    excerpt: 'Microsoft\'s AI coding assistant achieves major milestone as enterprise adoption accelerates across Fortune 500 companies.',
    content: 'GitHub Copilot Enterprise has officially reached 1 million active developers, representing a 300% growth in enterprise adoption over the past year. The AI-powered coding assistant now supports over 50 programming languages and has generated more than 10 billion lines of code. New features include team-specific model training, advanced security scanning, and integration with popular IDEs. Microsoft reports that developers using Copilot complete tasks 55% faster on average.',
    slug: 'github-copilot-million-developers',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '3', name: 'Michael Zhang', slug: 'michael-zhang' },
    publishedAt: new Date('2025-01-13T16:45:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['GitHub', 'AI', 'Developer Tools', 'Microsoft']
  },
  {
    id: '4',
    title: 'Anthropic Raises $4B Series C Led by Google',
    excerpt: 'The AI safety company secures massive funding round to compete with OpenAI and develop next-generation Claude models.',
    content: 'Anthropic has closed a $4 billion Series C funding round led by Google, with participation from Spark Capital and existing investors. The funding will accelerate development of Claude 4, which promises significant improvements in reasoning, safety, and multimodal capabilities. Anthropic plans to expand its constitutional AI research and build larger compute infrastructure. The company has also announced partnerships with major enterprises for AI safety consulting and custom model development.',
    slug: 'anthropic-4b-funding-google',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    category: { id: '4', name: 'Startups', slug: 'startups' },
    author: { id: '4', name: 'Jennifer Park', slug: 'jennifer-park' },
    publishedAt: new Date('2025-01-12T11:20:00Z'),
    readingTime: 7,
    featured: false,
    featureRank: null,
    tags: ['Anthropic', 'Funding', 'Google', 'AI Safety']
  },
  {
    id: '5',
    title: 'Tesla FSD Beta Shows 40% Improvement in City Driving',
    excerpt: 'Latest neural network architecture delivers significant advances in autonomous driving performance and safety metrics.',
    content: 'Tesla\'s Full Self-Driving Beta v12.3 demonstrates a 40% improvement in city driving scenarios compared to previous versions. The update introduces an end-to-end neural network architecture that processes camera inputs directly into driving decisions, eliminating hand-coded rules. Tesla reports a 60% reduction in disengagements and improved handling of complex intersections, construction zones, and pedestrian interactions. The company plans to expand the beta to 500,000 additional drivers this quarter.',
    slug: 'tesla-fsd-40-percent-improvement',
    coverUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
    category: { id: '5', name: 'Automotive', slug: 'automotive' },
    author: { id: '5', name: 'David Kim', slug: 'david-kim' },
    publishedAt: new Date('2025-01-11T09:15:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Tesla', 'Autonomous Driving', 'Neural Networks', 'FSD']
  },
  {
    id: '6',
    title: 'Vercel Announces Edge Runtime 2.0 with WebAssembly Support',
    excerpt: 'Next.js creator introduces major runtime upgrade with WASM support and 50% faster cold starts for serverless functions.',
    content: 'Vercel has launched Edge Runtime 2.0, featuring native WebAssembly support and significant performance improvements. The new runtime delivers 50% faster cold starts and enables developers to run WASM modules at the edge with near-native performance. Key features include streaming responses, enhanced security isolation, and support for popular WASM languages like Rust and Go. The update also introduces automatic function optimization and intelligent caching strategies.',
    slug: 'vercel-edge-runtime-2-wasm',
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '6', name: 'Lisa Wang', slug: 'lisa-wang' },
    publishedAt: new Date('2025-01-10T14:30:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Vercel', 'WebAssembly', 'Edge Computing', 'Serverless']
  },
  {
    id: '7',
    title: 'Supabase Raises $80M Series B for Open-Source Firebase Alternative',
    excerpt: 'PostgreSQL-based platform continues rapid growth as developers seek alternatives to Google\'s Firebase.',
    content: 'Supabase has secured $80 million in Series B funding led by Felicis Ventures, bringing total funding to $116 million. The open-source Firebase alternative has grown to over 1 million developers and 100,000 projects. New funding will accelerate development of real-time features, edge functions, and enterprise security capabilities. Supabase plans to expand its global edge network and introduce advanced analytics and monitoring tools for production applications.',
    slug: 'supabase-80m-series-b-funding',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    category: { id: '4', name: 'Startups', slug: 'startups' },
    author: { id: '7', name: 'Tom Rodriguez', slug: 'tom-rodriguez' },
    publishedAt: new Date('2025-01-09T13:45:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Supabase', 'Open Source', 'PostgreSQL', 'Firebase Alternative']
  },
  {
    id: '8',
    title: 'Rust Foundation Launches Security Audit Program',
    excerpt: 'New initiative provides free security audits for critical Rust crates in the ecosystem.',
    content: 'The Rust Foundation has announced a comprehensive security audit program for critical crates in the Rust ecosystem. The initiative will provide free security audits for the top 100 most-downloaded crates, focusing on memory safety, cryptographic implementations, and supply chain security. Trail of Bits and other security firms will conduct the audits, with results published publicly. The program aims to strengthen the overall security posture of the Rust ecosystem and establish best practices for crate maintainers.',
    slug: 'rust-foundation-security-audit-program',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: { id: '6', name: 'Open Source', slug: 'open-source' },
    author: { id: '8', name: 'Alex Kim', slug: 'alex-kim' },
    publishedAt: new Date('2025-01-08T12:00:00Z'),
    readingTime: 4,
    featured: false,
    featureRank: null,
    tags: ['Rust', 'Security', 'Open Source', 'Auditing']
  },
  {
    id: '9',
    title: 'Docker Desktop 5.0 Brings Multi-Architecture Builds',
    excerpt: 'Native support for ARM64 and x86 builds simplifies cross-platform development workflows.',
    content: 'Docker has released Desktop 5.0 with comprehensive multi-architecture build support, enabling developers to create ARM64 and x86 images simultaneously. The update includes improved BuildKit integration, faster layer caching, and streamlined CI/CD workflows. New features include automatic architecture detection, cross-compilation tools, and enhanced container registry integration. Docker reports 70% faster build times for multi-platform images.',
    slug: 'docker-desktop-5-multi-arch',
    coverUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '9', name: 'Chris Taylor', slug: 'chris-taylor' },
    publishedAt: new Date('2025-01-07T15:20:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Docker', 'Containers', 'Multi-Architecture', 'DevOps']
  },
  {
    id: '10',
    title: 'Google\'s Gemini Ultra Beats GPT-4 in Reasoning Benchmarks',
    excerpt: 'New evaluation shows significant improvements in mathematical and logical reasoning tasks.',
    content: 'Google\'s Gemini Ultra has achieved state-of-the-art performance on multiple reasoning benchmarks, surpassing GPT-4 in mathematical problem-solving and logical inference tasks. The model demonstrates particular strength in multi-step reasoning, achieving 94.8% accuracy on the MATH benchmark and 90.0% on MMLU. Google attributes the improvements to enhanced training techniques and a larger, more diverse dataset. The model will be available through Google Cloud AI Platform starting next month.',
    slug: 'google-gemini-ultra-reasoning-benchmarks',
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    category: { id: '1', name: 'AI', slug: 'ai' },
    author: { id: '10', name: 'Dr. Emily Zhang', slug: 'emily-zhang' },
    publishedAt: new Date('2025-01-06T11:30:00Z'),
    readingTime: 7,
    featured: false,
    featureRank: null,
    tags: ['Google', 'Gemini', 'AI Benchmarks', 'Reasoning']
  },
  {
    id: '11',
    title: 'Stability AI Releases SDXL Turbo for Real-Time Image Generation',
    excerpt: 'One-step diffusion model generates high-quality images in under 100ms on consumer hardware.',
    content: 'Stability AI has launched SDXL Turbo, a breakthrough diffusion model that generates high-quality images in a single inference step. The model achieves sub-100ms generation times on RTX 4090 GPUs while maintaining image quality comparable to multi-step models. Key innovations include adversarial training techniques and distillation from the full SDXL model. The release includes optimized implementations for mobile devices and edge deployment scenarios.',
    slug: 'stability-ai-sdxl-turbo-real-time',
    coverUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
    category: { id: '1', name: 'AI', slug: 'ai' },
    author: { id: '11', name: 'Mark Stevens', slug: 'mark-stevens' },
    publishedAt: new Date('2025-01-05T16:45:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Stability AI', 'Image Generation', 'Diffusion Models', 'Real-Time']
  },
  {
    id: '12',
    title: 'VS Code 2025 Introduces AI-Powered Debugging Assistant',
    excerpt: 'Integrated AI helps developers identify and fix bugs with contextual suggestions and explanations.',
    content: 'Microsoft has unveiled VS Code 2025 with an integrated AI debugging assistant that can analyze code execution, identify potential issues, and suggest fixes in real-time. The assistant uses advanced static analysis and runtime monitoring to provide contextual debugging help. Features include automatic breakpoint suggestions, variable inspection insights, and intelligent error explanations. The AI assistant supports over 30 programming languages and integrates with popular debugging frameworks.',
    slug: 'vscode-2025-ai-debugging-assistant',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '12', name: 'Rachel Green', slug: 'rachel-green' },
    publishedAt: new Date('2025-01-04T14:15:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['VS Code', 'AI', 'Debugging', 'Microsoft']
  },
  {
    id: '13',
    title: 'JetBrains Fleet Goes Open Source with Plugin Ecosystem',
    excerpt: 'The next-generation IDE opens its platform to community developers and third-party extensions.',
    content: 'JetBrains has announced that Fleet, its next-generation IDE, will transition to an open-source model with a comprehensive plugin ecosystem. The move enables community developers to create extensions and contribute to the core platform. Fleet features a distributed architecture, collaborative editing capabilities, and support for multiple programming languages. The open-source release includes the complete IDE framework, plugin APIs, and development tools.',
    slug: 'jetbrains-fleet-open-source-plugins',
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '13', name: 'David Park', slug: 'david-park' },
    publishedAt: new Date('2025-01-03T10:30:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['JetBrains', 'Fleet', 'Open Source', 'IDE']
  },
  {
    id: '14',
    title: 'Nvidia Announces H200 GPU with 141GB HBM3e Memory',
    excerpt: 'Next-generation AI accelerator delivers 4.8x memory bandwidth improvement for large language model training.',
    content: 'Nvidia has unveiled the H200 Tensor Core GPU, featuring 141GB of HBM3e memory and unprecedented bandwidth for AI workloads. The new architecture delivers 4.8x memory bandwidth improvement over the H100, enabling training of larger language models and more complex AI applications. Key features include enhanced Transformer Engine, improved sparsity support, and optimized inference capabilities. Major cloud providers have already committed to deploying H200-based instances.',
    slug: 'nvidia-h200-gpu-141gb-memory',
    coverUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',
    category: { id: '2', name: 'Hardware', slug: 'hardware' },
    author: { id: '14', name: 'James Wilson', slug: 'james-wilson' },
    publishedAt: new Date('2025-01-02T13:45:00Z'),
    readingTime: 7,
    featured: false,
    featureRank: null,
    tags: ['Nvidia', 'GPU', 'AI Hardware', 'HBM3e']
  },
  {
    id: '15',
    title: 'Cloudflare Workers AI Supports Custom Model Deployment',
    excerpt: 'Edge computing platform enables developers to deploy and run custom AI models at global scale.',
    content: 'Cloudflare has expanded Workers AI to support custom model deployment, allowing developers to run proprietary AI models at the edge across 300+ global locations. The platform supports popular frameworks including PyTorch, TensorFlow, and ONNX, with automatic scaling and sub-50ms inference latency. New features include model versioning, A/B testing capabilities, and integrated monitoring. The service aims to democratize AI deployment for developers without extensive infrastructure expertise.',
    slug: 'cloudflare-workers-ai-custom-models',
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    category: { id: '7', name: 'Cloud', slug: 'cloud' },
    author: { id: '15', name: 'Sophie Martinez', slug: 'sophie-martinez' },
    publishedAt: new Date('2025-01-01T09:00:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Cloudflare', 'Edge Computing', 'AI Deployment', 'Workers']
  },
  {
    id: '16',
    title: 'Apple Silicon M4 Pro Benchmarks Leak Ahead of Launch',
    excerpt: 'Upcoming chip shows 35% performance improvement over M3 Pro in multi-core workloads.',
    content: 'Leaked benchmarks reveal that Apple\'s upcoming M4 Pro chip delivers significant performance improvements over its predecessor. Geekbench scores show a 35% increase in multi-core performance and 28% improvement in single-core tasks. The chip features enhanced GPU capabilities with hardware-accelerated ray tracing and improved neural engine performance. Apple is expected to announce the M4 Pro in new MacBook Pro models later this quarter.',
    slug: 'apple-m4-pro-benchmarks-leak',
    coverUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
    category: { id: '2', name: 'Hardware', slug: 'hardware' },
    author: { id: '16', name: 'Kevin Chang', slug: 'kevin-chang' },
    publishedAt: new Date('2024-12-31T18:30:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Apple', 'M4 Pro', 'Benchmarks', 'Silicon']
  },
  {
    id: '17',
    title: 'Zoom Acquires AI Transcription Startup for $500M',
    excerpt: 'Video conferencing giant expands AI capabilities with real-time transcription and meeting intelligence.',
    content: 'Zoom has acquired Otter.ai for $500 million, significantly expanding its AI-powered meeting capabilities. The acquisition brings advanced real-time transcription, meeting summaries, and action item extraction to Zoom\'s platform. Otter.ai\'s technology supports over 30 languages and can identify individual speakers with 95% accuracy. The integration will be available to Zoom customers starting in Q2 2025, with enhanced features for enterprise accounts.',
    slug: 'zoom-acquires-otter-ai-500m',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    category: { id: '8', name: 'M&A', slug: 'mergers-acquisitions' },
    author: { id: '17', name: 'Maria Rodriguez', slug: 'maria-rodriguez' },
    publishedAt: new Date('2024-12-30T14:20:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Zoom', 'Acquisition', 'AI Transcription', 'Otter.ai']
  },
  {
    id: '18',
    title: 'New JavaScript Framework Promises 10x Faster Builds',
    excerpt: 'Turbopack-powered framework delivers unprecedented build performance for modern web applications.',
    content: 'A new JavaScript framework called "Velocity" has emerged, promising 10x faster build times compared to traditional bundlers. Built on Turbopack and written in Rust, Velocity features incremental compilation, intelligent caching, and parallel processing. Early adopters report build times reduced from minutes to seconds for large applications. The framework supports React, Vue, and Svelte out of the box, with TypeScript integration and hot module replacement.',
    slug: 'velocity-javascript-framework-10x-faster',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '18', name: 'Tyler Johnson', slug: 'tyler-johnson' },
    publishedAt: new Date('2024-12-29T11:45:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['JavaScript', 'Build Tools', 'Turbopack', 'Performance']
  }
];01-08T10:20:00Z'),
    readingTime: 4,
    featured: false,
    featureRank: null,
    tags: ['Rust', 'Security', 'Open Source', 'Audits']
  },
  {
    id: '9',
    title: 'Docker Desktop 5.0 Brings Multi-Architecture Builds',
    excerpt: 'Native support for ARM64 and x86 builds simplifies cross-platform development workflows.',
    content: 'Docker has released Desktop 5.0 with native multi-architecture build support, enabling seamless development across ARM64 and x86 platforms. The update includes improved build performance, enhanced container insights, and streamlined deployment workflows. New features include automatic architecture detection, optimized layer caching, and integrated security scanning. Docker reports 30% faster build times and reduced resource consumption compared to previous versions.',
    slug: 'docker-desktop-5-multi-architecture',
    coverUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '9', name: 'Chris Taylor', slug: 'chris-taylor' },
    publishedAt: new Date('2025-01-07T15:10:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Docker', 'Containers', 'Multi-Architecture', 'ARM64']
  },
  {
    id: '10',
    title: 'Google\'s Gemini Ultra Beats GPT-4 in Reasoning Benchmarks',
    excerpt: 'New evaluation shows significant improvements in mathematical and logical reasoning tasks.',
    content: 'Google\'s Gemini Ultra has achieved state-of-the-art performance on multiple reasoning benchmarks, surpassing GPT-4 in mathematical problem-solving and logical reasoning tasks. The model demonstrates particular strength in multi-step reasoning, achieving 94.8% accuracy on the MATH benchmark and 90.0% on MMLU. Google attributes the improvements to enhanced training techniques, larger model scale, and improved alignment methods. The model will be available through Google Cloud AI Platform starting next month.',
    slug: 'google-gemini-ultra-beats-gpt4',
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    category: { id: '1', name: 'AI', slug: 'ai' },
    author: { id: '10', name: 'Dr. Emily Zhang', slug: 'emily-zhang' },
    publishedAt: new Date('2025-01-06T12:30:00Z'),
    readingTime: 7,
    featured: false,
    featureRank: null,
    tags: ['Google', 'Gemini', 'AI Benchmarks', 'Reasoning']
  },
  {
    id: '11',
    title: 'Stability AI Releases SDXL Turbo for Real-Time Image Generation',
    excerpt: 'One-step diffusion model generates high-quality images in under 100ms on consumer hardware.',
    content: 'Stability AI has released SDXL Turbo, a breakthrough diffusion model capable of generating high-quality images in a single inference step. The model produces 512x512 images in under 100ms on consumer GPUs, enabling real-time image generation applications. SDXL Turbo uses adversarial training and distillation techniques to achieve this speed while maintaining image quality. The model is available under a research license with commercial licensing planned for Q2 2025.',
    slug: 'stability-ai-sdxl-turbo-realtime',
    coverUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800',
    category: { id: '1', name: 'AI', slug: 'ai' },
    author: { id: '11', name: 'Mark Stevens', slug: 'mark-stevens' },
    publishedAt: new Date('2025-01-05T16:20:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Stability AI', 'Image Generation', 'Diffusion Models', 'Real-time']
  },
  {
    id: '12',
    title: 'VS Code 2025 Introduces AI-Powered Debugging Assistant',
    excerpt: 'Integrated AI helps developers identify and fix bugs with contextual suggestions and explanations.',
    content: 'Microsoft has unveiled VS Code 2025 with an integrated AI-powered debugging assistant that can automatically identify, explain, and suggest fixes for common programming errors. The assistant uses advanced code analysis and machine learning to provide contextual debugging help, reducing average debugging time by 35%. New features include intelligent breakpoint suggestions, automated test generation, and natural language error explanations. The update also includes improved IntelliSense and enhanced Git integration.',
    slug: 'vscode-2025-ai-debugging-assistant',
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '12', name: 'Rachel Green', slug: 'rachel-green' },
    publishedAt: new Date('2025-01-04T11:45:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['VS Code', 'AI', 'Debugging', 'Microsoft']
  },
  {
    id: '13',
    title: 'JetBrains Fleet Goes Open Source with Plugin Ecosystem',
    excerpt: 'Next-generation IDE opens its platform to community developers and third-party extensions.',
    content: 'JetBrains has announced that Fleet, its next-generation IDE, will transition to an open-source model with a comprehensive plugin ecosystem. The move enables community developers to create extensions and contribute to the IDE\'s development. Fleet features a distributed architecture, collaborative editing, and smart code completion powered by machine learning. The open-source version will include core IDE functionality, while JetBrains will offer premium features through a subscription model.',
    slug: 'jetbrains-fleet-open-source-plugins',
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    category: { id: '3', name: 'DevTools', slug: 'devtools' },
    author: { id: '13', name: 'David Park', slug: 'david-park' },
    publishedAt: new Date('2025-01-03T14:15:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['JetBrains', 'Fleet', 'Open Source', 'IDE']
  },
  {
    id: '14',
    title: 'Nvidia Announces H200 GPU with 141GB HBM3e Memory',
    excerpt: 'Next-generation AI chip delivers 2.4x memory bandwidth improvement for large language model training.',
    content: 'Nvidia has unveiled the H200 Tensor Core GPU, featuring 141GB of HBM3e memory and 4.8TB/s of memory bandwidth. The new chip is specifically designed for training and inference of large language models, offering 2.4x the memory bandwidth of the H100. Early benchmarks show 60-90% performance improvements for LLM inference workloads. Major cloud providers including AWS, Google Cloud, and Microsoft Azure have committed to deploying H200 instances in 2025.',
    slug: 'nvidia-h200-gpu-141gb-memory',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    category: { id: '2', name: 'Hardware', slug: 'hardware' },
    author: { id: '14', name: 'James Liu', slug: 'james-liu' },
    publishedAt: new Date('2025-01-02T09:30:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Nvidia', 'GPU', 'AI Hardware', 'HBM3e']
  },
  {
    id: '15',
    title: 'Stripe Launches Advanced Fraud Detection with ML',
    excerpt: 'Payment processor\'s new ML system achieves 99.5% accuracy while reducing false positives by 40%.',
    content: 'Stripe has launched Radar 3.0, an advanced fraud detection system powered by machine learning that can identify suspicious transactions with 99.5% accuracy. The system analyzes over 500 signals in real-time, including device fingerprinting, behavioral patterns, and network analysis. Stripe reports a 40% reduction in false positives and 25% improvement in fraud detection compared to previous versions. The system processes over 100 million transactions daily and adapts to new fraud patterns automatically.',
    slug: 'stripe-radar-3-ml-fraud-detection',
    coverUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    category: { id: '7', name: 'Fintech', slug: 'fintech' },
    author: { id: '15', name: 'Jennifer Kim', slug: 'jennifer-kim' },
    publishedAt: new Date('2025-01-01T13:00:00Z'),
    readingTime: 5,
    featured: false,
    featureRank: null,
    tags: ['Stripe', 'Fraud Detection', 'Machine Learning', 'Payments']
  },
  {
    id: '16',
    title: 'Y Combinator Winter 2025 Batch: 45% AI Startups',
    excerpt: 'Record number of artificial intelligence companies join the accelerator\'s latest cohort of 127 startups.',
    content: 'Y Combinator\'s Winter 2025 batch includes a record 57 AI-focused startups out of 127 total companies, representing 45% of the cohort. The AI startups span various sectors including healthcare, education, developer tools, and enterprise software. Notable companies include an AI-powered code review platform, a medical diagnosis assistant, and an automated customer service solution. YC partners note increasing sophistication in AI startup applications and stronger technical teams compared to previous batches.',
    slug: 'yc-winter-2025-ai-startups-record',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    category: { id: '4', name: 'Startups', slug: 'startups' },
    author: { id: '16', name: 'Emma Thompson', slug: 'emma-thompson' },
    publishedAt: new Date('2024-12-31T10:45:00Z'),
    readingTime: 6,
    featured: false,
    featureRank: null,
    tags: ['Y Combinator', 'Startups', 'AI', 'Accelerator']
  },
  {
    id: '17',
    title: 'Apple M4 Chip Benchmarks Leak Ahead of Announcement',
    excerpt: 'Early performance tests show 35% CPU improvement and 40% GPU gains over M3 generation.',
    content: 'Leaked benchmarks of Apple\'s upcoming M4 chip reveal significant performance improvements over the M3 generation. Geekbench scores show 35% single-core and 42% multi-core CPU performance gains, while GPU benchmarks indicate 40% improvement in graphics performance. The M4 is built on TSMC\'s enhanced 3nm process and features improved neural engine capabilities for AI workloads. Apple is expected to announce the M4 MacBook Pro and iMac models at its spring event.',
    slug: 'apple-m4-chip-benchmarks-leak',
    coverUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
    category: { id: '2', name: 'Hardware', slug: 'hardware' },
    author: { id: '17', name: 'Kevin Chang', slug: 'kevin-chang' },
    publishedAt: new Date('2024-12-30T16:20:00Z'),
    readingTime: 4,
    featured: false,
    featureRank: null,
    tags: ['Apple', 'M4 Chip', 'Benchmarks', 'Performance']
  }
];
