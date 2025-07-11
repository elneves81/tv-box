import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Devices route' });
});

export default router;
