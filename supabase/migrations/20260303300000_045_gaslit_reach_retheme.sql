-- Migration 045: Retheme Capybara Kingdom → The Gaslit Reach
-- Fallen London / Sunless Sea inspired underground ocean setting.
-- Ambiguously non-human characters with subtle wrongness.
-- All UPDATEs, no DELETEs. Preserves UUIDs.

-- ═══════════════════════════════════════════════════════
-- 1. Simulation — update name, slug, description
-- ═══════════════════════════════════════════════════════

-- Temporarily disable slug immutability trigger
ALTER TABLE simulations DISABLE TRIGGER trg_slug_immutable;

UPDATE simulations SET
  name = 'The Gaslit Reach',
  slug = 'the-gaslit-reach',
  description = 'A sunless city carved into the stone beneath an underground ocean. Bioluminescent fungi light the caverns. The citizens are almost human. Secrets are currency, death is negotiable, and the darkness has a voice.'
WHERE id = '20000000-0000-0000-0000-000000000001';

ALTER TABLE simulations ENABLE TRIGGER trg_slug_immutable;

-- ═══════════════════════════════════════════════════════
-- 2. City — rename Rootwater to Glimhaven
-- ═══════════════════════════════════════════════════════

UPDATE cities SET
  name = 'Glimhaven',
  description = 'The principal settlement of the Gaslit Reach, carved into a vast cavern system beneath the Unterzee. Stalactite spires and fungal groves frame a city that predates memory. Gaslamps flicker along the Upper Galleries. The Undertide Docks hum with commerce. Below it all, Deepreach waits.'
WHERE id = 'c0000003-0000-4000-a000-000000000001';

-- ═══════════════════════════════════════════════════════
-- 3. Zones — update names and descriptions
-- ═══════════════════════════════════════════════════════

UPDATE zones SET
  name = 'The Upper Galleries',
  description = 'The political and administrative heart of Glimhaven. Carved into towering stalagmites, connected by stone bridges. Gaslamps line every passage — the only district that never goes dark. Well-patrolled by the Admiralty''s marines, though what they guard against is left carefully unspecified.'
WHERE id = 'a0000004-0000-0000-0000-000000000001';

UPDATE zones SET
  name = 'The Fungal Warrens',
  description = 'A labyrinthine tunnel network where bioluminescent fungi cast the world in amber and violet. The air is thick with spores. Pilgrims travel here to visit the Great Sporocarp, the Luminous Order''s holiest site. The deeper tunnels shift. Cartographers have stopped trying.'
WHERE id = 'a0000005-0000-0000-0000-000000000001';

UPDATE zones SET
  name = 'The Undertide Docks',
  description = 'Where the underground river meets the Unterzee. A chaotic waterfront of rope bridges, swaying platforms, and taverns built into the roots that pierce the cavern ceiling. Everything is damp. Everything is for sale. The current brings things from the deep — some of them are even cargo.'
WHERE id = 'a0000006-0000-0000-0000-000000000001';

UPDATE zones SET
  name = 'Deepreach',
  description = 'The oldest part of Glimhaven, partially flooded. Pre-settlement structures of unknown origin line corridors that descend beyond mapping. Strange lights flicker in the lower levels. The few residents who live here are not forthcoming about what they have seen. Most avoid it after dark, though dark is all it ever is.'
WHERE id = 'a0000007-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════════
-- 4. Agents — update names, character, background
-- ═══════════════════════════════════════════════════════

-- Agent 1: Commodore Whiskers → Commodore Harrowgate (military, male)
UPDATE agents SET
  name = 'Commodore Harrowgate',
  character = 'Grizzled naval commander of the Reach''s fleet. His teeth are too numerous. He navigates the Unterzee by dead reckoning and a relationship with the currents his officers describe as "listening." Forty years on lightless waters.',
  background = 'His logbook contradicts itself — entries from dates he has not yet reached. The Admiralty trusts him absolutely. His crew trusts him further than that. Three expeditions into the deep Unterzee. Two returned. The third, he says, hasn''t left yet.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Commodore Whiskers';

