import { Utils } from './Utils.js'

/**
 * Configuration merger for secondary particles
 */
export class ConfigMerger {
  /**
   * Merge primary particle config with secondary particle overrides
   * @param {Object} primary - Primary particle configuration
   * @param {Object} secondary - Secondary particle overrides
   * @returns {Object} Merged configuration
   */
  static mergeSecondaryConfig(primary, secondary) {
    // Deep clone primary config as base (always inherit)
    const merged = JSON.parse(JSON.stringify(primary))
    
    // Apply secondary overrides only where explicitly defined
    for (let [key, value] of Object.entries(secondary)) {
      // Skip meta fields
      if (key === 'enabled') {
        continue
      }
      
      // Only override if secondary has a non-undefined value
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Deep merge objects
          merged[key] = Utils.deepExtend(merged[key] || {}, value)
        } else {
          // Direct value override
          merged[key] = value
        }
      }
    }
    
    return merged
  }

  /**
   * Validate particle configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result {valid: boolean, errors: Array}
   */
  static validateConfig(config) {
    const errors = []
    
    if (!config.particles) {
      errors.push('Missing particles configuration')
    }
    
    if (!config.image) {
      errors.push('Missing image configuration')
    }
    
    if (config.particles?.density && !Utils.isValidNumber(config.particles.density)) {
      errors.push('Invalid particles density')
    }
    
    if (config.particles?.size?.value && !Utils.isValidNumber(config.particles.size.value)) {
      errors.push('Invalid particles size value')
    }
    
    if (config.secondary_particles?.enabled) {
      const sp = config.secondary_particles
      if (!sp.placement_mode || !['grid', 'random', 'around_image'].includes(sp.placement_mode)) {
        errors.push('Invalid secondary particles placement mode')
      }
    }
    
    if (config.animation?.enabled) {
      const anim = config.animation
      if (!Array.isArray(anim.frames) || anim.frames.length === 0) {
        errors.push('Animation enabled but no frames specified')
      }
      if (anim.frame_duration_ms && !Utils.isValidNumber(anim.frame_duration_ms)) {
        errors.push('Invalid animation frame duration')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Set default configuration values
   * @param {Object} config - Configuration object
   * @returns {Object} Configuration with defaults applied
   */
  static setDefaults(config) {
    const defaults = {
      particles: {
        color: '#ffffff',
        density: 100,
        size: {
          value: 2,
          random: false
        },
        movement: {
          speed: 1,
          restless: {
            enabled: false,
            value: 10
          },
          floating: {
            enabled: false,
            amplitude: 8,
            frequency: 0.25,
            phase_offset: 0
          }
        },
        scatter: {
          force: 3
        },
        interactivity: {
          on_hover: {
            enabled: true,
            action: 'repulse'
          },
          on_click: {
            enabled: false,
            action: 'big_repulse'
          },
          on_touch: {
            enabled: true,
            action: 'repulse'
          }
        }
      },
      image: {
        src: {
          path: null,
          is_external: false
        },
        position: {
          x_img_pct: -15,
          y_img_pct: -8
        },
        size: {
          canvas_pct: 50,
          min_px: 350,
          max_px: 2000
        }
      },
      interactions: {
        repulse: {
          detection_radius: 100,
          max_displacement: 0.5,
          repulse_duration: 0.1,
          force_curve: 'linear'
        },
        big_repulse: {
          distance: 120,
          strength: 300
        }
      },
      responsive: {
        enabled: false
      }
    }
    
    return ConfigMerger.normalizeConfig(Utils.deepExtend(defaults, config))
  }

  /**
   * Normalize configuration based on enabled features
   * @param {Object} config - Configuration with defaults applied
   * @returns {Object} Normalized configuration
   */
  static normalizeConfig(config) {
    const features = config.features || {}

    if (!config.animation && config.image?.animation) {
      config.animation = { ...config.image.animation }
      delete config.image.animation
    }

    if (features.responsive !== false && config.responsive?.enabled === undefined) {
      config.responsive = { ...config.responsive, enabled: true }
    }

    if (features.animation === true && config.animation?.enabled === undefined) {
      config.animation = { ...config.animation, enabled: true }
    }

    if (features.floating === true && config.particles?.movement?.floating?.enabled === undefined) {
      config.particles.movement.floating = {
        ...config.particles.movement.floating,
        enabled: true,
      }
    }

    if (features.fade === true && config.particles?.fade_out?.enabled === undefined) {
      config.particles.fade_out = {
        ...config.particles.fade_out,
        enabled: true,
      }
    }

    return config
  }
}

export default ConfigMerger
