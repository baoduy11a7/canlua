import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  updateCell,
  renameHousehold,
  closeSession,
  markSessionPaid,
  reopenSession,
  deleteSession,
} from '../controllers/session.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.patch('/:id/cell', updateCell);
router.patch('/:id/rename-household', renameHousehold);
router.post('/:id/close', closeSession);
router.post('/:id/paid', markSessionPaid);
router.post('/:id/reopen', reopenSession);
router.delete('/:id', deleteSession);

export default router;
