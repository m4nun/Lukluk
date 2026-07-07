# Lukluk Domain

Lukluk helps people choose a suitable pet type before ownership, then care for a specific pet after ownership. The domain separates general pet-type knowledge from each user's personal decision and care state.

## Language

**Pet Pool**:
The set of pet types available for matching in Lukluk.
_Avoid_: Catalog, marketplace, inventory

**Pet Type**:
A general kind of pet that users can be matched with, such as a breed, species, or care category. A pet type is not an individual animal.
_Avoid_: Pet, listing, animal profile

**Pet Type Profile**:
The global knowledge record for a pet type, including its care expectations, cost ranges, personality model, concerns, and matching traits.
_Avoid_: Pet profile, article, markdown file

**Pet MBTI**:
A human-MBTI-style personality label assigned to a pet type to help users understand its likely temperament. It is a communication model, not a scientific diagnosis.
_Avoid_: User MBTI, animal psychology score

**Lifestyle Profile**:
The structured picture of a user's budget, schedule, home, allergies, location, travel, noise tolerance, existing pets, and pet-care preferences.
_Avoid_: User MBTI, personality profile

**Match Result**:
The ranked output of matching a lifestyle profile against the pet pool, with the top matches shown to the user.
_Avoid_: Recommendation only, quiz result only

**Match Card**:
A shareable social card generated from a match result. It represents the user's matching outcome, not the full decision workspace.
_Avoid_: Report, pet profile, result

**Responsible Fit**:
The suitability of a pet type for a user's practical constraints, such as budget, time, space, allergies, legality, existing pets, noise tolerance, and travel.
_Avoid_: Personality fit, preference fit

**Planning Pet Profile**:
A user-owned workspace for exploring a chosen pet type before ownership. It contains decision-focused state such as estimated expenses, concerns, and decision status.
_Avoid_: Pet type profile, owned pet profile

**Owned Pet Profile**:
A user-owned workspace for a pet the user already has. It contains the user's specific pet details and care state.
_Avoid_: Planning pet profile, pet type profile

**Decision Agent**:
The agent that helps a user decide whether a selected pet type fits their life, using the pet type profile, lifestyle profile, owner experiences, and current-session external facts when needed.
_Avoid_: Report, static decision report

**Care Agent**:
The agent that helps a user care for an owned pet after ownership setup.
_Avoid_: Decision agent

**Owner Experience**:
A comment submitted by a self-declared owner with ownership context. It is anecdotal evidence, not verified expert guidance.
_Avoid_: Review, expert advice, comment

**Decision Status**:
The user's current state for a planning pet profile, such as exploring, considering seriously, ready to buy or adopt, not a fit, or already have this pet.
_Avoid_: Progress, stage

**Concern Checklist**:
A decision-focused list of risks or open questions the user should resolve before buying or adopting a pet type.
_Avoid_: Todo list, care checklist

**Estimated Expense Table**:
A planning estimate of expected pet-related costs before ownership.
_Avoid_: Actual expense tracker

**Actual Expense Tracker**:
The user's record of real expenses for an owned pet.
_Avoid_: Estimated expense table

**Buying Or Adoption Guidance**:
A next-step overview that helps the user understand responsible ways to get the pet type after affordability and concerns have been reviewed.
_Avoid_: Seller marketplace, purchase flow

**Fit Quiz Follow-Up Questions**:
LLM-generated clarifying questions asked after the fixed quiz, triggered only when answers are missing, borderline, or risky enough to affect the top 3 match results or responsible-fit constraints.
_Avoid_: Extra quiz question, survey question

**Agent Draft**:
An agent-generated edit to the left panel (expense table, concern checklist, decision status) that is proposed but not yet saved. Drafts require explicit user confirmation before being written to the Planning Pet Profile.
_Avoid_: Suggestion, recommendation, pending change

**Pet Place Search**:
A tool the agent can invoke to find nearby pet-related services (pet shops, veterinary clinics, pet boarding, dog parks, pet grooming) in Thailand using OpenStreetMap Nominatim for geocoding and the Overpass API for place search.
_Avoid_: Map search, location lookup, Google Places

**Inline Map**:
A structured agent tool result rendered as an interactive Leaflet map inside the chat message bubble. Forwarded to the client through the SSE `done` event as a `toolResults` payload and rendered with colored markers, popups, and a place list.
_Avoid_: Map widget, embedded map, map preview

**Map Place**:
A single point of interest on an Inline Map, with name, latitude, longitude, category, optional address, and optional distance from the search center.
_Avoid_: Map marker, pin, point of interest
