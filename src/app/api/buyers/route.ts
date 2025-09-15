import { createNewBuyer, getBuyersWithPagination } from '@/lib/buyer-service';
import { createClient } from '@/lib/supabase/server';
import { isRateLimited, getRateLimitHeaders } from '@/lib/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/buyers - Create a new buyer
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            ...getRateLimitHeaders(request),
            'Retry-After': '60'
          }
        }
      );
    }
    
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Create the buyer with the current user as the owner
    const buyer = await createNewBuyer({
      ...body,
      ownerId: user.id,
    });
    
    const rateLimitHeaders = getRateLimitHeaders(request);
    
    return NextResponse.json(buyer, { 
      status: 201,
      headers: rateLimitHeaders
    });
  } catch (error: unknown) {
    console.error('Error creating buyer:', error);
    
    // Handle validation errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create buyer' },
      { status: 500 }
    );
  }
}

// GET /api/buyers - Get all buyers with filtering and pagination
export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build filters object
    const filters: {
      searchTerm?: string;
      city?: string;
      propertyType?: string;
      status?: string;
      timeline?: string;
    } = {};
    if (searchParams.get('searchTerm')) {
      filters.searchTerm = searchParams.get('searchTerm') || undefined;
    }
    if (searchParams.get('city') && searchParams.get('city') !== 'all') {
      filters.city = searchParams.get('city') || undefined;
    }
    if (searchParams.get('propertyType') && searchParams.get('propertyType') !== 'all') {
      filters.propertyType = searchParams.get('propertyType') || undefined;
    }
    if (searchParams.get('status') && searchParams.get('status') !== 'all') {
      filters.status = searchParams.get('status') || undefined;
    }
    if (searchParams.get('timeline') && searchParams.get('timeline') !== 'all') {
      filters.timeline = searchParams.get('timeline') || undefined;
    }
    
    // Get buyers with pagination
    const result = await getBuyersWithPagination(page, limit, filters);
    
    return NextResponse.json({
      buyers: result.buyers,
      totalCount: result.totalCount
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching buyers:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch buyers' },
      { status: 500 }
    );
  }
}