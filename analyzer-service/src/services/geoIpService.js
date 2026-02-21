const maxmind = require('maxmind');
const path = require('path');

class GeoIpService {
  constructor() {
    this.reader = null;
    this.cache = new Map();
    this.dbPath = path.join(__dirname, '../../GeoLite2-City_20260210/GeoLite2-City.mmdb');
  }

  /**
   * Initialize the GeoIP database reader
   */
  async init() {
    try {
      this.reader = await maxmind.open(this.dbPath);
      console.log('GeoIP database loaded successfully');
    } catch (error) {
      console.error('Failed to load GeoIP database:', error.message);
      throw error;
    }
  }

  /**
   * Get location information for an IP address
   */
  getLocation(ip) {
    // Handle local IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return { country: 'Local' };
    }

    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip);
    }

    let result = { country: 'Unknown' };

    try {
      if (!this.reader) {
        console.warn('GeoIP reader not initialized');
        return result;
      }

      const lookup = this.reader.get(ip);
      
      if (lookup) {
        result = {
          country: lookup.country?.names?.en || 'Unknown',
          countryCode: lookup.country?.iso_code || null,
          city: lookup.city?.names?.en || null,
          latitude: lookup.location?.latitude || null,
          longitude: lookup.location?.longitude || null,
          timezone: lookup.location?.time_zone || null
        };
      }
    } catch (error) {
      console.warn(`GeoIP lookup failed for ${ip}:`, error.message);
    }

    // Cache the result
    this.cache.set(ip, result);
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 10000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new GeoIpService();