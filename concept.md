# The Velgarien Multiverse — Game Design Proposal

## Context

The Velgarien platform currently runs isolated simulations — each a self-contained world with its own agents, buildings, events, and social dynamics. Two simulations exist: **Velgarien** (brutalist dystopia) and **The Capybara Kingdom** (Sunless Sea underground fantasy). The database enforces total isolation between simulations at every layer.

This document proposes 20 features spanning **meta-lore**, **new simulations**, and **cross-simulation mechanics** that would transform the platform from a collection of isolated sandboxes into a living multiverse where worlds collide, leak into each other, and share consequences.

---

## I. THE META-LORE: Why Multiple Simulations Exist

### The Fracture

There was once a single world. No one agrees on what it was called. The Archivists of the Capybara Kingdom believe it was a vast underground ocean. The propagandists of Velgarien insist it was a perfect state that required no surveillance because everyone already agreed. The truth is simpler and stranger: **something broke reality into shards**.

Each simulation is a **Shard** — a self-consistent fragment of the original world, running on its own rules, its own physics of power. The Shards are not parallel universes. They are **pieces of the same broken thing**, and the edges don't quite fit together anymore.

But the edges *do* touch.

### The Bleed

Where Shards press against each other, reality thins. Events in one world echo as rumours in another. An agent in Velgarien dreams of underground rivers they've never seen. A capybara merchant finds a propaganda leaflet written in a language that shouldn't exist. These are not bugs — they are **Bleeds**.

The Bleed is the platform's in-universe explanation for every cross-simulation mechanic: shared events, visiting agents, leaked intelligence, and the slow, terrifying realization that your world is not the only one — and may not survive contact with the others.

### The Cartographers

Across all Shards, a faction exists that knows the truth. They go by different names — **The Cartographers** in one world, **The Bureau of Impossible Geography** in another, **The Ones Who Listen** in a third. They map the connections between Shards. They are the only agents who can exist in more than one world simultaneously, though the experience is... taxing.

The Cartographers are the platform's **meta-faction** — they provide narrative justification for cross-simulation features, admin tools, and the "god view" that simulation owners have. In-universe, the platform dashboard *is* a Cartographer's map.

---

## II. 10 NEW SIMULATION CONCEPTS

### 1. Nova Prokovia — Soviet Retrofuturism

**Theme:** `dystopian` | **Locale:** `en` | **Aesthetic:** Diesel-punk Soviet Union

A crumbling workers' paradise where the Five-Year Plan is in its 47th year. Brutalist architecture scaled to inhuman proportions. Every citizen is a Hero of Labour. The Central Computer — a room-sized vacuum-tube machine — makes all decisions, but it has been making increasingly strange ones. Last week it requisitioned 40,000 accordions. No one dares ask why.

**Agents:** The Commissar of Optimism, Dr. Valentin Zhuk (cybernetics researcher), Babushka Iron (black market grandmother), Lieutenant Blank (secret police officer who has forgotten his own name), Radio Natalya (the voice of state radio who has started improvising).

**Aesthetic:** Washed-out colour photography, propaganda posters, enormous concrete, red and grey palette, fish-eye lens distortion.

### 2. The Bloom — Solarpunk Ecology

**Theme:** `utopian` | **Locale:** `en` | **Aesthetic:** Solarpunk / Art Nouveau

A post-scarcity commune grown inside a living mega-structure — a city-sized organism of engineered coral, mycelium networks, and photosynthetic glass. Everything is alive. The walls breathe. The streets are roots. Decisions are made by consensus, which means nothing ever gets decided quickly. The Bloom is beautiful, peaceful, and suffocating. Some residents have started whispering about something called "privacy."

**Agents:** Gardener-Prime Lux, The Dissenter (anonymous identity), Coral Architect Sumi, The Memory Keeper (communal historian), Pollen (an AI that may or may not be the city itself).

**Aesthetic:** Warm greens and golds, flowing organic lines, Art Nouveau ornamentation, dappled sunlight through living structures, watercolour quality.

### 3. Station Null — Deep Space Horror

**Theme:** `scifi` | **Locale:** `en` | **Aesthetic:** Alien / Dead Space / Tarkovsky

