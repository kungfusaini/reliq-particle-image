# API Documentation

## ReliqParticleImage Class

The main class for creating and managing particle image systems.

### Constructor

```javascript
new ReliqParticleImage(container, config)
```

**Parameters:**
- `container` (string|HTMLElement) - CSS selector or DOM element for the particle container
- `config` (Object) - Configuration object (see Configuration section)

**Throws:**
- `Error` - If container is not found or configuration is invalid

**Example:**
```javascript
const particleSystem = new ReliqParticleImage('#particle-container', {
  particles: { color: '#ffffff', density: 100 },
  image: { src: { path: '/image.png' } }
});
```

### Static Methods

#### `create(container, config)`
Static factory method that creates a new instance.

```javascript
const particleSystem = ReliqParticleImage.create('#container', config);
```

#### `withFeatures(container, features, config)`
Creates instance with feature presets enabled.

```javascript
const particleSystem = ReliqParticleImage.withFeatures('#container', 
  { responsive: true, secondaryParticles: true },
  { particles: { color: '#ff0000' } }
);
```

### Instance Methods

#### `initialize() → Promise<void>`
Initialize the particle system asynchronously.

**Returns:** Promise that resolves when system is ready

**Example:**
```javascript
try {
  await particleSystem.initialize();
  console.log('Particles loaded!');
} catch (error) {
  console.error('Failed to initialize:', error);
}
```

#### `startAnimation()`
Start sprite animation (if animation system is enabled).

**Example:**
```javascript
particleSystem.startAnimation();
```

#### `stopAnimation()`
Stop current animation playback.

**Example:**
```javascript
particleSystem.stopAnimation();
```

#### `updateConfig(newConfig)`
Update configuration at runtime.

**Parameters:**
- `newConfig` (Object) - Partial configuration to merge

**Example:**
```javascript
particleSystem.updateConfig({
  particles: { color: '#00ff00' },
  features: { floating: true }
});
```

#### `getStats() → Object`
Get current system statistics.

**Returns:**
```javascript
{
  initialized: boolean,
  primaryParticles: number,
  secondaryParticles: number,
  totalParticles: number,
  animationPlaying: boolean,
  currentFrame: number|null,
  features: {
    responsive: boolean,
    secondaryParticles: boolean,
    animation: boolean,
    floating: boolean,
    scatter: boolean,
    fade: boolean,
    interactivity: boolean
  }
}
```

#### `destroy()`
Clean up all resources and remove particle system.

**Example:**
```javascript
particleSystem.destroy();
```

## Configuration System

### Feature Toggles

All major features are opt-in through the `features` object:

```javascript
{
  features: {
    responsive: boolean,        // Enable responsive scaling
    secondaryParticles: boolean,  // Enable secondary particle system
    animation: boolean,         // Enable sprite animations
    floating: boolean,          // Enable floating effects
    scatter: boolean,           // Enable scatter effects
    fade: boolean,              // Enable fade effects
    interactivity: boolean       // Enable mouse/touch interactions
  }
}
```

### Particles Configuration

```javascript
{
  particles: {
    color: string|string[],       // Particle color(s)
    density: number,            // Particle density (1-500)
    start_scrambled: boolean,    // Start particles scattered
    
    // Responsive settings
    responsive: {
      enabled: boolean,
      size: {
        base_viewport: number,    // Reference viewport width
        scale_factor: number,     // Scaling multiplier
        min_size: number,        // Minimum particle size
        max_size: number         // Maximum particle size
      },
      density: {
        base_density: number,    // Base particle density
        scale_factor: number,    // Density scaling
        min_density: number,    // Minimum density
        max_density: number     // Maximum density
      },
      breakpoints: {
        mobile: { 
          max_width: number, 
          multiplier: number 
        },
        tablet: { 
          max_width: number, 
          multiplier: number 
        },
        desktop: { 
          multiplier: number 
        }
      }
    },
    
    // Movement options
    movement: {
      speed: number,                    // Movement speed (0.1-10)
      restless: {
        enabled: boolean,
        value: number                 // Restless jitter distance
      },
      floating: {
        enabled: boolean,
        amplitude: number,            // Float amplitude (1-20)
        frequency: number,            // Float frequency (0.1-2.0)
        phase_offset: number          // Float phase offset (0-2π)
      }
    },
    
    // Effects
    scatter: {
      force: number                   // Scatter force (1-20)
    },
    fade_out: {
      enabled: boolean,
      duration_ms: number            // Fade duration (100-5000)
    },
    
    // Interactivity
    interactivity: {
      on_hover: {
        enabled: boolean,
        action: 'repulse'|'big_repulse'|'grab'
      },
      on_click: {
        enabled: boolean,
        action: 'repulse'|'big_repulse'|'grab'
      },
      on_touch: {
        enabled: boolean,
        action: 'repulse'|'big_repulse'|'grab'
      }
    }
  }
}
```

### Secondary Particles Configuration

