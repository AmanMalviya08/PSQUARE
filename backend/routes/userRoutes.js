// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// protected routes
router.use(protect);

router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);

// admin-only
router.get('/', restrictTo('admin'), userController.listUsers);

module.exports = router;
