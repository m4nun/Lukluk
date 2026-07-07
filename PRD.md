# Lukluk PRD

## Problem Statement

People who want a pet often choose from attraction, trend, or personality appeal before understanding whether the pet type responsibly fits their budget, schedule, home, allergies, location, travel pattern, and existing pets. After they choose, they still need help turning general pet advice into practical decisions and, later, day-to-day care.

Lukluk should guide users from curiosity to responsible decision-making: first by matching them to suitable Pet Types, then by helping subscribers explore a selected Planning Pet Profile, and finally by supporting an Owned Pet Profile after the user already has the pet.

## Solution

Lukluk provides a Fit Quiz that creates a Lifestyle Profile and ranks the user's Pet Pool into a Match Result. The top 3 Pet Types are shown for free with short explanations and a shareable Match Card. Responsible Fit is the primary matching factor; Pet MBTI is used as an understandable personality label, not as the safety engine.

After subscription, users can create a Planning Pet Profile from a recommended Pet Type and work inside a two-panel workspace. The left panel contains structured decision artifacts: an Estimated Expense Table, Concern Checklist, and Decision Status. The right panel contains a Decision Agent that can answer questions, ask clarifying questions, read Owner Experiences, use current-session external facts when needed, and draft edits for the left panel. Agent edits require user confirmation before saving.

When the user marks that they already have the pet, Lukluk collects basic ownership setup information and converts the workspace into ownership mode. The same two-panel layout remains, but the left panel becomes care-oriented with expense, activity, and food information, while the right panel becomes a Care Agent.

## User Stories

