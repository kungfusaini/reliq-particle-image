import { ReliqParticleImage } from './ReliqParticleImage.js'
import { ConfigMerger, Utils } from './utils/index.js'

// Export main class and utilities
export { ReliqParticleImage }

// Export static factory methods for convenient usage
export const create = ReliqParticleImage.create
export const withFeatures = ReliqParticleImage.withFeatures

// Global exposure for legacy usage
if (typeof window !== 'undefined') {
  const instances = []

  const getInstance = tagId =>
    instances.find(entry => entry.tagId === tagId)?.instance || null

  const registerInstance = (tagId, instance) => {
    const existing = instances.find(entry => entry.tagId === tagId)
    if (existing) {
      existing.instance = instance
      return
    }
    instances.push({ tagId, instance })
  }

  window.ReliqParticleImage = ReliqParticleImage
  window.mergeSecondaryConfig = ConfigMerger.mergeSecondaryConfig
  window.randIntInRange = Utils.randIntInRange
  window.particleImageInitialized = false
  window.particleImageDisplayerReady = false

  window.particleImageDisplay = async (tagId = 'particle-image', configOverride = null) => {
    const existingInstance = getInstance(tagId)
    if (existingInstance) {
      return existingInstance
    }

    const container = document.getElementById(tagId)
    if (!container) {
      console.warn('Particle container not found:', tagId)
      return null
    }

    let config = configOverride
    if (!config) {
      const paramsSrc = container.dataset.paramsSrc
      if (!paramsSrc) {
        console.warn('Missing data-params-src on particle container:', tagId)
        return null
      }

      try {
        const response = await fetch(paramsSrc, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Failed to load params: ${response.status}`)
        }
        config = await response.json()
      } catch (error) {
        console.error('Failed to load particle params:', error)
        return null
      }
    }

    const instance = new ReliqParticleImage(container, config)
    registerInstance(tagId, instance)
    await instance.initialize()
    return instance
  }

  window.particleAnimationControls = {
    play: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.startAnimation()
    },
    pause: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.stopAnimation()
    },
    stop: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.stopAnimation()
      instance?.setAnimationFrame?.(0)
    },
    setFrame: (frameNum, tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.setAnimationFrame?.(frameNum)
    },
    nextFrame: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.nextAnimationFrame?.()
    },
    previousFrame: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.previousAnimationFrame?.()
    },
    setSpeed: (speedMultiplier, tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      instance?.setAnimationSpeed?.(speedMultiplier)
    },
    isPlaying: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      return instance?.isAnimationPlaying?.() || false
    },
    getCurrentFrame: (tagId = 'particle-image') => {
      const instance = getInstance(tagId)
      return instance?.getAnimationFrame?.() || null
    }
  }
}

// Default export
export default ReliqParticleImage
