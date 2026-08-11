// Middleware/IsLoginUser.js

import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

const IsLoginUser = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login again. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Confirm the person still exists and hasn't been soft-deleted
    const person = await prisma.person.findUnique({
      where: { id: decoded.id },
      select: { id: true, deleted_at: true },
    });

    if (!person || person.deleted_at) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    req.user = decoded; // role, farmId, email, email_verified all still come from the token
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};

export { IsLoginUser };