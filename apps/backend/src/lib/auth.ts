import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET must be set in environment variables. See .env.example for setup instructions.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateAccessToken = (payload: { agencyId: string; employeeId: string; email: string } | { travelerId: string; email: string }) => {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: { agencyId: string; employeeId: string } | { travelerId: string; email: string }) => {
    const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as any };
    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const generatePrivateFileToken = (payload: { fileId: string; travelerId: string }) => {
    return jwt.sign({ ...payload, purpose: 'traveler-file' }, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyPrivateFileToken = (token: string) => {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (
            typeof payload === 'string'
            || (payload as any).purpose !== 'traveler-file'
            || typeof (payload as any).fileId !== 'string'
            || typeof (payload as any).travelerId !== 'string'
        ) {
            return null;
        }
        return payload as { fileId: string; travelerId: string; purpose: 'traveler-file' };
    } catch {
        return null;
    }
};
