const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

router.post('/create', shareController.createShare);

module.exports = router;
