# Harness Engineering: Agent Frameworks with Custom Tools

**Research Date:** July 5, 2026  
**Focus:** Building agent frameworks/harnesses that support custom tool definitions

---

## Summary

This research investigates how major agent frameworks handle custom tool registration, execution, and lifecycle management. The key findings are:

1. **Tool Definition Pattern**: All major frameworks (LangChain, CrewAI, AutoGen, OpenAI Agents SDK) converge on a similar pattern: name + description + JSON Schema + execution handler. The `@tool` decorator or `BaseTool` subclass are the two canonical approaches.

2. **Agent Loop Architecture**: The ReAct (Reason + Act) pattern dominates — models interleave reasoning traces with tool calls, observe results, and repeat until a stop condition is met. Frameworks implement this as a `while` loop with tool dispatch.

3. **MCP vs Function Calling**: Function calling is provider-specific (OpenAI, Anthropic, Google each have different schemas). MCP (Model Context Protocol) is an emerging open standard for tool interoperability, now supported by OpenAI, Anthropic, and Google.

4. **Error Handling**: Production agents require layered defenses: exponential backoff with jitter for transient errors, circuit breakers for cascading failures, and validation for semantic errors.

5. **Tool Choice**: Providers support `auto` (model decides), `required` (must call a tool), `none` (no tools), and specific tool forcing. OpenAI and Anthropic have the most mature implementations.

---

## 1. Custom Tool Registration Across Frameworks

### LangChain

LangChain provides two primary patterns for defining custom tools:

