import { Utils, ResponsiveCalculator } from '../utils/index.js'

/**
 * Core particle system for image-based particles
 */
export class CoreParticleSystem {
  constructor(config, canvas, responsiveCalculator) {
    this.config = config
    this.canvas = canvas
    this.context = canvas.getContext('2d', { willReadFrequently: true })
    this.particles = []
    this.responsiveCalculator = responsiveCalculator
  }

  /**
   * Create particles from image pixel data
   * @param {ImageData} pixelData - Image pixel data
   * @param {boolean} atDestination - Whether particles should start at destination
   */
  createImageParticles(pixelData, atDestination = false) {
    if (!pixelData || !pixelData.data || !pixelData.width || !pixelData.height) {
      console.error('Invalid pixel data provided to createImageParticles')
      return
    }

    this.particles = []
    const responsiveDensity = this.responsiveCalculator.calculateResponsiveDensity(
      this.config.particles.density
    )
    const increment = Math.max(1, Math.round(pixelData.width / responsiveDensity))

    for (let i = 0; i < pixelData.width; i += increment) {
      for (let j = 0; j < pixelData.height; j += increment) {
        const pixelIndex = (i + j * pixelData.width) * 4 + 3 // Alpha channel

        // Check if pixel has sufficient opacity
        if (pixelIndex < pixelData.data.length && pixelData.data[pixelIndex] > 128) {
          const destX = i
          const destY = j
          let initX, initY

          // Determine initial position
          if (atDestination || !this.config.particles.start_scrambled) {
            initX = destX
            initY = destY
          } else {
            initX = Math.random() * this.canvas.width
            initY = Math.random() * this.canvas.height
          }

          this.particles.push(new Particle(initX, initY, destX, destY, this.config, this.responsiveCalculator))
        }
      }
    }
  }

  /**
   * Update all particles
   */
  updateParticles() {
    for (const particle of this.particles) {
      particle.update()
    }
  }

  /**
   * Render all particles
   * @param {number} opacity - Global opacity multiplier
   */
  renderParticles(opacity = 1.0) {
    for (const particle of this.particles) {
      particle.render(this.context, opacity)
    }
  }

  /**
   * Get all particles
   * @returns {Array} Array of particles
   */
  getParticles() {
    return this.particles
  }

  /**
   * Clear all particles
   */
  clearParticles() {
    this.particles = []
  }

  /**
   * Get particle count
   * @returns {number} Number of particles
   */
  getParticleCount() {
    return this.particles.length
  }
}

/**
 * Individual particle class
 */
class Particle {
  constructor(initX, initY, destX, destY, config, responsiveCalculator) {
    this.x = initX
    this.y = initY
    this.destX = destX
    this.destY = destY
    this.config = config
    this.responsiveCalculator = responsiveCalculator

    // Physics properties
    this.vx = (Math.random() - 0.5) * (config.particles.movement.speed || 1)
    this.vy = (Math.random() - 0.5) * (config.particles.movement.speed || 1)
    this.accX = 0
    this.accY = 0
    this.friction = Math.random() * 0.01 + 0.92

    // Visual properties
    this.color = this.getParticleColor()
    this.radius = this.calculateRadius()
    this.targetRadius = this.radius

    // Movement properties
    this.restlessness = {
      maxDisplacement: Math.ceil(Math.random() * (config.particles.movement.restless?.value || 10)),
      xJitter: Math.floor(Math.random() * 7) - 3,
      yJitter: Math.floor(Math.random() * 7) - 3,
      onCurrFrame: false
    }
  }

  /**
   * Get particle color from configuration
   */
  getParticleColor() {
    const colors = this.config.particles.color
    if (Array.isArray(colors)) {
      return colors[Math.floor(Math.random() * colors.length)]
    }
    return colors || '#ffffff'
  }

  /**
   * Calculate responsive particle radius
   */
  calculateRadius() {
    const baseSize = this.config.particles.size.value || 2
    const responsiveSize = this.responsiveCalculator.calculateResponsiveSize(baseSize)
    const randomFactor = this.config.particles.size.random ? Math.max(Math.random(), 0.5) : 1
    
    return Math.round(randomFactor * responsiveSize)
  }

  /**
   * Update particle physics and position
   */
  update() {
    // Apply restless movement if enabled
    if (this.config.particles.movement.restless?.enabled && this.restlessness.onCurrFrame) {
      this.applyRestlessMovement()
    } else {
      // Apply movement towards destination
      this.accX = (this.destX - this.x) / 500
      this.accY = (this.destY - this.y) / 500
      this.vx = (this.vx + this.accX) * this.friction
      this.vy = (this.vy + this.accY) * this.friction
      this.x += this.vx
      this.y += this.vy
    }

    // Smooth size transitions
    if (Math.abs(this.radius - this.targetRadius) > 0.1) {
      this.radius += (this.targetRadius - this.radius) * 0.1
    }
  }

  /**
   * Apply restless/jitter movement
   */
  applyRestlessMovement() {
    this.x += this.restlessness.xJitter
    this.y += this.restlessness.yJitter
    
    const distance = Math.sqrt((this.destX - this.x) ** 2 + (this.destY - this.y) ** 2)
    if (distance >= this.restlessness.maxDisplacement) {
      this.restlessness.onCurrFrame = false
    }
  }

  /**
   * Render particle on canvas
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {number} globalOpacity - Global opacity multiplier
   */
  render(context, globalOpacity = 1.0) {
    let drawX = this.x
    let drawY = this.y

    context.fillStyle = this.color
    context.globalAlpha = globalOpacity
    context.beginPath()
    context.arc(drawX, drawY, this.radius, 0, Math.PI * 2, false)
    context.fill()
    context.globalAlpha = 1.0 // Reset global alpha
  }
}

export default CoreParticleSystem
