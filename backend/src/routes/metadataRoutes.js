const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', metadataController.getAll);
router.post('/', requireAdmin, metadataController.add);
router.delete('/', requireAdmin, metadataController.remove);

module.exports = router;