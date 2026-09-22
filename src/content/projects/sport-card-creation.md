---
title: Sport Card Creation
description: A WooCommerce plugin to prepare a personalized trading card shop.
role: Freelancer Senior WordPress Developer
type: Freelance
company: "Freelance"
category: Wordpress Plugin
technologies:
- PHP
- WordPress
- WooCommerce
- JavaScript
- Webpack
- MySQL
- html2canvas
- WP-Cron
- CSS
tags:
- WooCommerce
- WordPress Plugin
- E-commerce
- Image Processing
- Dynamic Pricing
stack: "PHP - WordPress - WooCommerce - Webpack"
year: "2025"
image: "Sport Card Creation - Hero.jpg"
slug: "sport-card-creation"
featuredProject: true
styledTitle: "Sport Card <br /> <span class='text-text-highlight'>Creation</span>"
team: "Myself"
problem: "Store owners had no way to sell personalized trading cards."
outcome: "A self-contained WooCommerce plugin with a full template builder, dynamic pricing, and structured order delivery for production."
impact: "Eliminated manual design handling for store owners, increasing sales."
---

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The brief</h2>
<p>The customer needed a custom functionality for WooCommerce stores to sell personalized sports trading cards without bolting on a third-party design tool. Store owners wanted customers to upload a photo, type in a name and number, and get a produced card, with every detail landing in the order ready to send to print. Before this plugin, that meant manual back-and-forth over email for every single order.</p>
<p>I built Sport Trading Cards as a freelance WooCommerce plugin, owning it end to end: the admin template builder, both customer-facing design modes, the pricing engine, and the order flow that packages a customer's design for production. No hosted service, no external design API. Everything runs inside the store's own WordPress and WooCommerce installation.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/sport-card-creation/sport-card-creation-1.png" alt="Advanced Designer showing the step list for name, team name, text line, logo, image, and number, a live front card preview, and a real-time price breakdown" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The Advanced Designer: each step in the left panel drives the live card preview and price breakdown on the right.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<img src="/images/projects/sport-card-creation/sport-card-creation-2.png" alt="Template builder admin editor showing a wrestling trading card design with a layers panel for background image, user image mask, background user image, and frame, plus a texture patch properties panel" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The template builder: store owners design front and back layouts layer by layer, from background art to the user's photo mask.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Building it</h2>
<p>The plugin ships two customization modes that feed the same WooCommerce cart: Quick Design, a mobile-friendly form with photo upload, name, and team fields plus an optional background-removal prompt, and Advanced Designer, a full desktop editor built step by step across text, image, signature, QR code, effects, and a six-field grading slab layout, each step priced independently and rendered as a live front-and-back preview. Templates are built in their own visual drag-and-drop admin editor and saved as a single JSON blob at the standard 63x88mm card size, and every image upload passes MIME, extension, and raw-byte PHP-injection checks before it's trusted.</p>
<p>Pricing runs through WooCommerce's own <code>set_price()</code> so taxes and coupons stay correct, with every step priced separately for front and back. The hard part was the image lifecycle: a customer can upload a photo, abandon the cart, remove an item, or reuse the same image across multiple designs, and none of that should ever orphan a file or delete an image another cart item still needs. Cart removal checks for shared usage before deleting anything, and a daily WP-Cron job sweeps temporary uploads older than 24 hours that never reached checkout, so every order arrives with a fully structured, downloadable design ready for production.</p>
</div>
</div>
