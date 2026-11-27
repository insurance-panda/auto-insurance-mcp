# Installing the Insurance Panda auto insurance MCP server

This server has no dependencies and needs no API keys. It only needs Node.js 18 or newer.

1. Clone the repository:

   ```bash
   git clone https://github.com/insurance-panda/auto-insurance-mcp.git
   ```

2. Check that it works (optional):

   ```bash
   cd auto-insurance-mcp
   node tests/smoke-test.mjs
   ```

   It should print `ALL SMOKE TESTS PASSED`.

3. Add the server to the MCP settings, using the absolute path to `src/index.js`:

   ```json
   {
     "mcpServers": {
       "insurance-panda": {
         "command": "node",
         "args": ["/absolute/path/to/auto-insurance-mcp/src/index.js"]
       }
     }
   }
   ```

There is no `npm install` step and nothing to configure. The server is read-only and uses the data files in `data/`.

Tools: `get_state_minimums`, `compare_state_minimums`, `get_coverage_guide`, `get_quote_comparison_link`.
