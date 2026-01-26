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
  }

  /**
   * Attach mouse event listeners
   */
  attach() {
    if (this.isAttached) return

    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    
    this.isAttached = true
  }

  /**
   * Detach mouse event listeners
   */
  detach() {
    if (!this.isAttached) return

    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    
    this.isAttached = false
  }

  /**
   * Handle mouse move event
   */
  handleMouseMove(e) {
    const pos_x = e.offsetX || e.clientX
    const pos_y = e.offsetY || e.clientY
    this.mouse.x = pos_x
    this.mouse.y = pos_y
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
}

export default MouseHandler
