import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const generateAuthToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET) ;
};