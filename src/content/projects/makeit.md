---
title: MakeIt Tool
description: SEO analytics platform that aggregates domain and keyword intelligence into a single real-time dashboard.
role: Lead Software Engineer & Technical Lead
type: Full Time
company: Confidential B2B
category: Platform
technologies:
- React 18
- Vite
- Node.js 20
- Fastify
- MongoDB
- Redis
- Socket.io
- Docker
- Nginx
- ECharts
- Recharts
- Mantine
- JWT
- GitHub Actions
- DigitalOcean
- DataForSEO API
tags:
- Microservices
- SEO Analytics
- Real-time Data
- Data Visualization
- Docker
- CI/CD
- Event-Driven Architecture
stack: "Microservices - React - Fastify - MongoDB - Redis"
year: "2022"
start_date: 2022
end_date: 2023
image: "MakeIt - Hero.jpg"
slug: "makeit"
featuredProject: true
styledTitle: "Make It <br> <span class='text-text-highlight'>Tool</span>"
team: "1 Engineer"
problem: "Teams relied on scattered tools to track SEO data, making analysis slow and the numbers impossible to trust."
outcome: "A unified SEO intelligence platform aggregating domain, keyword, backlink, and competitor data into one real-time dashboard."
impact: "5+ tools replaced by one platform, cutting time spent on reporting by 70%."
mockupFile: "MakeIt - Project Mockup.pdf"
---

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The brief</h2>
<p>Every team touching SEO had its own tool. Backlinks in one place, keywords in another, competitor data somewhere else, and a spreadsheet holding it all together. Nobody trusted the numbers because you could never tell which export came from which tool, or how stale it was. The ask was straightforward: one dashboard, one source of truth, with every number dated.</p>
<p>I led the full technical side: architecture, service design, frontend, deployment, and production support. The goal wasn't to wrap existing tools in a nicer interface. It was to build a system where the data pipeline and the presentation layer were designed together from the start.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/makeit/makeit-1.png" alt="MakeIt Tool backlinks page showing backlinks tendency chart, authority score, referring domains count, follow vs no follow breakdown, TLD distribution, and backlinks by country" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">Backlinks analysis: historical tendency, authority score, referring domains, and distribution by follow type, TLD, and country.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<img src="/images/projects/makeit/makeit-2.png" alt="MakeIt Tool domain keywords page showing monthly traffic chart, top categories bubble visualization, clicks by gender and age, and keywords table with search volume, CPC, rank, and difficulty columns" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">Domain keywords view: top content categories by traffic, audience demographics, and a full keyword table with search volume, CPC, rank, and difficulty.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Building it</h2>
<p>The platform is a microservices system orchestrated with Docker Compose. A single API Gateway handles all client traffic, validates JWT auth, and fans requests out to three downstream services: Auth, Profiles, and DataBuilder. Services never call each other directly. Inter-service communication runs through an internal Socket.io event bus, so each service stays isolated and events like USER_CREATED or USER_LOGGEDIN are subscribed to independently.</p>
<p>The DataBuilder service is the core of the product. It connects to the DataForSEO API and exposes a widget system where each widget is a self-contained class that knows which data calls to make and how to shape the result for the frontend. Bulk fetching lets the frontend load a full dashboard view in a single request. Every request is instrumented with high-resolution timings persisted to MongoDB, which made tuning the Redis caching strategy concrete rather than guesswork.</p>
<p>The hard part was volume on the frontend. Keyword tables with hundreds of thousands of rows that still had to feel instant. Server-side aggregation, Redis caching per widget, and a strict widget contract kept it manageable: each widget asks for exactly the shape it needs, degrades to a skeleton when a source is slow, and always shows when its data was last fetched. Six months in, the platform had replaced five separate subscriptions and cut reporting time by about 70%.</p>
</div>
</div>
