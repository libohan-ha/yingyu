const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');
const historyController = require('../controllers/historyController');
const reviewController = require('../controllers/reviewController');
const studyRecordRoutes = require('./studyRecordRoutes');
const noteRoutes = require('./noteRoutes');

// Process words to generate learning materials
router.post('/process', processController.processWords);

// Process image to extract text and marked words
router.post('/process-image', processController.processImage);

// Translate text
router.post('/translate', processController.translateText);

// Get all history sessions
router.get('/history', historyController.getAllSessions);

// Get specific session by ID
router.get('/history/:sessionId', historyController.getSessionById);

// Delete session by ID
router.delete('/history/:sessionId', historyController.deleteSession);

// Get review data for a session
router.get('/review/:sessionId', reviewController.getReviewData);

// Study records routes
router.use('/study-records', studyRecordRoutes);

// Notes routes
router.use('/notes', noteRoutes);

module.exports = router;
