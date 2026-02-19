// Google Business Profile Post Management

import { getValidAccessToken } from './auth';

const GBP_API_BASE = 'https://mybusiness.googleapis.com/v4';

interface CallToAction {
  actionType: 'BOOK' | 'ORDER' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
  url?: string;
}

interface GBPPost {
  languageCode: string;
  summary: string;
  callToAction?: CallToAction;
  topicType: 'STANDARD';
}

interface GBPPostResponse {
  name: string;
  languageCode: string;
  summary: string;
  state: 'LIVE' | 'PROCESSING' | 'REJECTED';
  createTime: string;
  updateTime: string;
  callToAction?: CallToAction;
}

/**
 * Create a new Google Business Profile post
 */
export async function createGBPPost(
  content: string,
  callToAction?: CallToAction
): Promise<GBPPostResponse> {
  const accountId = process.env.GBP_ACCOUNT_ID;
  const locationId = process.env.GBP_LOCATION_ID;

  if (!accountId || !locationId) {
    throw new Error('GBP_ACCOUNT_ID and GBP_LOCATION_ID must be configured');
  }

  const accessToken = await getValidAccessToken();

  const post: GBPPost = {
    languageCode: 'en-US',
    summary: content,
    topicType: 'STANDARD',
    callToAction: callToAction || {
      actionType: 'LEARN_MORE',
      url: 'https://www.taskforcetickets.com/intake',
    },
  };

  const response = await fetch(
    `${GBP_API_BASE}/${accountId}/${locationId}/localPosts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create GBP post: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get existing posts for the location
 */
export async function getGBPPosts(): Promise<GBPPostResponse[]> {
  const accountId = process.env.GBP_ACCOUNT_ID;
  const locationId = process.env.GBP_LOCATION_ID;

  if (!accountId || !locationId) {
    throw new Error('GBP_ACCOUNT_ID and GBP_LOCATION_ID must be configured');
  }

  const accessToken = await getValidAccessToken();

  const response = await fetch(
    `${GBP_API_BASE}/${accountId}/${locationId}/localPosts`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch GBP posts: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.localPosts || [];
}
