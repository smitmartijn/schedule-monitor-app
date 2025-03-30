import { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  const path = getRequestURL(event).pathname;

  // Skip auth for non-API routes
  if (!path.startsWith('/api/')) {
    return;
  }

  // Skip auth for the status endpoint if it's a GET request (public)
  if (path === '/api/status' && event.method === 'GET') {
    return;
  }

  const config = useRuntimeConfig();
  const authHeader = getRequestHeader(event, 'Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }

  const token = authHeader.substring(7);

  if (token !== config.apiSecret) {
    return createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid API token'
    });
  }
});