import bcrypt from 'bcrypt';
import prisma from '../prisma/client.js';
import jwt from 'jsonwebtoken';

import { generateAuthToken, generateVerificationToken } from '../utils/generateToken.js';
import sendVerificationEmail from '../utils/sendVerificationEmail.js';

const RegisterOwner = async (req, res) => {
  try {
    const { name, cnic_number, gender, email, password } = req.body;

    const existingCredentials = await prisma.person_Credentials.findUnique({
      where: { email },
    });

    if (existingCredentials) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: { name, cnic_number, gender },
      });

      const farm = await tx.farms.create({
        data: {
          farm_name: `${name}'s Farm`,
          owner_id: person.id,
          createdby: person.id,
          updatedby: person.id,
        },
      });

      const credentials = await tx.person_Credentials.create({
        data: {
          person_id: person.id,
          email,
          password: hashedPassword,
          email_verified: false,
          createdby: person.id,
          updatedby: person.id,
        },
      });

      return { person, farm, credentials };
    });

    const { person, farm } = result;

    const verificationToken = generateVerificationToken(person.id, email);

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    const authToken = generateAuthToken(
      { id: person.id, email },
      'owner',
      farm.id,
      false
    );

    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: person.id,
        name: person.name,
        email,
        role: 'owner',
        farmId: farm.id,
        email_verified: false,
      },
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

// VerifyEmail 

const VerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Verification link is invalid or has expired',
      });
    }

    const { personId, email } = decoded;

    const credentials = await prisma.person_Credentials.findUnique({
      where: { person_id: personId },
    });

    if (!credentials || credentials.email !== email) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    if (credentials.email_verified) {
      return res.status(200).json({ success: true, message: 'Email is already verified' });
    }

    await prisma.person_Credentials.update({
      where: { person_id: personId },
      data: { email_verified: true, updatedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Email verified successfully' });

  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find credentials by email
    const credentials = await prisma.person_Credentials.findUnique({
      where: { email },
      include: { person: true },
    });

    if (!credentials) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, credentials.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const person = credentials.person;

    // 3. Determine role — check if this person owns a farm first
    let role;
    let farmId;

    const ownedFarm = await prisma.farms.findUnique({
      where: { owner_id: person.id },
    });

    if (ownedFarm) {
      role = 'owner';
      farmId = ownedFarm.id;
    } else {
      // Not an owner — check Farm_Members for manager/worker role
      const membership = await prisma.farm_Members.findFirst({
        where: {
          person_id: person.id,
          status: 'active',
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'No active farm membership found for this account',
        });
      }

      role = membership.role;
      farmId = membership.farm_id;
    }

    // 4. Generate auth token
    const authToken = generateAuthToken(
      { id: person.id, email: credentials.email },
      role,
      farmId,
      credentials.email_verified
    );

    // 5. Set httpOnly cookie
    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 6. Respond — never send back the password
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: person.id,
        name: person.name,
        email: credentials.email,
        role,
        farmId,
        email_verified: credentials.email_verified,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

const LogoutUser = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
    });
  }
};

export { RegisterOwner, VerifyEmail, LoginUser, LogoutUser };