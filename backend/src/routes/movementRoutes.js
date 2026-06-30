const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', movementController.getAll);
router.post('/', movementController.process);
router.post('/bulkUpload', requireAdmin, movementController.bulkUpload);

module.exports = router;