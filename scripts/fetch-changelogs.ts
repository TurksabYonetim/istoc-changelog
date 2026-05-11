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
  { source: "admin", owner: "tradehub-tr", repo: "admin-panel", branch: "main", path: "CHANGELOG.md" },
];

export interface FetchedChangelog {
  source: Source;
  markdown: string;
}

export async function fetchAllChangelogs(token: string): Promise<FetchedChangelog[]> {
  const results: FetchedChangelog[] = [];
  for (const repo of REPOS) {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${repo.path}?ref=${repo.branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${repo.source}: ${res.status} ${res.statusText}`);
    }
    const markdown = await res.text();
    results.push({ source: repo.source, markdown });
  }
  return results;
}
