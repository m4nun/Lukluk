# agent
- Use function/tool calls (not structured JSON output) for agent-generated edits — LLM calls tools via API, backend processes into draft state, user confirms before save. Confidence: 0.50
- Embed the agent framework directly in the website (client-side/frontend) rather than as a separate backend service. Confidence: 0.60
- Use Vercel AI SDK + LangGraph for the agent framework. Confidence: 0.70
- Use Vercel AI SDK Elements (Conversation, Message, MessageResponse, PromptInput, Tool) for agent chat UI components instead of building custom chat UI. Confidence: 0.65
- For LLM follow-up questions: send borderline/uncertain answers to the LLM with a prompt to generate up to 3 clarifying questions that could change the top 3 result — no rule-based pre-filtering. Confidence: 0.50
- Follow-up question loop: user answers follow-ups until the match is sufficiently refined or a cap of 20 total questions is reached. Confidence: 0.50
- Initialize git in projects and commit regularly as part of standard agent workflow. Confidence: 0.65
