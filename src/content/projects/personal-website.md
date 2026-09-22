---
title: Personal Website
description: A space-themed portfolio where every project lives as a star you can navigate to, built solo with Astro, tsParticles, and Vercel.
role: Solo Developer & Designer
type: Side Project
company: Personal Project
category: Portfolio
technologies:
- Astro
- React
- TypeScript
- Tailwind CSS
- tsParticles
- Resend
- Vercel
- Astro Content Collections
- astro-icon
tags:
- Static Site Generation
- Canvas Animation
- View Transitions
- Serverless Functions
- Email Automation
stack: "Astro - React - Tailwind - Vercel"
year: "2026"
image: "Personal Website - Hero.jpg"
slug: "personal-website"
featuredProject: true
styledTitle: "Personal <br /> <span class='text-text-highlight'>Website</span>"
team: "Myself"
problem: "A portfolio needed to prove engineering craft on its own, not just list projects inside a generic template."
outcome: "A space-themed site where projects live as stars in an interactive galaxy, designed and built solo end to end."
impact: "Renders up to 800 animated particles at a steady 60fps while staying fully static and serverless."
liveUrl: "https://stivenilarraza.com"
---

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The idea</h2>
<p>Most portfolios are a grid of cards with a filter on top. I wanted something that felt like the projects were part of a world, not a list, so the whole site is framed as a galaxy. A full-screen canvas of animated stars sits behind every page, and each featured project is rendered as a literal star you can hover and click. Home is the canvas's center; every other page pans the camera away from it, so moving through the site feels like drifting through space instead of loading a new URL.</p>
<p>The star field runs on tsParticles: a base layer of up to 800 twinkling, sparkle-shaped stars plus a slower ambient dust layer, both capped at 60fps and scaled down on mobile so the canvas stays light on low-power devices. A comet manager spawns drifting comets on an interval, and a project manager reads the featured projects from a JSON payload injected at build time, places each one as a fixed star inside a defined screen zone, and wires up hover and click detection through a custom tsParticles interactivity plugin so a star lights up and gently repels nearby particles when you point at it.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/personal-website/personal-website-1.png" alt="Home page showing the interactive star field canvas with project stars scattered across it" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The home page: each featured project is a star positioned on a tsParticles canvas, with ambient dust and drifting comets in the background.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<img src="/images/projects/personal-website/personal-website-2.png" alt="Contact page showing the message form with name, email, and message fields" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The contact page: a JSON-based form backed by a Vercel serverless function and Resend, with a hidden honeypot field filtering bot submissions.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Getting in touch</h2>
<p>The contact form posts JSON to a single Vercel serverless function instead of a third-party form service. The endpoint is marked non-prerendered so Astro's Vercel adapter deploys it as an on-demand function. It validates the payload, then hands the message to Resend to deliver the email from a verified domain address with the visitor's own address set as the reply-to, so answering goes straight back to them with no extra lookup.</p>
<p>Spam is filtered with a honeypot instead of a CAPTCHA. A hidden field sits in the form, invisible and unreachable by tab order for a real visitor, but bots that fill in every field trip it. When it comes back filled, the endpoint quietly returns success without sending an email, so bots never get a signal that they were caught.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div>
<h2>Building it</h2>
<p>The site runs on Astro with the Vercel adapter, static where it can be and server-rendered only where it needs to be, like the contact endpoint. Navigation uses Astro's view transitions router, but instead of one generic animation, every route has its own named enter and exit pair: home slides in from the top left, projects from the bottom right, about from the bottom left, contact from the top right, and project detail pages slide up from below.</p>
<p>The star canvas has to move in sync with those transitions, so a panning script keeps a direction map per route and animates the canvas with its own requestAnimationFrame loop and eased interpolation on every navigation, so the star field glides in the opposite direction the page content slides toward, reinforcing the feeling of moving through the galaxy instead of watching a page reload. On the build side, tsParticles is split into its own chunk and small assets are inlined, keeping the initial JS payload light despite running a full particle engine underneath.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/personal-website/personal-website-3.png" alt="Project detail page mid-transition, sliding up over the star field" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">Route-specific enter and exit animations, kept in sync with the star canvas pan on every navigation.</p>
</div>
</div>
