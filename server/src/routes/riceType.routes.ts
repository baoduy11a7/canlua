import { Router } from 'express';
import { getRiceTypes, createRiceType, updateRiceType } from '../controllers/riceType.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getRiceTypes);
router.post('/', createRiceType);
router.put('/:id', updateRiceType);

export default router;
