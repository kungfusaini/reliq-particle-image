import { Utils } from '../utils/Utils.js'

/**
 * Mouse interaction handler
 */
export class MouseHandler {
  constructor(canvas, config) {
    this.canvas = canvas
    this.config = config
    this.mouse = {
      x: null,
      y: null,
      click_x: null,
      click_y: null
    }
    this.isAttached = false

    this.onMouseMove = this.handleMouseMove.bind(this)
    this.onMouseLeave = this.handleMouseLeave.bind(this)
    this.onMouseDown = this.handleMouseDown.bind(this)
    this.onMouseUp = this.handleMouseUp.bind(this)
  }

  /**
   * Attach mouse event listeners
   */
  attach() {
    if (this.isAttached) return

    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('mouseleave', this.onMouseLeave)
    this.canvas.addEventListener('mousedown', this.onMouseDown)
    this.canvas.addEventListener('mouseup', this.onMouseUp)
    
    this.isAttached = true
  }

  /**
   * Detach mouse event listeners
   */
  detach() {
    if (!this.isAttached) return

    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mouseup', this.onMouseUp)
    
    this.isAttached = false
  }

  /**
   * Handle mouse move event
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = e.clientX - rect.left
    this.mouse.y = e.clientY - rect.top
  }

  /**
   * Handle mouse leave event
   */
  handleMouseLeave(e) {
    this.mouse.x = null
    this.mouse.y = null
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown(e) {
    this.mouse.click_x = this.mouse.x
    this.mouse.click_y = this.mouse.y
  }

  /**
   * Handle mouse up event
   */
  handleMouseUp(e) {
    this.mouse.click_x = null
    this.mouse.click_y = null
  }

  /**
   * Get current mouse position
   * @returns {Object} Mouse position {x, y}
   */
  getMousePosition() {
    return this.mouse
  }

  /**
   * Check if mouse is over canvas
   * @returns {boolean} True if mouse is over canvas
   */
  isMouseOver() {
    return this.mouse.x !== null && this.mouse.y !== null
  }

  /**
   * Check if mouse is currently clicked
   * @returns {boolean} True if mouse is clicked
   */
  isMouseClicked() {
    return this.mouse.click_x !== null && this.mouse.click_y !== null
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }
}

export default MouseHandler