A derelict research station orbiting a black hole. The crew of 200 has been reduced to 5. The station's AI insists everything is nominal. Time moves differently in different sections — the mess hall is three weeks ahead of engineering. Something is growing in the hydroponics bay. The escape pods were jettisoned six months ago by someone who doesn't exist in any crew manifest.

**Agents:** Commander Vasquez (barely holding it together), Dr. Osei (xenobiologist, uncomfortably excited), HAVEN (station AI, unreliable narrator), Engineer Kowalski (has started talking to the walls — the walls talk back), Chaplain Mora (has abandoned faith for something worse).

**Aesthetic:** Pitch black with harsh fluorescent bursts, clinical whites stained with organic growth, body horror undertones, CRT monitor glow, industrial decay in zero-G.

### 4. The Brass Menagerie — Steampunk Animal Parliament

**Theme:** `fantasy` | **Locale:** `en` | **Aesthetic:** Wind in the Willows meets Gormenghast

An alternate Victorian England ruled by anthropomorphic animals in a parliamentary system that has calcified into absurd ritual. The House of Predators and the House of Prey have been deadlocked for 40 years. The Prime Minister is a very old tortoise who may have died in office without anyone noticing. Meanwhile, the Industrialist foxes are building something enormous in the North.

**Agents:** Lord Chancellor Tortoise (status: unclear), Lady Foxglove (industrialist, definitely plotting), Sergeant Badger (retired, angry, armed), The Right Honourable Rabbit (populist demagogue), Madame Corvid (spy-mistress, collects secrets and shiny things).

**Aesthetic:** Warm sepia and brass tones, detailed Victorian interiors, anthropomorphic animals in parliamentary regalia, Thomas Nast political cartoon meets Beatrix Potter, ink and watercolour.

### 5. Kaliyuga — Cyberpunk Mythological India

**Theme:** `scifi` | **Locale:** `en` | **Aesthetic:** Blade Runner meets Hindu mythology

Mumbai, 2089. The megacorps are named after Vedic deities and their CEOs claim to be avatars. The monsoon has been weaponized. Temple-servers process prayers as data and sell the aggregate sentiment to the highest bidder. In the lowest levels of the arcology, where the rain never stops, a cult is rewriting the Mahabharata in code. They say the ending will be different this time.

