import { NextRequest } from 'next/server';

// In-memory store for rate limiting
// In production, you would use Redis or a similar distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

// Get client identifier (IP + User ID if available)
function getClientId(request: NextRequest): string {
  // Get IP address
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Get user ID from auth header or cookie if available
  const authHeader = request.headers.get('authorization');
  const userId = authHeader ? authHeader.split(' ')[1] : null;
  
  // Return combined identifier
  return `${ip}${userId ? `-${userId}` : ''}`;
}

// Check if request is rate limited
export function isRateLimited(request: NextRequest): boolean {
  const clientId = getClientId(request);
  const now = Date.now();
  
  const clientData = rateLimitStore.get(clientId);
  
  // If no data or reset time has passed, reset the counter
  if (!clientData || clientData.resetTime <= now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  // If within limit, increment counter
  if (clientData.count < RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(clientId, {
      count: clientData.count + 1,
      resetTime: clientData.resetTime
    });
    return false;
  }
  
  // Rate limited
  return true;
}

// Get rate limit headers
export function getRateLimitHeaders(request: NextRequest): { [key: string]: string } {
  const clientId = getClientId(request);
  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData) {
    return {
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Reset': '0'
    };
  }
  
  return {
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX_REQUESTS - clientData.count).toString(),
    'X-RateLimit-Reset': clientData.resetTime.toString()
  };
}