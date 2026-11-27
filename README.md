# Insurance Panda — US Auto Insurance Minimums Dataset & MCP Server

[![insurance-panda/auto-insurance-mcp MCP server](https://glama.ai/mcp/servers/insurance-panda/auto-insurance-mcp/badges/score.svg)](https://glama.ai/mcp/servers/insurance-panda/auto-insurance-mcp)

An open, structured **2026 US 50-state + D.C. minimum car insurance requirements dataset** (JSON, CSV, and Markdown) paired with a zero-dependency, read-only **Model Context Protocol (MCP) server** maintained by [Insurance Panda](https://www.insurancepanda.com/).

> **Disclaimer:** Insurance Panda is an independent auto insurance comparison and driver education service, not an insurance company or underwriter. Statutory requirements change—always confirm current legal minimums with your state DMV or Department of Insurance.

## What's Inside

- **`data/state_minimums_2026.json`** — Machine-readable 2026 minimum liability limits (`BI/BI/PD`) and additional coverage mandates (PIP, UM/UIM, MedPay) for all 50 US states and Washington, D.C.
- **`data/state_minimums_2026.csv`** — Spreadsheet-ready CSV version of the same dataset.
- **`data/state_minimums_2026.md`** — Human-readable Markdown reference table.
- **`data/coverage_guides.json`** — Six plain-English car insurance guides (comparison shopping, full coverage vs. liability, state minimums, tickets & accidents, teen drivers, and high-risk drivers).
- **`src/index.js`** — Zero-dependency Node.js (>= 18) read-only MCP server over stdio.

## MCP Server Tools & Resources

### Tools
| Tool | Description |
| :--- | :--- |
| `get_state_minimums` | Look up 2026 minimum liability limits and additional state requirements by state name or 2-letter code (e.g., `TX`, `California`, `DC`). |
| `compare_state_minimums` | Compare multiple states side-by-side, or filter by `pip_required`, `um_required`, `highest_liability`, or `lowest_liability`. |
| `get_coverage_guide` | Fetch any of Insurance Panda's six plain-English coverage guides (or list all six). |
| `get_quote_comparison_link` | Validate a 5-digit US ZIP code and return a direct link to start a free, no-account quote comparison on Insurance Panda. |

### Resources
- `insurancepanda://datasets/state-minimums-2026`
- `insurancepanda://guides/coverage-guides`

## Quick Start (Zero Dependencies)

Requires **Node.js 18+**. No `npm install` needed.

```bash
# Run the built-in smoke test
npm test

# Start the stdio MCP server
npm start
```

### Example MCP Client Config (Claude Desktop / Cursor)

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

## About Insurance Panda

[Insurance Panda](https://www.insurancepanda.com/) is a free car insurance comparison and driver education platform available on **Web, iOS, and Android**:
- Start quote comparisons with just a 5-digit ZIP code—no account required.
- Set local policy renewal or shopping reminders with calendar and AM/PM controls (remembered ZIP and reminders stay locally on your device).
- Read plain-English auto coverage guides and insurer reviews.

## Data Sources & Verification

State minimum liability limits and additional state requirements were compiled and verified in November 2026 against [Insure.com's Minimum Car Insurance Requirements by State (Updated Oct 2026)](https://www.insure.com/car-insurance/minimum-coverage-levels.html), reflecting recent 2025–2026 statutory updates in California (`30/60/15`), Massachusetts (`25/50/30`), New Jersey (`35/70/25`), North Carolina (`50/100/50`), Utah (`30/65/25`), and Virginia (`50/100/25`).

## License

MIT — see [LICENSE](./LICENSE).
