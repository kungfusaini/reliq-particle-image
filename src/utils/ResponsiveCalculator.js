import { Utils } from './Utils.js'

/**
 * Responsive calculations for particle sizing and density
 */
export class ResponsiveCalculator {
  constructor(config) {
    this.config = config
  }

  /**
   * Calculate responsive particle size based on viewport
   * @param {number} baseSize - Base particle size
   * @returns {number} Calculated responsive size
   */
  calculateResponsiveSize(baseSize) {
    const viewport = Utils.getViewportSize()
    const sizeConfig = this.config.particles?.size
    
    // Check if we have responsive properties in size config
    if (!sizeConfig || 
        (typeof sizeConfig.min_size === 'undefined' && 
         typeof sizeConfig.max_size === 'undefined' &&
         typeof sizeConfig.scale_factor === 'undefined')) {
      return baseSize
    }
    
    // EXACT OLD CALCULATION: viewportRatio + (scale_factor * viewport.width)
    const viewportRatio = viewport.width / (sizeConfig.base_viewport || 600)
    const dynamicMultiplier = Math.max(0.3, Math.min(2.0, viewportRatio + (sizeConfig.scale_factor || 0.0005) * viewport.width))
    
    const calculatedSize = baseSize * dynamicMultiplier
    // EXACT OLD CLAMP: uses sizeConfig.min_size and sizeConfig.max_size directly
    return Math.min(Math.max(calculatedSize, sizeConfig.min_size || 0.8), sizeConfig.max_size || 4.0)
  }

  /**
   * Calculate responsive particle density based on viewport
   * @param {number} baseDensity - Base particle density
   * @returns {number} Calculated responsive density
   */
  calculateResponsiveDensity(baseDensity) {
    // Always return base density - no responsive density calculation
    return baseDensity
  }

  /**
   * Get responsive breakpoint multiplier
   * @returns {number} Multiplier based on current viewport
   */
  getBreakpointMultiplier() {
    if (!this.config.responsive?.breakpoints) {
      return 1.0
    }
    
    const viewport = Utils.getViewportSize()
    const breakpoints = this.config.responsive.breakpoints
    
    if (viewport.width <= (breakpoints.mobile?.max_width || 768)) {
      return breakpoints.mobile?.multiplier || 0.6
    } else if (viewport.width <= (breakpoints.tablet?.max_width || 1024)) {
      return breakpoints.tablet?.multiplier || 1.0
    } else {
      return breakpoints.desktop?.multiplier || 1.5
    }
  }
}

export default ResponsiveCalculator
