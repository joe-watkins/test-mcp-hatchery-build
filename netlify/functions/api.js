import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools } from '../../src/tools.js';

/**
 * Create MCP server instance
 */
const createServer = () => {
  const server = new Server(
    {
      name: 'magentaa11y-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });

  // Handler for calling tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    
    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    return await tool.handler(request.params.arguments);
  });

  return server;
};

/**
 * Handle JSON-RPC request directly (stateless)
 * This bypasses the transport layer for serverless compatibility
 */
async function handleJsonRpcRequest(server, request) {
  const { method, params, id } = request;

  try {
    let result;

    if (method === 'initialize') {
      result = {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'magentaa11y-mcp', version: '1.0.0' }
      };
    } else if (method === 'tools/list') {
      result = {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    } else if (method === 'tools/call') {
      const tool = tools.find(t => t.name === params.name);
      if (!tool) {
        throw new Error(`Unknown tool: ${params.name}`);
      }
      result = await tool.handler(params.arguments || {});
    } else if (method === 'notifications/initialized') {
      // This is a notification, no response needed
      return null;
    } else if (method === 'ping') {
      result = {};
    } else {
      throw new Error(`Unknown method: ${method}`);
    }

    return {
      jsonrpc: '2.0',
      id,
      result
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message
      }
    };
  }
}

/**
 * Netlify Function handler for MCP over HTTP
 * Implements stateless JSON-RPC handling for serverless environments
 */
export const handler = async (event, context) => {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Handle MCP JSON-RPC requests (POST to /mcp)
  if (event.httpMethod === 'POST') {
    try {
      const request = JSON.parse(event.body);
      const server = createServer();
      
      // Handle batch requests
      if (Array.isArray(request)) {
        const responses = [];
        for (const req of request) {
          const response = await handleJsonRpcRequest(server, req);
          if (response !== null) {
            responses.push(response);
          }
        }
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(responses.length === 1 ? responses[0] : responses)
        };
      }
      
      // Handle single request
      const response = await handleJsonRpcRequest(server, request);
      
      // Notifications don't get a response
      if (response === null) {
        return {
          statusCode: 202,
          headers: corsHeaders,
          body: ''
        };
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error: ' + error.message
          }
        })
      };
    }
  }

  // GET request - return server info (not MCP protocol)
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'magentaa11y-mcp',
        version: '1.0.0',
        status: 'healthy',
        protocol: 'MCP JSON-RPC 2.0',
        tools: tools.length
      })
    };
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
