# MagentaA11y MCP Server

MCP server providing accessibility criteria from [MagentaA11y](https://www.magentaa11y.com/). Works locally (stdio) and remotely (Netlify Functions).

## Tools (11 total)

| Tool | Description |
|------|-------------|
| `list_web_components` | List web accessibility components (51 total) |
| `get_web_component` | Get detailed criteria for a web component |
| `search_web_criteria` | Search web criteria by keyword |
| `list_native_components` | List native iOS/Android components (42 total) |
| `get_native_component` | Get detailed criteria for a native component |
| `search_native_criteria` | Search native criteria by keyword |
| `get_component_gherkin` | Get Gherkin-style acceptance criteria |
| `get_component_condensed` | Get condensed acceptance criteria |
| `get_component_developer_notes` | Get developer implementation notes |
| `get_component_native_notes` | Get iOS or Android specific notes |
| `list_component_formats` | List available formats for a component |

## Installation

```bash
npm install
```

### Local Use (Claude Desktop)

```json
{
  "mcpServers": {
    "magentaa11y": {
      "command": "node",
      "args": ["C:/path/to/src/index.js"]
    }
  }
}
```

### Remote Use (Netlify)

Deploy to Netlify, then:

```json
{
  "mcpServers": {
    "magentaa11y": {
      "command": "npx",
      "args": ["mcp-remote@next", "https://your-site.netlify.app/mcp"]
    }
  }
}
```

## Project Structure

- `src/index.js` - MCP server (stdio transport)
- `src/tools.js` - Tool definitions and handlers
- `src/helpers.js` - Data loading and search utilities
- `data/content.json` - MagentaA11y accessibility criteria
- `netlify/functions/api.js` - Netlify Function (SSE transport)
