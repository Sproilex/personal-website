# Case Study Writing Rules

Reference for writing and structuring project pages consistently across the portfolio.

---

## Frontmatter

| Field | Rule |
|---|---|
| `stack` | Short architecture summary, not individual tools. Use `·` or `-` as separator. Example: `"MERN - DDD - AWS - CI/CD"` |
| `technologies` | Full individual list. Populates the "Full Stack" popup, not the visible label. |
| `tags` | High-level descriptors first (`MERN Stack`, `Domain-Driven Design`), then specifics. |
| `year` | End year of the project, not start year. |
| `team` | Format: `"4 engineers · 1 designer"` |
| `category` | Capitalized. `Platform`, not `Plataform`. |
| `start_date` / `end_date` | Format: `MM/YYYY` |
| `mockupFile` | Filename only. File must live in `public/mockups/`. |

### Example

```yaml
---
title: Project Name
description: One sentence. What it is and who it's for.
role: Lead Software Engineer & Technical Lead
type: Full Time
company: Company Name
category: Platform
year: "2026"
start_date: 11/2025
end_date: 07/2026
team: "4 engineers · 1 designer"
stack: "MERN - DDD - AWS - CI/CD"
technologies:
  - TypeScript
  - Node.js
  - React
  - ...
tags:
  - MERN Stack
  - Domain-Driven Design
  - AI Integrations
  - ...
problem: "One sentence. The core pain before this existed."
outcome: "One sentence. What was built."
impact: "One sentence with a real number."
mockupFile: "Project Mockup.pdf"
---
```

---

## Tone and writing

- Write for two audiences at once: a non-technical reader should follow the story, a recruiter or engineer should see the depth.
- Direct and specific. Name the real tools, real numbers, real constraints. Vague language adds nothing.
- Active voice. "I built", "I led", "we shipped", not "was built", "was integrated".
- Short sentences. Use a period where you would be tempted to use a semicolon or comma chain.
- **No em dashes (`—`) anywhere.** Replace with a period, a comma, or a colon.

### Never write like this

- Em dashes: `"The goal wasn't just X — it was Y"`
- AI filler: "Additionally", "Furthermore", "It's worth noting", "At its core"
- Vague impact: "significantly improved performance", "streamlined the process"
- Over-explaining: "React, which is a JavaScript library for building UIs"
- First person drama: "This was perhaps the most challenging aspect..."

---

## Content structure

Two main sections: **The brief** and **Building it**. Add a third only if there is genuinely a third distinct story to tell.

### The brief
Two paragraphs max. Covers:
- What the company was doing before and what was broken
- Your full scope of ownership
- The real goal, not just "build a feature"

### Building it
Two to three paragraphs. Covers:
- The architecture and its main pieces
- Key integrations, named specifically
- The hard part and how you solved it
- The outcome with a real number

**The hard part is mandatory.** Every project has one thing that was harder than expected. Name it specifically.

**End with a number.** Reduced X by Y%, replaced N tools, shipped in Z months. If no number exists, state the concrete outcome.

---

## Layout and images

- Each section is a two-column grid: text on one side, image on the other. Alternate sides between sections.
- First section: text left, image right. Add `sm:mt-12` on the image column to drop it visually.
- Second section: image left with `order-2 sm:order-1`, text right with `order-1 sm:order-2`.
- Images go in `public/images/`. Name them descriptively: `projectname-1.png`.
- Use `class="w-full rounded-lg border border-border !my-0"` on every `<img>`. The `!my-0` overrides the prose default margin.
- Alt text must describe what is literally visible in the image, not what the feature does in general.
- Caption: one sentence, specific to what is shown. Not a marketing line.

### Image block pattern

```html
<div class="flex flex-col gap-3 sm:mt-12">
  <img
    src="/images/projectname-1.png"
    alt="Describe exactly what is visible in the screenshot"
    class="w-full rounded-lg border border-border !my-0"
  />
  <p class="text-xs text-text-muted !mb-0">
    Specific caption about what is shown.
  </p>
</div>
```

---

## Modals

- All modals use `BaseModal.astro`. Never write inline dialog markup directly in a page.
- PDF files use `PdfModal.astro`, which wraps BaseModal with an iframe and download/share footer.
- Tech stack popup uses `StackModal.astro`, which wraps BaseModal with technology pills.
- Trigger buttons use data attributes, not `id`. Example: `data-mockup-trigger` matches `triggerAttribute="mockup-trigger"`.
- PDF files go in `public/mockups/`. Reference by filename only in the `mockupFile` frontmatter field.
