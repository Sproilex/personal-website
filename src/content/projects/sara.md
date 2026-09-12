---
title: S.A.R.A.
description: B2B platform for the remodeling and real estate industry.
role: Lead Software Engineer & Technical Lead
type: Full Time
company: Confidential B2B
category: Platform
technologies:
- TypeScript
- Node.js
- React
- MySQL
- Redis
- n8n
- AWS
- PHP
- Tailwind CSS
- REST API
- MongoDB
- Cloudflare
- R2/S3
- Express
- PostgreSQL
- Codeigniter 4
- CI/CD
tags:
- MERN Stack
- Domain-Driven Design
- CRM
- AI Integrations
- AI Automations
- Third Party Integrations
- Server Management
- Data Orchestration
- Team Leadership
year: "2026"
start_date: 11/2025
end_date: 07/2026
image: "SARA - Hero.jpg"
slug: "sara"
featuredProject: true
styledTitle: "S<span class='text-text-highlight'>.</span>A<span class='text-text-highlight'>.</span>R<span class='text-text-highlight'>.</span>A<span class='text-text-highlight'>.</span>"
team: "3 engineers"
problem: "Fragmented operational workflows required repetitive manual work across disconnected tools."
outcome: "A centralized platform for automating operational workflows across the business."
impact: "Reduced manual human intervention by 40% to 60% across key processes."
stack: "MERN - DDD - AWS - CI/CD"
mockupFile: "SARA - Project Mockup.pdf"
---

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The brief</h2>
<p>The company was running its entire remodeling and real estate operation across a mix of spreadsheets, email threads, and disconnected tools. Sales, financing, document signing, supplier management, and customer communications each lived in a separate place. No single view of what was happening, no automation, just people doing the same manual steps over and over.</p>
<p>I joined as lead engineer to own the technical side completely: architecture, product development, integrations, delivery, and production support. The goal wasn't just to replace the spreadsheets with a fancier interface. It was to redesign how the business actually operates, so it could grow without adding headcount to manage the chaos.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/sara/sara-2.png" alt="SARA sales dashboard showing total revenue, projects sold, and a monthly breakdown chart" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">Sales dashboard: real-time overview of revenue, project pipeline, and financial flow across the business.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<img src="/images/projects/sara/sara-1.png" alt="SARA automation workspace with scheduled task cards and the task editor showing prompt, tags, and trigger configuration" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">Automation workspace: building and scheduling AI-powered tasks with custom prompts, module tags, and trigger rules.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Building it</h2>
<p>The platform is a distributed system with four main pieces working together: a central Node.js and TypeScript API handling all the business logic, a React web application where the team manages day-to-day operations, an n8n automation layer running workflows in the background, and a set of APIs supporting AI agents and smart automation.</p>
<p>I led integrations with QuickBooks, JustCall, Google Drive, DocuSign, ElevenLabs, and 15+ financing lenders, covering authentication, data sync, webhooks, and cross-service workflows. On top of that I built automation workflows for financing applications, document generation, CRM events, AI-powered customer communications, and data extraction. The initial monolithic application was progressively evolved into this architecture as the product and its requirements grew.</p>
<p>The hardest part wasn't any single integration. It was keeping the business running while we rebuilt it underneath. Every module went live incrementally, replacing one manual process at a time, without taking anything offline. By the end, manual intervention across the financing and document pipeline dropped by 40 to 60 percent.</p>
</div>
</div>
