import { Router } from 'express';

const router = Router();

// Placeholder para rotas de usuários
router.get('/', (req, res) => {
  res.json({ message: 'Users route' });
});

export default router;
