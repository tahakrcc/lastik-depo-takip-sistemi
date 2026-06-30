const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

router.get('/', saleController.getAll);
router.post('/', saleController.process);

module.exports = router;