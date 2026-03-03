import { msg } from '@lit/localize';
import type { LoreSection } from '../../platform/LoreScroll.js';

/**
 * The Gaslit Reach — Sunless Sea / Fallen London
 * Voice: Scholarly marginalia, archival fragments, harbour logs, official memoranda
 * Characters: Ambiguously non-human — subtle inhuman traits
 * Inspirations: Fallen London, Sunless Sea, Gormenghast, Peake, Miéville
 */
export function getGaslitReachLoreSections(): LoreSection[] {
  return [
    {
      id: 'nature-of-unterzee',
      chapter: msg('The Unterzee — Waters Without a Sky'),
      arcanum: 'I',
      title: msg('On the Nature and Disposition of the Unterzee'),
      epigraph: msg(
        'The sea does not care that it is underground. It was a sea before there was a sky, and it will be a sea long after the concept of "above" has been forgotten.',
      ),
      imageSlug: 'nature-of-unterzee',
      imageCaption: msg(
        'The Unterzee — Vast, lightless, and profoundly indifferent to cartography',
      ),
      body: msg(`FROM: A Natural History of the Subterranean Waters
BY: Archivist Quill, Keeper of the Drowned Archive
EDITION: Fourteenth (Revised, Expanded, and Partially Rearranged Overnight)

Let us begin, as all proper natural histories must, with a correction. The Unterzee is not underground. The Unterzee is beneath — a distinction that may seem academic until you have spent, as I have, longer than institutional memory extends cataloguing the difference between "below the earth" and "below everything else." The earth, you see, is a specific thing: soil, stone, the compressed memory of dead organisms. The Unterzee is beneath something far more fundamental. It is beneath assumption. It is the place you arrive at when you have descended past all the layers of the world that pretend to be solid and discovered, at the bottom of that pretence, a body of water so vast, so ancient, and so utterly disinterested in the affairs of the surface that it makes the oceans above look like enthusiastic puddles.

The water is dark. Not dark in the way of a room without candles — that is merely an absence. The darkness of the Unterzee is a presence. It is the colour that black wants to be when it grows up. Commodore Harrowgate, the finest naval mind the Reach has produced, once described the water as "the visible form of patience." He was three days into a crossing of the Phosphorescent Expanse at the time, and his navigator had just informed him that the stars they were steering by did not correspond to any known constellation and might, in fact, be something looking back. The Commodore's teeth — of which there are too many, though he is not forthcoming about the exact count — caught the bioluminescent light as he smiled. He adjusted course. He did not explain how.

The Unterzee has no tides. It has currents — vast, slow movements of water that follow paths established before the first settlers descended. These currents are warm in some passages and cold in others, and the boundary between warm and cold is so precise that one can stand a thermometer in the water and watch the mercury argue with itself. The warm currents carry nutrients from the fungal forests of the Luminous Reaches. The cold currents come from the Abyssal Trenches, where the water is not merely cold but philosophically cold — a temperature that calls into question whether warmth was ever more than a temporary condition.

There are things in the water. I will not catalogue them here — that is the purpose of my companion volume, A Bestiary of the Improbable (Third Edition, Available From the Drowned Archive, Price: One Interesting Secret). But I will say this: the Unterzee is not empty. It has never been empty. The creatures that live in it were there before us, and they regard our presence with the same mild curiosity that a mountain regards the lichen on its surface. We are a recent development. The Unterzee is patient. It has seen civilisations come and go like weather patterns, and it will be here, dark and vast and faintly phosphorescent, long after we have joined the fossils in the limestone.

This is not pessimism. This is geology. And geology, as every Archivist knows, is merely history with better handwriting.`),
    },
    {
      id: 'cartography-of-darkness',
      chapter: msg('The Unterzee — Waters Without a Sky'),
      arcanum: 'II',
      title: msg('A Cartography of Darkness — Navigating the Lightless Waters'),
      epigraph: msg('A map of the Unterzee is a confession of ignorance drawn very carefully.'),
      imageSlug: 'cartography-of-darkness',
      imageCaption: msg(
        'Subterranean waterways — Where the current knows paths that the navigator does not',
      ),
      body: msg(`FROM: Proceedings of the Glimhaven Cartographic Society, Vol. CXIV
PRESENTED BY: Madam Lacewing, Chief Cartographer, Surveyor of the Unmappable
OCCASION: The Annual Lecture on Things We Have Failed to Map

Distinguished colleagues, damp friends, and whatever is making that scratching noise behind the east wall (you are tolerated but not welcomed; please do not eat the slides),

I stand before you to present the findings of the Seventeenth Unterzee Survey, which departed from the Undertide Docks fourteen months ago with a crew of thirty-two, a cargo of mapping instruments, and the quiet confidence of scholars who believed they understood water. We returned with a crew of thirty-two — all present, all healthy, all profoundly confused — and a collection of charts that I can only describe as "aggressively speculative."

The Unterzee does not wish to be mapped. I do not mean this poetically. I mean that the water resists measurement with a consistency that suggests intent. Our sonar returned echoes from surfaces that were not there when we sent divers to verify. Our depth measurements in the Phosphorescent Expanse varied by up to forty metres between morning and afternoon readings, with no corresponding change in water level. In the Whispering Strait — so named because the acoustic properties of the limestone produce a sound that the crew unanimously described as "someone trying to tell you something important in a language you almost understand" — our compass pointed in six directions simultaneously, which should not be possible and yet was confirmed by three independent instruments, all of which we subsequently dismantled and found to be in perfect working order.

The Reach's navigators have known for generations that the Unterzee's geography is — and I choose this word with scholarly precision — moody. Passages that are wide enough for a three-mast vessel one month may be barely navigable by kayak the next. Islands appear, persist for a season, and vanish, leaving behind only a faint phosphorescent stain on the water and a sense of loss in the crew that defies rational explanation. The Luminous Reaches expand and contract like breathing. The Abyssal Trenches have been measured at seven different depths in seven different surveys, and the leading hypothesis — which I present to you now with no enthusiasm whatsoever — is that all seven measurements are correct, and the Trench simply occupies multiple depths at once.

My left eye, which is glass — or so I claim, and I will thank you not to look too closely — sees the routes that the right eye misses. This is not metaphor. This is cartography. The Unterzee rewards those who learn to see with more than light.

Commodore Harrowgate, when shown our latest charts, studied them for twenty minutes, traced a route that existed on no version of the map, and set sail the following morning. He arrived exactly where he intended. When asked how he navigated waters we had just proven were unmappable, he said: "I asked the current." He did not elaborate. The current, apparently, does not require footnotes.`),
    },
    {
      id: 'founding-of-glimhaven',
      chapter: msg('The Reach — A Commonwealth of Gaslight'),
      arcanum: 'III',
      title: msg('A Brief History of the Founding of Glimhaven'),
      epigraph: msg(
        'We did not choose to live underground. We chose to make underground a place worth living.',
      ),
      imageSlug: 'founding-of-glimhaven',
      imageCaption: msg(
        'The Upper Galleries — Where gaslight meets governance and the stone remembers',
      ),
      body: msg(`FROM: A Political History of the Gaslit Reach
BY: Archivist-Emeritus Greywick, Department of Governmental Memory
EDITION: Ninth (the definitive edition, he insists, though the tenth is already in draft)

The founding of Glimhaven is not recorded in any document, because the founding predates documents. It is recorded in the limestone — in marks on the walls of the First Chamber, where the original Compact was spoken. Not written. The earliest settlers preferred the spoken word, which can be amended in real time, unlike text, which sits there smugly being wrong until someone corrects it.

Who were they? This is the question that the Department of Governmental Memory has been unable to answer for the entirety of its existence, which is embarrassing given that answering questions is literally our institutional purpose. The founding population of the Reach descended from the surface — this much is clear from the geological record, the architectural evidence, and the persistent cultural memory of a place called "above" that no living citizen has visited. They were fleeing something. What they were fleeing is disputed: flood, famine, war, or something more fundamental — a fracturing of the world itself, a schism between what was and what could be.

They were human. Probably. The earliest remains are consistent with human anatomy, with certain exceptions that the Department has classified as "within normal variation" despite the fact that they are not, strictly speaking, within any variation that surface medicine would recognise. The teeth, for instance. The founding population had more of them than is standard. The fingers were longer. The eyes — preserved remarkably well in the alkaline limestone — showed structural adaptations for low-light vision that would require, by surface evolutionary standards, approximately fifty thousand years of selective pressure.

The Reach has been settled for four centuries.

This discrepancy is the subject of ongoing research, which is a polite way of saying we have been arguing about it for two hundred years and are no closer to resolution. The prevailing theory — advanced by Archivist Quill, whose own fingers are notably elongated and who has held the position of Head Archivist for longer than anyone can verify — is that the Unterzee changes those who live beside it. Not quickly. Not dramatically. But steadily, over generations, in ways that are easier to notice in hindsight. The citizens of the Reach are human. They are simply human in a way that the surface would find... unfamiliar.

The Compact that governs the Reach is simple. Three articles:

ONE: We share. Secrets, warmth, labour, the knowledge of safe passages. Hoarding is not forbidden. Hoarding is merely unwise — secrets are currency in the Reach, and currency that is not circulated loses its value.

TWO: We remember. The Archivists exist because forgetting is a luxury the Unterzee does not permit. Memory is infrastructure. It is how we navigate, how we avoid the things the water conceals, how we honour those who went into the Abyssal Trenches and did not return.

THREE: We stay. The surface is closed to us — whether by choice, by catastrophe, or by the simple fact that four centuries in the dark have made the light unbearable. We descended. We adapted. We made the darkness liveable, not by conquering it but by learning its rhythms, its moods, its preferences.

The Parliament — which meets in the Admiralty Grotto on the first day of each tidal cycle (the Unterzee has no moon, but the tides remember one, and we find this sufficient) — operates by consensus. This makes governance slow, argumentative, and occasionally interrupted by someone leaving for the Drowned Bell to think things over, which is considered a valid form of dissent.

The system works because the citizens of the Reach are, by nature, patient. They outlasted a catastrophe. They can outlast a committee meeting.`),
    },
    {
      id: 'archives-of-deep',
      chapter: msg('The Archives — Memory in the Dark'),
      arcanum: 'IV',
      title: msg("The Drowned Archive — A Librarian's Lament"),
      epigraph: msg(
        'The books are damp. The books have always been damp. If you wanted dry knowledge, you should have stayed on the surface.',
      ),
      body: msg(`FROM: Marginalia in the catalogue of the Drowned Archive
BY: Junior Archivist Foxglove, who was supposed to be reshelving but instead started writing and could not stop

I have been in the Drowned Archive for four years now, and I can say with scholarly confidence that it is the most extraordinary, infuriating, beautiful, and fundamentally impossible institution in the Reach, and possibly in whatever remains of the world above.

The Archive occupies seventeen chambers connected by passages that the original builders — if there were original builders; the Archive may have simply grown, like everything else down here — carved into the living rock at angles that suggest either brilliance or lunacy. The shelves are limestone, rising from dark water on stone pillars. The books are written on treated fungal-membrane (waterproof, luminescent, and faintly aromatic — the scent of old knowledge, which smells, for the record, like wet stone and ambition). Bioluminescent algae casts a sickly green light over everything. The deeper shelves are not locked — merely forbidden.

Archivist Quill has been in charge since before I was born, and possibly before several of my ancestors were born. They are very old. How old is classified — not for security reasons, but because Quill considers age to be "a private matter between oneself and one's joints." Their fingers are too long for their hands. This is not a metaphor. I measured. They move through the Archive as though the shelves rearrange themselves to accommodate their passage, which — and I state this with the careful neutrality of a scholar who does not wish to be reassigned to the Deepreach cataloguing annex — they do. I have watched it happen. The shelves wait until Quill has passed, and then they are not where they were.

The Archive's collection spans everything the Reach has ever known, suspected, imagined, or overheard in the Drowned Bell after too much fermented lichen-wine. It includes: natural histories, navigational charts, philosophical treatises, poetry, engineering manuals, diplomatic correspondence, and one shelf — the Restricted Shelf, behind a door that opens only for Quill and for the door's own amusement — that contains books the Archive did not acquire.

These are the Stranded Volumes. They appear on the shelves without explanation, written in languages that no Archivist can fully translate, describing places that do not exist in the Unterzee — or that do not exist yet. Quill has catalogued forty-seven Stranded Volumes over their career. Each describes a different world. Several describe the same world from contradictory perspectives. One describes a world that is, unmistakably, the surface — but a version of the surface that has been fractured, broken into separate realities like a mirror dropped from a great height. Quill read this volume three times and then placed it on the Restricted Shelf with the note: "Accurate but unhelpful. File under: Things We Cannot Fix."

The youngest Stranded Volume appeared six months ago. It is written in a hand that Quill recognises as their own — but a version of their handwriting that has not yet developed, as though it were written by a future Quill who had learned something the current Quill has not. The volume's title, translated roughly, is: On the Inevitability of Doors Between Worlds, and Why We Should Not Open Them, and Why We Will.

Quill has not opened it.
Quill will.
The Archive knows this. The Archive has always known this.
That is why it sent the book.`),
    },
    {
      id: 'luminescent-phenomena',
      chapter: msg('The Luminescence — Light in the Abyss'),
      arcanum: 'V',
      title: msg('A Catalogue of Luminescent Phenomena'),
      epigraph: msg(
        'The Unterzee is not dark. The Unterzee glows. You simply have to learn which light to trust.',
      ),
      body: msg(`FROM: Proceedings of the Glimhaven Society of Natural Philosophers, Special Issue
BY: Mother Cinder, Priestess of the Luminous Order, Keeper of the Great Sporocarp
SUPPLEMENTARY NOTES BY: Commodore Harrowgate (unsolicited but tolerated)

The Unterzee produces its own light. This is perhaps the first and most important thing for any surface-dweller (or any young citizen venturing beyond the Upper Galleries for the first time) to understand. There is no sun beneath the stone. There is no moon, no stars, no fire in the traditional sense. And yet the Unterzee is not dark. It glows — in patterns so varied, so beautiful, and so thoroughly resistant to systematic study that I have dedicated my ministry to cataloguing them and have managed, in thirty years, to classify approximately nine percent.

The primary source of light is the fungal forests of the Luminous Reaches — vast networks of mycelium that colonise the limestone walls and produce a soft, steady, amber-green glow that the Reach uses as its baseline illumination. This is the light of the Great Sporocarp — our holiest site, a colossal fungal growth filling an entire cavern, pulsing with rhythms that my Order believes are messages. The physicians say toxicosis. Both are correct. The spore-thick air induces visions. The visions contain information. Whether the information is divine revelation or neurochemical hallucination is a distinction I have come to regard as unimportant.

Beyond the fungal forests, the classification becomes complicated.

There are the Phosphorescent Tides — periodic waves of blue-white light that sweep through the open Unterzee at irregular intervals, illuminating vast stretches of water for minutes at a time before fading. The Tides follow no predictable schedule. Madam Lacewing mapped their patterns for eleven years and concluded that they are "probably biological, possibly geological, and definitely doing it on purpose." The organisms responsible — if they are organisms — have never been captured, observed, or successfully theorised about.

There are the Signal Corals of the Strait of Whispers — stationary growths that emit bursts of amber light in sequences that the Society has tentatively classified as "communication," though who is communicating with whom, and about what, remains unknown. The corals respond to the presence of vessels by changing their flash patterns, which either means they are acknowledging us or warning something else about us.

There are the Deep Stars — points of white light that appear at extreme depth, far below the navigable waters, in the Abyssal Trenches where the pressure would crush any vessel. Commodore Harrowgate, who has descended further than any other navigator and returned, describes the Deep Stars as "exactly like the stars above, except they are below, and they are watching." His eyes reflected them as he said this — reflected light that was not present in the room. His officers have stopped commenting on this.

And then there is the Glow Beneath the Glow. Beneath every light source in the Unterzee — beneath the fungi, beneath the phosphorescent tides, beneath the signal corals and the deep stars — there is a second light. Fainter. Older. A luminescence that does not belong to any organism, any mineral, any chemical process we can identify. It is the light of the Unterzee itself — the glow of a body of water that has been in the dark so long that it has learned to shine on its own.

This light is the colour of memory. I do not know a better way to describe it.

Archivist Quill, when I presented these findings, nodded slowly and said: "The light was here before we were. It will be here after. Your job is not to explain it. Your job is to describe it well enough that those who come after us will know what they are looking at." This is, I have come to understand, the entire philosophy of the Drowned Archive expressed in three sentences.

The Unterzee glows. We do not know why. We catalogue the glow anyway. This is what we do. This is what we have always done.`),
    },
    {
      id: 'current-is-strong',
      chapter: msg('The Current — What the Water Knows'),
      arcanum: 'VI',
      title: msg('The Current Is Strong Today'),
      epigraph: msg(
        'When the current changes, the Commodore changes course. He does not ask where it is going. He asks what it has seen.',
      ),
      body: msg(`FROM: Personal journal of Commodore Harrowgate, undated
FOUND: In the Commodore's cabin aboard the HMS Obstinate, left open on the navigation desk
NOTE: The Commodore does not keep a journal. This entry exists anyway.

The current is strong today.

I know this the way I know most things about the Unterzee — not through instruments, not through charts, not through the careful scholarship that Quill and the Archivists so value and I so respect without ever quite practising. I know it in my teeth. I have too many of them. This is not a complaint. Each one feels the water differently — pressure, temperature, salinity, and something else. Something the instruments cannot measure. When I hold still and let the water move past my face, I can feel the current's mood. Not its direction — the compass handles direction, when it feels like cooperating. Its mood.

Today the current is restless. It comes from the direction of the Abyssal Trenches — from the deep places where the Deep Stars watch and the water remembers being something other than water. It carries a temperature signature I haven't felt before: not warm, not cold, but different. As though the water has passed through something that changed its fundamental nature without changing its chemistry. It is still water. It is still wet. But it feels like water that has been somewhere that water should not go.

The crew does not feel it. The crew is young and enthusiastic and relies on instruments, which I do not discourage because instruments are useful and because youth needs something to trust while it learns to trust itself. Madam Lacewing feels it — she gave me a look this morning across the chart table that said, without words, "The water is strange." I nodded. Her glass eye — or whatever it actually is — tracked something in the darkness that neither of us mentioned.

I have been sailing the Unterzee for longer than most of my crew have been alive. I have navigated the Whispering Strait in absolute darkness. I have anchored at Dead-Light Reef, where the luminescence cuts out entirely and the water is so still that you can see your own reflection looking back at you with an expression you are not wearing. I have taken the Obstinate deeper than any vessel in the Reach's history and returned with charts that Quill classified as "impossible, accurate, and deeply concerning."

In all those years, I have never felt the current do what it is doing now.

It is not flowing. It is reaching. Like a hand extended in the dark, feeling for something it knows is there but cannot yet touch. The current has always been the Unterzee's circulatory system — blood moving through a body we sail inside. But today the blood is moving with purpose. The Unterzee is not merely circulating. It is searching.

For what? Quill would tell me to catalogue the phenomenon and wait for data. Mother Cinder would tell me the Sporocarp has been pulsing strangely and that the spore-visions mention doors. Obediah Crook would pour me an ale and tell me nothing while memorising everything I said. The Marchioness would ask what it means for trade routes and whether she should buy or sell.

But I am a Commodore, not a scholar. My job is not to understand the Unterzee. My job is to sail it, which requires a different kind of knowledge — the kind that lives in the teeth and the gut and the decades of experience that tell me, with quiet and absolute certainty, that the Unterzee is about to change.

Something is coming. Or something is leaving. Or something that was always here is waking up.

I do not know which. I do not know when. But the current is strong today, and the current does not lie.

I have ordered the crew to full watch. I have told Lacewing to chart every anomaly, no matter how minor. I have written this entry in a journal I do not keep, because some things need to be written even if they should not be, and this is one of them.

The Unterzee is patient. It does not hurry. It does not warn.

But today — today it is trying to tell us something.

I am listening.

— H.`),
    },
  ];
}
