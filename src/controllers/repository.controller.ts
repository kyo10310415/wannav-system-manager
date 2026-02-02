import { Request, Response } from 'express';
import { query } from '../database/db';
import githubService from '../services/github.service';

export const getRepositories = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM repositories ORDER BY is_visible DESC, COALESCE(github_updated_at, updated_at) DESC'
    );
    res.render('repositories/index', { repositories: result.rows });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).send('サーバーエラーが発生しました');
  }
};

export const syncRepositories = async (req: Request, res: Response) => {
  try {
    const repos = await githubService.getRepositories();
    
    for (const repo of repos) {
      await query(
        `INSERT INTO repositories (github_id, name, full_name, description, url, homepage, language, github_updated_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         ON CONFLICT (github_id) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           url = EXCLUDED.url,
           homepage = EXCLUDED.homepage,
           language = EXCLUDED.language,
           github_updated_at = EXCLUDED.github_updated_at,
           updated_at = CURRENT_TIMESTAMP`,
        [
          repo.id,
          repo.name,
          repo.full_name,
          repo.description,
          repo.html_url,
          repo.homepage,
          repo.language,
          repo.updated_at,
        ]
      );
    }
    
    res.redirect('/repositories');
  } catch (error) {
    console.error('Error syncing repositories:', error);
    res.status(500).send('リポジトリの同期に失敗しました');
  }
};

export const toggleVisibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query(
      'UPDATE repositories SET is_visible = NOT is_visible WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    res.status(500).json({ success: false, error: 'Failed to update visibility' });
  }
};

export const getRepositoryDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const repoResult = await query('SELECT * FROM repositories WHERE id = $1', [id]);
    if (repoResult.rows.length === 0) {
      return res.status(404).send('リポジトリが見つかりません');
    }
    
    const changeLogsResult = await query(
      'SELECT * FROM change_logs WHERE repository_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    const tasksResult = await query(
      'SELECT * FROM tasks WHERE repository_id = $1 ORDER BY due_date ASC, created_at DESC',
      [id]
    );
    
    const costsResult = await query(
      'SELECT * FROM costs WHERE repository_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.render('repositories/detail', {
      repository: repoResult.rows[0],
      changeLogs: changeLogsResult.rows,
      tasks: tasksResult.rows,
      costs: costsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching repository detail:', error);
    res.status(500).send('サーバーエラーが発生しました');
  }
};
