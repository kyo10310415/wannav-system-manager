import { Request, Response } from 'express';
import { query } from '../database/db';

export const createCost = async (req: Request, res: Response) => {
  try {
    const { repository_id, item_name, amount, currency, billing_cycle, description } = req.body;
    
    await query(
      `INSERT INTO costs (repository_id, item_name, amount, currency, billing_cycle, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [repository_id, item_name, amount, currency || 'JPY', billing_cycle, description]
    );
    
    res.redirect(`/repositories/${repository_id}`);
  } catch (error) {
    console.error('Error creating cost:', error);
    res.status(500).send('コストの作成に失敗しました');
  }
};

export const updateCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { item_name, amount, currency, billing_cycle, description } = req.body;
    
    await query(
      `UPDATE costs SET item_name = $1, amount = $2, currency = $3, billing_cycle = $4, description = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [item_name, amount, currency, billing_cycle, description, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating cost:', error);
    res.status(500).json({ success: false, error: 'Failed to update cost' });
  }
};

export const deleteCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM costs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cost:', error);
    res.status(500).json({ success: false, error: 'Failed to delete cost' });
  }
};

export const getTotalCosts = async (req: Request, res: Response) => {
  try {
    const { repository_id } = req.params;
    
    const result = await query(
      `SELECT currency, SUM(amount) as total
       FROM costs
       WHERE repository_id = $1
       GROUP BY currency`,
      [repository_id]
    );
    
    res.json({ success: true, totals: result.rows });
  } catch (error) {
    console.error('Error calculating total costs:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate total costs' });
  }
};
