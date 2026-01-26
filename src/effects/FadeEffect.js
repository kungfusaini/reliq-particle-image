/**
 * Fade effect for particles - gradual opacity transitions
 */
export class FadeEffect {
  constructor(config) {
    this.config = config?.fade_out || {}
    this.enabled = this.config.enabled || false
    this.duration = this.config.duration_ms || 1000
    this.startTime = null
    this.opacity = 1.0
    this.active = false
  }

  /**
   * Start fade out effect
   */
  startFadeOut() {
    if (!this.enabled) {
      return
    }
    
    this.startTime = performance.now()
    this.opacity = 1.0
    this.active = true
  }

  /**
   * Update fade effect
   * @returns {boolean} True if fade is complete
   */
  update() {
    if (!this.enabled || !this.active) {
      return false
    }
    
    const elapsed = performance.now() - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)
    
    // Update opacity (fade to 0)
    this.opacity = 1 - progress
    
    // Return true when fade is complete
    return progress >= 1
  }

  /**
   * Get current opacity value
   * @returns {number} Current opacity (0-1)
   */
  getCurrentOpacity() {
    return this.opacity
  }

  /**
   * Check if fade is currently active
   * @returns {boolean} True if fade is in progress
   */
  isActive() {
    return this.active
  }

  /**
   * Reset fade state
   */
  reset() {
    this.startTime = null
    this.opacity = 1.0
    this.active = false
  }

  /**
   * Update fade configuration
   * @param {Object} newConfig - New fade configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.enabled = this.config.enabled || false
    this.duration = this.config.duration_ms || 1000
  }
}

export default FadeEffect