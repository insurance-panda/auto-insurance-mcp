#!/usr/bin/env node
/**
 * Insurance Panda Read-Only MCP Server (JSON-RPC 2.0 over stdio)
 * Zero external dependencies — requires Node.js >= 18.
 *
 * Insurance Panda (https://www.insurancepanda.com/) is an independent auto
 * insurance comparison and driver education service, not an insurance company
 * or underwriter.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");

const stateData = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "state_minimums_2026.json"), "utf8")
);
const guideData = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "coverage_guides.json"), "utf8")
);

const SERVER_INFO = {
  name: "insurance-panda-mcp",
  version: "1.0.1",
};

const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "get_state_minimums",
    description:
      "Look up 2026 minimum car insurance liability limits and additional state requirements for any US state or Washington, D.C.",
    inputSchema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description:
            "US state name or 2-letter postal abbreviation (e.g., 'Texas', 'TX', 'California', 'DC').",
        },
      },
      required: ["state"],
    },
  },
  {
    name: "compare_state_minimums",
    description:
      "Compare 2026 minimum auto insurance requirements across multiple US states, or list states requiring PIP or uninsured motorist coverage.",
    inputSchema: {
      type: "object",
      properties: {
        states: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of state names or 2-letter abbreviations to compare side-by-side.",
        },
        filter: {
          type: "string",
          enum: ["all", "pip_required", "um_required", "highest_liability", "lowest_liability"],
          description:
            "Optional preset filter when 'states' is not provided.",
        },
      },
    },
  },
  {
    name: "get_coverage_guide",
    description:
      "Retrieve one of Insurance Panda's six plain-English car insurance guides (or list all guides if no slug is provided).",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          enum: [
            "comparison-shopping",
            "full-coverage-vs-liability",
            "state-minimums",
            "tickets-and-accidents",
            "teen-drivers",
            "high-risk-drivers",
          ],
          description: "Optional guide slug. Omit to list all six guides.",
        },
      },
    },
  },
  {
    name: "get_quote_comparison_link",
    description:
      "Validate a 5-digit US ZIP code and return a direct link to start a free, no-account car insurance comparison on Insurance Panda.",
    inputSchema: {
      type: "object",
      properties: {
        zip_code: {
          type: "string",
          description: "5-digit US ZIP code (e.g., '77380' or '90210').",
        },
      },
      required: ["zip_code"],
    },
  },
];

const RESOURCES = [
  {
    uri: "insurancepanda://datasets/state-minimums-2026",
    name: "US State Minimum Auto Insurance Requirements (2026)",
    description: "Structured JSON dataset of 2026 minimum liability limits across all 50 US states and D.C.",
    mimeType: "application/json",
  },
  {
    uri: "insurancepanda://guides/coverage-guides",
    name: "Insurance Panda Plain-English Coverage Guides",
    description: "Six consumer-friendly auto insurance guides covering shopping, coverage types, minimums, tickets, teens, and high-risk drivers.",
    mimeType: "application/json",
  },
];

function findState(query) {
  const norm = String(query || "").trim().toLowerCase();
  if (!norm) return null;
  if (norm === "washington dc" || norm === "washington, d.c." || norm === "d.c.") {
    return stateData.states.find((s) => s.abbreviation === "DC") || null;
  }
  return (
    stateData.states.find(
      (s) =>
        s.abbreviation.toLowerCase() === norm ||
        s.state.toLowerCase() === norm
    ) || null
  );
}

function handleToolCall(name, args = {}) {
  if (name === "get_state_minimums") {
    const match = findState(args.state);
    if (!match) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `State not found for '${args.state}'. Provide a valid US state name or 2-letter code (e.g., 'TX', 'California', 'DC').`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...match,
              last_verified: stateData.last_verified,
              disclaimer: stateData.disclaimer,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "compare_state_minimums") {
    let subset = [];
    if (Array.isArray(args.states) && args.states.length > 0) {
      subset = args.states.map(findState).filter(Boolean);
    } else {
      const f = args.filter || "all";
      if (f === "pip_required") {
        subset = stateData.states.filter((s) =>
          s.additional_requirements.toUpperCase().includes("PIP")
        );
      } else if (f === "um_required") {
        subset = stateData.states.filter((s) =>
          s.additional_requirements.toUpperCase().includes("UM")
        );
      } else if (f === "highest_liability") {
        subset = [...stateData.states]
          .sort(
            (a, b) =>
              b.bodily_injury_per_person_usd - a.bodily_injury_per_person_usd ||
              b.property_damage_per_accident_usd - a.property_damage_per_accident_usd
          )
          .slice(0, 10);
      } else if (f === "lowest_liability") {
        subset = [...stateData.states]
          .sort(
            (a, b) =>
              a.bodily_injury_per_person_usd - b.bodily_injury_per_person_usd ||
              a.property_damage_per_accident_usd - b.property_damage_per_accident_usd
          )
          .slice(0, 10);
      } else {
        subset = stateData.states;
      }
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              count: subset.length,
              last_verified: stateData.last_verified,
              states: subset,
              disclaimer: stateData.disclaimer,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "get_coverage_guide") {
    if (!args.slug) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(guideData, null, 2),
          },
        ],
      };
    }
    const guide = guideData.guides.find((g) => g.slug === args.slug);
    if (!guide) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Unknown guide slug '${args.slug}'.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...guide,
              disclaimer: guideData.disclaimer,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "get_quote_comparison_link") {
    const zip = String(args.zip_code || "").trim();
    if (!/^\d{5}$/.test(zip)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Please provide a valid 5-digit US ZIP code (e.g., '77380').",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              zip_code: zip,
              url: "https://www.insurancepanda.com/",
              comparison_guide: "https://www.insurancepanda.com/car-insurance-comparison/",
              platforms: ["Web", "iOS", "Android"],
              account_required: false,
              pricing: "Free",
              disclaimer:
                "Insurance Panda is an independent comparison and education service, not an insurance company or underwriter.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
  };
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  // Notifications have no id and expect no response
  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: SERVER_INFO,
        },
      };

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: TOOLS } };

    case "tools/call":
      return {
        jsonrpc: "2.0",
        id,
        result: handleToolCall(params?.name, params?.arguments),
      };

    case "resources/list":
      return { jsonrpc: "2.0", id, result: { resources: RESOURCES } };

    case "resources/read": {
      const uri = params?.uri;
      if (uri === "insurancepanda://datasets/state-minimums-2026") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(stateData, null, 2),
              },
            ],
          },
        };
      }
      if (uri === "insurancepanda://guides/coverage-guides") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(guideData, null, 2),
              },
            ],
          },
        };
      }
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: `Unknown resource URI: ${uri}` },
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const msg = JSON.parse(trimmed);
    const response = handleMessage(msg);
    if (response) {
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      }) + "\n"
    );
  }
});
