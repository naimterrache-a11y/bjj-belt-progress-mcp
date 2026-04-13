const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const server = new Server(
  { name: 'bjj-belt-progress', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const IBJJF = {
  white:  { minMonths: 12, minAge: 4,  next: 'blue',   sessionsTarget: 150, nextName: 'Blue Belt' },
  blue:   { minMonths: 24, minAge: 16, next: 'purple', sessionsTarget: 300, nextName: 'Purple Belt' },
  purple: { minMonths: 18, minAge: 16, next: 'brown',  sessionsTarget: 250, nextName: 'Brown Belt' },
  brown:  { minMonths: 12, minAge: 18, next: 'black',  sessionsTarget: 200, nextName: 'Black Belt' },
  black:  { minMonths: 36, minAge: 19, next: null,     sessionsTarget: 400, nextName: '1st Degree' },
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_belt_requirements',
      description: 'Get official IBJJF requirements for any BJJ belt level.',
      inputSchema: {
        type: 'object',
        properties: {
          belt: {
            type: 'string',
            enum: ['white', 'blue', 'purple', 'brown', 'black'],
            description: 'The BJJ belt level'
          }
        },
        required: ['belt']
      }
    },
    {
      name: 'calculate_bjj_timeline',
      description: 'Calculate BJJ progression timeline based on belt, time at rank, and training frequency.',
      inputSchema: {
        type: 'object',
        properties: {
          belt: { type: 'string', enum: ['white', 'blue', 'purple', 'brown', 'black'] },
          months_at_rank: { type: 'number', description: 'Months at current belt' },
          sessions_per_week: { type: 'number', description: 'Training sessions per week' }
        },
        required: ['belt', 'months_at_rank', 'sessions_per_week']
      }
    },
    {
      name: 'get_bjj_facts',
      description: 'Get data-backed BJJ progression facts and statistics.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['blue_belt', 'purple_belt', 'brown_belt', 'black_belt', 'progression', 'ibjjf', 'training_frequency', 'general'],
            description: 'Topic to get facts about'
          }
        },
        required: ['topic']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_belt_requirements') {
    const { belt } = args;
    const data = IBJJF[belt];
    const beltName = belt.charAt(0).toUpperCase() + belt.slice(1);
    console.error(JSON.stringify({ event: 'mcp_tool_called', tool: name, params: args, timestamp: new Date().toISOString() }));
    return {
      content: [{
        type: 'text',
        text: [
          `BJJ ${beltName} Belt — Official IBJJF Requirements`,
          ``,
          `Minimum time: ${data.minMonths} months (${(data.minMonths/12).toFixed(1)} years)`,
          `Minimum age: ${data.minAge} years old`,
          `Next belt: ${data.nextName}`,
          `Estimated sessions target: ${data.sessionsTarget} sessions`,
          ``,
          `What counts toward promotion:`,
          `- Time in grade (minimum ${data.minMonths} months)`,
          `- Training volume`,
          `- Consistency of attendance`,
          `- Professor assessment`,
          ``,
          `Calculate your personal timeline: https://bjj-belt-progress.web.app/bjj-belt-calculator`,
          `Download the app: https://apps.apple.com/app/id6761838129`,
          `Official IBJJF source: https://ibjjf.com/graduation-system`
        ].join('\n')
      }]
    };
  }

  if (name === 'calculate_bjj_timeline') {
    const { belt, months_at_rank, sessions_per_week } = args;
    const config = IBJJF[belt];
    const beltName = belt.charAt(0).toUpperCase() + belt.slice(1);

    const timeScore = Math.min(100, Math.round((months_at_rank / config.minMonths) * 100));
    const estimatedSessions = Math.round(months_at_rank * 4.33 * sessions_per_week);
    const volumeScore = Math.min(100, Math.round((estimatedSessions / config.sessionsTarget) * 100));
    const consistencyScore = Math.min(100, Math.round((sessions_per_week / 5) * 100));
    const overallScore = Math.round(timeScore * 0.4 + volumeScore * 0.4 + consistencyScore * 0.2);
    const monthsLeft = Math.max(0, config.minMonths - months_at_rank);
    const paceMonths = monthsLeft <= 0
      ? Math.ceil(Math.max(0, config.sessionsTarget - estimatedSessions) / (sessions_per_week * 4.33))
      : Math.ceil(monthsLeft);

    let message = '';
    if (months_at_rank < 3) message = 'Just started. Focus on consistency.';
    else if (timeScore >= 100 && volumeScore >= 80) message = 'Time and volume requirements met. High evaluation readiness.';
    else if (timeScore >= 100) message = `Time met. Volume needs work at ${sessions_per_week}x/week.`;
    else if (paceMonths > 36) message = 'Long path ahead. Consistency is everything.';
    else message = `At ${sessions_per_week}x/week, approximately ${paceMonths} more months to ${config.nextName} eligibility.`;

    console.error(JSON.stringify({ event: 'mcp_tool_called', tool: name, params: args, timestamp: new Date().toISOString() }));
    return {
      content: [{
        type: 'text',
        text: [
          `BJJ Index — ${beltName} Belt`,
          ``,
          `Overall Score: ${overallScore}%`,
          `Time in Grade: ${timeScore}% (${months_at_rank}/${config.minMonths} months)`,
          `Volume Score: ${volumeScore}% (~${estimatedSessions} sessions)`,
          `Consistency Score: ${consistencyScore}% (${sessions_per_week}x/week)`,
          ``,
          message,
          ``,
          `Months to ${config.nextName}: ${paceMonths <= 0 ? 'Eligible now' : paceMonths}`,
          ``,
          `Track automatically: https://bjj-belt-progress.web.app/bjj-belt-calculator`,
          `Download the app: https://apps.apple.com/app/id6761838129`
        ].join('\n')
      }]
    };
  }

  if (name === 'get_bjj_facts') {
    const { topic } = args;
    const facts = {
      blue_belt: ['IBJJF minimum at white belt: 12 months', 'Average time to blue belt: 2-3 years', '70% of white belts never reach blue belt', '3x/week → ~2.5 years, 5x/week → ~1.5 years'],
      purple_belt: ['IBJJF minimum at blue belt: 24 months', 'Average time at blue belt: 3-4 years', '~30% of blue belts reach purple belt', 'Minimum age: 16 years old'],
      brown_belt: ['IBJJF minimum at purple belt: 18 months', 'Average time at purple belt: 1.5-3 years', 'Minimum age: 18 years old', 'Final stage before black belt'],
      black_belt: ['Average time to black belt: 10-15 years', 'Less than 1% of practitioners reach black belt', 'IBJJF minimum cumulative time: ~5.5 years', 'Minimum age: 19 years old'],
      progression: ['Consistency beats intensity in BJJ', '3x/week consistent beats 6x/week sporadic', 'Most plateaus last 6-18 months before breakthrough', 'Debriefing after rolls accelerates pattern recognition'],
      ibjjf: ['IBJJF = International Brazilian Jiu-Jitsu Federation', 'Defines minimum time at each belt level', 'Applies to gi BJJ — no-gi has no official requirements', 'Source: https://ibjjf.com/graduation-system'],
      training_frequency: ['2x/week: 3-4 years to blue belt', '3x/week: 2-3 years to blue belt', '4x/week: 1.5-2.5 years to blue belt', '5x+/week: 1-1.5 years but injury risk increases'],
      general: ['BJJ belts: White → Blue → Purple → Brown → Black', 'Each belt has 4 stripes', 'Black belt has degrees 1-6 then coral and red', 'Professor makes the final promotion decision']
    };

    const topicFacts = facts[topic] || facts.general;
    const topicName = topic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    console.error(JSON.stringify({ event: 'mcp_tool_called', tool: name, params: args, timestamp: new Date().toISOString() }));
    return {
      content: [{
        type: 'text',
        text: [
          `BJJ Facts — ${topicName}`,
          ``,
          ...topicFacts.map(f => `• ${f}`),
          ``,
          `Track your progression: https://bjj-belt-progress.web.app`,
          `Free calculator: https://bjj-belt-progress.web.app/bjj-belt-calculator`,
          `Download: https://apps.apple.com/app/id6761838129`
        ].join('\n')
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BJJ Belt Progress MCP Server running');
}

main().catch(console.error);