-- Agent 2: Lady Caplin of Mudhollow → The Marchioness (politics, female)
UPDATE agents SET
  name = 'The Marchioness',
  character = 'Shrewd aristocrat and trading magnate. Her smile arrives slightly before her face does. Controls more of the Reach''s trade than Parliament suspects. Her parties are legendary. Her guest lists are strategic.',
  background = 'Three rivals vanished this year — coincidence, naturally. She came to Glimhaven with nothing and acquired the Exchange within a decade. No one remembers exactly how. Her ledgers are immaculate. Her other ledgers do not exist.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Lady Caplin of Mudhollow';

-- Agent 3: The Archivist (diverse) → Archivist Quill
UPDATE agents SET
  name = 'Archivist Quill',
  character = 'Keeper of the Drowned Archive. Ancient, near-blind, speaks in riddles. Their fingers are too long for their hands — or their hands too short for their fingers. Catalogues the unknowable with serene conviction.',
  background = 'Some pages rearrange themselves when unobserved. The Archivist claims not to notice. They have held this position for longer than institutional memory extends. Previous Archivists are recorded in the ledger, but the handwriting is always the same.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Archivist';

-- Agent 4: Sister Ember → Mother Cinder (clergy, female)
UPDATE agents SET
  name = 'Mother Cinder',
  character = 'Priestess of the Luminous Order. Her sermons move congregations to tears — or occasionally to violence. Her eyes reflect light that isn''t there. Tends the Great Sporocarp, the holiest site in the Reach.',
  background = 'She believes the fungi are the thoughts of something sleeping. Her order provides light and medicine to the Warrens. Demands absolute devotion. Her acolytes speak of her kindness in terms usually reserved for natural disasters.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Sister Ember';

-- Agent 5: Barnaby Gnaw → Obediah Crook (civilian, male)
UPDATE agents SET
  name = 'Obediah Crook',
  character = 'Innkeeper of The Drowned Bell. Cheerful, rotund, knows every secret in the Reach. His warmth is disarming. His memory is unkind. Serves all factions with equal hospitality.',
  background = 'Memorises everything, sells nothing — unless the price would reshape the Reach itself. Every surface of the Bell is carved with initials of patrons, some vanished decades ago. The piano plays itself on Tuesdays. Obediah does not question this.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Barnaby Gnaw';

-- Agent 6: Archivist Mossback → Madam Lacewing (science/civilian, female)
UPDATE agents SET
  name = 'Madam Lacewing',
  character = 'Chief cartographer of the Reach. Maps the unmappable with instruments of her own devising. Her left eye is glass — or so she claims. It sees things the right one doesn''t.',
  background = 'Her maps of Deepreach are the most complete in existence, which is to say they are merely incomplete rather than wrong. She charges exorbitantly for copies. The originals move when unobserved. She has stopped being surprised by this.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Archivist Mossback';

-- ═══════════════════════════════════════════════════════
-- 5. Buildings — update names, descriptions
-- ═══════════════════════════════════════════════════════

-- Building 1: The Drowned Library → The Drowned Archive (special, fair)
UPDATE buildings SET
  name = 'The Drowned Archive',
  description = 'Vast repository in a flooded cavern. Bookshelves rise from dark water on stone pillars. Bioluminescent algae casts a sickly green light. The deeper shelves are not locked — merely forbidden.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Drowned Library';

-- Building 2: The Great Sporocarp — keep name, update description (religious, excellent)
UPDATE buildings SET
  description = 'Colossal fungal growth filling an entire cavern, pulsing soft amber light. Pilgrims travel days through dangerous tunnels. The spore-thick air induces visions. The priestesses say messages. The physicians say toxicosis. Both are correct.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Great Sporocarp';

-- Building 3: Rootwater Market → Glimhaven Exchange (commercial, good)
UPDATE buildings SET
  name = 'Glimhaven Exchange',
  description = 'Bustling marketplace along the underground river. Stalls hang from stalactites, connected by rope bridges. Merchants sell fungal delicacies, Unterzee salvage, dubious maps, and secrets in waxed paper.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'Rootwater Market';

-- Building 4: The Admiralty Grotto — keep name, update description (government, good)
UPDATE buildings SET
  description = 'Carved into a massive stalagmite. Where naval and political power converge. War rooms, cartography chambers, a throne room in which no one sits. The walls are covered in charts that shift with the tides.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Admiralty Grotto';

