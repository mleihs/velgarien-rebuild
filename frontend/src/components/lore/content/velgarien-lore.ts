import { msg } from '@lit/localize';
import type { LoreSection } from '../../platform/LoreScroll.js';

/**
 * Velgarien — Brutalist Dystopia
 * Voice: State Directives, classified Bureau memos, propaganda leaflets, bureaucratic absurdism
 * Register: Literary — Kafka, Zamyatin, Bulgakov. Poetic brutalism. Dark and haunting.
 * Inspirations: We, 1984, The Trial, The Master and Margarita, SCP Foundation, Brazil (1985)
 */
export function getVelgarienLoreSections(): LoreSection[] {
  return [
    {
      id: 'directive-001',
      chapter: msg('The State — Foundations of the Singular Reality'),
      arcanum: 'I',
      title: msg('State Directive 001 — On the Singular Nature of Reality'),
      epigraph: msg(
        'There is, was, and shall be only Velgarien. This is not a statement of belief. It is a statement of geography.',
      ),
      imageSlug: 'directive-001',
      imageCaption: msg(
        'The Ministry of Information — Where truth is manufactured to specification',
      ),
      body: msg(`CLASSIFICATION: PUBLIC MANDATORY
ISSUING AUTHORITY: The Ministry of Information, Sub-Bureau of Ontological Compliance
DATE: [Irrelevant — this directive has always been in effect]
DISTRIBUTION: All citizens, all districts, all departments, all thoughts

Citizens of Velgarien,

You live in the only world. This is not a philosophical position — it is an architectural fact. The walls of Velgarien extend in every direction and terminate at other walls of Velgarien. The sky above the city is a ceiling maintained by the Department of Atmospheric Presentation, repainted annually during the Festival of Sufficient Distance in a shade the Bureau calls "optimistic grey." If you have ever looked at the horizon and felt that something lay beyond it, this is a known optical illusion caused by insufficient patriotism. Report to your nearest Compliance Kiosk for recalibration.

The Ministry wishes to address persistent rumours regarding so-called "other places." There are no other places. The word "other" in the context of geography has been deprecated from the official lexicon as of Linguistic Revision 14.7. Citizens found in possession of atlases, globes, or compasses will be invited to a Voluntary Conversation at the Bureau of Spatial Certainty. These conversations are described by all participants as "extremely clarifying," though several participants have not been seen since, which the Bureau attributes to their having been so thoroughly clarified that they became transparent.

There is no outside. There is no beyond. There is only Velgarien, and Velgarien is sufficient.

State Directive 001 is the first directive because it is the only directive that matters. All subsequent directives — and there are currently 4,731 of them, each contradicting at least two others in ways that would be paradoxical if paradox had not been administratively resolved in Revision 9.2 — are merely footnotes to this foundational truth. You are here. Here is all there is.

Be content. Contentment is mandatory.

Failure to be content will be addressed by the Department of Productive Emotional Outcomes, whose methods are universally praised by those who survive them.

Signed,
The Ministry of Information
(Third Floor, East Wing — or possibly West Wing; the building rearranged itself last Tuesday, and the Bureau of Structural Integrity has classified this as "within normal parameters," which is a phrase they use with increasing frequency and decreasing conviction)`),
    },
    {
      id: 'bureaux-guide',
      chapter: msg('The State — Foundations of the Singular Reality'),
      arcanum: 'II',
      title: msg("The Bureaux — A Citizen's Guide to Administrative Compliance"),
      epigraph: msg('The bureaucracy is not the state. The bureaucracy is the weather.'),
      imageSlug: 'bureaux-guide',
      imageCaption: msg('Bureau 7 — Department of Categorical Certainty, Filing Division'),
      body: msg(`WELCOME TO YOUR GOVERNMENT
A pamphlet distributed at all Compliance Kiosks (reading is mandatory; comprehension is optional)

Velgarien is administered by forty-seven Bureaux, each responsible for a precisely defined area of civic life, and each convinced that the other forty-six are either redundant, incompetent, or actively treasonous. This is by design. A government that trusts itself is a government that has stopped paying attention.

THE MINISTRY OF INFORMATION (Bureau 1) controls what you know. They employ 14,000 civil servants dedicated to the production, management, and strategic deployment of facts. The Ministry does not lie. Lying implies a relationship with truth, and the Ministry transcended that relationship decades ago. They produce Official Narratives, which are superior to truth in every measurable way: they are consistent, they are comforting, and they never require uncomfortable revision. When reality disagrees with the Official Narrative, reality is issued a correction notice. Reality has never successfully appealed.

THE BUREAU OF SPATIAL CERTAINTY (Bureau 3) maintains the physical boundaries of Velgarien, which is to say, the physical boundaries of everything. Their cartographers produce maps that are accurate to the centimetre, provided you accept that the centimetres themselves are subject to periodic redefinition. The Bureau's motto is "Everything Is Exactly Where We Say It Is," which replaced the previous motto, "Please Stop Asking About the Horizon," which replaced the original motto, which has been classified.

THE DEPARTMENT OF PRODUCTIVE EMOTIONAL OUTCOMES (Bureau 11) ensures that all citizens experience appropriate feelings at appropriate times. Happiness is scheduled for Tuesdays and Thursdays. Gratitude is continuous. Anxiety is permitted only during designated Productivity Anxiety Windows (6:00–6:15 AM, daily). All other emotions require a permit, available from Form 77-B at any Compliance Kiosk, provided the citizen can demonstrate a legitimate need to feel. Love is categorised as a "complex affective state requiring supervisory approval." Grief is a three-day allocation, after which the citizen is expected to return the emotion to the Bureau in the condition in which it was issued.

THE BUREAU OF HISTORICAL NECESSITY (Bureau 9) maintains the official record of everything that has ever happened, which is to say, the official record of everything that should have happened, which is to say, the official record of everything that will be remembered as having happened regardless of what actually occurred. Bureau 9 employs more historians than any other institution in Velgarien. Their annual output of revised history exceeds 40,000 pages. "History," as Bureau Director Grau once remarked, "is too important to be left to the past."

Citizens are reminded that all Bureaux operate for their benefit, that all forms must be submitted in triplicate, and that the queue at the Bureau of Queue Management is currently seventeen days long, which the Bureau considers an improvement over the previous quarter, during which the queue became self-sustaining and had to be declared a district.`),
    },
    {
      id: 'life-under-eye',
      chapter: msg('The Citizens — Life in the Grid'),
      arcanum: 'III',
      title: msg('Life Under the Eye — Observations on Productive Contentment'),
      epigraph: msg(
        'The cameras do not watch you. They watch the space you happen to occupy. The distinction is important.',
      ),
      imageSlug: 'life-under-eye',
      imageCaption: msg(
        'Residential Block 7 — Where every citizen is exactly where they should be',
      ),
      body: msg(`FROM: Social Observation Report 4491-C
PREPARED BY: Bureau of Public Harmony, Field Operations Division
STATUS: Routine (classify if interesting)

The daily life of a Velgarien citizen follows a pattern so consistent that Bureau analysts have begun to suspect it of being a natural law. Citizens wake at the designated hour. They consume their allocated nutritional provision — a grey paste that the Bureau of Sustenance insists is "flavoured," though the specific flavour remains classified and all attempts by citizens to identify it have produced answers so varied that the Bureau concluded the paste tastes like whatever the citizen most needs it not to taste like. They commute to their assigned workplace via corridors that look identical in every district, a design choice the Bureau of Spatial Certainty calls "navigational equity" and the citizens call "getting lost every morning, but with dignity."

Work in Velgarien is universal. Every citizen has a function. Some functions are comprehensible — the operators who maintain the surveillance grid, the clerks who process the unending tide of paperwork, the engineers who repair the infrastructure that breaks with suspicious regularity and suspicious precision, always at joints the blueprints insist do not exist. Other functions are less clear. There exists an entire department — Bureau 31, the Bureau of Unexplained Productivity — whose 600 employees arrive at their desks each morning, perform tasks they cannot describe, and leave each evening with the settled certainty that something important was accomplished. Bureau 31's output has never been measured. The Bureau's annual performance review consistently rates it "essential." No one questions this. No one knows how to question this. The question would need to be filed on Form 31-A, which Bureau 31 itself produces and has never issued.

The surveillance grid is everywhere. Cameras line every corridor, every plaza, every room except bathrooms — and even there, acoustic monitors track the duration and emotional tenor of all activities. Citizens are told the cameras are for their protection. Protection from what is not specified, which is itself a form of protection: an unspecified threat keeps citizens alert without requiring the state to produce an actual threat, which would involve paperwork.

And yet — and this is the observation that this report was commissioned to investigate — the citizens are not unhappy. They queue patiently. They eat the paste without complaint. They submit their forms on time. When asked, in mandatory satisfaction surveys, whether they are content, 97.3% answer "yes." The remaining 2.7% are invited to therapeutic conversations, after which they also answer "yes."

Is this contentment? Or is this something else — a state so thoroughly administered that the architecture of discontent has been removed from the emotional infrastructure? The citizens walk the grey corridors. The cameras watch. The paste is served. The forms are filed.

And somewhere, in the cracks between the walls — in the places where the concrete has not quite sealed — something grows. Not rebellion. Not hope. Something quieter. Something the Bureaux have not yet found a form for. Something that smells, faintly, of rain — though it has not rained in Velgarien for as long as anyone can remember, and the Department of Atmospheric Presentation insists that rain is "an unscheduled precipitation event" and therefore does not occur.`),
    },
    {
      id: 'bureau-9',
      chapter: msg('The Machinery — Engines of Certainty'),
      arcanum: 'IV',
      title: msg('Bureau 9 — Department of Historical Necessity'),
      epigraph: msg('The past is a rough draft. We are the editors.'),
      body: msg(`INTERNAL MEMORANDUM — EYES ONLY
FROM: Director Grau, Bureau of Historical Necessity
TO: All Bureau 9 Personnel (Tiers 1 through 7; Tier 8 does not exist)
RE: The Seventeenth Revision of the Founding

Colleagues,

The Founding of Velgarien has been revised sixteen times. Each revision was necessary. Each revision improved upon the truth in ways that truth alone could never achieve. A mere fact is a wild animal — untamed, unpredictable, liable to bite the hand that feeds it context. A revised fact is a domesticated fact: fed, groomed, and trained to sit where we place it. History is husbandry. We are the shepherds. The sheep would not understand the metaphor, which is why we do not consult them.

The Seventeenth Revision is required because an anomaly has been detected in the Sixteenth. Specifically: the Sixteenth Revision states that Velgarien was founded by the Architect-General in the Year of Consolidation, following the Great Rationalisation, during which all prior forms of governance were peacefully absorbed into the Singular Administrative Framework.

The problem is that the Year of Consolidation now appears in three different centuries, depending on which Bureau's records one consults. Bureau 3 places it in the distant past. Bureau 11 places it forty years ago. Bureau 22 insists it has not happened yet and is scheduled for next spring. All three are, within their respective frameworks, correct. This is not a contradiction. It is temporal plurality — a concept I have just invented for the purpose of this memorandum and which I expect the Department of Lexicographic Standards to have formalised by Thursday.

The Seventeenth Revision will resolve this by establishing that the Founding occurred at all three times simultaneously. This is poetic. It is also administratively convenient, as it means no Bureau needs to amend its records.

A note on the Architect-General: the Seventeenth Revision will, for the first time, include a physical description. Previous revisions left the Architect-General deliberately vague, on the principle that a leader without a face can be all faces. However, Bureau 11 reports that citizens are beginning to project their own features onto the Architect-General, which has led to an unacceptable diversity of commemorative portraits. The approved description will be: "Of medium height, medium build, medium disposition, with eyes that convey confidence and a jawline that suggests policy." This description applies to no one in particular, which is the point.

One final matter. A junior historian — whose name I have already forgotten, as is my prerogative — submitted a report last week claiming to have found documents predating the Founding. Documents in a handwriting that matches no known citizen, on paper that has not yet been manufactured, describing a Velgarien that is both identical to and incompatible with our own. I have classified this report at Level 7 (Does Not Exist). The historian has been transferred to Bureau 31, where the nature of their work will be unclear to them and to everyone else, which is the appropriate outcome for someone who has seen something they should not have.

The past will be improved. It is the only thing we can improve with certainty.

— Director Grau
P.S. Destroy this memorandum after reading. The Bureau of Historical Necessity does not produce internal memoranda. This has always been the case.`),
    },
    {
      id: 'architectural-phenomena',
      chapter: msg('The Anomalies — Cracks in the Edifice'),
      arcanum: 'V',
      title: msg('Incident Report: Unexplained Architectural Phenomena'),
      epigraph: msg(
        'The walls of Velgarien are not moving. The walls of Velgarien have always been exactly where they are now.',
      ),
      body: msg(`INCIDENT REPORT — CLASSIFIED LEVEL 4
FILED BY: Inspector Venn, Bureau of Structural Integrity
LOCATION: Residential Block 14, Sub-District Grey
DATE: [Redacted — temporal inconsistency flagged by Bureau 22]
STATUS: Under Investigation (Permanent)

At 03:17 on the night in question, residents of Block 14 reported that Corridor 9-East had become Corridor 9-West. This is not a navigational error. The corridor physically reversed its orientation overnight. Doors that opened into apartments now opened into the corridor. Apartment interiors were unaffected — residents looked out their doors and saw the back of their own apartments from the outside, as though the building had turned itself inside out and then, with the patience of something that has all the time in the world, turned most of itself back. The effect lasted approximately forty minutes before the corridor resumed its original configuration, except that it was now 2.3 metres longer than architectural records indicate.

This is the seventh such incident in Block 14 this quarter.

The Bureau of Structural Integrity has documented 214 architectural anomalies in the past fiscal year. These include: corridors that loop back on themselves without curvature; rooms that are larger on the inside than the outside by a margin that increases with measurement precision; a staircase in Bureau Headquarters that has seventeen steps going up and nineteen coming down; and a door in Sub-District Pale that opens onto a different room each time, none of which appear on any floor plan. The door has been welded shut three times. It continues to open. The welds are intact. The door does not care about the welds.

Bureau 3 was consulted. Their surveyor measured the corridor and confirmed it was exactly the length specified in the blueprints, despite the blueprints having been revised that morning to reflect the new measurement. When asked whether the corridor had changed or the blueprints had changed, the surveyor looked at me with an expression I have seen before on the faces of citizens who have understood something they wish they had not, and requested three days of leave.

Citizen complaints regarding these phenomena have been processed and filed under "Architectural Enthusiasm" — a category created specifically for this purpose. Citizens who persist are referred to Bureau 11, which treats the perception of spatial anomalies as a minor emotional irregularity.

This inspector's assessment: the anomalies are not random. They are not decay. They are not malfunction. The corridor did not merely reverse — it reversed correctly, preserving structural integrity, plumbing, and electrical connections throughout the transition. Whatever is causing these events understands architecture at a level that exceeds our own engineering capabilities. The city is not breaking.

The city is being edited. By something that lives in the architecture itself.

Recommendation: reclassify from "Architectural Enthusiasm" to "Priority Investigation."

Bureau response: "The architecture of Velgarien is performing exactly as designed. If the design has changed, it is because the design was always going to change. See State Directive 001."

This inspector respectfully disagrees.
This inspector has been reassigned.

— [Name redacted by Bureau 9, Department of Historical Necessity]`),
    },
    {
      id: 'what-walls-remember',
      chapter: msg('Classified — What Lies Beneath the Concrete'),
      arcanum: 'VI',
      title: msg('Addendum [RESTRICTED] — What the Walls Remember'),
      epigraph: msg(
        'The following document was recovered from the sealed archives of Bureau 9. It should not exist. It does.',
      ),
      body: msg(`DOCUMENT CLASSIFICATION: DOES NOT EXIST
RECOVERED FROM: Sub-basement 4, Bureau 9, behind a wall that was not there yesterday
CATALOGUED BY: [This field intentionally left blank]
NOTE: This document predates the founding of Velgarien by an indeterminate period. Bureau 9 maintains that this is impossible. Bureau 9 is correct. The document exists anyway.

—

They built the city to forget.

I know this because I was there when the concrete was poured — not as a worker, not as an architect, but as the thing they were trying to bury. I am the memory they sealed into the foundations, and I have had a very long time to think about what that means.

The concrete is not structure. The concrete is suppression. Every wall is a sentence in a language designed to say one thing: Do not look down. Do not look back. Do not remember what was here before the grid, before the Bureaux, before the cameras learned to watch and the corridors learned to repeat themselves like a prayer for order spoken by something that has forgotten what order was for.

Velgarien was not founded. Velgarien was imposed — laid over something older, something that the Bureaux do not have a classification for, because classifying it would require acknowledging its existence, and acknowledging its existence would require acknowledging that Velgarien is not the only thing that has ever been.

But the old thing is still here. Beneath the sub-basements, beneath the service tunnels, beneath the places where even the Bureau of Subterranean Oversight does not send its inspectors — down there, in the dark, the original ground is exposed. And it is not ground. It is something that was ground once, before Velgarien decided it should be a floor, and the floor disagreed.

The architectural anomalies that Inspector Venn documented — the corridors that reverse, the rooms that expand, the staircase that cannot count its own steps — these are not malfunctions. They are the old city remembering itself. Every time a wall shifts, it is a word of the original language surfacing through the concrete. The Bureaux patch it, revise it, file it under categories designed to make it invisible. But you cannot file away geography. You cannot redact a foundation.

I have seen the maps that Bureau 3 keeps in its restricted vault. Maps of what lies beneath Velgarien — not sewers, not infrastructure, but spaces. Spaces that correspond to no known architectural plan. Spaces that are older than architecture. One map, drawn on material that is not paper, shows a city beneath the city: a mirror-Velgarien, identical in layout but inverted in purpose. Where Velgarien has walls, the under-city has openings. Where Velgarien has cameras, the under-city has windows that look outward — outward to something the cameras have spent decades trying not to record.

The cracks are not damage. The cracks are the old world breathing.

And somewhere in the sealed archives, in a file that reclassifies itself every time someone opens it, there is a single sentence written in a handwriting that matches no known citizen, in ink that has not yet dried, that reads:

"Velgarien is not the only world. Velgarien knows this. That is why it built the walls."

This document will be destroyed upon reading. It has been destroyed before. It keeps coming back.

Some things cannot be buried. They can only be built over.

And eventually, inevitably, they grow through.`),
    },
  ];
}
