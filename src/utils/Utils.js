/**
 * Utility functions for the Reliq Enhanced Particle Image system
 */

export class Utils {
  /**
   * Deep extend/merge objects
   * @param {Object} destination - Target object to merge into
   * @param {Object} source - Source object to merge from
   * @returns {Object} Merged object
   */
  static deepExtend(destination, source) {
    for (let property in source) {
      if (source[property] && source[property].constructor && 
          source[property].constructor === Object) {
        destination[property] = destination[property] || {}
        Utils.deepExtend(destination[property], source[property])
      } else {
        destination[property] = source[property]
      }
    }
    return destination
  }

  /**
   * Clamp value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  /**
   * Get viewport dimensions
   * @returns {Object} Viewport dimensions {width, height}
   */
  static getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    }
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Check if value is a valid number
   * @param {*} value - Value to check
   * @returns {boolean} True if valid number
   */
  static isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  }

  /**
   * Generate random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  static randomBetween(min, max) {
    return Math.random() * (max - min) + min
  }

  /**
   * Generate random integer between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  static randIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Check for overlap between particles
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} existingParticles - Array of existing particles
   * @param {number} minSpacing - Minimum spacing required
   * @returns {boolean} True if overlap exists
   */
  static hasOverlap(x, y, existingParticles, minSpacing) {
    for (let p of existingParticles) {
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2)
      if (dist < minSpacing) {
        return true
      }
    }
    return false
  }
}

export default Utils
