import { Router } from 'express';
import {
  getHouseholds,
  getHouseholdById,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  getHouseholdHistory,
} from '../controllers/household.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getHouseholds);
router.get('/:id', getHouseholdById);
router.get('/:id/history', getHouseholdHistory);
router.post('/', createHousehold);
router.put('/:id', updateHousehold);
router.delete('/:id', deleteHousehold);

export default router;
