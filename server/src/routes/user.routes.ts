import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  toggleUserStatus,
  deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Only admin role can manage users
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/reset-password', resetPassword);
router.patch('/:id/toggle-status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;
