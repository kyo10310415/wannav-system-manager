import { Router } from 'express';
import * as repositoryController from '../controllers/repository.controller';

const router = Router();

router.get('/', repositoryController.getRepositories);
router.post('/sync', repositoryController.syncRepositories);
router.get('/:id', repositoryController.getRepositoryDetail);
router.post('/:id/toggle-visibility', repositoryController.toggleVisibility);

export default router;
