import jwt from 'jsonwebtoken';
import config from '../config/config';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export const generateAuthToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
};