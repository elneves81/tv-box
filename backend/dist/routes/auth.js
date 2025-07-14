"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome é obrigatório'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Senha é obrigatória')
];
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: Number(process.env.JWT_EXPIRES_IN) || 604800 });
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) || 2592000 });
    return { accessToken, refreshToken };
};
router.post('/register', registerValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array()
        });
        return;
    }
    const { email, password, name } = req.body;
    const existingUser = await database_1.prisma.user.findFirst({
        where: {
            email
        }
    });
    if (existingUser) {
        throw new errorHandler_1.AppError('Email já está em uso', 400);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await database_1.prisma.user.create({
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
    const { accessToken, refreshToken } = generateTokens(user.id);
    await database_1.prisma.userSession.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
router.post('/login', loginValidation, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array()
        });
        return;
    }
    const { email, password } = req.body;
    const user = await database_1.prisma.user.findUnique({
        where: { email }
    });
    if (!user || !await bcryptjs_1.default.compare(password, user.password)) {
        throw new errorHandler_1.AppError('Credenciais inválidas', 401);
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    await database_1.prisma.userSession.create({
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
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errorHandler_1.AppError('Refresh token requerido', 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const session = await database_1.prisma.userSession.findUnique({
            where: { refreshToken },
            include: { user: true }
        });
        if (!session || session.isRevoked || session.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('Refresh token inválido', 401);
        }
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);
        await database_1.prisma.userSession.update({
            where: { id: session.id },
            data: { isRevoked: true }
        });
        await database_1.prisma.userSession.create({
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
    }
    catch (error) {
        throw new errorHandler_1.AppError('Refresh token inválido', 401);
    }
}));
router.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await database_1.prisma.userSession.updateMany({
            where: { refreshToken },
            data: { isRevoked: true }
        });
    }
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map