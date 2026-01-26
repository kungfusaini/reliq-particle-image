import { Utils, ResponsiveCalculator, ConfigMerger } from './utils/index.js'
import { FloatingEffect, ScatterEffect, FadeEffect } from './effects/index.js'
import { InteractionManager } from './interaction/index.js'
import { CoreParticleSystem, SecondaryParticleSystem, AnimationSystem } from './core/index.js'

/**
 * Enhanced Particle Image System with modular architecture
 */
export class ReliqParticleImage {
  constructor(container, config = {}) {
    // Validate configuration
    const validation = ConfigMerger.validateConfig(config)
    if (!validation.valid) {
      console.error('Invalid configuration:', validation.errors)
      throw new Error('Invalid configuration: ' + validation.errors.join(', '))
    }

    // Set defaults and merge configuration
    this.config = ConfigMerger.setDefaults(config)
    
    // Initialize container and canvas
    this.container = typeof container === 'string' ? document.querySelector(container) : container
    if (!this.container) {
      throw new Error('Container not found: ' + container)
    }

    this.canvas = null
    this.isInitialized = false
    this.isDestroyed = false

    // Feature toggles (opt-in)
    this.features = {
      responsive: config.features?.responsive !== false,
      secondaryParticles: config.features?.secondaryParticles === true,
      animation: config.features?.animation === true,
      floating: config.features?.floating === true,
      scatter: config.features?.scatter !== false,
      fade: config.features?.fade === true,
      interactivity: config.features?.interactivity !== false
    }

    // Initialize systems based on features
    this.initializeSystems()
  }

  /**
   * Initialize all systems based on enabled features
   */
  initializeSystems() {
    // Setup canvas
    this.setupCanvas()

    // Core utilities
    this.responsiveCalculator = new ResponsiveCalculator(this.config)
    this.interactionManager = new InteractionManager(this.canvas, this.config)

    // Effects
    this.floatingEffect = this.features.floating ? new FloatingEffect(this.config) : null
    this.scatterEffect = this.features.scatter ? new ScatterEffect(this.config) : null
    this.fadeEffect = this.features.fade ? new FadeEffect(this.config) : null

    // Core particle systems
    this.primarySystem = new CoreParticleSystem(this.config, this.canvas, this.responsiveCalculator)
    this.secondarySystem = this.features.secondaryParticles 
      ? new SecondaryParticleSystem(this.config, this.canvas, this.responsiveCalculator)
      : null

    // Animation system
    this.animationSystem = this.features.animation 
      ? new AnimationSystem(this.config, this.canvas)
      : null

    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Setup canvas element
   */
  setupCanvas() {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'particle-image-canvas'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.touchAction = 'none'
    
    this.container.appendChild(this.canvas)
    this.updateCanvasSize()
  }

  /**
   * Update canvas dimensions
   */
  updateCanvasSize() {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.features.interactivity) {
      this.interactionManager.attach()
    }

    // Handle resize
    window.addEventListener('resize', Utils.debounce(() => {
      this.handleResize()
    }, 200))

    // Handle animation events
    if (this.animationSystem) {
      document.addEventListener('animationStopped', this.handleAnimationStopped.bind(this))
      document.addEventListener('animationFrameChanged', this.handleAnimationFrameChanged.bind(this))
    }
  }

