# Irregular Pearl

A non-profit, community-driven classical music knowledge hub.

## Product Requirements
Always read PRD.md before making product, scope, or data-model decisions.
Principles, invariants, entities, and surface tiers are defined there.
Do not introduce features, entities, or surfaces that contradict PRD.md without explicit user approval.
In QA and review modes, flag any code that contradicts PRD.md invariants.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Visual reference
Always consult color-palette.htm before creating new components or making visual
changes. It renders both themes side-by-side with tagged component samples
(T typography, B buttons, C chips, D drafting banner, A alerts, R request dialog,
P pending-draft proposal, F draft form, W wiki-edit dialog, I inline confirm,
X toast, H admin header, E signed-content edit form). Reuse documented token
combinations rather than introducing ad-hoc hex. Add a new sample when shipping
a pattern the palette doesn't already cover.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- For design work on specific components or surfaces, invoke the designer subagent via @agent-designer
