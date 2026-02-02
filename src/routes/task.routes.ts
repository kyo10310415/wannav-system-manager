import { Router } from 'express';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/toggle', taskController.toggleTaskStatus);

export default router;
