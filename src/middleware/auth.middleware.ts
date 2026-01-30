import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded: any = jwt.verify(token, JWT_SECRET);

            if (decoded.id === 0 && decoded.role === 'admin') {
                req.user = { id: 0, role: 'admin', email: decoded.email, fullName: 'Rambhau Kharpude' };
                return next();
            }

            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = {
                id: user.id,
                phoneNumber: user.phoneNumber,
                role: user.role,
                fullName: user.fullName
            };

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
