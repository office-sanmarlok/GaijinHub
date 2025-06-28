import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const GITHUB_TOKEN = process.env.GH_PERSONAL_TOKEN;
const GITHUB_REPO_OWNER = process.env.GH_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GH_REPO_NAME;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id } = await request.json();

    // Trigger GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/process-translations.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            listing_id: listing_id
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to trigger workflow:', error);
      return NextResponse.json(
        { error: 'Failed to trigger translation workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Translation workflow triggered',
      listing_id,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}