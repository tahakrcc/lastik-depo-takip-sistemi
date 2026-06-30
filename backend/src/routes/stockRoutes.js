const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', stockController.getAll);
router.put('/', requireAdmin, stockController.update);
router.delete('/', requireAdmin, stockController.remove);

module.exports = router;