/**
 * MCP Server Helper Functions
 * Provides data loading, caching, component finding, and search utilities
 * for the MagentaA11y accessibility criteria tools
 */

// Import content.json directly - works with bundlers (esbuild, webpack) and Node.js
// This approach is compatible with Netlify Functions bundling
import contentData from '../data/content.json' with { type: 'json' };

// Cache reference (using imported data directly)
const contentCache = contentData;

/**
 * Load and cache content.json data
 * Uses static import for bundler compatibility (Netlify Functions)
 * @returns {Object} Parsed content data with web and native sections
 */
export function loadContent() {
    return contentCache;
}

/**
 * Get all components for a platform, optionally filtered by category
 * @param {string} platform - 'web' or 'native'
 * @param {string} [category] - Optional category filter (e.g., 'component', 'controls')
 * @returns {Array} List of component objects with name and label
 */
export function listComponents(platform, category = null) {
    const content = loadContent();
    const platformData = content[platform];
    
    if (!platformData) {
        return [];
    }
    
    let components = [];
    
    for (const cat of platformData) {
        // Filter by category if specified
        if (category && cat.name.toLowerCase() !== category.toLowerCase()) {
            continue;
        }
        
        if (cat.children) {
            for (const child of cat.children) {
                components.push({
                    name: child.name,
                    label: child.label,
                    category: cat.label,
                    categoryName: cat.name
                });
            }
        }
    }
    
    return components;
}

/**
 * Find a specific component by name
 * @param {string} platform - 'web' or 'native'
 * @param {string} componentName - Component slug name (e.g., 'button', 'checkbox')
 * @returns {Object|null} Component object or null if not found
 */
export function findComponent(platform, componentName) {
    const content = loadContent();
    const platformData = content[platform];
    
    if (!platformData) {
        return null;
    }
    
    // Normalize component name for matching
    const normalizedName = componentName.toLowerCase().trim();
    
    for (const category of platformData) {
        if (category.children) {
            for (const component of category.children) {
                // Exact match on name
                if (component.name.toLowerCase() === normalizedName) {
                    return {
                        ...component,
                        category: category.label,
                        categoryName: category.name
                    };
                }
            }
        }
    }
    
    // Fallback: partial match
    for (const category of platformData) {
        if (category.children) {
            for (const component of category.children) {
                if (component.name.toLowerCase().includes(normalizedName) ||
                    component.label.toLowerCase().includes(normalizedName)) {
                    return {
                        ...component,
                        category: category.label,
                        categoryName: category.name
                    };
                }
            }
        }
    }
    
    return null;
}

/**
 * Search components by keyword across text fields
 * @param {string} platform - 'web' or 'native'
 * @param {string} query - Search term
 * @param {number} [maxResults=10] - Maximum results to return
 * @returns {Array} Matching components with relevance scores
 */
export function searchComponents(platform, query, maxResults = 10) {
    const content = loadContent();
    const platformData = content[platform];
    
    if (!platformData || !query) {
        return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    // Fields to search with weights
    const searchFields = [
        { field: 'label', weight: 10 },
        { field: 'name', weight: 10 },
        { field: 'generalNotes', weight: 5 },
        { field: 'gherkin', weight: 3 },
        { field: 'condensed', weight: 3 },
        { field: 'developerNotes', weight: 2 },
        { field: 'androidDeveloperNotes', weight: 2 },
        { field: 'iosDeveloperNotes', weight: 2 }
    ];
    
    for (const category of platformData) {
        if (category.children) {
            for (const component of category.children) {
                let score = 0;
                const matches = [];
                
                for (const { field, weight } of searchFields) {
                    const value = component[field];
                    if (value && typeof value === 'string') {
                        const lowerValue = value.toLowerCase();
                        if (lowerValue.includes(normalizedQuery)) {
                            score += weight;
                            // Count occurrences for better ranking
                            const occurrences = (lowerValue.match(new RegExp(normalizedQuery, 'g')) || []).length;
                            score += occurrences - 1; // Bonus for multiple matches
                            matches.push(field);
                        }
                    }
                }
                
                if (score > 0) {
                    results.push({
                        name: component.name,
                        label: component.label,
                        category: category.label,
                        categoryName: category.name,
                        score,
                        matchedFields: matches,
                        generalNotes: component.generalNotes
                    });
                }
            }
        }
    }
    
    // Sort by score descending, then by name
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
    });
    
    return results.slice(0, maxResults);
}

/**
 * List available content formats for a component
 * @param {string} platform - 'web' or 'native'
 * @param {string} componentName - Component slug name
 * @returns {Object} Object with available format flags
 */
export function listComponentFormats(platform, componentName) {
    const component = findComponent(platform, componentName);
    
    if (!component) {
        return null;
    }
    
    return {
        name: component.name,
        label: component.label,
        category: component.category,
        formats: {
            gherkin: !!component.gherkin,
            condensed: !!component.condensed,
            developerNotes: !!component.developerNotes,
            androidDeveloperNotes: !!component.androidDeveloperNotes,
            iosDeveloperNotes: !!component.iosDeveloperNotes,
            videos: !!component.videos,
            generalNotes: !!component.generalNotes
        }
    };
}

/**
 * Format component details for output
 * @param {Object} component - Component object
 * @param {boolean} includeCodeExamples - Whether to include code examples (from developerNotes)
 * @returns {Object} Formatted component data
 */
export function formatComponentOutput(component, includeCodeExamples = true) {
    if (!component) return null;
    
    const output = {
        name: component.name,
        label: component.label,
        category: component.category,
        generalNotes: component.generalNotes || null
    };
    
    // Include gherkin criteria if available
    if (component.gherkin) {
        output.gherkin = component.gherkin;
    }
    
    // Include condensed criteria if available
    if (component.condensed) {
        output.condensed = component.condensed;
    }
    
    // Include developer notes if requested and available
    if (includeCodeExamples && component.developerNotes) {
        output.developerNotes = component.developerNotes;
    }
    
    // Include platform-specific notes for native
    if (component.androidDeveloperNotes) {
        output.androidDeveloperNotes = component.androidDeveloperNotes;
    }
    if (component.iosDeveloperNotes) {
        output.iosDeveloperNotes = component.iosDeveloperNotes;
    }
    
    return output;
}

/**
 * Get list of all categories for a platform
 * @param {string} platform - 'web' or 'native'
 * @returns {Array} List of category objects
 */
export function listCategories(platform) {
    const content = loadContent();
    const platformData = content[platform];
    
    if (!platformData) {
        return [];
    }
    
    return platformData.map(cat => ({
        name: cat.name,
        label: cat.label,
        componentCount: cat.children ? cat.children.length : 0
    }));
}
