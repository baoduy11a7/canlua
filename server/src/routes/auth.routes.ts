import { Router } from 'express';
import { login, register, getProfile, refreshToken } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.get('/profile', authenticate, getProfile);

export default router;
