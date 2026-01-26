# Configuration Guide

## Overview

The Reliq Enhanced Particle Image system uses a comprehensive configuration system with feature toggles for maximum flexibility and performance optimization.

## Feature Toggles

Feature toggles allow you to enable only the features you need, optimizing both bundle size and runtime performance.

When a feature is enabled, the library will automatically set the corresponding `enabled` flag for that feature if it is missing (for example, `features.animation` will enable `animation.enabled`).

### All Features Available

```javascript
{
  features: {
    responsive: true,        // Dynamic viewport-based scaling
    secondaryParticles: true,  // Background/foreground particle layers
    animation: true,         // Sprite animation system
    floating: true,          // Sine-wave floating effects
    scatter: true,           // Particle explosion effects
    fade: true,              // Fade-out transitions
    interactivity: true       // Mouse and touch interactions
  }
}
```

### Performance Impact

| Feature | Bundle Size | CPU Impact | Memory Impact | Use Case |
|---------|--------------|-------------|----------------|-----------|
| responsive | +2KB | Low | Low | Mobile/desktop adaptation |
| secondaryParticles | +8KB | Medium | High | Background effects |
| animation | +6KB | Medium | Medium | Logo animations |
| floating | +3KB | Low | Low | Ambient movement |
| scatter | +4KB | High (one-time) | Low | Transition effects |
| fade | +2KB | Low | Low | Clean transitions |
| interactivity | +5KB | Medium | Low | User engagement |

## Core Configuration

### Particles

```javascript
{
  particles: {
    // Basic properties
    color: '#ffffff',                    // String or array of colors
    density: 100,                       // Number of particles (1-500)
    size: {
      value: 2,                         // Base particle radius (0.5-10)
      random: false                       // Random size variation
    },
    
    // Movement
    movement: {
      speed: 1,                           // Movement speed (0.1-10)
      restless: {
        enabled: false,                     // Jitter when at destination
        value: 10                          // Jitter distance (1-50)
      },
      floating: {
        enabled: false,
        amplitude: 8,                      // Sine wave amplitude (1-20)
        frequency: 0.25,                  // Oscillations per second (0.1-2.0)
        phase_offset: 0                     // Phase offset (0-2π)
      }
    },
    
    // Visual effects
    scatter: {
      force: 3                          // Explosion force (1-20)
    },
    fade_out: {
      enabled: false,
      duration_ms: 1000                  // Fade duration (100-5000)
    }
  }
}
```

#### Color Options

```javascript
// Single color
color: '#ffffff'

// Multiple colors (randomly assigned)
color: ['#ff6b6b', '#4ecdc4', '#45b7d1']

// HSL colors
color: 'hsl(200, 70%, 60%)'

// RGBA colors
color: 'rgba(255, 255, 255, 0.8)'
```

### Responsive System

The responsive system automatically adjusts particle size and density based on viewport dimensions.

```javascript
{
  particles: {
    responsive: {
      enabled: true,
      
      // Size scaling
      size: {
        base_viewport: 800,              // Reference viewport width
        scale_factor: 0.0005,           // Scaling multiplier
        min_size: 0.8,                  // Minimum particle radius
        max_size: 4.0                   // Maximum particle radius
      },
      
      // Density scaling  
      density: {
        base_density: 100,               // Base particle density
        scale_factor: 0.08,              // Density scaling
        min_density: 50,                 // Minimum density
        max_density: 200                 // Maximum density
      },
      
      // Breakpoint-based multipliers
      breakpoints: {
        mobile: { 
          max_width: 768,                // Maximum width for mobile
          multiplier: 0.6                 // Size/density multiplier
        },
        tablet: { 
          max_width: 1024,               // Maximum width for tablet
          multiplier: 1.0                 // Size/density multiplier
        },
        desktop: { 
          multiplier: 1.5                 // Desktop multiplier (no max width)
        }
      }
    }
  }
}
```

#### Responsive Calculation Logic

1. **Determine current breakpoint** based on viewport width
2. **Calculate size multiplier** using viewport ratio and scale factor
3. **Apply breakpoint multiplier** for final scaling
4. **Clamp results** to min/max boundaries

