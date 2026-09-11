import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  getProfitReport,
  exportFinanceExcel,
} from '../controllers/finance.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.delete('/expenses/:id', deleteExpense);
router.get('/profit', getProfitReport);
router.get('/export-excel', exportFinanceExcel);

export default router;