```javascript
{
  secondary_particles: {
    enabled: boolean,
    placement_mode: 'grid'|'random'|'around_image',
    particle_multiplier: number,     // Density multiplier (0.01-0.5)
    placement_image_buffer: number,  // Buffer around image (10-200%)
    color: string,                // Particle color
    render_order: 'background'|'foreground',
    
    // Movement (inherits from primary with overrides)
    movement: {
      random: {
        enabled: boolean,
        speed: number               // Random movement speed (0.1-2.0)
      }
    },
    
    // Interactivity
    interactivity: {
      enabled: boolean,
      touch_sensitivity: number,    // Touch sensitivity (0.01-1.0)
      touch_max_offset: number      // Maximum touch offset (0.5-10.0)
    }
  }
}
```

### Image Configuration

```javascript
{
  image: {
    src: {
      path: string,               // Image path or URL
      is_external: boolean         // Set for cross-origin images
    },
    
    // Animation system
    animation: {
      enabled: boolean,
      frames: number[],           // Frame numbers sequence
      frame_duration_ms: number,   // Frame duration (50-1000)
      loop: boolean,             // Loop animation
      auto_start: boolean        // Start on load
    },
    
    // Positioning
    position: {
      x_img_pct: number,          // X position offset (-100 to 100)
      y_img_pct: number           // Y position offset (-100 to 100)
    },
    
    // Sizing
    size: {
      canvas_pct: number,         // Canvas percentage (10-100)
      min_px: number,            // Minimum size in pixels
      max_px: number             // Maximum size in pixels
    }
  }
}
```

### Interactions Configuration

```javascript
{
  interactions: {
    repulse: {
      detection_radius: number,     // Detection distance (10-200)
      max_displacement: number,     // Maximum displacement (0.1-5.0)
      repulse_duration: number,    // Repulse duration (0.05-1.0)
      force_curve: 'linear'|'top_heavy'|'bottom_heavy'
    },
    big_repulse: {
      distance: number,            // Detection distance (50-300)
      strength: number            // Repulse strength (100-2000)
    },
    grab: {
      distance: number,            // Detection distance (50-300)
      line_width: number          // Line width (1-10)
    }
  }
}
```

## Event System

### Available Events

#### `particleImageReady`
Fired when particle system is fully initialized.

```javascript
document.addEventListener('particleImageReady', (event) => {
  console.log('Ready:', event.detail);
  // event.detail = {
  //   timestamp: number,
  //   features: Object,
  //   particleCount: number
  // }
});
```

#### `animationFrameChanged`
Fired when animation frame changes.

```javascript
document.addEventListener('animationFrameChanged', (event) => {
  console.log('Frame:', event.detail.frame);
  // event.detail = {
  //   frame: number,
  //   frameIndex: number,
  //   totalFrames: number,
  //   timestamp: number
  // }
});
```

#### `animationStopped`
Fired when animation playback stops.

```javascript
document.addEventListener('animationStopped', (event) => {
  console.log('Animation stopped:', event.detail);
  // event.detail = {
  //   timestamp: number,
  //   frameCount: number
  // }
});
```

#### `particleAnimationComplete`
Fired when particle fade-out completes.

```javascript
document.addEventListener('particleAnimationComplete', (event) => {
  console.log('Complete:', event.detail);
  // event.detail = {
  //   timestamp: number,
  //   particleSystem: 'primary'|'secondary'
  // }
});
```

#### `particleImageError`
Fired when an error occurs.

```javascript
document.addEventListener('particleImageError', (event) => {
  console.error('Error:', event.detail);
  // event.detail = {
  //   error: string,
  //   timestamp: number
  // }
});
```

## Utility Functions

### ConfigMerger

Static utility for configuration validation and merging.

```javascript
import { ConfigMerger } from 'reliq-enhanced-particle-image';

// Validate configuration
const validation = ConfigMerger.validateConfig(config);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

// Set defaults
const configWithDefaults = ConfigMerger.setDefaults(config);
```

### ResponsiveCalculator

Utility for responsive calculations.

```javascript
import { ResponsiveCalculator } from 'reliq-enhanced-particle-image';

const calculator = new ResponsiveCalculator(config);
const responsiveSize = calculator.calculateResponsiveSize(baseSize);
const responsiveDensity = calculator.calculateResponsiveDensity(baseDensity);
```

## TypeScript Support

Type definitions are included in the distribution:

```typescript
import { ReliqParticleImage, ParticleConfig } from 'reliq-enhanced-particle-image';

const config: ParticleConfig = {
  particles: { color: '#ffffff' },
  features: { responsive: true }
};

const particleSystem: ReliqParticleImage = new ReliqParticleImage('#container', config);
```

## Browser Compatibility

### Minimum Requirements
- ES6+ JavaScript support
- Canvas 2D context support
- RequestAnimationFrame support

### Supported Browsers
- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 79+
- IE 11+ (limited features)

### Polyfills
For older browsers, include these polyfills:
- Promise
- Object.assign
- requestAnimationFrame

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=Promise,Object.assign,requestAnimationFrame"></script>
```