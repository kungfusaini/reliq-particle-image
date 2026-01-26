import { FrameCache } from '../utils/FrameCache.js'
import { Utils } from '../utils/Utils.js'

/**
 * Animation system for sprite-based frame animations
 */
export class AnimationSystem {
  constructor(config, canvas) {
    this.config = config
    this.canvas = canvas
    this.context = canvas.getContext('2d', { willReadFrequently: true })
    this.frameCache = new FrameCache()
    this.isPlaying = false
    this.currentFrame = null
    this.hasPlayedOnce = false
    this.lastFrameTime = 0
    this.floatOffset = null
    this.animationFrames = []
  }

  /**
   * Initialize animation system
   */
  initialize() {
    if (!this.config.animation?.enabled) {
      return Promise.resolve()
    }

    this.animationFrames = this.config.animation.frames || []
    if (this.animationFrames.length === 0) {
      console.warn('Animation enabled but no frames specified')
      return Promise.resolve()
    }

    return this.loadAnimationFrames()
  }

  /**
   * Load all animation frames into cache
   */
  loadAnimationFrames() {
    this.frameCache.initialize(this.animationFrames)
    
    const loadPromises = this.animationFrames.map(frameNum => {
      return new Promise((resolve) => {
        const img = new Image()
        
        img.addEventListener('load', () => {
          const bounds = this.calculateFrameBounds(img)
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = this.canvas.width
          tempCanvas.height = this.canvas.height
          
          return this.frameCache.cacheFrame(frameNum, img, bounds, tempCanvas)
            .then(resolve)
        })
        
        img.addEventListener('error', () => resolve(frameNum))
        
        const frameSource = this.getFrameSource(frameNum)
        img.src = frameSource
        if (
          this.config.animation?.is_external ||
          this.config.image?.src?.is_external ||
          frameSource.startsWith('http')
        ) {
          img.crossOrigin = "anonymous"
        }
      })
    })
    
    return Promise.all(loadPromises).then(() => {
      this.frameCache.isInitialized = true
      
      if (this.config.animation.auto_start && !this.hasPlayedOnce) {
        this.start()
      }
    })
  }

  /**
   * Resolve source URL for a frame
   * @param {string|number} frame - Frame identifier
   * @returns {string} Frame source URL
   */
  getFrameSource(frame) {
    if (typeof frame === 'string') {
      return frame
    }

    const basePath =
      this.config.animation?.frame_base_path ||
      this.config.animation?.base_path ||
      this.config.animation?.framePath

    const suffix = this.config.animation?.frame_suffix || '.png'
    if (basePath) {
      return `${basePath.replace(/\/$/, '')}/${frame}${suffix}`
    }

    const fallbackPath = this.config.image?.src?.path
    if (fallbackPath) {
      const lastSlash = fallbackPath.lastIndexOf('/')
      const directory = lastSlash >= 0 ? fallbackPath.slice(0, lastSlash) : ''
      if (directory) {
        return `${directory}/${frame}${suffix}`
      }
    }

    return `/frames/${frame}${suffix}`
  }

  /**
   * Calculate frame bounds for image scaling and positioning
   */
  calculateFrameBounds(img) {
    const aspectRatio = img.width / img.height
    const canvasAspectRatio = this.canvas.width / this.canvas.height
    
    let scaledWidth, scaledHeight
    
    if (aspectRatio < canvasAspectRatio) {
      // Canvas height constrains image size
      scaledHeight = Utils.clamp(
        Math.round(this.canvas.height * (this.config.image?.size?.canvas_pct || 50) / 100),
        this.config.image?.size?.min_px || 350,
        this.config.image?.size?.max_px || 2000
      )
      scaledWidth = Math.round(scaledHeight * aspectRatio)
    } else {
      // Canvas width constrains image size
      scaledWidth = Utils.clamp(
        Math.round(this.canvas.width * (this.config.image?.size?.canvas_pct || 50) / 100),
        this.config.image?.size?.min_px || 350,
        this.config.image?.size?.max_px || 2000
      )
      scaledHeight = Math.round(scaledWidth / aspectRatio)
    }
    
    // Calculate positioning with image-relative offsets
    const xOffset = (scaledWidth * (this.config.image?.position?.x_img_pct || -15)) / 100
    const yOffset = (scaledHeight * (this.config.image?.position?.y_img_pct || -8)) / 100
    
    const xPos = this.canvas.width / 2 - scaledWidth / 2 + xOffset
    const yPos = this.canvas.height / 2 - scaledHeight / 2 + yOffset
    
    return { 
      x_pos: xPos, 
      y_pos: yPos, 
      scaledWidth, 
      scaledHeight 
    }
  }