### Image Configuration

```javascript
{
  image: {
    // Source image
    src: {
      path: '/path/to/image.png',       // Local or external URL
      is_external: false                // Set for cross-origin images
    },
    
    // Positioning
    position: {
      x_img_pct: -15,                  // X offset (-100 to 100%)
      y_img_pct: -8                    // Y offset (-100 to 100%)
    },
    
    // Sizing
    size: {
      canvas_pct: 50,                  // Percentage of smallest canvas dimension
      min_px: 350,                     // Minimum size in pixels
      max_px: 2000                     // Maximum size in pixels
    }
  }
}
```

#### Sprite Animation Setup

For sprite animations, organize frames sequentially:

```
/animation/
├── 0.png
├── 1.png
├── 2.png
└── ...
```

```javascript
// Animation configuration (top-level)
animation: {
  enabled: true,
  frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  frame_base_path: '/animation',
  frame_suffix: '.png',
  frame_duration_ms: 150,
  loop: false,
  auto_start: false
}

// Or provide full URLs
animation: {
  enabled: true,
  frames: [
    'https://example.com/frames/0.png',
    'https://example.com/frames/1.png',
  ],
  frame_duration_ms: 150,
  loop: false,
  auto_start: false
}

// Control animation
particleSystem.startAnimation();  // User-triggered start
```

### Secondary Particles

Secondary particles provide background/foreground effects independent of the main image particles.

```javascript
{
  secondary_particles: {
    enabled: true,
    
    // Placement strategies
    placement_mode: 'around_image',        // 'grid', 'random', 'around_image'
    particle_multiplier: 0.075,           // Density relative to primary (0.01-0.5)
    placement_image_buffer: 80,            // Buffer around image (10-200%)
    color: '#ebdbb2',                   // Particle color
    render_order: 'background',            // 'background' or 'foreground'
    
    // Movement (inherits from primary with overrides)
    movement: {
      random: {
        enabled: true,
        speed: 0.3                        // Movement speed (0.1-2.0)
      }
    },
    
    // Interactions (independent from primary)
    interactivity: {
      enabled: true,
      detection_radius: 120,              // Interaction radius (50-300)
      touch_sensitivity: 0.1,             // Touch response strength (0.01-1.0)
      touch_max_offset: 2.0               // Maximum touch displacement (0.5-10.0)
    }
  }
}
```

#### Placement Modes

**Grid Mode**
```
Regular grid across entire canvas
┼─┼─┼─┼─┼
┼─┼─┼─┼─┼
┼─┼─┼─┼─┼
```

**Random Mode**
```
Random distribution with minimum spacing
•    •     •  
  •   •   •
 •       •
```

**Around Image Mode**
```
Elliptical distribution around image area
    • • •
  •       •
 •   ■   •    (■ = image)
  •       •
    • • •
```

### Interactions

```javascript
{
  interactions: {
    // Repulse interaction (gentle push)
    repulse: {
      detection_radius: 100,             // Detection distance (10-300)
      max_displacement: 0.5,            // Maximum push distance (0.1-5.0)
      repulse_duration: 0.1,           // Animation duration (0.05-1.0)
      force_curve: 'linear'              // 'linear', 'top_heavy', 'bottom_heavy'
    },
    
    // Big repulse (stronger push)
    big_repulse: {
      distance: 100,                    // Detection distance (50-500)
      strength: 500                     // Push strength (100-2000)
    }
  }
}
```

#### Force Curves

**Linear**: Constant force throughout duration
```
Force │───────
       │       
       │       
       └─────── Time
```

**Top Heavy**: Strong initial force, then decay
```
Force │╱╲
       │ ╱ ╲
       │╱   ╲
       └─────── Time
```

**Bottom Heavy**: Weak initial force, then increase
```
Force │╲╱
       │ ╲ ╱
       │╲   ╱
       └─────── Time
```

## Configuration Presets

### Basic Static Image
```javascript
{
  particles: { color: '#ffffff', density: 100 },
  image: { src: { path: '/logo.png' } },
  features: {
    responsive: false,
    interactivity: true
  }
}
```

