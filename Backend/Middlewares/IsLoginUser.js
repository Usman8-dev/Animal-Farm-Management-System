import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

const IsLoginUser = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Please login again. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const personId = Number(decoded.id);

    const person = await prisma.person.findFirst({
      where: { id: personId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!person) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    // IMPORTANT: use the exact client model names from your generated Prisma client
    const ownedFarm = await prisma.farms.findFirst({
      where: { owner_id: personId, deleted_at: null },
      select: { id: true },
    });

    const membership = await prisma.farm_Members.findFirst({
      where: {
        person_id: personId,
        deleted_at: null,
        status: 'active',
      },
      select: { farm_id: true, role: true },
    });

    let role = null;
    let farmId = null;

    if (ownedFarm) {
      role = 'owner';
      farmId = ownedFarm.id;
    } else if (membership) {
      role = membership.role; // manager | worker
      farmId = membership.farm_id;
    }

    if (!role || !farmId) {
      return res.status(403).json({
        success: false,
        message: 'No active farm access for this account.',
        debug: { personId, ownedFarm, membership },
      });
    }

    req.user = {
      id: person.id,
      name: person.name,
      role,
      farmId,
    };

    // console.log('IsLoginUser req.user =>', req.user); // must show role + farmId
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