const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/summary', analyticsController.getSummary);
router.get('/attacks', analyticsController.getAttacks);
router.get('/attackers', analyticsController.getAttackers);
router.get('/detections', analyticsController.getDetections);
router.get('/logs', analyticsController.getLogs);
router.get('/timeline', analyticsController.getTimeline);
router.get('/report', analyticsController.getReport);
router.get('/countries', analyticsController.getCountries);
router.get('/geo-map', analyticsController.getGeoMap);

module.exports = router;
