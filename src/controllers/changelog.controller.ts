import { Request, Response } from 'express';
import { query } from '../database/db';
import { body, validationResult } from 'express-validator';

export const createChangeLog = async (req: Request, res: Response) => {
  try {
    const { repository_id, title, description, author } = req.body;
    
    await query(
      `INSERT INTO change_logs (repository_id, title, description, change_type, author)
       VALUES ($1, $2, $3, 'manual', $4)`,
      [repository_id, title, description, author || 'Manual Entry']
    );
    
    res.redirect(`/repositories/${repository_id}`);
  } catch (error) {
    console.error('Error creating change log:', error);
    res.status(500).send('更新履歴の作成に失敗しました');
  }
};

export const deleteChangeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM change_logs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting change log:', error);
    res.status(500).json({ success: false, error: 'Failed to delete change log' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.headers['x-github-event'];
    
    if (event === 'push') {
      const { repository, commits, pusher } = req.body;
      
      // リポジトリをデータベースから検索
      const repoResult = await query(
        'SELECT id FROM repositories WHERE github_id = $1',
        [repository.id]
      );
      
      if (repoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Repository not found in database' });
      }
      
      const repositoryId = repoResult.rows[0].id;
      
      // 最新のコミットを更新履歴として記録
      if (commits && commits.length > 0) {
        const latestCommit = commits[commits.length - 1];
        await query(
          `INSERT INTO change_logs (repository_id, title, description, change_type, commit_sha, author)
           VALUES ($1, $2, $3, 'webhook', $4, $5)`,
          [
            repositoryId,
            latestCommit.message.split('\n')[0], // 最初の行をタイトルに
            latestCommit.message,
            latestCommit.id,
            pusher.name,
          ]
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};
