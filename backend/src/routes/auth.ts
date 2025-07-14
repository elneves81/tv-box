import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { body, validationResult } from 'express-validator';

const router = Router();

// Validações
const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  // Removido validação de username pois não existe no schema
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Função para gerar tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: Number(process.env.JWT_EXPIRES_IN) || 604800 } // 7 dias em segundos
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 2592000 } // 30 dias em segundos
  );

  return { accessToken, refreshToken };
};

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array()
    });
    return;
  }

  const { email, password, name } = req.body;

  // Verificar se usuário já existe
  const existingUser = await prisma.user.findFirst({
    where: {
      email
    }
  });

  if (existingUser) {
    throw new AppError('Email já está em uso', 400);
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 12);

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'USER'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  // Gerar tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Salvar refresh token
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    }
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
}));

// @desc    Login usuário
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array()
    });
    return;
  }

  const { email, password } = req.body;

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Removido isActive pois não existe no schema

  // Gerar tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Salvar refresh token
  await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token requerido', 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new AppError('Refresh token inválido', 401);
    }

    // Gerar novos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

    // Revogar token antigo e criar novo
    await prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true }
    });

    await prisma.userSession.create({
      data: {
        userId: session.userId,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    throw new AppError('Refresh token inválido', 401);
  }
}));

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await prisma.userSession.updateMany({
      where: { refreshToken },
      data: { isRevoked: true }
    });
  }

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
}));

export default router;