  /**
   * Start animation playback
   */
  start() {
    if (!this.config.animation?.enabled || this.isPlaying) {
      return
    }
    
    // Prevent restart if already played once (unless loop is enabled)
    if (this.hasPlayedOnce && !this.config.animation.loop) {
      return
    }
    
    // Capture floating offset if floating is enabled
    this.captureFloatingOffset()
    
    // Reset to first frame
    this.currentFrame = this.animationFrames[0]
    this.isPlaying = true
    this.lastFrameTime = performance.now()
    this.hasPlayedOnce = true
    
    this.animate()
  }

  /**
   * Stop animation and trigger cleanup effects
   */
  stop() {
    this.isPlaying = false
    this.floatOffset = null
    
    // Dispatch event for other systems to handle cleanup
    const event = new CustomEvent('animationStopped', {
      detail: {
        timestamp: performance.now(),
        frameCount: this.animationFrames.length
      }
    })
    document.dispatchEvent(event)
  }

  /**
   * Set animation to specific frame
   */
  setFrame(frameNum) {
    if (!this.frameCache.frames.has(frameNum)) {
      console.warn('Frame not found in cache:', frameNum)
      return
    }
    
    this.currentFrame = frameNum
  }

  /**
   * Get pixel data for current frame
   */
  getCurrentFramePixels() {
    if (this.currentFrame === null) {
      return null
    }
    
    return this.frameCache.getFrame(this.currentFrame)
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isPlaying) {
      return
    }
    
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    
    if (deltaTime >= this.config.animation.frame_duration_ms) {
      const frames = this.animationFrames
      const currentIndex = frames.indexOf(this.currentFrame)
      let nextIndex = (currentIndex + 1) % frames.length
      
      // Handle loop logic
      if (!this.config.animation.loop && nextIndex === 0) {
        this.stop()
        return
      }
      
      this.setFrame(frames[nextIndex])
      this.lastFrameTime = currentTime
      
      // Dispatch frame change event
      const event = new CustomEvent('animationFrameChanged', {
        detail: {
          frame: this.currentFrame,
          frameIndex: nextIndex,
          totalFrames: frames.length,
          timestamp: currentTime
        }
      })
      document.dispatchEvent(event)
    }
    
    requestAnimationFrame(() => this.animate())
  }

  /**
   * Capture current floating offset for consistency during animation
   */
  captureFloatingOffset() {
    // This would need to be called from the main particle system
    // that has access to the floating effect
    this.floatOffset = { x: 0, y: 0 } // Default, to be updated by caller
  }

  /**
   * Check if animation is currently playing
   */
  isPlaying() {
    return this.isPlaying
  }

  /**
   * Check if animation has completed at least once
   */
  hasCompleted() {
    return this.hasPlayedOnce
  }

  /**
   * Get current frame number
   */
  getCurrentFrame() {
    return this.currentFrame
  }

  /**
   * Get animation progress (0-1)
   */
  getProgress() {
    if (!this.currentFrame || this.animationFrames.length === 0) {
      return 0
    }
    
    const currentIndex = this.animationFrames.indexOf(this.currentFrame)
    return currentIndex / (this.animationFrames.length - 1)
  }

  /**
   * Reset animation state
   */
  reset() {
    this.isPlaying = false
    this.currentFrame = null
    this.hasPlayedOnce = false
    this.lastFrameTime = 0
    this.floatOffset = null
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Update frame duration if changed
    if (newConfig.animation?.frame_duration_ms) {
      this.config.animation.frame_duration_ms = newConfig.animation.frame_duration_ms
    }
  }
}

export default AnimationSystem
