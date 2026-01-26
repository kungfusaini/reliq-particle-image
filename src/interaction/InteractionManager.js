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
   * Resolve interaction action based on current input state
   * @param {Object} state - Interaction state
   * @returns {string|null} Action name
   */
  getPrimaryAction(state) {
    const interactivity = this.config.particles?.interactivity || {}

    if (state.isMouseClicked && interactivity.on_click?.enabled) {
      return interactivity.on_click.action || 'big_repulse'
    }

    if (state.isTouchActive && interactivity.on_touch?.enabled) {
      return interactivity.on_touch.action || 'repulse'
    }

    if (state.isMouseOver && interactivity.on_hover?.enabled) {
      return interactivity.on_hover.action || 'repulse'
    }

    return null
  }

  /**
   * Resolve repulse arguments for the selected action
   * @param {string} action - Action name
   * @returns {Object|null} Repulse argument payload
   */
  getRepulseArgs(action) {
    if (!action) {
      return null
    }

    const interactions = this.config.interactions || {}
    const args = interactions[action]

    if (!args) {
      return null
    }

    if (action === 'big_repulse') {
      const distance = args.distance || 120
      const strength = args.strength || 300
      return {
        detection_radius: distance,
        max_displacement: Math.min(Math.max(strength / 200, 0.5), 5.0),
        repulse_duration: 0.12,
        force_curve: 'linear',
      }
    }

    return args
  }

  /**
   * Apply primary particle interactions
   * @param {Object} particle - Particle to affect
   * @param {Object} state - Cached interaction state
   */
  applyPrimaryInteraction(particle, state) {
    if (!this.config.particles?.interactivity) {
      return
    }

    if (!state) {
      return
    }

    const action = this.getPrimaryAction(state)
    const args = this.getRepulseArgs(action)
    if (!args) {
      return
    }

    this.applyRepulsion(particle, args, state)
  }

  /**
   * Apply secondary particle interactions
   * @param {Object} particle - Secondary particle to affect
   * @param {Object} state - Cached interaction state
   */
  applySecondaryInteraction(particle, state) {
    const secondary = this.config.secondary_particles?.interactivity
    if (!secondary?.enabled) {
      return
    }

    if (!state) {
      return
    }

    this.applyGentleInteraction(particle, secondary, state)
  }

  /**
   * Apply repulsion interaction to particle
   * @param {Object} particle - Particle to affect
   * @param {Object} args - Interaction arguments
   */
  applyRepulsion(particle, args, state = this.getInteractionState()) {
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

    if (mouse_dist === 0) {
      return
    }

    const detectionRadius = args.detection_radius || 100
    const maxDisplacement = args.max_displacement || 0.5
    const repulseDuration = args.repulse_duration || 0.1
    const forceCurve = args.force_curve || 'linear'

    if (mouse_dist <= detectionRadius) {
      // Calculate displacement from destination
      const dx_dest = particle.x - particle.destX
      const dy_dest = particle.y - particle.destY
      const current_displacement = Math.sqrt(dx_dest * dx_dest + dy_dest * dy_dest)

      // Check displacement constraint
      if (current_displacement < maxDisplacement) {
        // Initialize repulse timer if not started
        if (!particle.repulse_start_time) {
          particle.repulse_start_time = Date.now()
        }

        // Calculate elapsed time as fraction of repulse duration
        const elapsed_ms = Date.now() - particle.repulse_start_time
        const elapsed_fraction = Math.min(elapsed_ms / (repulseDuration * 1000), 1)

        // Apply force with decay after significant displacement
        if (elapsed_fraction < 0.8) {
          // Calculate force multiplier based on curve
          let force_multiplier
          switch (forceCurve) {
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
          const required_acceleration = (2 * maxDisplacement) / (repulseDuration ** 2)

          // Apply displacement constraint factor
          const constraint_factor = Math.max(0, 1 - (current_displacement / maxDisplacement))

          // Calculate and apply force
          const force = required_acceleration * force_multiplier * constraint_factor
          particle.accX = ((particle.x - x) / mouse_dist) * force * 0.01
          particle.accY = ((particle.y - y) / mouse_dist) * force * 0.01
          particle.vx += particle.accX
          particle.vy += particle.accY
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
  applyGentleInteraction(particle, args, state = this.getInteractionState()) {
    const x = state.touchX !== null ? state.touchX : state.mouseX
    const y = state.touchY !== null ? state.touchY : state.mouseY

    if (x === null || y === null) {
      return
    }

    const dx_mouse = particle.x - x
    const dy_mouse = particle.y - y
    const mouse_dist = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse)

    if (mouse_dist === 0) {
      return
    }

    const detectionRadius = args.detection_radius || 120

    if (mouse_dist <= detectionRadius) {
      const sensitivity = args.touch_sensitivity || 0.1
      const maxOffset = args.touch_max_offset || 2.0

      // Calculate gentle repulsion force
      const distance_factor = 1 - (mouse_dist / detectionRadius)
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

    if (this.mouseHandler) {
      this.mouseHandler.updateConfig?.(this.config)
    }

    const shouldReinit =
      (!this.mouseHandler && this.shouldEnableMouse()) ||
      (!this.touchHandler && this.shouldEnableTouch())

    if (shouldReinit) {
      const wasAttached = this.isAttached
      this.detach()
      this.mouseHandler = null
      this.touchHandler = null
      this.initialize()
      if (wasAttached) {
        this.attach()
      }
    }
  }
}

export default InteractionManager
