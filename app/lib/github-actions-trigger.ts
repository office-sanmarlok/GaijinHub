import { logger } from '@/lib/utils/logger';
/**
 * Trigger GitHub Actions workflow via repository dispatch
 */
export async function triggerTranslationWorkflow(listingId: string): Promise<void> {
  // Only trigger in production
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Skipping GitHub Actions trigger in development');
    return;
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!githubToken || !repoOwner || !repoName) {
    logger.warn('GitHub configuration missing, skipping workflow trigger');
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'new-listing',
        client_payload: {
          listing_id: listingId,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      logger.error('Failed to trigger GitHub Actions workflow:', response.statusText);
    } else {
      logger.debug('GitHub Actions workflow triggered for listing:', listingId);
    }
  } catch (error) {
    logger.error('Error triggering GitHub Actions workflow:', error);
  }
}
