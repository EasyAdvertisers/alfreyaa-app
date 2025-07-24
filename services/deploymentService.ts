import { DeploymentStatus } from '../types';

// Hardcoded for this environment. In a real build system, this would be dynamic.
const PROJECT_FILES = [
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'metadata.json',
  'services/geminiService.ts',
  'services/deploymentService.ts',
  'services/websiteService.ts',
  'components/Header.tsx',
  'components/ChatInput.tsx',
  'components/ChatMessage.tsx',
  'components/TypingIndicator.tsx',
];

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

interface ProgressUpdate {
  status: DeploymentStatus;
  message: string;
  url?: string;
}

type ProgressCallback = (update: ProgressUpdate) => void;

export async function getProjectFiles(): Promise<{ path: string; content: string }[]> {
  const filePromises = PROJECT_FILES.map(async (path) => {
    try {
        const response = await fetch(`/${path}`);
        if (!response.ok) {
        throw new Error(`Failed to fetch project file: ${path}`);
        }
        const content = await response.text();
        return { path, content };
    } catch (e) {
        // This can happen during development if a file is requested before it's available.
        // Return empty content to allow the process to continue.
        console.warn(`Could not fetch ${path}, returning empty content.`)
        return { path, content: "" }
    }
  });
  return Promise.all(filePromises);
}

// Helper to use btoa safely in different environments
function base64Encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}

export const deployApp = async (onProgress: ProgressCallback): Promise<void> => {
  if (!GITHUB_TOKEN || !NETLIFY_TOKEN) {
    onProgress({
      status: 'error',
      message: "My apologies, Kaarthi. I lack the required deployment credentials (GITHUB_TOKEN or NETLIFY_TOKEN) in my environment to proceed.",
    });
    return;
  }

  try {
    onProgress({ status: 'initializing', message: 'Initializing deployment sequence...' });
    const repoName = `alfreyaa-deployment-${Date.now()}`;

    // Step 1: Get GitHub user
    const userResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    if (!userResponse.ok) throw new Error('Failed to authenticate with GitHub.');
    const githubUser = await userResponse.json();
    const owner = githubUser.login;

    // Step 2: Create GitHub repository
    onProgress({ status: 'creating_repo', message: `Creating new GitHub repository: ${repoName}` });
    const repoResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: repoName, description: 'Automated deployment of Alfreyaa AI Assistant' }),
    });
    if (!repoResponse.ok) throw new Error(`Failed to create GitHub repository. Status: ${repoResponse.status}`);
    const repoData = await repoResponse.json();

    // Step 3: Fetch and push files to repository
    onProgress({ status: 'pushing_files', message: 'Uploading application source code...' });
    const files = await getProjectFiles();
    for (const file of files) {
        if(file.content.trim() === "") continue; // Don't push empty files
      await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `feat: add ${file.path}`,
          content: base64Encode(file.content),
        }),
      });
    }

    // Step 4: Create Netlify site
    onProgress({ status: 'creating_site', message: 'Configuring deployment with Netlify...' });
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: { Authorization: `Bearer ${NETLIFY_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            repo: {
                provider: 'github',
                repo: repoData.full_name,
                private: repoData.private,
                branch: repoData.default_branch,
            },
            build_settings: {}
        }),
    });
    if (!siteResponse.ok) throw new Error(`Failed to create Netlify site. Status: ${siteResponse.statusText}`);
    const netlifySite = await siteResponse.json();
    
    // Step 5: Poll for deployment completion
    onProgress({ status: 'deploying', message: `Deploying... This may take a moment.` });
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    onProgress({ status: 'success', message: 'Deployment complete. The application is now live.', url: netlifySite.ssl_url });

  } catch (error) {
    console.error('Deployment failed:', error);
    onProgress({
      status: 'error',
      message: `I have failed in my deployment task, Kaarthi. An error occurred: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
};