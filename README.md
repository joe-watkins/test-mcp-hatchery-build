# MagentaA11y MCP Server

MCP server providing accessibility criteria from [MagentaA11y](https://www.magentaa11y.com/). Works locally (stdio) and remotely (Netlify Functions).

## Tools

| Tool | Description |
|------|-------------|
| `list_web_components` | List web accessibility components |
| `get_web_component` | Get detailed criteria for a web component |
| `search_web_criteria` | Search web criteria by keyword |
| `list_native_components` | List native iOS/Android components |
| `get_native_component` | Get detailed criteria for a native component |
| `search_native_criteria` | Search native criteria by keyword |
| `get_component_gherkin` | Get Gherkin-style acceptance criteria |
| `get_component_condensed` | Get condensed acceptance criteria |
| `get_component_developer_notes` | Get developer implementation notes |
| `get_component_native_notes` | Get iOS or Android specific notes |
| `list_component_formats` | List available formats for a component |

## Setup

```bash
npm install
git submodule update --init
```

## Updating Content

The accessibility criteria comes from the [magentaA11y](https://github.com/tmobile/magentaA11y) submodule. To update:

```bash
npm run update-content
```

This pulls the latest from magentaA11y, builds it, and copies the generated `content.json` to `/data`.

## Usage

### Local (Claude Desktop)

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

### Remote (Netlify)

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

```
src/
  index.js          # MCP server (stdio transport)
  tools.js          # Tool definitions and handlers
  helpers.js        # Data loading and search utilities
data/
  content.json      # MagentaA11y accessibility criteria
  magentaA11y/      # Git submodule (source repo)
netlify/
  functions/api.js  # Netlify Function (SSE transport)
scripts/
  update-content.js # Build script for updating content
```
