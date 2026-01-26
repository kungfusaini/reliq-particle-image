import { Utils } from '../utils/Utils.js'

/**
 * Touch interaction handler with tap vs drag detection
 */
export class TouchHandler {
  constructor(canvas, config) {
    this.canvas = canvas
    this.config = config
    this.touch = {
      x: null,
      y: null,
      startX: null,
      startY: null,
      startTime: null,
      isTouchEvent: false
    }
    this.dragThreshold = 10
    this.tapMaxDuration = 300
    this.isAttached = false

    this.onTouchStart = this.handleTouchStart.bind(this)
    this.onTouchMove = this.handleTouchMove.bind(this)
    this.onTouchEnd = this.handleTouchEnd.bind(this)
  }

  /**
   * Attach touch event listeners
   */
  attach() {
    if (this.isAttached) return

    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true })
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false })
    
    this.isAttached = true
  }

  /**
   * Detach touch event listeners
   */
  detach() {
    if (!this.isAttached) return

    this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
    
    this.isAttached = false
  }

  /**
   * Handle touch start event
   */
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const y = e.touches[0].clientY - rect.top
      this.touch.startX = e.touches[0].clientX
      this.touch.startY = e.touches[0].clientY
      this.touch.x = x
      this.touch.y = y
      this.touch.startTime = Date.now()
      this.touch.isTouchEvent = true
    }
  }

  /**
   * Handle touch move event
   */
  handleTouchMove(e) {
    e.preventDefault()
    
    if (e.touches.length === 1) {
      const rect = this.canvas.getBoundingClientRect()
      const pos_x = e.touches[0].clientX - rect.left
      const pos_y = e.touches[0].clientY - rect.top
      this.touch.x = pos_x
      this.touch.y = pos_y
      
      // Check if this is a drag (not a tap)
      if (this.touch.startX !== null) {
        const deltaX = Math.abs(e.touches[0].clientX - this.touch.startX)
        const deltaY = Math.abs(e.touches[0].clientY - this.touch.startY)
        if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
          this.touch.startX = null
          this.touch.startY = null
          this.touch.startTime = null
        }
      }
    }
  }

  /**
   * Handle touch end event
   */
  handleTouchEnd(e) {
    if (e.changedTouches.length === 1 && 
        this.touch.startX !== null && 
        this.touch.startTime !== null) {
      
      const deltaX = Math.abs(e.changedTouches[0].clientX - this.touch.startX)
      const deltaY = Math.abs(e.changedTouches[0].clientY - this.touch.startY)
      const duration = Date.now() - this.touch.startTime

      // Check if this was a tap (not a drag)
      if (deltaX < this.dragThreshold && 
          deltaY < this.dragThreshold && 
          duration < this.tapMaxDuration) {
        // This was a tap - trigger callback if provided
        if (this.config.onTap) {
          this.config.onTap(e)
        }
      }
    }
    
    // Reset touch state
    this.touch.x = null
    this.touch.y = null
    this.touch.startX = null
    this.touch.startY = null
    this.touch.startTime = null
    this.touch.isTouchEvent = false
  }

  /**
   * Get current touch position
   * @returns {Object} Touch position {x, y}
   */
  getTouchPosition() {
    return { x: this.touch.x, y: this.touch.y }
  }

  /**
   * Check if touch is active
   * @returns {boolean} True if touch is active
   */
  isTouchActive() {
    return this.touch.x !== null && this.touch.y !== null
  }

  /**
   * Check if current interaction is a touch (vs mouse)
   * @returns {boolean} True if this is a touch interaction
   */
  isTouchEvent() {
    return this.touch.isTouchEvent
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.dragThreshold = this.config.dragThreshold || 10
    this.tapMaxDuration = this.config.tapMaxDuration || 300
  }
}

export default TouchHandler
