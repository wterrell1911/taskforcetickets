// GBP Post Content Generator using Claude AI

import Anthropic from '@anthropic-ai/sdk';

const TOPIC_ROTATION = [
  'traffic safety tips for Memphis drivers',
  'Tennessee traffic law facts that drivers should know',
  'what to expect during a traffic court appearance at 201 Poplar',
  'how professional representation can help with traffic tickets',
  'seasonal driving reminders for Memphis area',
  'common traffic violations in Shelby County and how to avoid them',
  'the cost of ignoring traffic tickets in Tennessee',
  'benefits of keeping a clean driving record',
];

const SYSTEM_PROMPT = `You write Google Business Profile posts for TaskForce Tickets, a Memphis traffic ticket defense service.

Posts must be:
- 150-300 characters (this is critical - Google truncates longer posts)
- Professional but approachable tone
- Include a soft call to action
- Vary in style and content week to week

Our service:
- Flat-fee traffic ticket defense
- Covers Memphis and Shelby County
- Most clients don't need to appear in court
- Money-back guarantee if not dismissed

IMPORTANT: Never make specific claims about win rates or guarantees beyond our actual policies. Keep posts informational and helpful.`;

/**
 * Generate a weekly GBP post using Claude AI
 */
export async function generateWeeklyPost(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY must be configured');
  }

  const anthropic = new Anthropic({ apiKey });

  // Rotate topics based on week of year
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const topicIndex = weekNumber % TOPIC_ROTATION.length;
  const topic = TOPIC_ROTATION[topicIndex];

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write a Google Business Profile post about: ${topic}

Remember: 150-300 characters max. Include a call to action like "Learn more at our website" or "Submit your ticket online today."`,
      },
    ],
  });

  // Extract text from response
  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Ensure it's within character limits
  let post = textContent.text.trim();
  if (post.length > 300) {
    // Truncate at last sentence that fits
    const sentences = post.match(/[^.!?]+[.!?]+/g) || [post];
    post = '';
    for (const sentence of sentences) {
      if ((post + sentence).length <= 300) {
        post += sentence;
      } else {
        break;
      }
    }
    post = post.trim();
  }

  return post;
}

/**
 * Generate a post for a specific topic (for testing)
 */
export async function generatePostForTopic(topic: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY must be configured');
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write a Google Business Profile post about: ${topic}

Remember: 150-300 characters max. Include a call to action.`,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textContent.text.trim();
}