-- Building 5: The Soggy Paw Tavern → The Drowned Bell (commercial, poor)
UPDATE buildings SET
  name = 'The Drowned Bell',
  description = 'Ramshackle tavern wedged between massive roots piercing the cavern ceiling. Floor permanently damp. Ale surprisingly good. Every surface carved with initials of patrons — some vanished decades ago. The piano plays itself on Tuesdays. No one questions this.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Soggy Paw Tavern';

-- ═══════════════════════════════════════════════════════
-- 6. Embassy Buildings — update descriptions (names already match)
-- ═══════════════════════════════════════════════════════

UPDATE buildings SET
  description = 'A diplomatic threshold carved from a single obsidian slab. Sigils from foreign simulations glow faintly at the entrance. Ambassadors pass through in both directions, carrying treaties sealed in bioluminescent wax.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Threshold';

UPDATE buildings SET
  description = 'A communications array built into a flooded shaft, its mechanisms half-submerged. Signals travel through the Unterzee via means the engineers describe as "resonance" and refuse to elaborate upon. Receives transmissions from distant simulations.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Drowned Antenna';

UPDATE buildings SET
  description = 'A trading post at the edge of the docks where goods from other simulations change hands. The exchange rates are posted daily. They make no mathematical sense. Business is brisk regardless.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND name = 'The Warm Market';

-- ═══════════════════════════════════════════════════════
-- 7. Prompt Templates — update portrait and building prompts
-- ═══════════════════════════════════════════════════════

UPDATE prompt_templates SET
  template_name = 'Gaslit Reach Portrait Description (EN)',
  prompt_content = 'Describe a portrait for image generation: {agent_name}.

Character: {agent_character}
Background: {agent_background}

FORMAT: 1-2 sentences, max 30 words, like a database entry — not a story.
STYLE: Dark fantasy oil painting. Victorian gothic underground. Bioluminescent lighting. Ambiguously non-human — subtle wrongness (too-long fingers, too many teeth, eyes that reflect absent light). Sunless Sea aesthetic.
DO NOT: Anthropomorphic animals, photorealistic, anime, bright lighting, modern clothing.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND template_name = 'Capybara Kingdom Portrait Description (EN)';

UPDATE prompt_templates SET
  template_name = 'Gaslit Reach Building Image Description (EN)',
  prompt_content = 'Describe a building for image generation: {building_name}.

Description: {building_description}

FORMAT: 1-2 sentences, max 30 words, like a database entry — not a story.
STYLE: Dark fantasy architecture. Underground caverns. Bioluminescent fungi lighting. Victorian gothic structures carved from stone. Gas lamps. Damp surfaces. Oil painting concept art.
DO NOT: Anthropomorphic animals, photorealistic, anime, bright outdoor lighting, modern architecture.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND template_name = 'Capybara Kingdom Building Image Description (EN)';

-- ═══════════════════════════════════════════════════════
-- 8. Simulation Settings — update image style prompts
-- ═══════════════════════════════════════════════════════

UPDATE simulation_settings SET
  setting_value = '"Dark fantasy oil painting, Victorian gothic underground, bioluminescent lighting, ambiguously non-human characters with subtle wrongness, Sunless Sea aesthetic, underground cavern setting, gas lamps and fungal glow"'::jsonb
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND setting_key = 'image_style_prompt_portrait';

UPDATE simulation_settings SET
  setting_value = '"Dark fantasy architecture, underground caverns, bioluminescent fungi lighting, Victorian gothic structures carved from stone, gas lamps, damp surfaces, oil painting concept art, Sunless Sea aesthetic"'::jsonb
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND setting_key = 'image_style_prompt_building';

-- ═══════════════════════════════════════════════════════
-- 9. Simulation Connections — update descriptions
-- ═══════════════════════════════════════════════════════

-- Velgarien ↔ Gaslit Reach
UPDATE simulation_connections SET
  description = 'Brutalist forms appear in the cavern walls of the Reach — geometries too regular for geology. Bureau communiqués reference a "subterranean anomaly." The Gaslit Reach''s archivists have found documents written in bureaucratic language that predates their settlement.'
WHERE simulation_a_id = '10000000-0000-0000-0000-000000000001'
  AND simulation_b_id = '20000000-0000-0000-0000-000000000001';

-- Gaslit Reach ↔ Station Null
UPDATE simulation_connections SET
  description = 'The Unterzee''s darkness mirrors the void between stars. Station Null sensors have detected bioluminescent signatures in deep space that match Reach fungi. The Drowned Archive contains star charts. The station''s logs reference an underground ocean.'
