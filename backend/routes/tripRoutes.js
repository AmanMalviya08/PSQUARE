// routes/tripRoutes.js
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

/* Public */
router.get('/', tripController.listTrips);
router.get('/:id', tripController.getTrip);

// image endpoint (streams DB-stored image or redirects to uploads path)
router.get('/:id/image', tripController.getImage);

/* Admin (protected) */
router.use(protect, restrictTo('admin'));
router.post('/', tripController.uploadImage, tripController.createTrip);
router.patch('/:id', tripController.uploadImage, tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
