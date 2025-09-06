import React from 'react';
import Container, { Grid, Flex, Section, TouchTarget } from '@/components/ui/Container';

/**
 * Demo component to showcase the responsive grid system
 * This demonstrates all the features implemented for task 12
 */
export default function ResponsiveGridDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <Section padding="lg" background="accent">
        <Container size="xl" padding="md">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Responsive Grid System Demo
            </h1>
            <p className="text-xl md:text-2xl text-gray-600">
              Showcasing the magazine layout's responsive container system
            </p>
          </div>
        </Container>
      </Section>

      {/* Container Sizes Demo */}
      <Section padding="md">
        <Container size="xl" padding="md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Container Sizes</h2>
          
          <div className="space-y-6">
            <Container size="sm" padding="md" className="bg-blue-100 py-4 rounded">
              <p className="text-center">Small Container (max-w-3xl)</p>
            </Container>
            
            <Container size="md" padding="md" className="bg-green-100 py-4 rounded">
              <p className="text-center">Medium Container (max-w-5xl)</p>
            </Container>
            
            <Container size="lg" padding="md" className="bg-yellow-100 py-4 rounded">
              <p className="text-center">Large Container (max-w-6xl)</p>
            </Container>
            
            <Container size="xl" padding="md" className="bg-red-100 py-4 rounded">
              <p className="text-center">Extra Large Container (max-w-7xl)</p>
            </Container>
          </div>
        </Container>
      </Section>

      {/* Grid System Demo */}
      <Section padding="md" background="muted">
        <Container size="xl" padding="md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Responsive Grid System</h2>
          
          {/* 2-column grid on mobile, 3 on tablet, 4 on desktop */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Category Exploration Grid (2→3→4 columns)</h3>
            <Grid cols={{ default: 2, md: 3, lg: 4 }} gap="md">
              {Array.from({ length: 8 }).map((_, i) => (
                <TouchTarget key={i} size="lg" className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <h4 className="font-semibold">Category {i + 1}</h4>
                    <p className="text-sm text-gray-600">{Math.floor(Math.random() * 50)} articles</p>
                  </div>
                </TouchTarget>
              ))}
            </Grid>
          </div>

          {/* 1-column mobile, 2-column desktop */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Article Grid (1→2 columns)</h3>
            <Grid cols={{ default: 1, md: 2 }} gap="lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="aspect-[16/9] bg-gray-200 rounded mb-4"></div>
                  <h4 className="font-semibold mb-2">Article Title {i + 1}</h4>
                  <p className="text-gray-600 text-sm">This is a sample article excerpt that demonstrates the responsive grid system...</p>
                </div>
              ))}
            </Grid>
          </div>
        </Container>
      </Section>

      {/* Flex System Demo */}
      <Section padding="md">
        <Container size="xl" padding="md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Responsive Flex System</h2>
          
          {/* Hero Mosaic Layout Demo */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Hero Mosaic Layout (Column→Row)</h3>
            <Flex
              direction={{ default: 'col', md: 'row' }}
              gap="lg"
              align="start"
              className="bg-gray-100 p-6 rounded-lg"
            >
              <div className="w-full md:w-2/5 bg-red-500 text-white p-6 rounded">
                <h4 className="font-bold mb-2">Newsletter Panel</h4>
                <p>40% width on desktop, full width on mobile</p>
              </div>
              <div className="w-full md:w-3/5 bg-blue-500 text-white p-6 rounded">
                <h4 className="font-bold mb-2">Featured Articles</h4>
                <p>60% width on desktop, full width on mobile</p>
              </div>
            </Flex>
          </div>

          {/* Navigation Layout */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Navigation Layout</h3>
            <Flex justify="between" align="center" className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="font-bold">Logo</div>
              <Flex gap="md" align="center">
                <TouchTarget size="md">
                  <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                    Home
                  </button>
                </TouchTarget>
                <TouchTarget size="md">
                  <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                    About
                  </button>
                </TouchTarget>
                <TouchTarget size="md">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    Contact
                  </button>
                </TouchTarget>
              </Flex>
            </Flex>
          </div>
        </Container>
      </Section>

      {/* Touch Target Demo */}
      <Section padding="md" background="muted">
        <Container size="xl" padding="md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Touch Target System</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Touch Target Sizes</h3>
              <Flex gap="md" align="center" wrap>
                <TouchTarget size="sm" className="bg-yellow-200 rounded">
                  <span className="text-sm">Small (40px)</span>
                </TouchTarget>
                <TouchTarget size="md" className="bg-green-200 rounded">
                  <span className="text-sm">Medium (44px)</span>
                </TouchTarget>
                <TouchTarget size="lg" className="bg-blue-200 rounded">
                  <span className="text-sm">Large (48px)</span>
                </TouchTarget>
              </Flex>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Interactive Elements</h3>
              <Flex gap="md" wrap>
                <TouchTarget size="md">
                  <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Primary Button
                  </button>
                </TouchTarget>
                <TouchTarget size="md">
                  <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Secondary Button
                  </button>
                </TouchTarget>
                <TouchTarget size="md">
                  <a href="#" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors inline-block">
                    Link Button
                  </a>
                </TouchTarget>
              </Flex>
            </div>
          </div>
        </Container>
      </Section>

      {/* Responsive Breakpoints Info */}
      <Section padding="md">
        <Container size="xl" padding="md">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Responsive Breakpoints</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 mb-2">Mobile</div>
                <div className="text-sm text-gray-600">
                  <div>&lt; 640px</div>
                  <div>Single column</div>
                  <div>Stacked layout</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-2">Tablet</div>
                <div className="text-sm text-gray-600">
                  <div>≥ 768px</div>
                  <div>2-3 columns</div>
                  <div>Side-by-side</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500 mb-2">Desktop</div>
                <div className="text-sm text-gray-600">
                  <div>≥ 1024px</div>
                  <div>3-4 columns</div>
                  <div>Full layout</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">Wide</div>
                <div className="text-sm text-gray-600">
                  <div>≥ 1280px</div>
                  <div>4+ columns</div>
                  <div>Max width</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <Section padding="md" background="accent">
        <Container size="xl" padding="md">
          <div className="text-center text-gray-600">
            <p>Responsive Grid System Demo - Magazine Layout Implementation</p>
          </div>
        </Container>
      </Section>
    </div>
  );
}