import { Request, Response } from 'express';
import { query } from '../database/db';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { repository_id, title, memo, due_date } = req.body;
    
    await query(
      `INSERT INTO tasks (repository_id, title, memo, due_date)
       VALUES ($1, $2, $3, $4)`,
      [repository_id, title, memo, due_date || null]
    );
    
    res.redirect(`/repositories/${repository_id}`);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).send('タスクの作成に失敗しました');
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, memo, due_date, status } = req.body;
    
    await query(
      `UPDATE tasks SET title = $1, memo = $2, due_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [title, memo, due_date || null, status, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
};

export const toggleTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await query(
      `UPDATE tasks SET 
       status = CASE WHEN status = 'completed' THEN 'pending' ELSE 'completed' END,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling task status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle task status' });
  }
};
