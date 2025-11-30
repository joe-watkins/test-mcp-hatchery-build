/**
 * MCP Tool Definitions for MagentaA11y Accessibility Criteria
 * Provides 11 tools for querying web and native accessibility criteria
 * Used by both stdio (local) and HTTP (Netlify) transports
 */
import {
    loadContent,
    listComponents,
    findComponent,
    searchComponents,
    listComponentFormats,
    formatComponentOutput,
    listCategories
} from './helpers.js';

/**
 * Helper to create text response
 */
function textResponse(text) {
    return {
        content: [{ type: 'text', text }]
    };
}

/**
 * Helper to create JSON response
 */
function jsonResponse(data) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    };
}

export const tools = [
    // ============================================
    // Web Platform Tools
    // ============================================
    {
        name: 'list_web_components',
        description: 'List all available web accessibility components from MagentaA11y. Optionally filter by category (e.g., controls, forms, components).',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    description: 'Optional category filter (e.g., "controls", "forms", "components")',
                },
            },
        },
        handler: async (args) => {
            try {
                const components = listComponents('web', args.category);
                
                if (components.length === 0) {
                    if (args.category) {
                        const categories = listCategories('web');
                        return textResponse(
                            `No components found in category "${args.category}".\n\nAvailable categories:\n${categories.map(c => `- ${c.label} (${c.name}): ${c.componentCount} components`).join('\n')}`
                        );
                    }
                    return textResponse('No web components found.');
                }
                
                // Group by category for better display
                const grouped = {};
                for (const comp of components) {
                    if (!grouped[comp.category]) {
                        grouped[comp.category] = [];
                    }
                    grouped[comp.category].push(comp);
                }
                
                let output = `# Web Accessibility Components (${components.length} total)\n\n`;
                for (const [category, comps] of Object.entries(grouped)) {
                    output += `## ${category}\n`;
                    for (const comp of comps) {
                        output += `- **${comp.label}** (\`${comp.name}\`)\n`;
                    }
                    output += '\n';
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error listing web components: ${error.message}`);
            }
        }
    },
    {
        name: 'get_web_component',
        description: 'Get detailed accessibility criteria for a specific web component. Returns acceptance criteria, WCAG mappings, code examples, and implementation guidelines.',
        inputSchema: {
            type: 'object',
            properties: {
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "checkbox", "text-input")',
                },
                include_code_examples: {
                    type: 'boolean',
                    description: 'Include code examples in response (default: true)',
                    default: true,
                },
            },
            required: ['component'],
        },
        handler: async (args) => {
            try {
                const component = findComponent('web', args.component);
                
                if (!component) {
                    const allComponents = listComponents('web');
                    const suggestions = allComponents
                        .filter(c => c.name.includes(args.component.toLowerCase()) || 
                                    c.label.toLowerCase().includes(args.component.toLowerCase()))
                        .slice(0, 5);
                    
                    let msg = `Component "${args.component}" not found.`;
                    if (suggestions.length > 0) {
                        msg += `\n\nDid you mean:\n${suggestions.map(s => `- ${s.label} (\`${s.name}\`)`).join('\n')}`;
                    }
                    return textResponse(msg);
                }
                
                const includeCode = args.include_code_examples !== false;
                const formatted = formatComponentOutput(component, includeCode);
                
                let output = `# ${formatted.label}\n\n`;
                output += `**Category:** ${formatted.category}\n`;
                output += `**Component ID:** \`${formatted.name}\`\n\n`;
                
                if (formatted.generalNotes) {
                    output += `## Overview\n${formatted.generalNotes}\n\n`;
                }
                
                if (formatted.condensed) {
                    output += `## Condensed Criteria\n${formatted.condensed}\n\n`;
                }
                
                if (formatted.gherkin) {
                    output += `## Gherkin Acceptance Criteria\n${formatted.gherkin}\n\n`;
                }
                
                if (includeCode && formatted.developerNotes) {
                    output += `## Developer Notes & Code Examples\n${formatted.developerNotes}\n`;
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting component: ${error.message}`);
            }
        }
    },
    {
        name: 'search_web_criteria',
        description: 'Search web accessibility criteria using keywords. Find criteria related to WCAG guidelines, implementation patterns, or specific accessibility requirements.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search term or phrase (e.g., "focus indicator", "aria-label")',
                },
                max_results: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 10)',
                    default: 10,
                },
            },
            required: ['query'],
        },
        handler: async (args) => {
            try {
                const maxResults = args.max_results || 10;
                const results = searchComponents('web', args.query, maxResults);
                
                if (results.length === 0) {
                    return textResponse(`No results found for "${args.query}" in web accessibility criteria.`);
                }
                
                let output = `# Search Results for "${args.query}" (${results.length} matches)\n\n`;
                
                for (const result of results) {
                    output += `## ${result.label} (\`${result.name}\`)\n`;
                    output += `**Category:** ${result.category}\n`;
                    output += `**Matched in:** ${result.matchedFields.join(', ')}\n`;
                    if (result.generalNotes) {
                        output += `**Overview:** ${result.generalNotes}\n`;
                    }
                    output += '\n';
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error searching web criteria: ${error.message}`);
            }
        }
    },
    
    // ============================================
    // Native Platform Tools
    // ============================================
    {
        name: 'list_native_components',
        description: 'List all available native (iOS/Android) accessibility components from MagentaA11y. Optionally filter by category.',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    description: 'Optional category filter (e.g., "controls", "components")',
                },
            },
        },
        handler: async (args) => {
            try {
                const components = listComponents('native', args.category);
                
                if (components.length === 0) {
                    if (args.category) {
                        const categories = listCategories('native');
                        return textResponse(
                            `No components found in category "${args.category}".\n\nAvailable categories:\n${categories.map(c => `- ${c.label} (${c.name}): ${c.componentCount} components`).join('\n')}`
                        );
                    }
                    return textResponse('No native components found.');
                }
                
                // Group by category for better display
                const grouped = {};
                for (const comp of components) {
                    if (!grouped[comp.category]) {
                        grouped[comp.category] = [];
                    }
                    grouped[comp.category].push(comp);
                }
                
                let output = `# Native Accessibility Components (${components.length} total)\n\n`;
                output += `*For iOS (VoiceOver) and Android (TalkBack)*\n\n`;
                
                for (const [category, comps] of Object.entries(grouped)) {
                    output += `## ${category}\n`;
                    for (const comp of comps) {
                        output += `- **${comp.label}** (\`${comp.name}\`)\n`;
                    }
                    output += '\n';
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error listing native components: ${error.message}`);
            }
        }
    },
    {
        name: 'get_native_component',
        description: 'Get detailed accessibility criteria for a specific native component. Returns iOS and Android implementation details, platform-specific properties, and code examples.',
        inputSchema: {
            type: 'object',
            properties: {
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "switch", "picker")',
                },
                include_code_examples: {
                    type: 'boolean',
                    description: 'Include platform-specific code examples (default: true)',
                    default: true,
                },
            },
            required: ['component'],
        },
        handler: async (args) => {
            try {
                const component = findComponent('native', args.component);
                
                if (!component) {
                    const allComponents = listComponents('native');
                    const suggestions = allComponents
                        .filter(c => c.name.includes(args.component.toLowerCase()) || 
                                    c.label.toLowerCase().includes(args.component.toLowerCase()))
                        .slice(0, 5);
                    
                    let msg = `Native component "${args.component}" not found.`;
                    if (suggestions.length > 0) {
                        msg += `\n\nDid you mean:\n${suggestions.map(s => `- ${s.label} (\`${s.name}\`)`).join('\n')}`;
                    }
                    return textResponse(msg);
                }
                
                const includeCode = args.include_code_examples !== false;
                
                let output = `# ${component.label} (Native)\n\n`;
                output += `**Category:** ${component.category}\n`;
                output += `**Component ID:** \`${component.name}\`\n\n`;
                
                if (component.generalNotes) {
                    output += `## Overview\n${component.generalNotes}\n\n`;
                }
                
                if (component.condensed) {
                    output += `## Condensed Criteria\n${component.condensed}\n\n`;
                }
                
                if (component.gherkin) {
                    output += `## Gherkin Acceptance Criteria\n${component.gherkin}\n\n`;
                }
                
                if (includeCode) {
                    if (component.iosDeveloperNotes) {
                        output += `## iOS Developer Notes (VoiceOver)\n${component.iosDeveloperNotes}\n\n`;
                    }
                    
                    if (component.androidDeveloperNotes) {
                        output += `## Android Developer Notes (TalkBack)\n${component.androidDeveloperNotes}\n\n`;
                    }
                    
                    if (component.developerNotes) {
                        output += `## General Developer Notes\n${component.developerNotes}\n`;
                    }
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting native component: ${error.message}`);
            }
        }
    },
    {
        name: 'search_native_criteria',
        description: 'Search native accessibility criteria using keywords. Find platform-specific implementation details for iOS (VoiceOver) and Android (TalkBack).',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search term or phrase (e.g., "voiceover", "talkback", "accessibility label")',
                },
                max_results: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 10)',
                    default: 10,
                },
            },
            required: ['query'],
        },
        handler: async (args) => {
            try {
                const maxResults = args.max_results || 10;
                const results = searchComponents('native', args.query, maxResults);
                
                if (results.length === 0) {
                    return textResponse(`No results found for "${args.query}" in native accessibility criteria.`);
                }
                
                let output = `# Native Search Results for "${args.query}" (${results.length} matches)\n\n`;
                
                for (const result of results) {
                    output += `## ${result.label} (\`${result.name}\`)\n`;
                    output += `**Category:** ${result.category}\n`;
                    output += `**Matched in:** ${result.matchedFields.join(', ')}\n`;
                    if (result.generalNotes) {
                        output += `**Overview:** ${result.generalNotes}\n`;
                    }
                    output += '\n';
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error searching native criteria: ${error.message}`);
            }
        }
    },
    
    // ============================================
    // Content Format Tools
    // ============================================
    {
        name: 'get_component_gherkin',
        description: 'Get Gherkin-style acceptance criteria for a component. These are detailed Given/When/Then scenarios for testing accessibility.',
        inputSchema: {
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    enum: ['web', 'native'],
                    description: 'Platform (web or native)',
                },
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "checkbox")',
                },
            },
            required: ['platform', 'component'],
        },
        handler: async (args) => {
            try {
                const component = findComponent(args.platform, args.component);
                
                if (!component) {
                    return textResponse(`Component "${args.component}" not found for platform "${args.platform}".`);
                }
                
                if (!component.gherkin) {
                    return textResponse(`No Gherkin criteria available for "${component.label}".`);
                }
                
                let output = `# Gherkin Acceptance Criteria: ${component.label}\n\n`;
                output += `**Platform:** ${args.platform}\n`;
                output += `**Category:** ${component.category}\n\n`;
                output += component.gherkin;
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting Gherkin criteria: ${error.message}`);
            }
        }
    },
    {
        name: 'get_component_condensed',
        description: 'Get condensed acceptance criteria for a component. These are shorter, more focused testing instructions.',
        inputSchema: {
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    enum: ['web', 'native'],
                    description: 'Platform (web or native)',
                },
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "checkbox")',
                },
            },
            required: ['platform', 'component'],
        },
        handler: async (args) => {
            try {
                const component = findComponent(args.platform, args.component);
                
                if (!component) {
                    return textResponse(`Component "${args.component}" not found for platform "${args.platform}".`);
                }
                
                if (!component.condensed) {
                    return textResponse(`No condensed criteria available for "${component.label}".`);
                }
                
                let output = `# Condensed Acceptance Criteria: ${component.label}\n\n`;
                output += `**Platform:** ${args.platform}\n`;
                output += `**Category:** ${component.category}\n\n`;
                output += component.condensed;
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting condensed criteria: ${error.message}`);
            }
        }
    },
    {
        name: 'get_component_developer_notes',
        description: 'Get developer implementation notes for a component. Includes code examples, WCAG mappings, and technical guidance.',
        inputSchema: {
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    enum: ['web', 'native'],
                    description: 'Platform (web or native)',
                },
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "checkbox")',
                },
            },
            required: ['platform', 'component'],
        },
        handler: async (args) => {
            try {
                const component = findComponent(args.platform, args.component);
                
                if (!component) {
                    return textResponse(`Component "${args.component}" not found for platform "${args.platform}".`);
                }
                
                let output = `# Developer Notes: ${component.label}\n\n`;
                output += `**Platform:** ${args.platform}\n`;
                output += `**Category:** ${component.category}\n\n`;
                
                let hasNotes = false;
                
                if (component.developerNotes) {
                    output += `## General Developer Notes\n${component.developerNotes}\n\n`;
                    hasNotes = true;
                }
                
                if (args.platform === 'native') {
                    if (component.iosDeveloperNotes) {
                        output += `## iOS Developer Notes\n${component.iosDeveloperNotes}\n\n`;
                        hasNotes = true;
                    }
                    
                    if (component.androidDeveloperNotes) {
                        output += `## Android Developer Notes\n${component.androidDeveloperNotes}\n\n`;
                        hasNotes = true;
                    }
                }
                
                if (!hasNotes) {
                    return textResponse(`No developer notes available for "${component.label}".`);
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting developer notes: ${error.message}`);
            }
        }
    },
    {
        name: 'get_component_native_notes',
        description: 'Get platform-specific developer notes for native components (iOS or Android implementation details).',
        inputSchema: {
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    enum: ['ios', 'android'],
                    description: 'Native platform (ios or android)',
                },
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "switch")',
                },
            },
            required: ['platform', 'component'],
        },
        handler: async (args) => {
            try {
                // Native components are stored under 'native' platform
                const component = findComponent('native', args.component);
                
                if (!component) {
                    return textResponse(`Native component "${args.component}" not found.`);
                }
                
                const platformName = args.platform === 'ios' ? 'iOS' : 'Android';
                const notesField = args.platform === 'ios' ? 'iosDeveloperNotes' : 'androidDeveloperNotes';
                const notes = component[notesField];
                
                if (!notes) {
                    return textResponse(`No ${platformName} developer notes available for "${component.label}".`);
                }
                
                let output = `# ${platformName} Developer Notes: ${component.label}\n\n`;
                output += `**Component:** ${component.name}\n`;
                output += `**Category:** ${component.category}\n\n`;
                output += notes;
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error getting native notes: ${error.message}`);
            }
        }
    },
    {
        name: 'list_component_formats',
        description: 'List all available content formats for a specific component (e.g., gherkin, condensed, developer notes).',
        inputSchema: {
            type: 'object',
            properties: {
                platform: {
                    type: 'string',
                    enum: ['web', 'native'],
                    description: 'Platform (web or native)',
                },
                component: {
                    type: 'string',
                    description: 'Component name (e.g., "button", "checkbox")',
                },
            },
            required: ['platform', 'component'],
        },
        handler: async (args) => {
            try {
                const formats = listComponentFormats(args.platform, args.component);
                
                if (!formats) {
                    return textResponse(`Component "${args.component}" not found for platform "${args.platform}".`);
                }
                
                let output = `# Available Formats: ${formats.label}\n\n`;
                output += `**Platform:** ${args.platform}\n`;
                output += `**Category:** ${formats.category}\n`;
                output += `**Component ID:** \`${formats.name}\`\n\n`;
                output += `## Available Content Formats\n\n`;
                
                const formatDescriptions = {
                    gherkin: 'Gherkin-style acceptance criteria (Given/When/Then)',
                    condensed: 'Condensed acceptance criteria (quick reference)',
                    developerNotes: 'Developer implementation notes with code examples',
                    androidDeveloperNotes: 'Android-specific developer notes (TalkBack)',
                    iosDeveloperNotes: 'iOS-specific developer notes (VoiceOver)',
                    videos: 'Demo videos',
                    generalNotes: 'General overview notes'
                };
                
                for (const [format, available] of Object.entries(formats.formats)) {
                    const status = available ? '✅' : '❌';
                    const desc = formatDescriptions[format] || format;
                    output += `${status} **${format}**: ${desc}\n`;
                }
                
                return textResponse(output);
            } catch (error) {
                return textResponse(`Error listing formats: ${error.message}`);
            }
        }
    }
];
