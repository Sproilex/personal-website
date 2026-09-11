---
title: MakeIt Tool
description: Realtime SEO intelligence platform dashboard.
role: Lead Software Engineer & Technical Lead
type: Full Time
company: Confidential B2B
category: Plataform
technologies:
- Typescript
- React
- REST API
- MySQL
- MongoDB
- n8n
- Cloudflare
- AWS
- Node.js
- HTML
- CSS
- Javascript
- R2/S3
- PHP
- Codeigniter 4
- Next.js
tags:
- CRM
- AI Integrations
- AI Automations
- Third Party Integrations
- Server Management
- Data Orchestration
- Team Organization
year: "2025"
start_date: 11/2025
end_date: 07/2026
image: "MakeIt - Hero.jpg"
slug: "makeit"
featuredProject: true
styledTitle: "Make It <br> <span class='text-text-highlight'>Tool</span>"
team: "3 engineers · 1 designer"
problem: "Teams relied on scattered tools to track data, which made analysis slow and inconsistent."
outcome: "A unified SEO intelligence platform that consolidates data into a single real-time dashboard."
impact: "5+ tools consolidated into 1 platform, cutting time spent on reporting by 70%."
---
<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The brief</h2>
<p>Every team touching SEO had its own tool: one for backlinks, one for keywords, one for site audits, and a spreadsheet to glue the exports together. Nobody trusted the numbers because nobody could tell which export they came from. The ask was deceptively simple — one place, one source of truth, updated in real time.</p>
<p>We started with the data model rather than the dashboard. Domains, keywords, backlinks and audits were normalised into a single schema with a shared refresh contract, so every widget on screen could state exactly how fresh its numbers were. That decision cost two extra weeks up front and saved the project later: adding the competitors module afterwards took days, not a rewrite.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<div class="border border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center gap-3"></div>
<p class="text-xs text-text-muted !mb-0">Domain overview — the first screen after login.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<div class="border border-dashed border-border rounded-lg aspect-video flex flex-col items-center justify-center gap-3"></div>
<p class="text-xs text-text-muted !mb-0">Widgets share one refresh contract, so every number is dated.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Building it</h2>
<p>On the front end the hard part was volume: hundreds of thousands of keyword rows that still had to feel instant. Virtualised tables, server-side aggregation and a strict widget contract kept the interface honest — each widget asks for exactly the shape it renders, nothing more, and degrades to a skeleton instead of a spinner when a provider is slow.</p>
<p>Six months after launch the platform replaced five separate subscriptions and cut reporting time by about 70%. The part I'm most proud of isn't a feature: it's that the team now argues about strategy in the dashboard instead of arguing about whose spreadsheet is right.</p>
</div>
</div>