### Responsive Background
```javascript
{
  particles: {
    color: ['rgba(255,255,255,0.3)', 'rgba(100,200,255,0.2)'],
    density: 60,
    movement: {
      floating: { enabled: true, amplitude: 4, frequency: 0.2 }
    }
  },
  features: {
    responsive: true,
    floating: true,
    interactivity: false
  }
}
```

### Animated Logo with Effects
```javascript
{
  image: {
    src: { path: '/logo-sprites/0.png' }
  },
  animation: {
    enabled: true,
    frames: [0,1,2,3,4,5,6,7,8,9],
    frame_base_path: '/logo-sprites',
    frame_suffix: '.png',
    frame_duration_ms: 100,
    loop: false,
    auto_start: false
  },
  secondary_particles: {
    enabled: true,
    placement_mode: 'around_image',
    particle_multiplier: 0.1,
    color: 'rgba(255,100,50,0.5)',
    render_order: 'background'
  },
  particles: {
    scatter: { force: 12 },
    fade_out: { enabled: true, duration_ms: 1500 }
  },
  features: {
    responsive: true,
    secondaryParticles: true,
    animation: true,
    scatter: true,
    fade: true,
    interactivity: true
  }
}
```

## Performance Optimization

### 1. Feature Selection
Only enable features you actually need:

```javascript
// Good: Minimal bundle
features: {
  responsive: true,
  interactivity: true
}

// Avoid: All features unless needed
features: {
  responsive: true,
  secondaryParticles: true,    // +8KB
  animation: true,           // +6KB  
  floating: true,           // +3KB
  scatter: true,           // +4KB
  fade: true,              // +2KB
  interactivity: true
}
```

### 2. Particle Density
Use responsive density for mobile optimization:

```javascript
particles: {
  density: 80,                     // Desktop
  responsive: {
    density: {
      base_density: 80,
      breakpoints: {
        mobile: { multiplier: 0.4 },  // 32 particles on mobile
        desktop: { multiplier: 1.2 }  // 96 particles on desktop
      }
    }
  }
}
```

### 3. Image Optimization
- Use appropriately sized source images
- Compress images without quality loss
- Consider SVG for simple graphics
- Pre-load critical images

## Validation and Error Handling

### Configuration Validation
```javascript
import { ConfigMerger } from 'reliq-enhanced-particle-image';

const config = { /* your config */ };
const validation = ConfigMerger.validateConfig(config);

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  // validation.errors = ['Missing particles configuration', 'Invalid animation frames']
}
```

### Runtime Errors
```javascript
document.addEventListener('particleImageError', (event) => {
  console.error('Particle system error:', event.detail);
  // Handle errors gracefully
});
```

### Common Pitfalls

1. **Invalid Container**: Ensure container element exists
2. **Missing Image**: Verify image path is accessible
3. **Cross-Origin Images**: Set `is_external: true` for external URLs
4. **Feature Conflicts**: Some combinations may not work well together
5. **Performance**: Too many particles on mobile devices

## Migration from Original

### Key Differences

| Aspect | Original | Enhanced |
|---------|-----------|-----------|
| API | Global function | ES6 Class |
| Initialization | Manual | Promise-based |
| Features | Always enabled | Opt-in toggles |
| Architecture | Monolithic | Modular |
| Error Handling | Console logs | Event system |

### Step-by-Step Migration

1. **Replace constructor**:
```javascript
// Old
const pImg = new ParticleImageDisplayer('particle-image', canvas, params);

// New
const particleSystem = new ReliqParticleImage('#container', config);
```

2. **Update initialization**:
```javascript
// Old
pImg.functions.canvas.init();
pImg.functions.image.init();

// New
await particleSystem.initialize();
```

3. **Add feature toggles**:
```javascript
// Old (features always on)
// No configuration needed

// New (opt-in features)
features: {
  responsive: true,
  interactivity: true
}
```

4. **Update event handling**:
```javascript
// Old (callback-based)
// Manual event binding

// New (event-driven)
document.addEventListener('particleImageReady', callback);
document.addEventListener('particleImageError', errorHandler);
```
