const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', requireAdmin, userController.getAll);
router.post('/', requireAdmin, userController.create);
router.put('/', requireAdmin, userController.update);
router.delete('/', requireAdmin, userController.remove);

module.exports = router;