import express from 'express';
const router = express.Router();

import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js'; 
import { validate } from '../Middlewares/validate.js';

import {
  ListTeamMembers,
  GetTeamMember,
  CreateTeamMember,
  UpdateTeamMember,
  DeleteTeamMember,
} from '../Controller/TeamController.js';

import {
  TeamMemberCreateValidator,
  TeamMemberUpdateValidator,
  TeamMemberIdParamValidator,
} from '../Validators/TeamValidators.js';

// ── Team / Staff ─────────────────────────────────────────────
// List/detail: owner + manager
// Create/Update/Delete: owner only

// Every route in this module requires a logged-in user
router.use(IsLoginUser);

router.get('/team', authorizeRoles('owner', 'manager'), ListTeamMembers );

router.get('/team/:id', authorizeRoles('owner', 'manager'), TeamMemberIdParamValidator, validate, GetTeamMember);

router.post('/team', authorizeRoles('owner'), TeamMemberCreateValidator, validate, CreateTeamMember);

router.put('/team/:id', authorizeRoles('owner'), TeamMemberIdParamValidator, TeamMemberUpdateValidator, validate, UpdateTeamMember);

router.delete('/team/:id', authorizeRoles('owner'), TeamMemberIdParamValidator, validate, DeleteTeamMember);

export default router; 