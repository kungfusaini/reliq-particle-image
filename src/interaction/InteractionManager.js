import { Utils } from '../utils/Utils.js'

import { MouseHandler } from './MouseHandler.js'
import { TouchHandler } from './TouchHandler.js'

/**
 * Unified interaction manager for particles
 */
export class InteractionManager {
  constructor(canvas, config) {
    this.canvas = canvas
    this.config = config
    this.mouseHandler = null
    this.touchHandler = null
    this.isAttached = false
  }

  /**
   * Initialize interaction handlers based on configuration
   */
  initialize() {
    // Check which interaction types are needed
    const needsMouse = this.shouldEnableMouse()
    const needsTouch = this.shouldEnableTouch()

    if (needsMouse) {
      this.mouseHandler = new MouseHandler(this.canvas, this.config)
    }

    if (needsTouch) {
      this.touchHandler = new TouchHandler(this.canvas, this.config)
    }
  }

  /**
   * Check if mouse interactions should be enabled
   */
  shouldEnableMouse() {
    const particles = this.config.particles?.interactivity || {}
    return particles.on_hover?.enabled || particles.on_click?.enabled
  }

  /**
   * Check if touch interactions should be enabled
   */
  shouldEnableTouch() {
    const particles = this.config.particles?.interactivity || {}
    const secondary = this.config.secondary_particles?.interactivity || {}
    return particles.on_touch?.enabled || secondary.enabled
  }

  /**
   * Attach all interaction handlers
   */
  attach() {
    if (this.isAttached) return

    if (this.mouseHandler) {
      this.mouseHandler.attach()
    }

    if (this.touchHandler) {
      this.touchHandler.attach()
    }

    this.isAttached = true
  }

  /**
   * Detach all interaction handlers
   */
  detach() {
    if (!this.isAttached) return

    if (this.mouseHandler) {
      this.mouseHandler.detach()
    }

    if (this.touchHandler) {
      this.touchHandler.detach()
    }

    this.isAttached = false
  }

  /**
   * Get current interaction state
   * @returns {Object} Interaction state
   */
  getInteractionState() {
    const state = {
      mouseX: null,
      mouseY: null,
      touchX: null,
      touchY: null,
      isMouseOver: false,
      isMouseClicked: false,
      isTouchActive: false
    }

    if (this.mouseHandler) {
      const mousePos = this.mouseHandler.getMousePosition()
      state.mouseX = mousePos.x
      state.mouseY = mousePos.y
      state.isMouseOver = this.mouseHandler.isMouseOver()
      state.isMouseClicked = this.mouseHandler.isMouseClicked()
    }

    if (this.touchHandler) {
      const touchPos = this.touchHandler.getTouchPosition()
      state.touchX = touchPos.x
      state.touchY = touchPos.y
      state.isTouchActive = this.touchHandler.isTouchActive()
    }

    return state
  }

  /**
   * Apply repulsion interaction to particle
   * @param {Object} particle - Particle to affect
   * @param {Object} args - Interaction arguments
   */
  applyRepulsion(particle, args) {
    const state = this.getInteractionState()
    const mouseX = state.mouseX
    const mouseY = state.mouseY
    const touchX = state.touchX
    const touchY = state.touchY

    // Use touch position if available, otherwise mouse position
    const x = touchX !== null ? touchX : mouseX
    const y = touchY !== null ? touchY : mouseY

    if (x === null || y === null) {
      return
    }

    const dx_mouse = particle.x - x
    const dy_mouse = particle.y - y
    const mouse_dist = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse)

    if (mouse_dist <= args.detection_radius) {
      // Calculate displacement from destination
      const dx_dest = particle.x - particle.dest_x
      const dy_dest = particle.y - particle.dest_y
      const current_displacement = Math.sqrt(dx_dest * dx_dest + dy_dest * dy_dest)

      // Check displacement constraint
      if (current_displacement < args.max_displacement) {
        // Initialize repulse timer if not started
        if (!particle.repulse_start_time) {
          particle.repulse_start_time = Date.now()
        }

        // Calculate elapsed time as fraction of repulse duration
        const elapsed_ms = Date.now() - particle.repulse_start_time
        const elapsed_fraction = Math.min(elapsed_ms / (args.repulse_duration * 1000), 1)

        // Apply force with decay after significant displacement
        if (elapsed_fraction < 0.8) {
          // Calculate force multiplier based on curve
          let force_multiplier
          switch (args.force_curve) {
            case 'top_heavy':
              force_multiplier = 1 - (1 - elapsed_fraction) ** 2
              break
            case 'bottom_heavy':
              force_multiplier = elapsed_fraction ** 2
              break
            case 'linear':
            default:
              force_multiplier = elapsed_fraction
              break
          }

          // Calculate required acceleration from physics
          const required_acceleration = (2 * args.max_displacement) / (args.repulse_duration ** 2)

          // Apply displacement constraint factor
          const constraint_factor = Math.max(0, 1 - (current_displacement / args.max_displacement))

          // Calculate and apply force
          const force = required_acceleration * force_multiplier * constraint_factor
          particle.acc_x = ((particle.x - x) / mouse_dist) * force * 0.01
          particle.acc_y = ((particle.y - y) / mouse_dist) * force * 0.01
          particle.vx += particle.acc_x
          particle.vy += particle.acc_y
        }
      }
    } else {
      // Reset timer when interaction ends
      particle.repulse_start_time = null
    }
  }

  /**
   * Apply gentle interaction to secondary particles
   * @param {Object} particle - Secondary particle to affect
   * @param {Object} args - Interaction arguments
   */
  applyGentleInteraction(particle, args) {
    const state = this.getInteractionState()
    let x = state.touchX !== null ? state.touchX : state.mouseX
    let y = state.touchY !== null ? state.touchY : state.mouseY

    if (x === null || y === null) {
      return
    }

    const dx_mouse = particle.x - x
    const dy_mouse = particle.y - y
    const mouse_dist = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse)

    if (mouse_dist <= args.detection_radius) {
      const sensitivity = args.touch_sensitivity || 0.1
      const maxOffset = args.touch_max_offset || 2.0

      // Calculate gentle repulsion force
      const distance_factor = 1 - (mouse_dist / args.detection_radius)
      const repulse_force = distance_factor * sensitivity * maxOffset

      // Apply gentle force as direct velocity addition
      particle.vx += ((particle.x - x) / mouse_dist) * repulse_force
      particle.vy += ((particle.y - y) / mouse_dist) * repulse_force
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    if (this.touchHandler) {
      this.touchHandler.updateConfig(this.config)
    }
  }
}

export default InteractionManager
