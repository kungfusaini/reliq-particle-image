import { Utils, ResponsiveCalculator } from '../utils/index.js'

import { ConfigMerger } from '../utils/ConfigMerger.js'

/**
 * Secondary particle system for background/foreground effects
 */
export class SecondaryParticleSystem {
  constructor(config, canvas, responsiveCalculator) {
    this.config = config
    this.canvas = canvas
    this.context = canvas.getContext('2d', { willReadFrequently: true })
    this.particles = []
    this.responsiveCalculator = responsiveCalculator
    this.mergedConfig = null

    if (config.secondary_particles?.enabled) {
      this.initializeSystem()
    }
  }

  /**
   * Initialize secondary particle system
   */
  initializeSystem() {
    // Merge secondary config with primary config
    this.mergedConfig = ConfigMerger.mergeSecondaryConfig(
      this.config.particles,
      this.config.secondary_particles
    )
    this.createSecondaryParticles()
  }

  /**
   * Create secondary particles based on placement mode
   */
  createSecondaryParticles() {
    if (!this.mergedConfig) return

    const placementMode = this.config.secondary_particles.placement_mode || 'grid'
    
    switch (placementMode) {
      case 'grid':
        this.createGridParticles()
        break
      case 'random':
        this.createRandomParticles()
        break
      case 'around_image':
        this.createAroundImageParticles()
        break
      default:
        console.warn('Unknown placement mode:', placementMode, '- defaulting to grid')
        this.createGridParticles()
    }
  }

  /**
   * Create grid-based particles
   */
  createGridParticles() {
    const spacing = this.config.secondary_particles.grid_spacing || 20
    const cols = Math.floor(this.canvas.width / spacing)
    const rows = Math.floor(this.canvas.height / spacing)
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = (i + 0.5) * spacing
        const y = (j + 0.5) * spacing
        this.particles.push(new SecondaryParticle(x, y, this.mergedConfig, this.responsiveCalculator))
      }
    }
  }

  /**
   * Create randomly placed particles
   */
  createRandomParticles() {
    const density = this.responsiveCalculator.calculateResponsiveDensity(
      this.mergedConfig.density
    )
    const particleMultiplier = this.config.secondary_particles.particle_multiplier || 0.075
    const margin = this.config.secondary_particles.random_margin || 50
    const minSpacing = 10
    
    const particleCount = Math.floor(
      density * (this.canvas.width * this.canvas.height) / 10000 * particleMultiplier
    )
    
    for (let i = 0; i < particleCount; i++) {
      let x, y
      let attempts = 0
      
      // Try to place particle without overlap
      do {
        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2
        const maxRadius = (Math.min(this.canvas.width, this.canvas.height) * 
                         (this.config.secondary_particles.placement_radius_percentage || 100)) / 200
        
        const angle = Math.random() * 2 * Math.PI
        const distance = Math.random() * maxRadius
        x = centerX + Math.cos(angle) * distance
        y = centerY + Math.sin(angle) * distance
        attempts++
      } while (attempts < 50 && Utils.hasOverlap(x, y, this.particles, minSpacing))
      
      if (attempts < 50) {
        this.particles.push(new SecondaryParticle(x, y, this.mergedConfig, this.responsiveCalculator))
      }
    }
  }

  /**
   * Create particles around image area
   */
  createAroundImageParticles() {
    const density = this.responsiveCalculator.calculateResponsiveDensity(
      this.mergedConfig.density
    )
    const particleMultiplier = this.config.secondary_particles.particle_multiplier || 0.075
    const bufferPercent = (this.config.secondary_particles.placement_image_buffer || 20) / 100
    const minSpacing = 10
    
    // Calculate elliptical bounds (would need image dimensions here)
    const canvasCenterX = this.canvas.width / 2
    const canvasCenterY = this.canvas.height / 2
    const baseRadius = Math.min(this.canvas.width, this.canvas.height) / 2 * (1 + bufferPercent)
    
    const particleCount = Math.floor(
      density * (this.canvas.width * this.canvas.height) / 10000 * particleMultiplier
    )
    
    for (let i = 0; i < particleCount; i++) {
      let x, y
      let attempts = 0
      
      do {
        const angle = Math.random() * 2 * Math.PI
        const normalizedRadius = Math.random()
        x = canvasCenterX + Math.cos(angle) * baseRadius * Math.sqrt(normalizedRadius)
        y = canvasCenterY + Math.sin(angle) * baseRadius * Math.sqrt(normalizedRadius)
        attempts++
      } while (attempts < 50 && Utils.hasOverlap(x, y, this.particles, minSpacing))
      
      if (attempts < 50) {
        this.particles.push(new SecondaryParticle(x, y, this.mergedConfig, this.responsiveCalculator))
      }
    }
  }

  /**
   * Update all secondary particles
   */
  updateParticles() {
    if (!this.particles.length) return

    for (const particle of this.particles) {
      particle.update()
    }
  }

  /**
   * Render all secondary particles
   * @param {number} opacity - Global opacity multiplier
   */
  renderParticles(opacity = 1.0) {
    if (!this.particles.length) return

    for (const particle of this.particles) {
      particle.render(this.context, opacity)
    }
  }

  /**
   * Get all particles
   * @returns {Array} Array of secondary particles
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
 * Individual secondary particle class
 */
