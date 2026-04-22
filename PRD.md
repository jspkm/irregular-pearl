**IRREGULAR PEARL**

**Product requirements**

*Principles, data model, and surfaces — April 2026, revision 2*

This document is the shared reference for what Irregular Pearl is building and what it is not. It is used by the Lead Designer, the Lead Engineer, the Editorial Director, and the AI Operations Lead as the source of truth for product direction. It is not a roadmap — roadmaps change. This is the underlying structure that the roadmap arranges.

The document is in three layers. Principles define the constraints that shape every downstream decision. The data model defines the entities, relationships, and invariants that the engineering and editorial work must preserve. The surfaces section defines the user-facing views of the product, each with a job-to-be-done, a primary audience, and a priority tier.

*When in doubt during any decision about Irregular Pearl, this document is the first place to look. If the answer isn't here, raise it — so the document can be updated before the decision compounds.*

*This is revision 2. Revision 1 is preserved in git history. Key changes: (a) Tier 1 narrowed to the surfaces that support a single named user's daily-use loop and produce the site's first signed content, with the personal library promoted from Tier 2 and broad browse/landing surfaces demoted to Tier 2; (b) the attribution model is made explicit — content carries a contributor's byline only after that contributor has approved the current text in-app, and the contributor controls edit and delete from within the app thereafter; (c) legacy community surfaces (events/venues scrapers, public /events and /venues pages, applause, activity log, discussions) were removed to align with the "not an events directory" and "not a social network" principles.*

# **Part one: principles**

## **What Irregular Pearl is**

Irregular Pearl is a reference for working classical musicians. It organizes knowledge around the *piece* as the atomic unit: every musical work gets a living page with structured metadata, signed performer's notes, edition comparisons, structural landmarks, technical flags, interpretive schools, and curated recording references. The site is editorial before it is technical — the engineering and design exist to present editorial judgment, not to generate it.

The audience is working musicians: performers deciding what to program and which edition to buy, teachers building curricula and guiding students through specific passages, students at conservatory and advanced amateur levels preparing real repertoire. The site is not for casual listeners, for concert-going audiences, or for the general classical-music-curious public. Those audiences are already well-served elsewhere.

**Revision 2 narrows the first-release audience to a single named user.** The first real user and first signed contributor is one working musician (internally referenced as H.) whose daily repertoire practice the product is explicitly built around. The public catalog with plural signed voices is what the site *becomes*; it is not how it starts. Every Tier 1 decision is evaluated against whether it opens or closes H.'s daily-use loop.

## **What Irregular Pearl is not**

-   Not a score host. IMSLP holds public-domain scores; publishers and nkoda hold in-copyright ones. We describe editions, we do not reproduce them.
-   Not a practice tool. forScore, Newzik, the Henle Library app, Modacity, and others handle practice workflow on tablets. We sit next to that work, we do not replace it.
-   Not a streaming service. Spotify, Apple Music, Idagio, Qobuz handle recording delivery. We describe and reference, we do not stream.
-   Not a social network. We have named signed contributors, not anonymous users commenting. We have a personal library, not a public feed.
-   Not a content farm. No listicles, no SEO-chasing, no AI-generated insights under fake bylines, no outrage-bait programming.
-   Not an events directory. Bachtrack and Operabase handle concert listings. We focus on the pieces themselves. *Earlier builds shipped per-venue event scrapers, an /events surface, and a /venues surface. These contradicted this principle and were removed (migration `20260419000000_drop_legacy_features.sql`).*

## **Vocabulary discipline**

The product preserves three distinct words used precisely:

-   **Piece** — a work. The abstract musical object. Bach Cello Suite No. 1 in G major, BWV 1007 is a piece. This is the atomic unit of the site.
-   **Edition** — a published interpretation of a piece. Bärenreiter 2012 Schwemer/Woodfull-Harris is an edition. Henle 2000 Voss is another edition. Editions are what editorial scholarship argues over.
-   **Score** — a specific copy of an edition, physical or digital. The site does not host scores; we describe editions and link to score sources.

