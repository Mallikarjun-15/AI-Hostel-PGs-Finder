const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getAdminProperties,
} = require('../controllers/propertyController');
const { protect, ownerOrAdmin, admin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.route('/')
  .get(getProperties)
  .post(protect, ownerOrAdmin, upload.array('images', 5), createProperty);

router.get('/my', protect, ownerOrAdmin, getMyProperties);
router.get('/admin/all', protect, admin, getAdminProperties);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, ownerOrAdmin, updateProperty)
  .delete(protect, ownerOrAdmin, deleteProperty);

module.exports = router;
