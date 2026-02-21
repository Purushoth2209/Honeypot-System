const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  /**
   * GET /api/analytics/summary
   */
  async getSummary(req, res) {
    try {
      const data = analyticsService.getSummary();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/attacks
   */
  async getAttacks(req, res) {
    try {
      const data = analyticsService.getAttacksByType();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/attackers
   */
  async getAttackers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = analyticsService.getTopAttackers(limit);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/detections
   */
  async getDetections(req, res) {
    try {
      const data = analyticsService.getDetections();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/logs
   */
  async getLogs(req, res) {
    try {
      const filters = {
        ip: req.query.ip,
        attackType: req.query.attackType,
        endpoint: req.query.endpoint
      };
      
      const pagination = {
        limit: req.query.limit,
        offset: req.query.offset
      };
      
      const data = analyticsService.getLogs(filters, pagination);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/timeline
   */
  async getTimeline(req, res) {
    try {
      const data = analyticsService.getTimeline();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/report
   */
  async getReport(req, res) {
    try {
      const data = analyticsService.getReport();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/countries
   */
  async getCountries(req, res) {
    try {
      const data = analyticsService.getCountries();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/geo-map
   */
  async getGeoMap(req, res) {
    try {
      const data = analyticsService.getGeoMap();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new AnalyticsController();