class SecondaryParticle {
  constructor(x, y, config, responsiveCalculator) {
    this.x = x
    this.y = y
    this.destX = x  // Secondary particles don't move to a destination
    this.destY = y
    this.config = config
    this.responsiveCalculator = responsiveCalculator

    // Physics properties
    this.vx = 0
    this.vy = 0
    this.accX = 0
    this.accY = 0
    this.friction = Math.random() * 0.01 + 0.92

    // Visual properties
    this.color = config.color || '#ffffff'
    this.radius = this.calculateRadius()
    this.targetRadius = this.radius

    // Movement properties
    this.restlessness = {
      maxDisplacement: Math.ceil(Math.random() * (config.movement?.restless?.value || 10)),
      xJitter: Math.floor(Math.random() * 7) - 3,
      yJitter: Math.floor(Math.random() * 7) - 3,
      onCurrFrame: false
    }

    // Random movement properties
    this.randomMovement = {
      enabled: config.movement?.random?.enabled || false,
      speed: config.movement?.random?.speed || 0.1,
      currentDirection: Math.random() * 2 * Math.PI
    }

    // Initialize random velocity if enabled
    if (this.randomMovement.enabled) {
      this.vx = Math.cos(this.randomMovement.currentDirection) * this.randomMovement.speed
      this.vy = Math.sin(this.randomMovement.currentDirection) * this.randomMovement.speed
    }

    this.isScattered = false
    this.scatterOriginal = null
  }

  /**
   * Calculate responsive particle radius
   */
  calculateRadius() {
    const baseSize = this.config.size?.value || 2
    const responsiveSize = this.responsiveCalculator.calculateResponsiveSize(baseSize)
    const randomFactor = this.config.size?.random ? Math.max(Math.random(), 0.5) : 1
    
    return Math.round(randomFactor * responsiveSize)
  }

  /**
   * Update particle physics and position
   */
  update() {
    // Handle scatter behavior
    if (this.isScattered) {
      this.updateScatterMovement()
      return
    }

    // Apply random movement if enabled
    if (this.randomMovement.enabled) {
      this.updateRandomMovement()
    }

    // Apply restless movement if enabled
    if (this.config.movement?.restless?.enabled && this.restlessness.onCurrFrame) {
      this.applyRestlessMovement()
    } else if (!this.randomMovement.enabled) {
      // Apply friction when no random movement
      this.vx *= this.friction
      this.vy *= this.friction
      this.x += this.vx
      this.y += this.vy
    }

    // Smooth size transitions
    if (Math.abs(this.radius - this.targetRadius) > 0.1) {
      this.radius += (this.targetRadius - this.radius) * 0.1
    }
  }

  /**
   * Update scatter movement
   */
  updateScatterMovement() {
    // Move towards scatter destination
    this.accX = (this.destX - this.x) / 500
    this.accY = (this.destY - this.y) / 500
    this.vx = (this.vx + this.accX) * this.friction
    this.vy = (this.vy + this.accY) * this.friction
    this.x += this.vx
    this.y += this.vy
    
    // Check if particle has slowed down enough to transition
    const velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (velocity < 0.1) {
      this.isScattered = false
      this.scatterOriginal = null
      this.friction = Math.random() * 0.01 + 0.92
      
      // Re-initialize random direction
      if (this.randomMovement.enabled) {
        this.randomMovement.currentDirection = Math.random() * 2 * Math.PI
      }
    }
  }

  /**
   * Update random movement
   */
  updateRandomMovement() {
    // Calculate target velocity
    const targetVx = Math.cos(this.randomMovement.currentDirection) * this.randomMovement.speed
    const targetVy = Math.sin(this.randomMovement.currentDirection) * this.randomMovement.speed
    
    // Smoothly blend towards target velocity
    this.vx = this.vx * 0.9 + targetVx * 0.1
    this.vy = this.vy * 0.9 + targetVy * 0.1
    
    // Apply friction
    this.vx *= this.friction
    this.vy *= this.friction
    
    // Update position
    this.x += this.vx
    this.y += this.vy
    
    // Bounce off canvas edges
    this.handleBoundaryCollision()
  }

  /**
   * Handle boundary collisions for random movement
   */
  handleBoundaryCollision() {
    if (this.x < this.radius) {
      this.x = this.radius
      this.randomMovement.currentDirection = Math.PI - this.randomMovement.currentDirection
    }
    if (this.x > this.canvas.width - this.radius) {
      this.x = this.canvas.width - this.radius
      this.randomMovement.currentDirection = Math.PI - this.randomMovement.currentDirection
    }
    if (this.y < this.radius) {
      this.y = this.radius
      this.randomMovement.currentDirection = -this.randomMovement.currentDirection
    }
    if (this.y > this.canvas.height - this.radius) {
      this.y = this.canvas.height - this.radius
      this.randomMovement.currentDirection = -this.randomMovement.currentDirection
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
    context.fillStyle = this.color
    context.globalAlpha = globalOpacity
    context.beginPath()
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    context.fill()
    context.globalAlpha = 1.0 // Reset global alpha
  }
}

export default SecondaryParticleSystem