  /**
   * Initialize the particle system
   */
  async initialize() {
    if (this.isInitialized || this.isDestroyed) {
      return
    }

    try {
      // Initialize animation system first if enabled (to cache frames)
      if (this.animationSystem) {
        await this.animationSystem.initialize()
      }

      // Load image and create particles
      await this.loadImage()
      
      if (this.animationSystem) {
        // Start with animation if configured
        if (this.config.animation?.auto_start) {
          this.animationSystem.start()
        }
      } else {
        // Create static image particles
        const pixelData = this.getImagePixels()
        this.primarySystem.createImageParticles(pixelData, this.config.particles?.start_scrambled !== true)
      }

      this.isInitialized = true

      if (typeof window !== 'undefined') {
        window.particleImageDisplayerReady = true
        window.particleImageInitialized = true
      }

      // Start animation loop
      this.startAnimationLoop()

      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('particleImageReady', {
        detail: { 
          timestamp: performance.now(),
          features: this.features,
          particleCount: this.primarySystem.getParticleCount() + 
                       (this.secondarySystem?.getParticleCount() || 0)
        }
      }))

    } catch (error) {
      console.error('Failed to initialize particle system:', error)
      this.handleError(error)
    }
  }

  /**
   * Load the main image
   */
  loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.addEventListener('load', () => {
        this.image = img
        this.imageLoaded = true
        resolve()
      })
      
      img.addEventListener('error', () => {
        console.error('Failed to load image:', this.config.image?.src?.path)
        reject(new Error('Failed to load image'))
      })
      
      img.src = this.config.image?.src?.path
      if (this.config.image?.src?.is_external) {
        img.crossOrigin = "anonymous"
      }
    })
  }

  /**
   * Get image pixel data
   */
  getImagePixels() {
    if (!this.imageLoaded) {
      return null
    }

    const ctx = this.canvas.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Calculate image bounds
    const bounds = this.calculateImageBounds()
    ctx.drawImage(this.image, bounds.x, bounds.y, bounds.width, bounds.height)
    
    const pixelData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    return pixelData
  }

  /**
   * Calculate image bounds for rendering
   */
  calculateImageBounds() {
    const aspectRatio = this.image.width / this.image.height
    const canvasAspectRatio = this.canvas.width / this.canvas.height
    
    let width, height
    const canvasPct = this.config.image?.size?.canvas_pct || 50
    const minPx = this.config.image?.size?.min_px || 350
    const maxPx = this.config.image?.size?.max_px || 2000
    
    if (aspectRatio < canvasAspectRatio) {
      // Canvas height constrains image size
      height = Utils.clamp(Math.round(this.canvas.height * canvasPct / 100), minPx, maxPx)
      width = Math.round(height * aspectRatio)
    } else {
      // Canvas width constrains image size
      width = Utils.clamp(Math.round(this.canvas.width * canvasPct / 100), minPx, maxPx)
      height = Math.round(width / aspectRatio)
    }
    
    // Calculate position with image-relative offsets
    const xPct = this.config.image?.position?.x_img_pct || -15
    const yPct = this.config.image?.position?.y_img_pct || -8
    const xOffset = (width * xPct) / 100
    const yOffset = (height * yPct) / 100
    
    const x = this.canvas.width / 2 - width / 2 + xOffset
    const y = this.canvas.height / 2 - height / 2 + yOffset
    
    return { x, y, width, height }
  }

  /**
   * Main animation loop
   */
  startAnimationLoop() {
    const animate = () => {
      if (this.isDestroyed) {
        return
      }

      // Clear canvas
      const ctx = this.canvas.getContext('2d')
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Update systems
      this.updateSystems()

      // Render systems
      this.renderSystems()

      requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Update all systems
   */
  updateSystems() {
    // Update primary particles
    this.primarySystem.updateParticles()

    // Update secondary particles
    if (this.secondarySystem) {
      this.secondarySystem.updateParticles()
    }

    // Update animation system
    if (this.animationSystem) {
      // Animation system handles its own updates
    }

    // Update effects
    if (this.fadeEffect) {
      if (this.fadeEffect.update()) {
        // Fade completed
        this.handleFadeComplete()
      }
    }
  }

  /**
   * Render all systems
   */
  renderSystems() {
    const ctx = this.canvas.getContext('2d')
    const opacity = this.fadeEffect ? this.fadeEffect.getCurrentOpacity() : 1.0

    // Determine render order
    const renderSecondaryFirst = this.config.secondary_particles?.render_order === 'background'

    if (renderSecondaryFirst && this.secondarySystem) {
      this.secondarySystem.renderParticles(opacity)
      this.primarySystem.renderParticles(opacity)
    } else {
      this.primarySystem.renderParticles(opacity)
      if (this.secondarySystem) {
        this.secondarySystem.renderParticles(opacity)
      }
    }
  }

  /**
   * Handle resize events
   */
  handleResize() {
    this.updateCanvasSize()
    
    // Recreate particles with new dimensions
    if (this.imageLoaded) {
      if (this.animationSystem) {
        // Animation system handles particle creation
        this.animationSystem.initialize()
      } else {
        const pixelData = this.getImagePixels()
        this.primarySystem.createImageParticles(pixelData, true)
      }
    }
  }

  /**
   * Handle animation stopped event
   */
  handleAnimationStopped(event) {
    // Trigger scatter and fade effects
    if (this.scatterEffect) {
      const primaryParticles = this.primarySystem.getParticles()
      const secondaryParticles = this.secondarySystem?.getParticles() || []
      this.scatterEffect.scatterParticles([...primaryParticles, ...secondaryParticles], true)
    }

    if (this.fadeEffect) {
      this.fadeEffect.startFadeOut()
    }
  }

  /**
   * Handle animation frame changed event
   */
  handleAnimationFrameChanged(event) {
    // Update primary particles for new frame
    const pixelData = this.animationSystem.getCurrentFramePixels()
    if (pixelData) {
      this.primarySystem.createImageParticles(pixelData, true)
    }
  }

  /**
   * Handle fade complete event
   */
  handleFadeComplete() {
    // Clear primary particles but keep secondary
    this.primarySystem.clearParticles()
    
    // Dispatch completion event
    document.dispatchEvent(new CustomEvent('particleAnimationComplete', {
      detail: { 
        timestamp: performance.now(),
        particleSystem: 'primary'
      }
    }))
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('Particle system error:', error)
    document.dispatchEvent(new CustomEvent('particleImageError', {
      detail: { error: error.message, timestamp: performance.now() }
    }))
  }

  /**
   * Start animation (if animation system is enabled)
   */
  startAnimation() {
    if (this.animationSystem) {
      this.animationSystem.start()
    } else {
      console.warn('Animation system not enabled')
    }
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    if (this.animationSystem) {
      this.animationSystem.stop()
    }
  }

  /**
   * Set animation frame to a specific frame number
   * @param {number} frameNum - Frame number to show
   */
  setAnimationFrame(frameNum) {
    if (!this.animationSystem) {
      return
    }

    this.animationSystem.setFrame(frameNum)
  }

  /**
   * Advance to the next animation frame
   */
  nextAnimationFrame() {
    if (!this.animationSystem) {
      return
    }

    const frames = this.animationSystem.animationFrames || []
    if (frames.length === 0) {
      return
    }

    const currentFrame = this.animationSystem.getCurrentFrame()
    const currentIndex = frames.indexOf(currentFrame)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % frames.length
    this.animationSystem.setFrame(frames[nextIndex])
  }

  /**
   * Go back to the previous animation frame
   */
  previousAnimationFrame() {
    if (!this.animationSystem) {
      return
    }

    const frames = this.animationSystem.animationFrames || []
    if (frames.length === 0) {
      return
    }

    const currentFrame = this.animationSystem.getCurrentFrame()
    const currentIndex = frames.indexOf(currentFrame)
    const prevIndex = currentIndex <= 0 ? frames.length - 1 : currentIndex - 1
    this.animationSystem.setFrame(frames[prevIndex])
  }

  /**
   * Set animation speed multiplier
   * @param {number} speedMultiplier - Multiplier for playback speed
   */
  setAnimationSpeed(speedMultiplier) {
    if (!this.animationSystem || !Utils.isValidNumber(speedMultiplier)) {
      return
    }

    const baseDuration = this.config.animation?.frame_duration_ms || 150
    const frameDuration = Math.max(10, baseDuration / speedMultiplier)
    this.animationSystem.updateConfig({
      animation: {
        frame_duration_ms: frameDuration
      }
    })
  }

  /**
   * Check if animation is currently playing
   */
  isAnimationPlaying() {
    return this.animationSystem ? this.animationSystem.isPlaying === true : false
  }

  /**
   * Get current animation frame number
   */
  getAnimationFrame() {
    return this.animationSystem ? this.animationSystem.getCurrentFrame() : null
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = Utils.deepExtend(this.config, newConfig)
    
    // Update feature toggles
    if (newConfig.features) {
      this.features = { ...this.features, ...newConfig.features }
    }

    // Update systems
    if (this.interactionManager) {
      this.interactionManager.updateConfig(this.config)
    }
    if (this.floatingEffect) {
      this.floatingEffect.updateConfig(this.config)
    }
    if (this.scatterEffect) {
      this.scatterEffect.updateConfig(this.config)
    }
    if (this.fadeEffect) {
      this.fadeEffect.updateConfig(this.config)
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      primaryParticles: this.primarySystem.getParticleCount(),
      secondaryParticles: this.secondarySystem?.getParticleCount() || 0,
      totalParticles: this.primarySystem.getParticleCount() + (this.secondarySystem?.getParticleCount() || 0),
      animationPlaying: this.animationSystem?.isPlaying() || false,
      currentFrame: this.animationSystem?.getCurrentFrame() || null,
      features: this.features
    }
  }

  /**
   * Destroy the particle system and clean up
   */
  destroy() {
    this.isDestroyed = true

    // Detach event listeners
    if (this.interactionManager) {
      this.interactionManager.detach()
    }

    // Clear particles
    if (this.primarySystem) {
      this.primarySystem.clearParticles()
    }
    if (this.secondarySystem) {
      this.secondarySystem.clearParticles()
    }

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    // Clear references
    this.canvas = null
    this.image = null
    this.primarySystem = null
    this.secondarySystem = null
    this.animationSystem = null
    this.interactionManager = null
    this.floatingEffect = null
    this.scatterEffect = null
    this.fadeEffect = null
  }

  /**
   * Static factory method for easy creation
   */
  static create(container, config = {}) {
    return new ReliqParticleImage(container, config)
  }

  /**
   * Static method to create with feature presets
   */
  static withFeatures(container, features = {}, config = {}) {
    const fullConfig = {
      ...config,
      features
    }
    return new ReliqParticleImage(container, fullConfig)
  }
}

export default ReliqParticleImage