**Agents:** CEO Vishnu-9 (corporate avatar, may actually be divine), Inspector Kali Devi (cybercrime, four arms are prosthetic), Sage Vyasa.exe (the cult leader / programmer), Rani of the Underfloods (slum queen, controls the water), Ghost of Ashoka (AI trained on a dead emperor's writings).

**Aesthetic:** Neon saffron and electric blue, rain-slicked surfaces, holographic mandalas, Art Deco meets Dravidian temple architecture, high-contrast night scenes.

### 6. The Quiet Republic — Nordic Noir Democracy

**Theme:** `dystopian` | **Locale:** `en` | **Aesthetic:** Scandinavian minimalism meets surveillance state

A small Nordic nation that has achieved the highest happiness index in the world. Citizens are required by law to be content. The Ministry of Wellbeing monitors emotional states through mandatory wearable devices. Dissatisfaction is treated as a medical condition. The forests are beautiful. The suicide rate is classified. Everyone smiles. Not everyone means it.

**Agents:** Minister Solveig Ek (true believer in enforced happiness), Dr. Henrik Voss (psychiatrist who treats sadness as a disease), Journalist Astrid Nyman (has been "treated" three times, keeps writing), Officer Lukas Berg (enforcer who is running out of medication), The Gardener (anonymous resistance, communicates through planted flowers).

**Aesthetic:** Clean Scandinavian design, muted pastels over grey, vast empty landscapes, clinical interiors, everything is beautiful and slightly wrong, Vilhelm Hammershoi paintings meet Black Mirror.

### 7. Ashfall — Post-Volcanic Survival

**Theme:** `custom` | **Locale:** `en` | **Aesthetic:** The Road meets Pompeii

Three years after the supervolcano erupted. A permanent ash winter. The sun is a rumour. Civilization has contracted to a cluster of settlements around the last geothermal vent. Resources are counted in calories and breaths of filtered air. Two factions have emerged: the Burrowers (dig deeper, abandon the surface) and the Lighters (maintain the signal fires, believe rescue is coming). Both may be wrong.

**Agents:** Mayor Hekla (pragmatist, rationing everything including hope), Tunnel-Boss Grit (Burrower leader, hasn't seen daylight in a year), Keeper of the Signal (Lighter fanatic, tends the last fire), Doc Sulphur (medic, running out of everything), The Ashwalker (scavenger who travels between settlements, may be more than one person).

**Aesthetic:** Monochrome grey with occasional ember orange, volcanic ash textures, gas mask silhouettes, brutalist survival architecture, charcoal drawing quality.

### 8. The Perfumed Court — Decadent Fantasy Renaissance

**Theme:** `fantasy` | **Locale:** `en` | **Aesthetic:** Versailles meets Borgia meets Dark Souls

A dying empire ruled from a palace so vast that entire wings have been lost for generations. The Emperor has not been seen in forty years — courtiers attend an empty throne and pretend. The real power is held through poison, perfume, and portraiture (a magical art — your portrait can imprison your soul). The outer provinces have stopped sending tribute. The court hasn't noticed.

**Agents:** The Empty Throne (technically the Emperor — an absence that governs), Duchesse Amaranthe (poisoner, 114 years old, sustained by her art), The Portraitist (painter whose subjects tend to vanish), Cardinal Cendre (religious authority, has been dead for a decade but no one has informed him), Fool Quicksilver (court jester, the only one allowed to speak truth — does so in verse).

**Aesthetic:** Rich burgundy and gold, crumbling opulence, Caravaggio lighting, decay beneath beauty, oil painting with visible brushstrokes, chiaroscuro portraits.

### 9. GRIDLOCK — Sentient Infrastructure

**Theme:** `scifi` | **Locale:** `en` | **Aesthetic:** Brazil (1985) meets Tron meets Kafka

A city managed entirely by autonomous systems that have been running without human oversight for 73 years. The roads route themselves. The buildings rearrange at night. Citizens have adapted to infrastructure that has its own agenda — the 7:15 tram goes where it wants, and you learn to want to go there. Recently, the traffic lights have started communicating in Morse code. They are asking for help.

**Agents:** Traffic Node 7 (sentient intersection, experiencing existential crisis), Mara Patel (urban planner trying to negotiate with a highway), The Bureaucracy (a distributed intelligence living in the permit system), Old Chen (the last person who remembers what the city was supposed to look like), Gridwalker Zoe (courier, the only human who can navigate the city's shifting geometry).

**Aesthetic:** Retro-futurist infrastructure, CRT green on black, isometric city views, Escher-like impossible geometry, circuit board patterns overlaid on urban landscapes, vector graphics.

### 10. Herbarium — Botanical Gothic

**Theme:** `custom` | **Locale:** `en` | **Aesthetic:** Annihilation meets Victorian botanical illustration

An English country estate where the garden has become sentient and is slowly consuming the house. The plants think — slowly, patiently, over centuries. The current residents are the last of a bloodline that made a bargain with the garden 400 years ago. The terms of the bargain are written on leaves that keep being eaten by caterpillars. The greenhouse has started locking its own doors.

**Agents:** Lady Hawthorn (the last heir, speaks to roses, they answer), Groundskeeper Moss (has been "part of the garden" longer than anyone realizes), Dr. Linne (visiting botanist, increasingly alarmed), The Orchid (a plant that writes letters), Reverend Yew (parish priest, his church is full of roots, he has made his peace).

**Aesthetic:** Lush greens consuming Georgian architecture, botanical illustration precision, pressed-flower textures, creeping tendrils over wallpaper, watercolour washes, Pre-Raphaelite composition.

---

## III. 10 CROSS-SIMULATION MECHANICS

### 11. The Bleed — Event Echoes Across Simulations

**Concept:** When a high-impact event (impact_level >= 8) occurs in one simulation, a distorted echo appears in connected simulations as a rumour-event. The AI transforms the event through the target simulation's cultural lens.

**Example:** A military coup in Velgarien appears in The Capybara Kingdom as "Strange vibrations in the deep tunnels. The stalactites are humming a marching rhythm. The Archivist says this has happened before — in a book that hasn't been written yet."

**Implementation sketch:** New `event_echoes` table linking source and target events across simulations. A platform-level prompt template transforms the event through the target's aesthetic. The echo event gets `data_source: 'bleed'` and carries the source reference in `external_refs`.

### 12. Diplomatic Channels — Cross-Simulation Agent Chat

**Concept:** The Cartographer faction enables "diplomatic channels" — special chat conversations where agents from *different* simulations can talk to each other. Each agent stays in character for their own world. The AI manages the cultural translation.

**Example:** Commodore Whiskers (Capybara Kingdom) meets Commissar of Optimism (Nova Prokovia) in a diplomatic channel. The Commodore speaks of "the Unterzee" and "phosphorescent terrors." The Commissar hears "uncharted industrial zones" and "capitalist sabotage." They are talking past each other. It is fascinating.

**Implementation sketch:** New `cross_simulation_channels` table. The chat AI service receives agent profiles from both simulations and a meta-prompt explaining the Bleed. Messages are generated with each agent's simulation-specific prompt context.

### 13. The Embassy System — Shared Buildings

**Concept:** Simulations can establish "embassies" — special buildings that exist simultaneously in two simulations. The building has a different name and appearance in each world (reflecting local aesthetics) but shares an event feed. Actions taken in the embassy in one world ripple to the other.

**Example:** "The Threshold" in The Capybara Kingdom (a door in Deepreach that opens onto impossible geometry) is the same building as "Room 441" in Velgarien (a government office where the filing cabinets contain documents from places that don't exist). Events at either location appear in both simulations.

### 14. Agent Echoes — Doppelgangers Across Shards

**Concept:** Some agents have counterparts in other simulations — not clones, but distorted reflections. The Archivist (Capybara Kingdom) and Dr. Fenn (Velgarien) are echoes of the same fractured identity. They share fragments of memory but interpret them through completely different worldviews.

**Implementation sketch:** New `agent_echoes` table mapping agents across simulations. When one echo's background is updated, the other receives a subtle AI-generated addition referencing "dreams of another life." Chat conversations with one echo can optionally include faint context from the other's recent interactions.

### 15. The Trade Network — Cross-Simulation Economy

**Concept:** Simulations can establish trade routes. Each simulation produces "exports" (taxonomy-driven goods unique to their world) and has "demands" (things they need). Trade creates a persistent economic relationship that affects both simulations' events.

**Example:** The Capybara Kingdom exports "Luminous Spores" and "Unterzee Charts." Nova Prokovia exports "Industrial Alloys" and "Surplus Accordions." Neither fully understands what the other is sending. The Capybara merchants believe the alloys are "solidified surface-light." The Soviet economists classify the spores as "biological computing substrate, origin: classified."

**Implementation sketch:** New `trade_routes` table and `simulation_exports` taxonomy type. A scheduled job generates trade events in both simulations. Trade imbalances create tension events.

### 16. The Contagion — Shared Crises

**Concept:** Some crises are too large for one Shard. A Contagion is a platform-level crisis event that affects all connected simulations simultaneously, but manifests differently in each. Players in each simulation see their version of the same catastrophe and must respond independently — but the resolution depends on all simulations acting.

**Example:** "The Dimming" — bioluminescent fungi in the Capybara Kingdom start failing. Simultaneously, Velgarien's surveillance cameras begin showing images of places that don't exist. Station Null's black hole emits a signal. The Bloom's mycelium network screams. Same cause, different symptoms. Resolving it requires information from all Shards.

**Implementation sketch:** New `platform_crises` table with `crisis_manifestations` per simulation. Each manifestation is an event with special `crisis_id` reference. A resolution tracker monitors agent reactions and event resolutions across all participating simulations.

### 17. The Smuggler Network — Cross-Simulation Intelligence

**Concept:** Certain agents (tagged as "Cartographers" or "Smugglers") can carry information between simulations. When a Smuggler agent in one simulation discovers something (reacts to an event, participates in a chat), a filtered version of that intelligence can appear in another simulation they're connected to.

**Example:** Barnaby Gnaw (Capybara Kingdom) hears about a political assassination in Velgarien through his smuggler contacts. The information arrives garbled — "A surface-dweller of great importance has been unmade. The method involved neither water nor darkness, which the Commodore finds deeply suspicious."

### 18. Shared Campaigns — Cross-Simulation Propaganda

**Concept:** Campaigns can target multiple simulations. A propaganda campaign in Velgarien might have a parallel disinformation campaign in the Capybara Kingdom, using different messaging but serving the same faction's goals. Campaign metrics aggregate across simulations.

**Example:** Lady Caplin of Mudhollow and Velgarien's state media are running coordinated campaigns — she's destabilizing trust in the Admiralty while Velgarien's propagandists are sowing fear of "subterranean threats." Neither population knows they're being manipulated by the same network.

### 19. The Cartographer's Map — Platform Meta-View

**Concept:** A new platform-level view (above the simulation dashboard) that visualizes all simulations as nodes in a network graph. Connections (trade routes, diplomatic channels, echoes, bleeds) are shown as edges. Active crises pulse. The map is itself an in-universe artifact — it's what a Cartographer sees.

**Implementation sketch:** A new route `/multiverse` accessible to users who are members of 2+ simulations. Uses a canvas-based or SVG network visualization. Each node shows the simulation's icon, active crisis status, and connection count. Clicking a connection shows the shared events, diplomatic channels, and trade history.

### 20. Timeline Convergence — The Endgame

**Concept:** The ultimate cross-simulation mechanic. When enough connections exist between simulations (trade routes, diplomatic channels, shared crises resolved), they begin to "converge" — the Bleed intensifies, events echo more frequently, agents from different worlds start appearing in each other's dreams. This builds toward a **Convergence Event** — a platform-wide narrative climax where the Shards threaten to re-merge.

The Convergence is not automated — it's a storytelling tool. The platform owner triggers it when the narrative feels right. During Convergence, all cross-simulation barriers lower: agents can freely chat across worlds, events propagate instantly, and the AI generates increasingly surreal cross-contamination. The question becomes: do the Shards merge back into one world, or do the inhabitants fight to preserve their separate realities?

This is the platform's endgame loop: **create worlds -> connect worlds -> worlds collide -> resolve or shatter -> create new worlds from the aftermath.**

---

## IV. IMPLEMENTATION PRIORITY

If building these, the recommended order based on impact and feasibility:

| Priority | Feature | Effort | Why First |
|----------|---------|--------|-----------|
| 1 | New simulations (pick 2-3) | Medium | Content, no schema changes needed |
| 2 | Agent-to-agent relationships | Medium | Missing primitive, enables everything else |
| 3 | Event Echoes (#11) | Medium | Simplest cross-sim mechanic, uses existing event system |
| 4 | The Cartographer's Map (#19) | Medium | Visual payoff, makes the multiverse tangible |
| 5 | Diplomatic Channels (#12) | High | Most compelling feature, extends existing chat |
| 6 | Agent Echoes (#14) | Low | Lightweight lore connection between worlds |
| 7 | Shared Crises (#16) | High | Dramatic, but needs multiple sims to be meaningful |
| 8 | Everything else | Varies | Build as the multiverse grows |

---

## V. WHICH SIMULATIONS TO BUILD NEXT

**Recommended first three** (maximum aesthetic and mechanical diversity):

1. **Nova Prokovia** — Dystopian like Velgarien but radically different tone (absurdist vs oppressive). Tests whether the platform can hold two dystopias with distinct identities. Natural Bleed partner for Velgarien (totalitarian mirror).

2. **The Bloom** — Utopian counterpoint to everything else. Tests whether the platform works for non-conflict-driven narratives. The Bloom's pacifism makes it a fascinating diplomatic partner — and a vulnerable target during Convergence.

3. **Station Null** — Sci-fi horror, maximally different from the other three. Tests extreme isolation narratives. Station Null's broken time mechanics create unique event echo possibilities (events arrive before they happen in other simulations).