1. As a visitor, I want to understand that Lukluk helps me choose a suitable pet type, so that I know the app is about responsible fit, not just cute recommendations.
2. As a visitor, I want to create an account before taking the Fit Quiz, so that my Match Result and later profile work can be saved.
3. As a user, I want to answer fixed Fit Quiz questions about budget, time, space, allergies, location, existing pets, noise tolerance, travel, and experience, so that the app can build a useful Lifestyle Profile.
4. As a user, I want the quiz to avoid asking unnecessary questions, so that I can reach my Match Result quickly.
5. As a user, I want the app to ask LLM follow-up questions only when my answers are missing, borderline, or risky, so that the app can improve match confidence without making the quiz feel endless.
6. As a user, I want follow-up questions to be limited to answers that could affect my top 3 or responsible-fit constraints, so that I only spend time on meaningful clarification.
7. As a user, I want Lukluk to prioritize Responsible Fit over Pet MBTI, so that I do not get encouraged toward a pet I cannot responsibly care for.
8. As a user, I want pets that fail important fit criteria to rank lower, so that my top 3 are realistic choices.
9. As a user, I want to see my top 3 Pet Types, so that I have a small, useful set of options.
10. As a user, I want each Match Result to include a short explanation, so that I understand why a Pet Type was recommended.
11. As a user, I want Pet MBTI to describe the Pet Type personality in familiar human-MBTI language, so that I can quickly understand its temperament.
12. As a user, I want Pet MBTI to be clearly about the pet and not about me, so that I do not feel like I am taking a human personality test.
13. As a user, I want to export a Match Card from my Match Result, so that I can share my result on social media.
14. As a user, I want the Match Card to represent my result without exposing my detailed decision workspace, so that sharing feels safe and lightweight.
15. As a user, I want to subscribe from the Match Result page, so that I can explore a pet choice more deeply.
16. As a subscriber, I want to enter a dashboard after subscribing, so that I can manage pet decision workspaces.
17. As a subscriber, I want to create a Planning Pet Profile from one of my recommended Pet Types, so that I can focus on a specific pet decision.
18. As a subscriber, I want the Planning Pet Profile to allow a default planning name like "Future Corgi," so that I can start without committing to a real pet name.
19. As a subscriber, I want each Planning Pet Profile to have its own isolated agent session and saved artifacts, so that decisions for one Pet Type do not affect another.
20. As a subscriber, I want a two-panel workspace, so that I can see structured pet decision data on the left and talk to the Decision Agent on the right.
21. As a subscriber, I want the Planning Pet Profile left panel to contain only Estimated Expense Table, Concern Checklist, and Decision Status, so that the pre-ownership workspace stays focused.
22. As a subscriber, I want the Decision Agent to ask about my work, lifestyle, schedule, and affordability, so that the decision reflects my real life.
23. As a subscriber, I want the Decision Agent to create or update an Estimated Expense Table, so that I can understand likely first-month and monthly costs.
24. As a subscriber, I want the Decision Agent to create or update a Concern Checklist, so that I can see what risks or open questions remain before buying or adopting.
25. As a subscriber, I want the agent to draft changes automatically in conversation, so that the app feels helpful and active.
26. As a subscriber, I want to confirm agent-drafted changes before saving, so that I stay in control of my decision artifacts.
27. As a subscriber, I want only the final saved state to be kept for v1, so that the interface remains simple.
28. As a subscriber, I want to manually edit left-panel tables and checklists, so that I can quickly correct simple values without using chat.
29. As a subscriber, I want agent-assisted editing for reasoning-heavy changes, so that I can ask for adjustments like "make this cheaper" or "adjust for my work schedule."
30. As a subscriber, I want to read Owner Experiences for a Pet Type, so that I can learn from real owners before deciding.
31. As a subscriber-owner, I want to submit an Owner Experience with ownership context, so that my experience can help other users.
32. As a reader, I want Owner Experiences labeled as anecdotal owner input, so that I do not confuse them with expert guidance.
33. As a user, I want the Decision Agent to use Owner Experiences carefully as anecdotal evidence, so that lived patterns can inform answers without overriding Pet Type Profile facts.
34. As an admin, I want Owner Experiences to support post-publish reporting/removal controls, so that harmful or spammy content can be handled even if experiences go live immediately.
35. As a subscriber, I want Buying Or Adoption Guidance to appear only after I have seen costs, time commitment, concerns, and fit/mismatch explanation, so that I do not rush into a decision.
36. As a subscriber, I want Buying Or Adoption Guidance to be a light overview, so that I know responsible next steps without Lukluk becoming a seller marketplace.
37. As a subscriber, I want to mark "I already have this pet," so that I can move from decision mode to ownership mode.
38. As a pet owner, I want to enter only minimal required ownership setup information, so that switching to ownership mode is not burdensome.
39. As a pet owner, I want required ownership setup fields to be pet name, Pet Type, age/life stage, and got-date or "I don't remember," so that the Care Agent has enough context to begin.
40. As a pet owner, I want weight/size, sex, current food, health concerns, neutered/spayed status, other pets, and vet notes to be optional, so that I can add detail later.
41. As a pet owner, I want the same two-panel workspace in ownership mode, so that I do not have to learn a new interaction model.
42. As a pet owner, I want the ownership left panel to show expense, activity schedule, and food guide, so that the workspace supports day-to-day care.
43. As a pet owner, I want the right panel to become a Care Agent, so that the agent's role matches my current needs.
44. As a product maintainer, I want Pet Type Profiles to live in repo-managed YAML files, so that pet knowledge is versioned and can be reviewed.
45. As a product maintainer, I want Pet Type Profile YAML to contain both scoring fields and guidance text, so that matching and agents share one source of truth.
46. As a product maintainer, I want Pet Type Profile YAML to be validated by a strict schema, so that malformed profiles cannot affect matching or agent behavior.
47. As a product maintainer, I want basic consistency checks for Pet Type Profiles, so that suspicious values like unrealistic costs or contradictory care levels are caught before use.
48. As a product maintainer, I want user-specific state stored separately from Pet Type Profiles, so that global pet knowledge does not get mixed with individual user data.
49. As a user, I want the agent to show me nearby pet shops, veterinary clinics, pet boarding, dog parks, and grooming services as an interactive map inside the chat when I ask about them, so that I can find real places near me without leaving the conversation.
50. As a user, I want each map marker to show the place name, category, address, distance from my area, and a link to open it in a map service, so that I can decide where to go.

## Implementation Decisions

