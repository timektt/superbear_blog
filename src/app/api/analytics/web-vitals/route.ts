import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';
    
    const data = await request.json();
    
    // Validate Web Vitals data
    const validMetrics = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'];
    if (!data.name || !validMetrics.includes(data.name)) {
      return NextResponse.json(
        { error: 'Invalid Web Vitals metric name' },
        { status: 400 }
      );
    }

    if (typeof data.value !== 'number' || data.value < 0) {
      return NextResponse.json(
        { error: 'Invalid Web Vitals metric value' },
        { status: 400 }
      );
    }

    const validRatings = ['good', 'needs-improvement', 'poor'];
    if (!data.rating || !validRatings.includes(data.rating)) {
      return NextResponse.json(
        { error: 'Invalid Web Vitals rating' },
        { status: 400 }
      );
    }

    // Log Web Vitals data
    console.log('📈 Web Vitals Metric:', {
      name: data.name,
      value: data.value,
      rating: data.rating,
      id: data.id,
      navigationType: data.navigationType,
      url: data.url || referer,
      userAgent: userAgent.substring(0, 100),
      timestamp: data.timestamp || Date.now(),
    });

    // In a real application, store in database
    /*
    await prisma.webVitalMetric.create({
      data: {
        name: data.name,
        value: data.value,
        rating: data.rating,
        metricId: data.id,
        navigationType: data.navigationType,
        url: data.url || referer,
        userAgent,
        timestamp: new Date(data.timestamp || Date.now()),
      },
    });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Web Vitals metric:', error);
    return NextResponse.json(
      { error: 'Failed to process Web Vitals metric' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return Web Vitals analytics summary
  return NextResponse.json({
    message: 'Web Vitals analytics endpoint',
    supportedMetrics: ['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'],
    thresholds: {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    },
  });
}