// frontend/src/app/api/papers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/papers/search?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    // Handle non-JSON responses or server errors
    if (!response.ok) {
      try {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return NextResponse.json(
          { error: `Backend server error (${response.status})` },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Paper API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}