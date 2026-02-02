import axios, { AxiosInstance } from 'axios';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

class GitHubService {
  private client: AxiosInstance;
  private username: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    this.username = process.env.GITHUB_USERNAME || '';

    if (!token) {
      throw new Error('GITHUB_TOKEN is not set in environment variables');
    }

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    try {
      const response = await this.client.get<GitHubRepository[]>(
        `/users/${this.username}/repos`,
        {
          params: {
            sort: 'updated',
            per_page: 100,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching repositories:', error.message);
      throw new Error('Failed to fetch repositories from GitHub');
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.client.get<GitHubRepository>(
        `/repos/${owner}/${repo}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching repository:', error.message);
      throw new Error('Failed to fetch repository from GitHub');
    }
  }

  async getRecentCommits(owner: string, repo: string, limit: number = 10): Promise<GitHubCommit[]> {
    try {
      const response = await this.client.get<GitHubCommit[]>(
        `/repos/${owner}/${repo}/commits`,
        {
          params: {
            per_page: limit,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching commits:', error.message);
      throw new Error('Failed to fetch commits from GitHub');
    }
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}

export default new GitHubService();
