import jwt from 'jsonwebtoken';

// Used at login/registration — this is what proves an active session
function generateAuthToken(person, role, farmId, emailVerified) {
  return jwt.sign(
    {
      id: person.id,
      email: person.email,
      role,
      farmId,
      email_verified: emailVerified,
    },
    process.env.JWT_KEY,
    { expiresIn: '1d' }
  );
}

// Used once, right after registration — proves ownership of the email address
function generateVerificationToken(personId, email) {
  return jwt.sign(
    { personId, email },
    process.env.JWT_KEY,
    { expiresIn: '1d' }
  );
}

// Used once, for password reset — proves the user requested the reset and owns the email
function generateResetToken(personId, email) {
  return jwt.sign(
    { personId, email },
    process.env.JWT_KEY,
    { expiresIn: '1h' }
  );
}

export { generateAuthToken, generateVerificationToken, generateResetToken };