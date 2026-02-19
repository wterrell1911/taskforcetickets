// Google Business Profile OAuth Token Management

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const GBP_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Get a valid access token, refreshing if necessary
 * Proactively refreshes when token has < 5 minutes remaining
 */
export async function getValidAccessToken(): Promise<string> {
  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;
  const refreshToken = process.env.GBP_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GBP OAuth credentials not configured');
  }

  // Check if cached token is still valid (with 5 minute buffer)
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (tokenCache && tokenCache.expiresAt > now + bufferMs) {
    return tokenCache.accessToken;
  }

  // Refresh the token
  const response = await fetch(GBP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh GBP token: ${error}`);
  }

  const data = await response.json();

  // Cache the new token
  tokenCache = {
    accessToken: data.access_token,
    // tokens typically last 3600 seconds (1 hour)
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
}

/**
 * Clear the token cache (useful for testing or after errors)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}
