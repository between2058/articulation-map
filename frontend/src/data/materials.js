/**
 * Physical Material Presets
 * 
 * Standard material properties for rapid physics configuration.
 * Units:
 * - Density: kg/m³
 * - Friction: 0.0 - 1.0+ (coefficient)
 * - Restitution: 0.0 - 1.0 (bounciness)
 */

export const MATERIAL_PRESETS = [
    // --- Metals ---
    {
        id: 'steel',
        name: 'Steel (Stainless)',
        icon: '/materials/mat_steel.png',
        properties: { density: 7800, staticFriction: 0.6, dynamicFriction: 0.4, restitution: 0.1 }
    },
    {
        id: 'aluminum',
        name: 'Aluminum',
        icon: '/materials/mat_aluminum.png',
        properties: { density: 2700, staticFriction: 0.6, dynamicFriction: 0.4, restitution: 0.1 }
    },
    {
        id: 'titanium',
        name: 'Titanium Alloy',
        icon: '/materials/mat_titanium.png',
        properties: { density: 4500, staticFriction: 0.5, dynamicFriction: 0.3, restitution: 0.1 }
    },

    // --- Plastics ---
    {
        id: 'abs',
        name: 'ABS Plastic',
        icon: '/materials/mat_abs_plastic.png',
        properties: { density: 1050, staticFriction: 0.5, dynamicFriction: 0.35, restitution: 0.3 }
    },
    {
        id: 'nylon',
        name: 'Nylon',
        icon: '/materials/mat_nylon.png',
        properties: { density: 1150, staticFriction: 0.3, dynamicFriction: 0.2, restitution: 0.2 }
    },
    {
        id: 'acrylic',
        name: 'Acrylic (Clear)',
        icon: '/materials/mat_acrylic.png',
        properties: { density: 1180, staticFriction: 0.8, dynamicFriction: 0.5, restitution: 0.2 }
    },

    // --- Rubber & Soft ---
    {
        id: 'rubber_tire',
        name: 'Rubber (Tire)',
        icon: '/materials/mat_rubber_tire.png',
        properties: { density: 1100, staticFriction: 1.0, dynamicFriction: 0.8, restitution: 0.05 }
    },
    {
        id: 'rubber_bouncy',
        name: 'Rubber (Bouncy)',
        icon: '/materials/mat_rubber_bouncy.png',
        properties: { density: 1100, staticFriction: 0.8, dynamicFriction: 0.6, restitution: 0.8 }
    },
    {
        id: 'silicone',
        name: 'Silicone',
        icon: '/materials/mat_silicone.png',
        properties: { density: 1300, staticFriction: 0.9, dynamicFriction: 0.7, restitution: 0.1 }
    },

    // --- Natural / Other ---
    {
        id: 'wood',
        name: 'Wood (Oak)',
        icon: '/materials/mat_wood.png',
        properties: { density: 750, staticFriction: 0.5, dynamicFriction: 0.3, restitution: 0.1 }
    },
    {
        id: 'concrete',
        name: 'Concrete',
        icon: '/materials/mat_concrete.png',
        properties: { density: 2400, staticFriction: 0.8, dynamicFriction: 0.6, restitution: 0.0 }
    },
    {
        id: 'ice',
        name: 'Ice',
        icon: '/materials/mat_ice.png',
        properties: { density: 900, staticFriction: 0.1, dynamicFriction: 0.05, restitution: 0.0 }
    }
];
