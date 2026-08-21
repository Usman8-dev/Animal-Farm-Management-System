import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js'; // see note at bottom
import { validate } from '../Middlewares/validate.js';
import { uploadImage } from '../Middlewares/upload.js';
import {
  AnimalTypeValidator,
  BreedValidator,
  AnimalValidator,
  AnimalListQueryValidator,
  AnimalIdParamValidator,
  AnimalImageValidator,
  GenderValidator,
} from '../Validators/Animalvalidators .js';

import {
  ListAnimalTypes,
  CreateAnimalType,
  UpdateAnimalType,
  DeleteAnimalType,
  GetAnimalType,
  ListBreeds,
  CreateBreed,
  UpdateBreed,
  DeleteBreed, 
  GetBreed,
  ListGenders,
  GetGender,
  CreateGender,
  UpdateGender,
  DeleteGender,
} from '../Controller/MasterDataController.js';

import {
  ListAnimals,
  GetAnimal,
  CreateAnimal,
  UpdateAnimal,
  DeleteAnimal,
  GetOffspring,
  AddAnimalImage,
  SetPrimaryImage,
  DeleteAnimalImage,
  GetAnimalFamilyTree,
} from '../Controller/AnimalController.js';

const router = Router();

// Every route in this module requires a logged-in user
router.use(IsLoginUser);

// ── Master / Reference Data ─────────────────────────────────
// Read access: any farm member. Write access: owner + manager only.

router.get('/animal-types', ListAnimalTypes);
router.post('/animal-types', authorizeRoles('owner', 'manager'), AnimalTypeValidator, validate, CreateAnimalType);
router.put('/animal-types/:id', authorizeRoles('owner', 'manager'), AnimalTypeValidator, validate, UpdateAnimalType);
router.delete('/animal-types/:id', authorizeRoles('owner', 'manager'), DeleteAnimalType);
router.get('/animal-types/:id', GetAnimalType);

router.get('/breeds', ListBreeds);
router.post('/breeds', authorizeRoles('owner', 'manager'), BreedValidator, validate, CreateBreed);
router.put('/breeds/:id', authorizeRoles('owner', 'manager'), BreedValidator, validate, UpdateBreed);
router.delete('/breeds/:id', authorizeRoles('owner', 'manager'), DeleteBreed);
router.get('/breeds/:id', GetBreed);

router.get('/genders', ListGenders);
router.get('/genders/:id', GetGender);
router.post('/genders', authorizeRoles('owner', 'manager'), GenderValidator, validate, CreateGender);
router.put('/genders/:id', authorizeRoles('owner', 'manager'), GenderValidator, validate, UpdateGender);
router.delete('/genders/:id', authorizeRoles('owner', 'manager'), DeleteGender);

// ── Animals ──────────────────────────────────────────────────
// Read: any farm member. Create/Update: owner, manager, worker.
// Delete: owner + manager only (a worker shouldn't be able to erase records).

router.get('/animals', AnimalListQueryValidator, validate, ListAnimals);
router.get('/animals/:id', AnimalIdParamValidator, validate, GetAnimal);

router.post('/animals',authorizeRoles('owner', 'manager', 'worker'), AnimalValidator, validate, CreateAnimal);

router.put('/animals/:id',authorizeRoles('owner', 'manager', 'worker'),AnimalIdParamValidator, AnimalValidator, validate, UpdateAnimal);

router.delete('/animals/:id', authorizeRoles('owner', 'manager'), AnimalIdParamValidator, validate, DeleteAnimal);

router.get('/animals/:id/offspring', AnimalIdParamValidator, validate, GetOffspring);

// ── Animal Images ────────────────────────────────────────────
// Accepts either a pasted URL (application/json) or a device image
// file (multipart/form-data with field name "image").

router.post('/animals/:id/images', authorizeRoles('owner', 'manager', 'worker'), uploadImage.single('image'), AnimalIdParamValidator, AnimalImageValidator, validate, AddAnimalImage
);
router.put('/animals/:id/images/:imageId/primary', authorizeRoles('owner', 'manager', 'worker'), SetPrimaryImage);
router.delete('/animals/:id/images/:imageId', authorizeRoles('owner', 'manager', 'worker'), DeleteAnimalImage);

router.get('/animals/:id/family-tree', authorizeRoles('owner', 'manager', 'worker'), GetAnimalFamilyTree);

export default router;
