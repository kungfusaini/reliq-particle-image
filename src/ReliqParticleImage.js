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

    const featureOverrides = config.features || {}

    // Feature toggles (opt-in or inferred)
    this.features = {
      responsive: featureOverrides.responsive ?? config.responsive?.enabled !== false,
      secondaryParticles: featureOverrides.secondaryParticles ?? config.secondary_particles?.enabled === true,
      animation: featureOverrides.animation ?? config.animation?.enabled === true,
      floating: featureOverrides.floating ?? config.particles?.movement?.floating?.enabled === true,
      scatter: featureOverrides.scatter ?? config.particles?.scatter?.force !== undefined,
      fade: featureOverrides.fade ?? config.particles?.fade_out?.enabled === true,
      interactivity: featureOverrides.interactivity ?? true
    }

    this.flow = this.config.flow || {}
    this.flowState = {
      animationTriggered: false,
      floatingDisabled: false,
      currentStageIndex: this.flow.current_stage_index || 0,
      stages: this.flow.stages || [],
      autoProgress: this.flow.auto_progress !== false
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
    this.interactionManager.initialize()

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
    this.context = this.canvas.getContext('2d', { willReadFrequently: true })
    this.updateCanvasSize()
  }

  /**
   * Update canvas dimensions
   */
  updateCanvasSize() {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight
    if (this.context) {
      this.context.imageSmoothingEnabled = true
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (this.features.interactivity) {
      this.interactionManager.attach()
    }

    if (this.animationSystem && this.isCurrentStage('wait_for_click')) {
      this.canvas.style.cursor = 'pointer'
      this.canvas.addEventListener('click', this.handleFlowClick.bind(this))
      this.canvas.addEventListener('touchstart', this.handleFlowClick.bind(this), {
        passive: false,
      })
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
   * Check if given stage type is currently active
   * @param {string} stageType - Type of stage to check
   * @returns {boolean} True if stage is active
   */
  isCurrentStage(stageType) {
    if (!this.flowState.stages || this.flowState.stages.length === 0) {
      return false
    }
    
    const currentStage = this.flowState.stages[this.flowState.currentStageIndex]
    return currentStage && currentStage.type === stageType && currentStage.enabled !== false
  }
  
  /**
   * Progress to next stage in flow
   */
  progressToNextStage() {
    if (!this.flowState.stages || this.flowState.stages.length === 0) {
      return
    }
    
    const currentIndex = this.flowState.currentStageIndex
    if (currentIndex < this.flowState.stages.length - 1) {
      this.flowState.currentStageIndex = currentIndex + 1
      this.executeCurrentStage()
      
      // Dispatch stage change event
      document.dispatchEvent(new CustomEvent('particleFlowStageChanged', {
        detail: {
          stage: this.flowState.stages[this.flowState.currentStageIndex],
          index: this.flowState.currentStageIndex,
          totalStages: this.flowState.stages.length,
          timestamp: performance.now()
        }
      }))
    }
  }
  
  /**
   * Execute current stage actions
   */
  executeCurrentStage() {
    if (!this.flowState.stages || this.flowState.stages.length === 0) {
      return
    }
    
    const stage = this.flowState.stages[this.flowState.currentStageIndex]
    if (!stage || stage.enabled === false) {
      this.progressToNextStage()
      return
    }
    
    switch (stage.type) {
      case 'float':
        this.executeFloatStage()
        break
      case 'wait_for_click':
        this.executeWaitForClickStage()
        break
      case 'animation':
        this.executeAnimationStage(stage)
        break
      case 'disable_floating':
        this.executeDisableFloating()
        break
      case 'scatter':
        this.executeScatter()
        break
      case 'fade_out':
        this.executeFadeOut()
        break
    }
  }
  
  /**
   * Execute float stage
   */
  executeFloatStage() {
    if (this.floatingEffect) {
      this.floatingEffect.updateConfig({
        particles: {
          movement: {
            floating: { enabled: true }
          }
        }
      });
      this.flowState.floatingDisabled = false;
    }
  }
  
  /**
   * Initialize flow system
   */
  initializeFlow() {
    if (this.flowState.stages && this.flowState.stages.length > 0) {
      this.executeCurrentStage();
    }
  }
  
  /**
   * Execute wait for click stage
   */
  executeWaitForClickStage() {
    // Already handled by event listeners in setupEventListeners
    this.canvas.style.cursor = 'pointer';
  }
  
  /**
   * Execute animation stage
   */
  executeAnimationStage(stage) {
    if (!this.animationSystem || !this.features.animation) {
      this.progressToNextStage()
      return
    }
    
    const playOnce = stage.play_once !== false
    
    // Setup animation system based on stage config
    if (playOnce) {
      this.config.animation = { ...this.config.animation, loop: false }
      this.animationSystem.updateConfig({ animation: { loop: false } })
    }
    
    // Start animation immediately or wait for trigger?
    if (stage.auto_start !== false) {
      if (this.floatingEffect && !this.flowState.floatingDisabled) {
        this.animationSystem.floatOffset = this.floatingEffect.calculateOffset()
      }
      this.animationSystem.start()
    }
  }

  /**
   * Handle click/touch to trigger animation or next stage
   */
  handleFlowClick(event) {
    if (event?.type === 'touchstart') {
      event.preventDefault()
    }

    if (this.isCurrentStage('wait_for_click')) {
      this.progressToNextStage()
    } else if (this.isCurrentStage('animation')) {
      const stage = this.flowState.stages[this.flowState.currentStageIndex]
      if (stage.auto_start === false) {
        this.startAnimation()
      }
    }
  }

  /**
   * Trigger animation playback based on flow settings
   */
  handleAnimationTrigger(event) {
    if (event?.type === 'touchstart') {
      event.preventDefault()
    }

    if (!this.animationSystem || !this.features.animation) {
      return
    }

    if (this.animationSystem && this.animationSystem.isPlaying && typeof this.animationSystem.isPlaying === 'function' && this.animationSystem.isPlaying()) {
      return
    }

    if (this.flow.play_once && this.flowState.animationTriggered) {
      return
    }

    if (this.floatingEffect && !this.flowState.floatingDisabled) {
      this.animationSystem.floatOffset = this.floatingEffect.calculateOffset()
    }

    this.flowState.animationTriggered = true
    this.animationSystem.start()
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
        // Create particles from first animation frame
        const firstFramePixels = await this.getFirstAnimationFrame()
        if (firstFramePixels) {
          this.primarySystem.createImageParticles(firstFramePixels, this.config.particles?.start_scrambled !== true)
        }
        
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

    // Initialize flow
    this.initializeFlow()

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
   * Get first animation frame for initial particle creation
   */
  async getFirstAnimationFrame() {
    if (!this.animationSystem || !this.config.animation?.frames?.length) {
      return null
    }
    
    // Make sure animation system is initialized
    await this.animationSystem.initialize()
    
    // Set current frame to first frame
    const firstFrame = this.config.animation.frames[0]
    this.animationSystem.setFrame(firstFrame)
    
    // Get pixel data for first frame
    return this.animationSystem.getCurrentFramePixels()
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

    const ctx = this.context
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // Calculate image bounds
    const bounds = this.calculateImageBounds()
    ctx.drawImage(this.image, bounds.x, bounds.y, bounds.width, bounds.height)
    
    const pixelData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height)
    pixelData.bounds = bounds
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
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

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
    let animationPlaying = false
    if (this.animationSystem && this.animationSystem.isPlaying && typeof this.animationSystem.isPlaying === 'function') {
      animationPlaying = this.animationSystem.isPlaying()
    }
    const allowInteractivity =
      this.features.interactivity &&
      (!animationPlaying || this.flow.disable_interactivity_during_animation !== true)
    const interactionState = allowInteractivity && this.interactionManager
      ? this.interactionManager.getInteractionState()
      : null
    const interactionManager = interactionState ? this.interactionManager : null

    // Update primary particles
    this.primarySystem.updateParticles(interactionManager, interactionState)

    // Update secondary particles
    if (this.secondarySystem) {
      this.secondarySystem.updateParticles(interactionManager, interactionState)
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
    const opacity = this.fadeEffect ? this.fadeEffect.getCurrentOpacity() : 1.0
    let animationPlaying = false
    if (this.animationSystem && this.animationSystem.isPlaying && typeof this.animationSystem.isPlaying === 'function') {
      animationPlaying = this.animationSystem.isPlaying()
    }
    let floatOffset = { x: 0, y: 0 }

    if (this.floatingEffect && !this.flowState.floatingDisabled) {
      if (animationPlaying && this.animationSystem?.floatOffset) {
        floatOffset = this.animationSystem.floatOffset
      } else if (!animationPlaying) {
        floatOffset = this.floatingEffect.calculateOffset()
      }
    }

    // Determine render order
    const renderSecondaryFirst = this.config.secondary_particles?.render_order === 'background'

    if (floatOffset.x !== 0 || floatOffset.y !== 0) {
      this.context.save()
      this.context.translate(floatOffset.x, floatOffset.y)
    }

    if (renderSecondaryFirst && this.secondarySystem) {
      this.secondarySystem.renderParticles(opacity)
      this.primarySystem.renderParticles(opacity)
    } else {
      this.primarySystem.renderParticles(opacity)
      if (this.secondarySystem) {
        this.secondarySystem.renderParticles(opacity)
      }
    }

    if (floatOffset.x !== 0 || floatOffset.y !== 0) {
      this.context.restore()
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
    if (this.flowState.autoProgress) {
      this.progressToNextStage()
    }
    
    if (this.isCurrentStage('disable_floating')) {
      this.executeDisableFloating()
    }
    
    if (this.isCurrentStage('scatter')) {
      this.executeScatter()
    }
    
    if (this.isCurrentStage('fade_out')) {
      this.executeFadeOut()
    }
  }
  
  /**
   * Execute disable floating stage
   */
  executeDisableFloating() {
    this.flowState.floatingDisabled = true
    if (this.config.particles?.movement?.floating) {
      this.config.particles.movement.floating.enabled = false
    }
    if (this.floatingEffect) {
      this.floatingEffect.updateConfig(this.config)
    }
  }
  
  /**
   * Execute scatter stage
   */
  executeScatter() {
    if (this.scatterEffect) {
      const primaryParticles = this.primarySystem.getParticles()
      const secondaryParticles = this.secondarySystem?.getParticles() || []
      this.scatterEffect.scatterParticles([...primaryParticles, ...secondaryParticles])
    }
  }
  
  /**
   * Execute fade out stage
   */
  executeFadeOut() {
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
    // Clear all particles after fade
    this.primarySystem.clearParticles()
    if (this.secondarySystem) {
      this.secondarySystem.clearParticles()
    }
    
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
    if (this.animationSystem && this.animationSystem.isPlaying && typeof this.animationSystem.isPlaying === 'function') {
      return this.animationSystem.isPlaying()
    }
    return false
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
      animationPlaying: (this.animationSystem && this.animationSystem.isPlaying && typeof this.animationSystem.isPlaying === 'function') ? this.animationSystem.isPlaying() : false,
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
