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
    if (!this.config.responsive?.enabled) {
      return baseSize
    }
    
    const viewport = Utils.getViewportSize()
    const sizeConfig = this.config.responsive.size || this.config.particles?.size?.responsive
    
    if (!sizeConfig) {
      return baseSize
    }
    
    // Calculate dynamic multiplier based on viewport width
    const viewportRatio = viewport.width / (sizeConfig.base_viewport || 600)
    const dynamicMultiplier = Utils.clamp(
      1.0 + (viewportRatio - 1.0) * (sizeConfig.scale_factor || 0.0005) * viewport.width,
      0.3,
      2.0
    )
    
    const calculatedSize = baseSize * dynamicMultiplier
    return Utils.clamp(
      calculatedSize,
      sizeConfig.min_size || 0.8,
      sizeConfig.max_size || 4.0
    )
  }

  /**
   * Calculate responsive particle density based on viewport
   * @param {number} baseDensity - Base particle density
   * @returns {number} Calculated responsive density
   */
  calculateResponsiveDensity(baseDensity) {
    if (!this.config.responsive?.enabled) {
      return baseDensity
    }
    
    const viewport = Utils.getViewportSize()
    const densityConfig = this.config.responsive.density || this.config.particles?.responsive?.density
    
    if (!densityConfig) {
      return baseDensity
    }
    
    // Calculate dynamic density based on viewport width
    const viewportRatio = viewport.width / (densityConfig.base_viewport || 600)
    const dynamicDensity = (densityConfig.min_density || 50) + 
      (viewportRatio - 0.5) * (densityConfig.scale_factor || 0.08) * viewport.width
    
    return Utils.clamp(
      dynamicDensity,
      densityConfig.min_density || 50,
      densityConfig.max_density || 200
    )
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
