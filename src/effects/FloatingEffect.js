/**
 * Floating effect for particles using sine wave movement
 */
export class FloatingEffect {
  constructor(config) {
    this.config = config?.floating || {}
    this.enabled = this.config.enabled || false
    this.amplitude = this.config.amplitude || 8
    this.frequency = this.config.frequency || 0.25
    this.phaseOffset = this.config.phase_offset || 0
  }

  /**
   * Calculate floating offset for current time
   * @returns {Object} Offset {x, y}
   */
  calculateOffset() {
    if (!this.enabled) {
      return { x: 0, y: 0 }
    }
    
    const time = performance.now() / 1000
    const phase = (time * this.frequency * 2 * Math.PI) + this.phaseOffset
    
    return {
      x: 0,
      y: Math.sin(phase) * this.amplitude
    }
  }

  /**
   * Update floating configuration
   * @param {Object} newConfig - New floating configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.enabled = this.config.enabled || false
    this.amplitude = this.config.amplitude || 8
    this.frequency = this.config.frequency || 0.25
    this.phaseOffset = this.config.phase_offset || 0
  }
}

export default FloatingEffect