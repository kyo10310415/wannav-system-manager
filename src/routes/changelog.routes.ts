import { Router } from 'express';
import * as changelogController from '../controllers/changelog.controller';

const router = Router();

router.post('/', changelogController.createChangeLog);
router.delete('/:id', changelogController.deleteChangeLog);
router.post('/webhook', changelogController.handleWebhook);

export default router;
