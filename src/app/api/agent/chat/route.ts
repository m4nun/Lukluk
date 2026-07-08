import { createAgentRoute } from "@/lib/agent/route-factory";
import { createAgentTools } from "@/lib/agent/tools";
import { DECISION_SYSTEM_PROMPT } from "@/lib/agent/graph";

export const POST = createAgentRoute({
  profileTable: "planning_pet_profiles",
  threadField: "planning_pet_profile_id",
  agentType: "decision",
  systemPrompt: DECISION_SYSTEM_PROMPT,
  createTools: (repo) => createAgentTools(repo),
  idParam: "planning_profile_id",
  bodyKey: "planningProfileId",
});
