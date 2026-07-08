import { createAgentRoute } from "@/lib/agent/route-factory";
import { createCareTools } from "@/lib/agent/tools";
import { CARE_SYSTEM_PROMPT } from "@/lib/agent/graph";

export const POST = createAgentRoute({
  profileTable: "owned_pet_profiles",
  threadField: "owned_pet_profile_id",
  agentType: "care",
  systemPrompt: CARE_SYSTEM_PROMPT,
  createTools: (repo) => createCareTools(repo),
  idParam: "owned_profile_id",
  bodyKey: "ownedProfileId",
});
