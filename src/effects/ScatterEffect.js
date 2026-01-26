import { Utils } from '../utils/Utils.js'

/**
 * Scatter effect for particles - creates explosion-like dispersal
 */
export class ScatterEffect {
  constructor(config) {
    this.config = config?.scatter || {}
    this.force = this.config.force || 3
    this.isScattered = false
    this.originalPositions = new Map()
  }

  /**
   * Scatter particles away from current positions
   * @param {Array} particles - Array of particles to scatter
   */
  scatterParticles(particles) {
    // Store original positions if not already scattered
    if (!this.isScattered) {
      this.originalPositions.clear()
      particles.forEach(particle => {
        this.originalPositions.set(particle, {
          x: particle.destX ?? particle.x,
          y: particle.destY ?? particle.y
        })
      })
    }

    this.isScattered = true
    
    particles.forEach(particle => {
      // Calculate random scatter direction
      const scatterAngle = Math.random() * 2 * Math.PI
      
      // Set new destination far from current position
      const scatterDistance = this.force * (particle.isSecondary ? 25 : 30)
      particle.destX = particle.x + Math.cos(scatterAngle) * scatterDistance
      particle.destY = particle.y + Math.sin(scatterAngle) * scatterDistance
      
      // Give particles initial velocity in scatter direction
      const scatterVelocity = particle.isSecondary ? this.force * 0.8 : this.force
      particle.vx = Math.cos(scatterAngle) * scatterVelocity
      particle.vy = Math.sin(scatterAngle) * scatterVelocity
      
      // Reduce friction to allow particles to travel
      particle.friction = 0.85
      
      // Mark particle as scattered
      particle.isScattered = true
    })

  }

  /**
   * Check if particle should return from scattered state
   * @param {Object} particle - Particle to check
   * @returns {boolean} True if particle should return
   */
  shouldReturn(particle) {
    if (!particle.isScattered) return false
    
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
    return velocity < 0.1
  }

  /**
   * Return particle to original position
   * @param {Object} particle - Particle to return
   */
  returnParticle(particle) {
    const original = this.originalPositions.get(particle)
    if (original) {
      particle.destX = original.x
      particle.destY = original.y
      particle.friction = Math.random() * 0.01 + 0.92 // Reset normal friction
      particle.isScattered = false
    }
  }

  /**
   * Reset scatter state
   */
  reset() {
    this.isScattered = false
    this.originalPositions.clear()
  }

  /**
   * Update scatter configuration
   * @param {Object} newConfig - New scatter configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.force = this.config.force || 3
  }
}

export default ScatterEffect