**Pattern 1: `@tool` Decorator** (Source: [docs.langchain.com/oss/python/langchain/tools](https://docs.langchain.com/oss/python/langchain/tools))

```python
from langchain.tools import tool

@tool
def search_database(query: str, limit: int = 10) -> str:
    """Search the customer database for records matching the query.

    Args:
        query: Search terms to look for
        limit: Maximum number of results to return
    """
    return f"Found {limit} results for '{query}'"
```

Key characteristics:
- Function name becomes the tool name (overridable with `@tool("custom_name")`)
- Docstring becomes the tool description
- Type hints define the input schema automatically
- Supports Pydantic models or JSON schemas for complex inputs

**Pattern 2: Pydantic Schema with `@tool`**

```python
from pydantic import BaseModel, Field
from typing import Literal

class WeatherInput(BaseModel):
    """Input for weather queries."""
    location: str = Field(description="City name or coordinates")
    units: Literal["celsius", "fahrenheit"] = Field(default="celsius")

@tool(args_schema=WeatherInput)
def get_weather(location: str, units: str = "celsius") -> str:
    """Get current weather."""
    return f"Weather in {location}: 22 degrees"
```

**Tool Registration**: Tools are passed to agents or models via `bindTools()`:

```python
model_with_tools = model.bind_tools([search_database, get_weather])
```

**Source:** [docs.langchain.com/oss/python/langchain/tools](https://docs.langchain.com/oss/python/langchain/tools)

---

### CrewAI

CrewAI offers similar patterns with its own abstractions:

**Pattern 1: Subclassing `BaseTool`** (Source: [docs.crewai.com/v1.15.0/en/learn/create-custom-tools](https://docs.crewai.com/v1.15.0/en/learn/create-custom-tools))

```python
from typing import Type
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

class MyToolInput(BaseModel):
    """Input schema for MyCustomTool."""
    argument: str = Field(..., description="Description of the argument.")

class MyCustomTool(BaseTool):
    name: str = "Name of my tool"
    description: str = "What this tool does. It's vital for effective utilization."
    args_schema: Type[BaseModel] = MyToolInput

    def _run(self, argument: str) -> str:
        # Your tool's logic here
        return "Tool's result"
```

**Pattern 2: `@tool` Decorator**

```python
from crewai.tools import tool

@tool("Tool Name")
def my_simple_tool(question: str) -> str:
    """Tool description for clarity."""
    # Tool logic here
    return "Tool output"
```

**Key Differences from LangChain:**
- CrewAI tools are assigned to agents via the `tools` parameter on `Agent`
- Supports caching via `cache_function` attribute
- Enterprise features include tool delegation and dynamic tool calling

**Source:** [docs.crewai.com/v1.15.0/en/learn/create-custom-tools](https://docs.crewai.com/v1.15.0/en/learn/create-custom-tools)

---

### AutoGen (Microsoft)

AutoGen uses `FunctionTool` to wrap Python functions:

**Custom Function Tool Pattern** (Source: [microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html))

```python
import random
from autogen_core import CancellationToken
from autogen_core.tools import FunctionTool
from typing_extensions import Annotated

async def get_stock_price(
    ticker: str, 
    date: Annotated[str, "Date in YYYY/MM/DD"]
) -> float:
    """Get stock price for a ticker on a given date."""
    return random.uniform(10, 200)

# Create a function tool
stock_price_tool = FunctionTool(
    get_stock_price, 
    description="Get the stock price."
)

# Run the tool
cancellation_token = CancellationToken()
result = await stock_price_tool.run_json(
    {"ticker": "AAPL", "date": "2021/01/01"}, 
    cancellation_token
)
print(stock_price_tool.return_value_as_string(result))
```

**Key Characteristics:**
- `FunctionTool` uses descriptions and type annotations to inform the LLM
- Supports both sync and async functions
- Built-in tools include `PythonCodeExecutionTool`, `HttpTool`, `LangChainToolAdapter`
- MCP integration via `mcp_server_tools`

**Source:** [microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html)

---

### OpenAI Agents SDK

The OpenAI Agents SDK provides the most comprehensive tool system:

**Function Tool Pattern** (Source: [openai.github.io/openai-agents-python/tools](https://openai.github.io/openai-agents-python/tools))

```python
from agents import Agent, function_tool, RunContextWrapper

@function_tool
async def fetch_weather(location: dict) -> str:
    """Fetch the weather for a given location.

    Args:
        location: The location to fetch the weather for.
    """
    return "sunny"

agent = Agent(
    name="Assistant",
    tools=[fetch_weather],
)
```

**Custom FunctionTool (Manual Schema)**

```python
from pydantic import BaseModel
from agents import FunctionTool

class FunctionArgs(BaseModel):
    username: str
    age: int

async def run_function(ctx: RunContextWrapper, args: str) -> str:
    parsed = FunctionArgs.model_validate_json(args)
    return f"{parsed.username} is {parsed.age} years old"

tool = FunctionTool(
    name="process_user",
    description="Processes extracted user data",
    params_json_schema=FunctionArgs.model_json_schema(),
    on_invoke_tool=run_function,
)
```

**Key Features:**
- Automatic schema generation from function signatures and docstrings
- Supports `@function_tool(defer_loading=True)` for lazy tool loading
- Tool namespaces via `tool_namespace()` for organizing related tools
- Built-in timeout support: `@function_tool(timeout=2.0)`
- Custom error handling via `failure_error_function`
- Human-in-the-loop approval gates via `needs_approval=True`

**Source:** [openai.github.io/openai-agents-python/tools](https://openai.github.io/openai-agents-python/tools)

---

## 2. Canonical Tool Definition Pattern

Across all frameworks, the canonical pattern for defining a tool consists of four components:

| Component | Purpose | Example |
|-----------|---------|---------|
| **Name** | Unique identifier | `get_weather`, `search_database` |
| **Description** | What the tool does (shown to LLM) | "Get current weather for a city" |
| **Input Schema** | JSON Schema defining parameters | `{"location": {"type": "string"}}` |
| **Execution Handler** | Function that runs the tool | `async def get_weather(location: str) -> str` |

### Schema Generation Approaches

1. **Automatic from Type Hints**: Most frameworks infer schemas from Python type annotations (LangChain, OpenAI Agents SDK)
2. **Pydantic Models**: Explicit schema definition via Pydantic `BaseModel` (all frameworks)
3. **Raw JSON Schema**: Direct JSON Schema specification (LangChain, OpenAI Agents SDK)

### Best Practices for Tool Descriptions

From [CallSphere's tool formatting guide](https://callsphere.ai/blog/tool-result-formatting-helping-llms-understand-outputs):

- Lead with the answer in tool results
- Use consistent structure across tools
- Truncate thoughtfully to stay within token limits
- Format errors as actionable messages

---

## 3. Agent Loop / Harness Architecture

### The ReAct Pattern

The dominant pattern for agent loops is ReAct (Reason + Act), introduced by Yao et al. in 2022. (Source: [youngju.dev/blog/culture/2026-03-18-llm-agent-design-patterns.en](https://www.youngju.dev/blog/culture/2026-03-18-llm-agent-design-patterns.en))

```
Thought: [reasoning about what to do]
Action: tool_name(params)
Observation: [result of tool call]
Thought: [reasoning about the result]
... (repeat)
Final Answer: [conclusion]
```

**Core Loop Implementation:**

```python
# Simplified agent loop pattern
while not done:
    # 1. Send messages to LLM
    response = await llm.call(messages)
    
    # 2. Check for tool calls
    if response.tool_calls:
        for tool_call in response.tool_calls:
            # 3. Execute tool
            result = await execute_tool(tool_call)
            # 4. Append result to messages
            messages.append(ToolMessage(content=result, tool_call_id=tool_call.id))
    else:
        # 5. No more tool calls - return final answer
        done = True
        return response.content
```

### Framework-Specific Implementations

**LangChain**: Uses `ToolNode` in LangGraph for tool execution within graph workflows. The `create_agent` function handles the loop automatically. (Source: [docs.langchain.com/oss/python/langchain/tools](https://docs.langchain.com/oss/python/langchain/tools))

**CrewAI**: Implements sequential, hierarchical, and consensual execution modes. Tools are called within agent task execution. (Source: [docs.crewai.com](https://docs.crewai.com))

**AutoGen**: Uses `AssistantAgent` with tool registration. The agent loop is managed by the framework's conversation management. (Source: [microsoft.github.io/autogen](https://microsoft.github.io/autogen))

**OpenAI Agents SDK**: The `Runner` component manages the agent loop with built-in support for tool invocation, guardrails, and handoffs. (Source: [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python))

### Key Loop Components

From [Layra's Agent Loop Pattern](https://layra4.dev/pattern/agent-loop):

1. **Message History (State Carrier)**: Running conversation transcript replayed to the model each iteration
2. **Tool Registry**: Available tools with schemas and execution handlers
3. **Tool Dispatcher**: Routes tool calls to appropriate handlers
4. **Stop Condition**: Max iterations, token budget, or model signaling completion

---

## 4. Error Handling, Retries, and Streaming

### Error Taxonomy

From [Neel Mishra's error handling guide](https://neelmishra.github.io/blog/mlops/llm-agents/agent-error-handling.html):

| Error Type | Example | Recovery Strategy |
|------------|---------|-------------------|
| **Transient** | Rate limits (429), timeouts | Retry with backoff |
| **Semantic** | Malformed JSON, wrong tool | Re-prompt with corrective context |
| **Resource** | Token budget exceeded | Reduce payload, summarize |
| **Fatal** | Auth failures, revoked keys | Abort immediately, alert |

### Retry Strategies

**Exponential Backoff with Jitter** (Gold standard for transient errors):

```python
import random
import asyncio

async def retry_with_backoff(func, max_retries=5, base_delay=1.0):
    for attempt in range(max_retries):
        try:
            return await func()
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"Rate limited. Retrying in {delay:.1f}s")
            await asyncio.sleep(delay)
```

**Source:** [neelmishra.github.io/blog/mlops/llm-agents/agent-error-handling.html](https://neelmishra.github.io/blog/mlops/llm-agents/agent-error-handling.html)

### Circuit Breaker Pattern

From [zylos.ai research](https://zylos.ai/research/2026-01-12-ai-agent-error-handling-recovery/):

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"
        self.last_failure_time = None
    
    async def call(self, func, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
            else:
                raise CircuitBreakerOpenError("Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            raise
```

### Streaming Best Practices

From [Conduktor's agentic AI pipelines guide](https://www.conduktor.io/glossary/agentic-ai-pipelines):

- Stream tool execution progress for long-running operations
- Use Server-Sent Events (SSE) for real-time updates
- Implement backpressure handling to prevent overwhelming clients
- Provide fallback responses when streaming fails

### Framework-Specific Error Handling

**LangChain**: Uses middleware for tool error handling:

```python
from langchain.agents.middleware import wrap_tool_call

@wrap_tool_call
def handle_tool_errors(request, handler):
    try:
        return handler(request)
    except Exception as e:
        return ToolMessage(
            content=f"Tool error: {e}",
            tool_call_id=request.tool_call["id"],
        )
```

**OpenAI Agents SDK**: Custom error functions via `failure_error_function`:

```python
@function_tool(failure_error_function=my_custom_error_function)
def get_user_profile(user_id: str) -> str:
    """Fetches a user profile."""
    if user_id == "user_123":
        return "User profile retrieved."
    else:
        raise ValueError(f"Could not retrieve profile for {user_id}")
```

**Source:** [openai.github.io/openai-agents-python/tools](https://openai.github.io/openai-agents-python/tools)

---

## 5. Tool Result Formatting Back to the LLM

### Key Principles

From [CallSphere's tool result formatting guide](https://callsphere.ai/blog/tool-result-formatting-helping-llms-understand-outputs):

1. **Lead with the Answer**: Put the most important information first. LLMs process text sequentially and are better at using information that appears early.

2. **Use Consistent Structure**: Standardize format across tools so the model can predict where to find information.

3. **Truncate Thoughtfully**: Don't overwhelm the model with excessive data. Summarize large results.

4. **Format Errors as Actionable Messages**: Instead of stack traces, provide clear error messages the model can act on.

### Return Value Types

**LangChain supports three return types:**

1. **String**: Human-readable text for the model to read
2. **Object (dict)**: Structured data for the model to parse
3. **Command**: Update graph state directly

```python
# String return
@tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"It is currently sunny in {city}."

# Object return
@tool
def get_weather_data(city: str) -> dict:
    """Get structured weather data."""
    return {"city": city, "temperature_c": 22, "conditions": "sunny"}

# Command return (updates state)
@tool
def set_language(language: str, runtime: ToolRuntime) -> Command:
    """Set the preferred response language."""
    return Command(update={"preferred_language": language})
```

**Source:** [docs.langchain.com/oss/python/langchain/tools](https://docs.langchain.com/oss/python/langchain/tools)

### Multimodal Tool Results

Tools can return images, files, and mixed content:

```python
@tool
def capture_screenshot() -> list[dict]:
    """Capture a screenshot of the current page."""
    return [
        {"type": "text", "text": "Screenshot of the current page:"},
        {"type": "image", "url": "https://example.com/page.png"},
    ]
```

### OpenAI Agents SDK Tool Output

The SDK supports returning images and files:

```python
from agents import ToolOutputImage, ToolOutputFileContent, ToolOutputText

# Return images
@function_tool
def get_chart() -> ToolOutputImage:
    """Generate a chart."""
    return ToolOutputImage(url="https://example.com/chart.png")

# Return files
@function_tool
def get_document() -> ToolOutputFileContent:
    """Get a PDF document."""
    return ToolOutputFileContent(content=pdf_bytes, mime_type="application/pdf")
```

**Source:** [openai.github.io/openai-agents-python/tools](https://openai.github.io/openai-agents-python/tools)

---

## 6. Function Calling Tools vs MCP Tools

### Function Calling (Provider-Specific)

Function calling is the original mechanism for LLMs to invoke external tools. Each provider has its own format:

| Provider | Request Field | Response Field | Schema Definition |
|----------|---------------|----------------|-------------------|
| OpenAI | `tools` array | `tool_calls` | `parameters` (JSON Schema) |
| Anthropic | `tools` array | `tool_use` in content | `input_schema` (JSON Schema) |
| Google | `function_declarations` | `function_call` | `parameters` (OpenAPI-style) |

**Source:** [qveris.ai/guides/function-calling](https://qveris.ai/guides/function-calling)

**Limitations of Function Calling:**
- Tied to specific provider's API format
- Functions must be predefined for each session
- No built-in persistent sessions
- Each function call is independent

### MCP (Model Context Protocol)

MCP is an open-source standard introduced by Anthropic in November 2024, now adopted by OpenAI and Google. (Source: [modelcontextprotocol.io/introduction](https://modelcontextprotocol.io/introduction))

**Key Differences:**

| Aspect | Function Calling | MCP |
|--------|------------------|-----|
| **Standardization** | Provider-specific | Open standard |
| **Discovery** | Static tool list | Dynamic tool discovery |
| **Session Management** | Stateless | Persistent sessions |
| **Governance** | Per-provider | Centralized |
| **Ecosystem** | Provider-locked | Cross-provider |

**MCP Architecture:**
- **MCP Host**: Manages the LLM application (e.g., Claude Desktop, Cursor)
- **MCP Client**: Maintains connection between Host and Server
- **MCP Server**: Provides tools and context to the LLM

**Source:** [modelcontextprotocol.io/introduction](https://modelcontextprotocol.io/introduction)

### Hybrid Approach

You can combine both approaches:

```python
# Define a generic MCP tool within function calling framework
@tool
def call_mcp_tool(tool_name: str, args: dict) -> str:
    """Call an MCP tool by name."""
    return mcp_client.call_tool(tool_name, args)

# Or use MCP tools directly in frameworks that support it
from agents import HostedMCPTool

agent = Agent(
    name="Assistant",
    tools=[
        HostedMCPTool(tool_config={
            "type": "mcp",
            "server_label": "github",
            "server_url": "https://api.githubcopilot.com/mcp/",
        })
    ],
)
```

**Source:** [openai.github.io/openai-agents-python/tools](https://openai.github.io/openai-agents-python/tools)

### MCP 2026 Adoption

From [a2a-mcp.org's MCP Roadmap 2026](https://a2a-mcp.org/blog/mcp-2026-roadmap):

- MCP crossed 200+ server implementations
- Transport evolution for horizontal scaling
- Agent communication refinements
- Enterprise governance maturation
- Skills primitive and registry support

---

## 7. Tool Choice Across Providers

### OpenAI

`tool_choice` parameter controls which tools the model can use:

| Value | Behavior |
|-------|----------|
| `"auto"` | Model decides whether to call a tool |
| `"none"` | Model cannot call any tools |
| `"required"` | Model must call at least one tool |
| `{"type": "function", "function": {"name": "my_tool"}}` | Force specific tool |

```python
response = client.chat.completions.create(
    model="gpt-5.5",
    messages=[...],
    tools=[...],
    tool_choice="auto"  # or "required", "none", or specific tool
)
```

**Source:** [platform.openai.com/docs/guides/function-calling](https://platform.openai.com/docs/guides/function-calling)

### Anthropic

Anthropic uses automatic tool selection via Tool Search:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    messages=[...],
    tools=[...]
    # tool_choice is automatic via Tool Search
)
```

Anthropic also supports programmatic tool calling with `allowed_callers` field for batch processing.

**Source:** [docs.litellm.ai/docs/providers/anthropic_programmatic_tool_calling](https://docs.litellm.ai/docs/providers/anthropic_programmatic_tool_calling)

### Google Gemini

Google uses automatic function calling:

```python
response = client.models.generate_content(
    model="gemini-3.1-pro",
    contents=[...],
    config=types.GenerateContentConfig(
        tools=[types.Tool(function_declarations=[...])]
    )
)
```

**Source:** [qveris.ai/guides/function-calling](https://qveris.ai/guides/function-calling)

### Framework-Level Tool Choice

**OpenAI Agents SDK** supports tool choice at the model settings level:

```python
from agents import Agent, ModelSettings

agent = Agent(
    name="Assistant",
    model="gpt-5.5",
    model_settings=ModelSettings(tool_choice="required"),
    tools=[...],
)
```

**LangChain** passes tool choice to the underlying provider:

```python
model_with_tools = model.bind_tools(
    [tool1, tool2],
    tool_choice="auto"  # or "required", "none"
)
```

### Reliability Comparison

From DigitalApplied's Q1 2026 benchmark:
- **Anthropic Claude**: 8.4/10 reliability
- **Google Gemini**: 7.9/10 reliability  
- **OpenAI**: 6.3/10 reliability

**Source:** [digitalapplied.com/blog/ai-function-calling-guide-openai-anthropic-google](https://www.digitalapplied.com/blog/ai-function-calling-guide-openai-anthropic-google)

---

## Key Takeaways for Harness Engineers

1. **Standardize on JSON Schema**: All frameworks support JSON Schema for tool definitions. Use Pydantic for type safety.

2. **Implement the ReAct Loop**: The agent loop is the core pattern. Build it with proper state management and termination conditions.

3. **Layer Error Handling**: Use exponential backoff for transient errors, circuit breakers for cascading failures, and validation for semantic errors.

4. **Adopt MCP Early**: With OpenAI, Anthropic, and Google all supporting MCP, it's becoming the cross-provider standard for tool interoperability.

5. **Format Tool Results for LLM Consumption**: Lead with answers, use consistent structure, truncate thoughtfully, and format errors as actionable messages.

6. **Support Tool Choice Flexibility**: Allow models to auto-select tools, force specific tools, or require tool usage based on the use case.

---

## Sources

- LangChain Tools Documentation: https://docs.langchain.com/oss/python/langchain/tools
- CrewAI Custom Tools: https://docs.crewai.com/v1.15.0/en/learn/create-custom-tools
- AutoGen Tools Documentation: https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/components/tools.html
- OpenAI Agents SDK Tools: https://openai.github.io/openai-agents-python/tools
- MCP Introduction: https://modelcontextprotocol.io/introduction
- MCP 2026 Roadmap: https://a2a-mcp.org/blog/mcp-2026-roadmap
- Function Calling Comparison: https://qveris.ai/guides/function-calling
- DigitalApplied Function Calling Guide: https://www.digitalapplied.com/blog/ai-function-calling-guide-openai-anthropic-google
- Agent Error Handling: https://neelmishra.github.io/blog/mlops/llm-agents/agent-error-handling.html
- Tool Result Formatting: https://callsphere.ai/blog/tool-result-formatting-helping-llms-understand-outputs
- Agent Loop Pattern: https://layra4.dev/pattern/agent-loop
- LLM Agent Design Patterns: https://www.youngju.dev/blog/culture/2026-03-18-llm-agent-design-patterns.en
