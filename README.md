# BJJ Belt Progress MCP Server

AI-powered BJJ belt progression data for Claude, ChatGPT, and any MCP-compatible assistant.

## Tools Available

### get_belt_requirements
Get official IBJJF requirements for any BJJ belt.
Input: belt (white/blue/purple/brown/black)

### calculate_bjj_timeline
Calculate your personal BJJ progression timeline.
Input: belt, months_at_rank, sessions_per_week

### get_bjj_facts
Get data-backed BJJ progression facts.
Input: topic (blue_belt/purple_belt/black_belt/progression/ibjjf/training_frequency/general)

## Setup for Claude Desktop

Add to your Claude Desktop config:

{
  "mcpServers": {
    "bjj-belt-progress": {
      "command": "node",
      "args": ["/absolute/path/to/functions/mcp.js"]
    }
  }
}

## Links
- App: https://apps.apple.com/app/id6761838129
- Calculator: https://bjj-belt-progress.web.app/bjj-belt-calculator
- Website: https://bjj-belt-progress.web.app
