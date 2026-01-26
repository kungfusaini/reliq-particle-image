/**
 * Floating effect for particles using sine wave movement
 */
export class FloatingEffect {
  constructor(config) {
    this.config = FloatingEffect.extractConfig(config)
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
    const floatingConfig = newConfig?.particles?.movement?.floating || newConfig?.floating || {}
    this.config = { ...this.config, ...floatingConfig }
    this.enabled = this.config.enabled || false
    this.amplitude = this.config.amplitude || 8
    this.frequency = this.config.frequency || 0.25
    this.phaseOffset = this.config.phase_offset || 0
  }

  static extractConfig(config) {
    if (!config) {
      return {}
    }

    return config.particles?.movement?.floating || config.floating || {}
  }
}

export default FloatingEffect
