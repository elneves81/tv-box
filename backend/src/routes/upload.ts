import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  res.json({ message: 'Upload route' });
});

export default router;
