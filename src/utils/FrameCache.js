import { Utils } from './Utils.js'

/**
 * Frame caching system for sprite animations
 */
export class FrameCache {
  constructor() {
    this.frames = new Map() // frameNumber -> pixelData
    this.loadedCount = 0
    this.totalCount = 0
    this.isInitialized = false
  }

  /**
   * Initialize cache with frame list
   * @param {Array} frameNumbers - Array of frame numbers to cache
   */
  initialize(frameNumbers) {
    this.frames.clear()
    this.loadedCount = 0
    this.totalCount = frameNumbers.length
    this.isInitialized = false
  }

  /**
   * Cache a single frame
   * @param {number} frameNum - Frame number
   * @param {Image} img - Loaded image object
   * @param {Object} bounds - Frame bounds {x_pos, y_pos, scaledWidth, scaledHeight}
   * @param {HTMLCanvasElement} tempCanvas - Temporary canvas for processing
   * @returns {Promise} Promise that resolves when frame is cached
   */
  cacheFrame(frameNum, img, bounds, tempCanvas) {
    return new Promise((resolve) => {
      const tempCtx = tempCanvas.getContext('2d')
      
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
      tempCtx.drawImage(img, bounds.x_pos, bounds.y_pos, bounds.scaledWidth, bounds.scaledHeight)
      
      const pixelData = tempCtx.getImageData(
        bounds.x_pos, 
        bounds.y_pos, 
        bounds.scaledWidth, 
        bounds.scaledHeight
      )
      pixelData.bounds = {
        x: bounds.x_pos,
        y: bounds.y_pos,
        width: bounds.scaledWidth,
        height: bounds.scaledHeight,
      }
      
      this.frames.set(frameNum, pixelData)
      this.loadedCount++
      resolve(frameNum)
    })
  }

  /**
   * Get cached frame pixel data
   * @param {number} frameNum - Frame number
   * @returns {ImageData|null} Cached pixel data or null if not found
   */
  getFrame(frameNum) {
    return this.frames.get(frameNum) || null
  }

  /**
   * Check if all frames are loaded
   * @returns {boolean} True if all frames are cached
   */
  isFullyLoaded() {
    return this.loadedCount >= this.totalCount && this.totalCount > 0
  }

  /**
   * Get loading progress (0-1)
   * @returns {number} Loading progress ratio
   */
  getProgress() {
    return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0
  }

  /**
   * Clear all cached frames
   */
  clear() {
    this.frames.clear()
    this.loadedCount = 0
    this.totalCount = 0
    this.isInitialized = false
  }
}

export default FrameCache