- Use the domain vocabulary in `CONTEXT.md` as the source of truth.
- The current repo contains early pet pool material in Markdown files, but v1 Pet Type Profiles should be repo-managed YAML files.
- Pet Type Profile YAML is global Pet Type knowledge only. It should not contain user-specific quiz answers, decision state, or owned-pet data.
- Pet Type Profile YAML should include machine-readable scoring fields and longer guidance text for agents.
- Pet Type Profile creation should include strict schema validation and consistency checks before a profile is accepted into the Pet Pool.
- The Fit Quiz should have fixed required questions first, followed by LLM follow-up questions only when uncertainty affects matching.
- The matching engine should rank by Responsible Fit first, then use preferences and Pet MBTI as secondary signals.
- The Match Result should expose top 3 Pet Types with short explanations for free.
- Match Card generation remains a free growth path and should use Match Result data, not the full Planning Pet Profile.
- Subscription unlocks Planning Pet Profile workspaces and the Decision Agent.
- A Planning Pet Profile is a user-owned workspace for a selected Pet Type before ownership.
- A Planning Pet Profile contains Estimated Expense Table, Concern Checklist, and Decision Status only.
- Each Planning Pet Profile has its own isolated Decision Agent session.
- The two-panel workspace is the main interaction surface for both decision mode and ownership mode.
- The left panel should be directly editable and also accept confirmed agent-drafted edits.
- The Decision Agent may draft edits automatically, but saving requires explicit user confirmation.
- V1 saves only final artifact state, not change history.
- The Decision Agent can use current-session external tools for current/local facts such as legality, price ranges, and buying/adoption options.
- Current/local external facts should not be saved as durable truth.
- Owner Experiences are subscriber-only, self-declared owner submissions with context.
- Owner Experiences go live immediately, but must support post-publish safety controls.
- Agents may read Owner Experiences as anecdotal evidence, not verified facts.
- Buying Or Adoption Guidance is locked until affordability and concerns have been reviewed.
- Ownership mode starts when the user marks that they already have this pet.
- Ownership setup requires pet name, Pet Type, age/life stage, and got-date or "I don't remember"; weight/size and other fields are optional.
- Ownership mode keeps the two-panel layout and changes the left panel toward expense, activity schedule, and food guide while the right panel becomes a Care Agent.
- The Pet Place Search tool uses OpenStreetMap Nominatim (geocoding) and the Overpass API (place search) with no API key required. Results are rendered as an Inline Map directly inside the chat message bubble.
- Inline Map tool results are forwarded from the server to the client through the existing SSE `done` event as a `toolResults` payload, keeping the transport protocol unchanged.

## Testing Decisions

- Test external behavior at the highest product seams available: matching output, workspace state changes, agent edit confirmation, and profile validation.
- Pet Type Profile validation tests should verify that valid YAML profiles are accepted and malformed or inconsistent profiles are rejected.
- Matching tests should verify that Responsible Fit constraints dominate Pet MBTI, including cases where personality fit is high but budget, time, space, allergy, legality, existing pets, noise, or travel make the Pet Type unsuitable.
- Fit Quiz tests should verify that follow-up questions are only triggered for missing, borderline, or risky answers that can affect top 3 results or responsible-fit constraints.
- Match Result tests should verify that exactly the intended free data is exposed: top 3, short explanations, and Match Card inputs.
- Subscription boundary tests should verify that Planning Pet Profile workspace, Decision Agent, Owner Experiences, Estimated Expense Table, and Concern Checklist are paid features.
- Agent edit tests should verify that drafts do not save until the user confirms.
- Workspace tests should verify that each Planning Pet Profile has isolated state and agent conversation context.
- Buying Or Adoption Guidance tests should verify that guidance is unavailable until the user has seen required affordability and concern information.
- Ownership transition tests should verify that minimal required setup fields are enforced and optional fields can be omitted.
- Owner Experience tests should verify required ownership context, subscriber-only contribution/read access, report/removal controls, and that agent usage labels experiences as anecdotal.

## Out of Scope

- Matching users to individual real pets or live marketplace listings.
- Full seller marketplace, checkout, breeder marketplace, or adoption transaction flow.
- A full human MBTI quiz or assigning MBTI to users.
- Treating Pet MBTI as scientific animal psychology.
- Saving external current/local search results as permanent Pet Type knowledge.
- Change history for agent-edited artifacts in v1.
- Detailed pre-ownership food schedules or activity schedules before the user owns the pet.
- Manual moderation before every Owner Experience is published.
- Medical diagnosis or treatment advice.
- Full admin UI for editing Pet Type Profiles; repo-managed YAML is the v1 source.

## Further Notes

- The repo currently has `CONTEXT.md` and `HANDOFF.md` capturing domain language and the prior conversation.
- Existing pet pool files are Markdown and appear to be early source material. The PRD assumes they will be migrated or transformed into validated YAML Pet Type Profiles.
- No issue tracker setup was visible in the workspace, so this PRD is stored as a project file rather than published as an issue.
