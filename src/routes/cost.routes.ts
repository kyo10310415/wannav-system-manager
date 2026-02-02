import { Router } from 'express';
import * as costController from '../controllers/cost.controller';

const router = Router();

router.post('/', costController.createCost);
router.put('/:id', costController.updateCost);
router.delete('/:id', costController.deleteCost);
router.get('/:repository_id/total', costController.getTotalCosts);

export default router;