WHERE simulation_a_id = '20000000-0000-0000-0000-000000000001'
  AND simulation_b_id = '30000000-0000-0000-0000-000000000001';

-- Gaslit Reach ↔ Speranza
UPDATE simulation_connections SET
  description = 'Underground civilisations share construction knowledge across the fracture. Speranza''s tunnel-builders use techniques documented in the Drowned Archive. The Reach''s merchants trade in salvage that bears Speranza''s maker-marks.'
WHERE simulation_a_id = '20000000-0000-0000-0000-000000000001'
  AND simulation_b_id = '40000000-0000-0000-0000-000000000001';

-- Gaslit Reach ↔ Cité des Dames
UPDATE simulation_connections SET
  description = 'The Reach''s archivists catalogue volumes that bear the Cité''s illuminated script. The Luminous Order has adopted hymns whose melodies originate in Christine''s city. Scholarly delegations travel in both directions, exchanging knowledge that enriches both civilisations.'
WHERE simulation_a_id = '20000000-0000-0000-0000-000000000001'
  AND simulation_b_id = '50000000-0000-0000-0000-000000000001';

-- ═══════════════════════════════════════════════════════
-- 10. Agent Relationships — update descriptions
-- ═══════════════════════════════════════════════════════

-- Lady Caplin → Commodore Whiskers becomes The Marchioness → Commodore Harrowgate
UPDATE agent_relationships SET
  description = 'The Marchioness supplies the Commodore''s fleet. The Commodore overlooks the Marchioness''s less documented cargo manifests. A mutually profitable arrangement maintained through careful ambiguity.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND source_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'The Marchioness')
  AND target_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'Commodore Harrowgate');

-- Sister Ember → The Archivist becomes Mother Cinder → Archivist Quill
UPDATE agent_relationships SET
  description = 'They share research on the boundary between divine revelation and fungal neurotoxicology. The Archivist provides texts. Mother Cinder provides interpretations. Neither fully trusts the other''s conclusions.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND source_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'Mother Cinder')
  AND target_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'Archivist Quill');

-- The Archivist → Barnaby Gnaw becomes Archivist Quill → Obediah Crook
UPDATE agent_relationships SET
  description = 'The Archivist frequents the Drowned Bell for reasons beyond ale. Obediah hears everything. The Archivist wishes to know what the walls remember. An exchange of information disguised as friendship.'
WHERE simulation_id = '20000000-0000-0000-0000-000000000001'
  AND source_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'Archivist Quill')
  AND target_agent_id = (SELECT id FROM agents WHERE simulation_id = '20000000-0000-0000-0000-000000000001' AND name = 'Obediah Crook');

-- ═══════════════════════════════════════════════════════
-- 11. Streets — INSERT 16 streets (Capybara had 0)
-- ═══════════════════════════════════════════════════════

INSERT INTO city_streets (simulation_id, city_id, zone_id, name, street_type, length_km) VALUES
-- Upper Galleries (4 streets)
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'Parliament Row', 'boulevard', 0.80),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'Gaslight Promenade', 'boulevard', 0.65),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'Stalagmite Way', 'avenue', 0.50),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000004-0000-0000-0000-000000000001', 'Admiral''s Stair', 'alley', 0.30),
-- Fungal Warrens (4 streets)
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'Spore Lane', 'lane', 0.45),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'Pilgrim''s Descent', 'path', 0.70),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'Luminous Passage', 'tunnel', 0.55),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000005-0000-0000-0000-000000000001', 'Mycelium Walk', 'path', 0.35),
-- Undertide Docks (4 streets)
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'Bilge Row', 'lane', 0.40),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'Rope Bridge Crossing', 'bridge', 0.25),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'Chandler''s Wharf', 'quay', 0.50),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000006-0000-0000-0000-000000000001', 'Salvage Alley', 'alley', 0.30),
-- Deepreach (4 streets)
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'The Drowned Corridor', 'tunnel', 0.60),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'Cartographer''s Dead End', 'path', 0.35),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'Floodlight Stairs', 'alley', 0.25),
('20000000-0000-0000-0000-000000000001', 'c0000003-0000-4000-a000-000000000001', 'a0000007-0000-0000-0000-000000000001', 'The Forgotten Shelf', 'path', 0.40);