The word repertoire is distinct from all three: it is a scoped collection of pieces (cello repertoire, my student's repertoire, this evening's recital). Every use of repertoire on the site has a qualifier. The URL scheme, the data model, the navigation, and the prose all observe these distinctions.

## **Plurality of voices**

The site's core editorial commitment is that disagreement between contributors is preserved on the page, not flattened into false consensus. When two respected musicians hold incompatible views on how a piece should be played, the site shows both, signed, with neither presented as canonical. Visitors leave knowing the shape of the disagreement, not a manufactured answer.

**The commitment is plurality; the v1 practice is a single voice.** Day one of the first release, there is one signed contributor (H.). Bylines become plural as additional contributors land through the submission pipeline. The pluralistic surface patterns (multi-column school grids, side-by-side performer's notes) exist in the data model and the component library from day one, so plurality arrives by adding signatures, not by rebuilding pages.

This has design consequences (the performer's note pattern supports multiple signed voices with distinct visual treatments), engineering consequences (the data model represents views as belonging to named contributors rather than to the site), and editorial consequences (the Editorial Director actively recruits contrasting voices rather than consistent ones, as the contributor base grows).

## **Signed human expertise**

Every editorial claim on the site carries a human name. Performer's notes are signed. Interpretive school descriptions are signed. Extended piece descriptions, when substantive, carry a contributor credit. Practice notes attached to landmarks are signed. Edition observations, when interpretive, are signed. Short reference copy, metadata, and structured fields can be unsigned — but interpretive or pedagogical judgment never is.

**Authors own their bylines.** Content is published under a contributor's byline only after that contributor has approved the current text in-app. The form that approval takes depends on who authored the text. When staff or an AI agent drafts *on behalf of* a contributor, the draft is not public and is not counted as that contributor's voice until that contributor records explicit approval in the approval queue. When the contributor authors or edits the text directly in-app, the act of authoring is itself the approval — the byline holder is the hands on the keyboard, and no secondary approval gate is required. After publication, the bylined contributor has full edit and delete control from within the app — no code changes, no email to the Editorial Director, no intermediary. Their byline, their button, their final word. This is the invariant that makes ghostwriting on behalf of contributors ethically honest: the byline only appears once the person it names has either written the text themselves or explicitly assented to someone else's draft, and they can remove it at any time.

AI agents assist the human leads in drafting, organizing, and maintaining consistency, but no AI-generated content is ever published under its own byline or without human signature. The Agent Role Profiles document specifies this in detail; the principle exists here because it is foundational.

## **Narrow scope, deep craft**

The product is deliberately narrower than most attempts in this space. The bet is that a small set of surfaces done excellently — piece pages, edition comparisons, the personal library, the submission pipeline — is worth more than a broad set of surfaces done adequately. Every proposed feature is measured against whether it deepens one of these surfaces or whether it adds a new one that will dilute attention.

*A piece page a working musician consults weekly, for years, is worth more than ten features used once and abandoned.*

## **Craftsmanship signals**

The audience will judge the site by small details within thirty seconds of arrival. The catalog counts match across pages. The dates and opus numbers are correct. The typography is calm. The prose sounds like a musician wrote it. The search is instant. The mobile page loads before the rest position changes. None of these individually matter more than any other. All of them signal whether the site is worth taking seriously. No decision, on any surface, may shortchange them.

# **Part two: data model**

The entities below are the atomic units of the product. Relationships between them are expressed precisely — they are not shortcuts to be refactored later. The schema below is definitional; implementation choices (table structures, join models, normalization tactics) are the Lead Engineer's call, but the entities and relationships are fixed.

## **Core entities**

**Piece**

*The atomic unit of the site. A musical work.*

**FIELDS**

• id (stable slug, e.g. bach-cello-suite-1)

• canonical title (in the work's conventional English form)

• native title (in the composer's language, when different)

• composer (reference to Composer entity)

• catalog number (BWV, Op., K., D., Hob., etc., with a typed prefix)

• year or period of composition (with hedge qualifier when contested)

• era (Baroque, Classical, Romantic, Late Romantic, Post-Romantic, Impressionist, 20th Century, Modern, Contemporary)

• form (Suite, Sonata, Concerto, Quartet, Symphony, Trio, etc.)

• instrumentation (one or more Instrument references, with a 'primary' flag for solo or concertante works)

• duration (typical performance duration in minutes, range when meaningful)

• movements (ordered list, each with title, key, meter, tempo marking, and approximate duration)

• short description (150 to 300 words, house style)

• difficulty tier (per-instrument, per-movement granularity supported)

• tags (free-form, editorially governed)

**RELATIONSHIPS**

• has many Editions

• has many Recordings

• has many Landmarks (grouped by movement)

• has many Flags (attached to Landmarks or to movements directly)

• has many InterpretiveSchools (signed by Contributors)

• has many PerformersNotes (signed by Contributors)

• related to other Pieces via PedagogicalArc (prepare-with, natural-next)

*A piece is immutable in identity — the slug, composer, and catalog number do not change. Everything else can evolve under editorial discipline.*

**Edition**

*A published interpretation of a piece.*

**FIELDS**

• id

• piece (reference)

• publisher (Henle, Bärenreiter, IMC, Universal, Peters, Schirmer, etc.)

• editor (named person or persons, when known)

• year of publication

• type (urtext, scholarly, performer, facsimile, critical, practical)

• editorial approach (short description — bowings minimal, bowings dense, fingerings mandatory, source commentary, etc.)

• languages (of introductory matter and critical notes)

• ISMN or similar identifier when available

• description (100 to 200 words, house style, editorially signed when substantive)

• sample references (measure-level annotations for edition-comparison surfaces, each signed)

**RELATIONSHIPS**

• belongs to one Piece

• referenced by EditionComparisons

*The site describes editions; it does not reproduce them. Sample references are editorial observations about how an edition handles a specific passage, not reproductions of engraved pages.*

**Recording**

*A referenced performance of a piece.*

**FIELDS**

• id

• piece (reference)

• performers (named, with instrument roles)

• year

• label (Deutsche Grammophon, Sony Classical, ECM, Naïve, etc.)

• medium (studio, live, broadcast)

• instrument type (modern, period, hybrid — relevant for HIP discussions)

• landmark tempi (movement-level or section-level, as relevant)

• external links (IMSLP archive, streaming services, video platforms)

• editorial notes (short, signed when interpretive)

**RELATIONSHIPS**

• belongs to one Piece

• may be associated with one or more InterpretiveSchools as representative

*The site does not host audio. Recordings are references to performances that exist elsewhere, with editorial observation about them.*

**Contributor**

*A named human who signs editorial work on the site.*

**FIELDS**

• id

• display name (the form used in bylines)

• biographical one-liner (instrument, ensemble, primary credential)

• longer biographical note (one paragraph, on their contributor page)

• areas of expertise (repertoire, era, instrument, interpretive tradition)

• agreement on file (reference to signed contributor agreement — which governs the draft-and-approve pattern, AI usage of transcripts and signed work, house-style grounding, and agent-memory treatment of their identity; see Contributor Agreement)

• payment configuration (per-piece fee, retainer, honorary, etc.; deferred operationally in v1)

• active status (active, paused, retired)

• can publish in own name (boolean; true once the agreement is on file and the contributor has activated their account)

• pending drafts count (computed; populates their in-app approval queue)

**RELATIONSHIPS**

• signs one or more PerformersNotes, InterpretiveSchools, practice notes, substantive Edition descriptions, Edition sample references, or Recording notes

• may appear on Contributor pages (Tier 2)

*The contributor record is one of the site's most sensitive data surfaces. See the Contributor Agreement for the privacy, IP, and revocation provisions that bind how this data is used.*

**Landmark**

*A named passage within a movement, usable for practice, teaching, or interpretive reference.*

**FIELDS**

• id

• piece (reference)

• movement (reference to movement within piece)

• measure range (start, end)

• label (house-style short phrase — 'opening bariolage,' 'pedal-point climax,' 'second-subject return')

• description (one sentence, optional)

• ordinal (for sequential display within movement)

**RELATIONSHIPS**

• belongs to one Piece (via movement)

• may have one or more Flags attached

• may have one or more signed PracticeNotes attached

**Flag**

*A tagged technical or musical challenge attached to a passage.*

**FIELDS**

• id

• landmark (reference — or, less commonly, movement)

• type (controlled vocabulary — 'stamina,' 'bow control,' 'stretch,' 'voicing,' 'double stops,' 'sustained bowing,' 'articulation,' 'rhythmic lift,' 'intonation,' 'ensemble coordination,' etc.)

• severity (informational, notable, significant)

• instrument specificity (flag that applies only to certain instruments in a chamber work)

**RELATIONSHIPS**

• attached to a Landmark or to a movement directly

*The flag vocabulary is governed by the Editorial Director and the rubric guide. Adding a new type is an editorial decision, not a user action.*

**InterpretiveSchool**

*A named approach to interpreting a piece, signed by a named contributor.*

**FIELDS**

• id

• piece (reference)

• name ('Historically informed,' 'Clarinet-aspirational,' 'String-native,' 'Chamber-symphonic,' etc.)

• description (one paragraph, signed)

• representative recording (reference to Recording, when applicable)

• typical tempo cues (opening, slow movement, finale — as relevant)

• signed by (reference to Contributor)

• status (draft / awaiting-contributor-approval / published / removed)

• drafted by (reference to the staff member or AI role that produced the draft, distinct from the contributor whose byline it will carry)

• approved by contributor at (timestamp; null until explicit approval is recorded)

• version history (ordered list of published revisions, retained server-side)

**RELATIONSHIPS**

• belongs to one Piece

• signed by one Contributor

• may reference one or more Recordings

*Schools are plural by design. A piece may have two, three, or more schools on its page, and the framing must not imply consensus or ranking among them.*

**PerformersNote**

*A signed prose reflection on the piece as a whole.*

**FIELDS**

• id

• piece (reference)

• body (prose in house style, signed)

• signed by (reference to Contributor)

• date published

• status (draft / awaiting-contributor-approval / published / removed)

• drafted by (reference to the staff member or AI role that produced the draft, when applicable)

• approved by contributor at (timestamp; null until explicit approval)

• version history (ordered list of published revisions, retained server-side)

**RELATIONSHIPS**

• belongs to one Piece

• signed by one Contributor

*Unlike schools, which are tagged positions, performer's notes are open-ended reflections. A piece may carry multiple performer's notes from different contributors, presented as side-by-side perspectives rather than competing schools.*

**PracticeNote**

*A signed note attached to a Landmark, offering practice or interpretive guidance for that specific passage.*

**FIELDS**

• id

• landmark (reference)

• body (short prose, signed)

• signed by (reference to Contributor)

• status (draft / awaiting-contributor-approval / published / removed)

• drafted by (reference to the staff member or AI role that produced the draft, when applicable)

• approved by contributor at (timestamp; null until explicit approval)

• version history

**RELATIONSHIPS**

• belongs to one Landmark

• signed by one Contributor

**UserLibrary**

*A musician's personal layer over the catalog.*

**FIELDS**

• user id

• performed pieces (with dates, ensembles, brief optional notes)

• editions owned (references to Edition entities)

• programs (named collections of pieces with order and notes)

• students (for teaching users — named, with each student's current and assigned pieces; Tier 2)

• reflections (text-only, attached to specific pieces, private by default)

• visibility settings per reflection (private, shared with specific person, published under user's signature)

**RELATIONSHIPS**

• belongs to one User

• references many Pieces, Editions, and Contributors

*The library is the site's personal-memory layer and the long-run contributor pipeline. A private reflection today is a signed public note tomorrow, if and when the user chooses to publish. This data is treated with the same sensitivity as contributor identity.*

**Notification**

*An in-product message alerting a user that something requires their attention.*

**FIELDS**

• id

• recipient (reference to the user the notification is addressed to)

• type (enumerated: draft-awaiting-approval is the first type; the list extends only by editorial decision)

• subject (reference to the entity the notification is about — a draft PerformersNote, InterpretiveSchool, PracticeNote, edition observation, or substantive description)

• body (short system-generated line; e.g. "A draft performer's note on the Dvořák Cello Concerto is ready for your review")

• created at (timestamp)

• cleared at (timestamp; null until the recipient explicitly clears it — navigating to the subject does not auto-clear)

• last digest sent at (timestamp; null until included in an email digest, updated thereafter so the same unchanged notification is not re-mailed)

**RELATIONSHIPS**

• belongs to one User (the recipient)

• references one subject entity, polymorphic by type

*Notifications are the one in-product nag surface. The type list stays deliberately short — a notification firehose is as bad as none at all.*

## **Invariants the data model must preserve**

-   Every PerformersNote, InterpretiveSchool, PracticeNote, and substantive description has a Contributor signature. No anonymous interpretive or pedagogical content is publishable.
-   **No content publishes under a Contributor's byline without that Contributor's explicit in-app approval of the current text. When the text is drafted on the Contributor's behalf by staff or an AI agent, approval is a distinct action taken from the approval queue and stored with a timestamp. When the text is authored or edited directly in-app by the bylined Contributor themselves, the act of authoring is the approval and is stored with the same timestamp semantics. Edits and deletions after publication are performed by the bylined Contributor from within the app. Staff do not edit or remove a Contributor's published content without a written request from that Contributor recorded in the system.**
-   An Edition is never a Piece. A Recording is never a Piece. A Score is never represented in the data model at all.
-   A Flag type cannot be introduced without an editorial decision. The controlled vocabulary is owned by the Editorial Director.
-   AI usage of a Contributor's transcripts, signed work, and identity is governed by the Contributor Agreement accepted at onboarding, not by per-contributor runtime toggles. There is no in-product AI consent surface; what agents may and may not do is set uniformly by the Agreement. Revocation happens by amending the Agreement (or withdrawing from the site), not by flipping a setting.
-   User library reflections are private by default. Publication requires an explicit user action, per reflection, with a visible signed byline, routed through the contributor approval pipeline.
-   Revisions to PerformersNotes, InterpretiveSchools, and PracticeNotes are versioned. A contributor may request the current version be replaced or withdrawn; prior versions are retained for audit but removed from public view on request.
-   A Notification is only generated when the recipient has a direct action to take (approve a draft, respond to an edit request). Notifications are not used for activity feeds, social signals, marketing, or system announcements. The type list is controlled by the Editorial Director.
-   **Piece identity originates from the canonical index, not from human entry.** A `Piece` row is only ever created by a materialize action triggered when a logged-in user selects an entry from the `CanonicalPieceIndex`. The index itself is populated exclusively by an automated backend process (initial multi-source import + ongoing worker consuming the unmatched-query signal); no human-facing form or admin UI writes to the index. This removes the human-typed-title failure mode entirely: the humans typing names in the product (typeahead, search) are always selecting from a curated corpus, never authoring new piece metadata. The worker's scope is deliberately small — canonical title, native title, composer, catalog number, era, instrumentation, and movements when confidence is high; nothing editorial. Source set is restricted to providers that publish for programmatic consumption (MusicBrainz API, Wikidata SPARQL, IMSLP XML dumps, Wikipedia REST, VIAF). Bot-blocked sites and paywalled catalogs are excluded by design. An index entry is written when two independent sources agree on the core facts, or when a single authoritative source has high confidence; ambiguous entries are skipped and surfaced for human review.

# **Part three: surfaces**

The surfaces below are the user-facing views of the product. Each surface has a job-to-be-done, a primary audience, and a priority tier. Tier 1 surfaces ship in the first public release. Tier 2 surfaces ship in the first nine months. Tier 3 surfaces are planned but not committed.

**Revision 2 narrows Tier 1 to seven surfaces that together support the first real user's daily-use loop and produce the first signed content on the site. Surfaces previously in Tier 1 that do not serve this loop are moved to Tier 2. (The piece page is one responsive surface across desktop and mobile; earlier drafts counted it as two. Notifications was added as a Tier 1 surface alongside the contributor approval pipeline, since the pipeline is meaningless if contributors aren't told they have drafts to review.)**

## **Tier 1 — first release**

### **Piece page**

Job: the definitive reference for the piece, from the desk and from the music stand. Audience: the first real user, then performers deciding and preparing, teachers planning, students studying, and the same musician returning on a phone between takes. Primary surface: a single responsive page, anchored by sections. Header with title, composer, catalog, era pills. Four-axis difficulty panel. One or more signed performer's notes with distinct visual treatment per contributor (single voice in v1, plural as contributors land). Structural landmarks with per-movement flags and signed practice notes. Interpretive schools as a multi-column grid of signed positions on wide viewports, collapsing to stacked cards on narrow ones. Editions section with a prominent passage-comparison surface. Recordings section organized around landmark tempi. Pedagogical arc section linking prepare-with and natural-next pieces.

The page is one product across viewports, not two. Content, ordering, and hierarchy are shared; narrow viewports reflow multi-column sections into stacks and compress chrome, but do not re-rank sections or hide information. Cold-start to structural landmarks under one second on a three-year-old phone on cellular is a Tier 1 performance target for the shared page, not a separate mobile build.

### **Structural landmarks**

Job: give the working musician a passage-by-passage technical and interpretive map of the piece, oriented toward practice. Audience: performers preparing, teachers teaching a specific passage. Primary surface: movement-grouped cards with measure ranges, house-style short labels, controlled-vocabulary flag pills (C-string warmth, stamina, voicing, double stops, sustained bowing, rhythmic lift, articulation, bow distribution, etc.), and signed inline practice notes. The landmarks surface is the densest information surface on the piece page and the place where the site's expertise is most visibly load-bearing.

### **Edition comparison at measure level**

Job: let a musician make an informed edition choice for a piece they are preparing. Audience: performers and teachers. Primary surface: a passage-level comparison (initially two or three iconic passages per piece, not ten), each column showing one edition's editorial reading of the same passage with signed editorial observations noted. Signed observations are the core of the value. An 'at a glance' band at the bottom characterizes each edition's overall editorial stance in one sentence. Contributor-proposed passage additions are Tier 2.

### **Personal library**

Job: give the first real user, and the musicians like her who follow, a lightweight personal layer over the catalog that replaces their paper notebook, their iPad margins, their Google Sheet of upcoming performances, and their scattered browser tabs. Audience: registered users. Primary surface: a dashboard showing pieces currently preparing (pinned), pieces assigned by a teacher, upcoming performances with dates (manual entry or calendar paste), pieces performed (retroactive, optional, easy to fill in later), and a chronological feed of the user's private reflections. Each reflection is attached to a specific piece, privacy-defaulted, with optional measure-range anchoring and free-form prose. The UI must make jotting a reflection take under thirty seconds from the relevant piece page. Each reflection has a publish pipeline: the user can convert it to a draft-for-publication, which enters the contributor approval flow under their own byline (if they are a Contributor) or under a contributor-to-be onboarding (if not). Visibility settings per reflection are private, shared with a specific person, or published.

### **Contributor submission and approval pipeline**

Job: the surface by which drafts become published content under a contributor's byline, and the surface by which new contributors onboard. Audience: contributors (first, the one real contributor; later, every signed voice). Primary surface: an in-app approval queue showing drafts attributed to the logged-in contributor, each with current text, diff from any prior version, and action buttons (approve, edit-and-approve, reject). For staff producing drafts on a contributor's behalf, the draft status is visible in a staff dashboard (not in Tier 1 UI, but in the data model and an admin view). Every signed surface on the site routes through this flow: performer's notes, interpretive schools, practice notes, substantive piece descriptions, edition observations. Published content is editable and deletable by the bylined contributor at any time from within the app; deletion removes from public view in the next request.

### **Notifications**

Job: surface the things a logged-in user must act on, so drafts never stall waiting on a contributor who doesn't know they are waiting. Audience: logged-in users; in v1 effectively the one signed contributor. Primary surface: a bell icon in the navbar next to the profile control, badged with the exact count of un-cleared notifications when there are between one and nine, and with "9+" when there are ten or more (no badge when the count is zero); clicking opens a popover listing each notification with its subject line and a link to the relevant review surface. Clearing is an explicit user action from the popover or the review surface — navigating away does not auto-clear. A scheduled daily job emails the recipient a digest of their un-cleared notifications with a direct link back to the in-app popover; the same unchanged notification is not re-sent in subsequent digests. The bell is the only in-product nag surface — no toasts, modals, or interstitials.

### **Search**

Job: the universal entry point. Targets under 100ms p50 from keystroke to structured results, including network. Returns grouped results: Pieces, Composers, Contributors, Browse targets. Typo-tolerant. Works over native titles as well as English forms. Works over opus and catalog numbers.

## **Tier 2 — first nine months**

### **Landing page**

Previously Tier 1. Demoted because week-one the landing page need be nothing more than a search input, a heading, and a link to a handful of populated pieces. The task-framed entry cards, chip rows for instrument and composer browsing with piece counts, the In Focus signed piece, and the contributor-count stat line are Tier 2 polish that arrives once there is a catalog and a contributor base worth showcasing.

### **Repertoire browse**

Previously Tier 1. Demoted because week-one browse is a flat alphabetical list of pieces in the catalog with title, composer, and instrumentation. Faceted filtering (instrument, era, form, difficulty), multi-facet combinations including mixed chamber instrumentation, and sort controls beyond alphabetical are Tier 2.

### **Contributor page**

Previously Tier 1. Demoted because until the second contributor exists, there is nothing meaningful to show beyond the one-line bio already visible on each signed piece of content. Contributor pages become meaningful when they can show a named body of work across multiple pieces.

### **Teacher's studio view**

Job: give teachers a single dashboard of their studio's current and planned repertoire. Audience: teachers. Primary surface: a list of students, each with their current pieces and next assigned pieces. Click a student to see their full arc. Click a piece to see the teacher's private notes for that student on that piece. Mobile parity is essential — this is a during-the-lesson tool.

### **Recital planner**

Job: support the assembly of a program from the catalog. Audience: performers. Primary surface: a drag-and-arrange list of pieces with running duration, intermission placement, key and mood indicators, and optional pairing suggestions (pieces frequently programmed together, contrasting or complementary keys, era transitions).

### **Edition comparison — extended passages**

The Tier 1 comparison covers a handful of iconic passages per piece. Tier 2 extends to more passages and supports contributor-proposed passage additions through the submission pipeline.

## **Tier 3 — planned, not committed**

-   Audition repertoire tagging (this piece is on the MET cello audition list, this is required for the Tchaikovsky Competition Round 1).
-   Chamber part difficulty breakdown (the cello part of the Dvořák Piano Quintet rated separately from the piano part).
-   Curated listening paths across pieces ('if you love the Brahms Piano Quintet, listen next to…').
-   Contributor video, where a contributor records a short spoken reflection on a piece. Not a general video platform — a sparing, editorially controlled surface.

## **What we will not build, in any tier**

-   A public discussion feed, forum, or comment section. Discussion on the site exists only in the form of signed contributor voices.
-   A practice timer, metronome, section-looping tool, or any software running during practice.
-   A score annotation layer, in browser or app.
-   A composer biography section expanded beyond what is performance-relevant. Wikipedia wins.
-   A general concert events directory. Bachtrack wins.
-   A music-theoretic analysis tool.
-   A user-facing "add a piece to the catalog" form. Human entry of piece identity is the failure mode the canonical-index invariant exists to prevent. Users searching for a piece that isn't in the catalog leave a silent signal via unmatched-query logging; the automated worker consumes that signal to prioritize index growth.

# **Appendix: using this document**

When a feature is proposed, reference this document. If the feature deepens a Tier 1 or Tier 2 surface, proceed. If it requires a new data entity, update the data model section first. If it violates a principle, don't build it — or raise the principle for re-examination explicitly. If it's a Tier 3 item that suddenly feels urgent, ask why.

This document is revised quarterly by the four leads together. Substantive changes (new entities, new principles, new surface tiers) require agreement of all four. Minor clarifications may be proposed by any lead and accepted asynchronously.

*The document is a contract between the four leads, not a wish list. When it says a thing is not in scope, that is a decision, not a suggestion.*

*Irregular Pearl · a non-profit for classical music knowledge*
