import type { Source } from "../src/types/changelog";

interface RepoConfig {
  source: Source;
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

const REPOS: RepoConfig[] = [
  { source: "backend", owner: "tradehub-tr", repo: "tradehub_core", branch: "version-15", path: "CHANGELOG.md" },
  { source: "frontend", owner: "tradehub-tr", repo: "tradehubfront", branch: "main", path: "CHANGELOG.md" },
  { source: "admin", owner: "tradehub-tr", repo: "admin-panel", branch: "master", path: "CHANGELOG.md" },
];

export interface FetchedChangelog {
  source: Source;
  markdown: string;
}

export interface FetchResult {
  results: FetchedChangelog[];
  errors: { source: Source; message: string }[];
}

export async function fetchAllChangelogs(token: string): Promise<FetchResult> {
  const results: FetchedChangelog[] = [];
  const errors: FetchResult["errors"] = [];

  for (const repo of REPOS) {
    try {
      const markdown = await fetchOne(repo, token);
      results.push({ source: repo.source, markdown });
    } catch (err) {
      errors.push({
        source: repo.source,
        message: err instanceof Error ? err.message : String(err),
      });
      console.warn(`Skipping ${repo.source}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return { results, errors };
}

async function fetchOne(repo: RepoConfig, token: string): Promise<string> {
  // Try configured branch first; on 404, fall back to default branch
  const branches = [repo.branch, undefined];
  let lastError = "";

  for (const branch of branches) {
    const url = branch
      ? `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${repo.path}?ref=${branch}`
      : `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${repo.path}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (res.ok) return await res.text();
    if (res.status !== 404) {
      throw new Error(`${repo.source}: ${res.status} ${res.statusText}`);
    }
    lastError = `${res.status} ${res.statusText}${branch ? ` (branch: ${branch})` : " (default branch)"}`;
  }

  throw new Error(`${repo.source}: ${lastError}`);
}
