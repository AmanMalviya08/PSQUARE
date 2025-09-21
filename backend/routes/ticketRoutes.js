const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/:id', ticketController.getTicket);

router.get('/', restrictTo('admin'), async (req, res) => {
  res.status(200).json({ status: 'success', message: 'Implement tickets listing if needed' });
});

module.exports = router;
