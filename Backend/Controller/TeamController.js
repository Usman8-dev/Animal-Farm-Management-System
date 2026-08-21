import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';

const SALT_ROUNDS = 10;

// ── List ─────────────────────────────────────────────────────

const ListTeamMembers = async (req, res) => {
  try {
    const farmId = req.user.farmId;

    const members = await prisma.farm_Members.findMany({
      where: {
        farm_id: farmId,
        deleted_at: null,
        status: { not: 'removed' },
      },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            cnic_number: true,
            gender: true,
            created_at: true,
            credentials: {
              select: {
                email: true,
                email_verified: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = members.map((m) => ({
      id: m.id,
      person_id: m.person_id,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      name: m.person.name,
      gender: m.person.gender,
      cnic_number: m.person.cnic_number,
      email: m.person.credentials?.email ?? null,
      email_verified: m.person.credentials?.email_verified ?? false,
      created_at: m.created_at,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('ListTeamMembers error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Get one ──────────────────────────────────────────────────

const GetTeamMember = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const memberId = Number(req.params.id);

    const member = await prisma.farm_Members.findFirst({
      where: {
        id: memberId,
        farm_id: farmId,
        deleted_at: null,
      },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            cnic_number: true,
            gender: true,
            credentials: {
              select: { email: true, email_verified: true },
            },
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: member.id,
        person_id: member.person_id,
        role: member.role,
        status: member.status,
        joined_at: member.joined_at,
        name: member.person.name,
        gender: member.person.gender,
        cnic_number: member.person.cnic_number,
        email: member.person.credentials?.email ?? null,
        email_verified: member.person.credentials?.email_verified ?? false,
      },
    });
  } catch (err) {
    console.error('GetTeamMember error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Create ───────────────────────────────────────────────────

const CreateTeamMember = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const actorId = req.user.id;
    const { name, email, password, gender, cnic_number, role } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingCred = await prisma.person_Credentials.findFirst({
      where: { email: normalizedEmail, deleted_at: null },
    });
    if (existingCred) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    if (cnic_number?.trim()) {
      const existingCnic = await prisma.person.findFirst({
        where: { cnic_number: cnic_number.trim(), deleted_at: null },
      });
      if (existingCnic) {
        return res.status(409).json({
          success: false,
          message: 'CNIC is already registered',
        });
      }
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          name: name.trim(),
          gender: gender.trim(),
          cnic_number: cnic_number?.trim() || null,
          createdby: actorId,
        },
      });

      await tx.person_Credentials.create({
        data: {
          person_id: person.id,
          email: normalizedEmail,
          password: hashed,
          email_verified: false,
          createdby: actorId,
        },
      });

      const membership = await tx.farm_Members.create({
        data: {
          farm_id: farmId,
          person_id: person.id,
          role,
          status: 'active',
          createdby: actorId,
        },
      });

      return { person, membership };
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.membership.id,
        person_id: result.person.id,
        name: result.person.name,
        role: result.membership.role,
        status: result.membership.status,
        email: normalizedEmail,
      },
    });
  } catch (err) {
    console.error('CreateTeamMember error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Email or CNIC already exists',
      });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Update ───────────────────────────────────────────────────

const UpdateTeamMember = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const actorId = req.user.id;
    const memberId = Number(req.params.id);
    const { name, gender, cnic_number, role, status, password } = req.body;

    const member = await prisma.farm_Members.findFirst({
      where: { id: memberId, farm_id: farmId, deleted_at: null },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    await prisma.$transaction(async (tx) => {
      const personData = { updatedby: actorId };
      if (name !== undefined) personData.name = name.trim();
      if (gender !== undefined) personData.gender = gender.trim();
      if (cnic_number !== undefined) {
        personData.cnic_number = cnic_number?.trim() || null;
      }

      if (Object.keys(personData).length > 1) {
        await tx.person.update({
          where: { id: member.person_id },
          data: personData,
        });
      }

      if (password) {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await tx.person_Credentials.update({
          where: { person_id: member.person_id },
          data: { password: hashed, updatedby: actorId },
        });
      }

      const memberData = { updatedby: actorId };
      if (role !== undefined) memberData.role = role;
      if (status !== undefined) memberData.status = status;

      await tx.farm_Members.update({
        where: { id: memberId },
        data: memberData,
      });
    });

    return res.status(200).json({ success: true, message: 'Team member updated' });
  } catch (err) {
    console.error('UpdateTeamMember error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'CNIC already exists',
      });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Soft remove from farm ────────────────────────────────────

const DeleteTeamMember = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const actorId = req.user.id;
    const memberId = Number(req.params.id);

    const member = await prisma.farm_Members.findFirst({
      where: { id: memberId, farm_id: farmId, deleted_at: null },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    await prisma.farm_Members.update({
      where: { id: memberId },
      data: {
        status: 'removed',
        deleted_at: new Date(),
        deletedby: actorId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (err) {
    console.error('DeleteTeamMember error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// // ── Soft remove from farm (+ related person records) ─────────

// const DeleteTeamMember = async (req, res) => {
//   try {
//     const farmId = req.user.farmId;
//     const actorId = req.user.id;
//     const memberId = Number(req.params.id);
//     const now = new Date();

//     const member = await prisma.farm_Members.findFirst({
//       where: { id: memberId, farm_id: farmId, deleted_at: null },
//     });

//     if (!member) {
//       return res.status(404).json({ success: false, message: 'Team member not found' });
//     }

//     const personId = member.person_id;

//     await prisma.$transaction([
//       prisma.farm_Members.update({
//         where: { id: memberId },
//         data: {
//           status: 'removed',
//           deleted_at: now,
//           deletedby: actorId,
//         },
//       }),
//       prisma.person.update({
//         where: { id: personId },
//         data: {
//           deleted_at: now,
//           deletedby: actorId,
//         },
//       }),
//       prisma.person_Credentials.update({
//         where: { person_id: personId },
//         data: {
//           deleted_at: now,
//           deletedby: actorId,
//         },
//       }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: 'Team member removed successfully',
//     });
//   } catch (err) {
//     console.error('DeleteTeamMember error:', err);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };

// ----------------------------------------------
// This soft-deletes Farm_Members, Person, and Person_Credentials together.
// Do not use this if the same person could still own another farm or belong to another farm — in that case only soft-delete Farm_Members.
// ----------------------------------------------

export {
  ListTeamMembers,
  GetTeamMember,
  CreateTeamMember,
  UpdateTeamMember,
  DeleteTeamMember,
};