---
title: Class Agenda
description: A WordPress plugin for activity centers to manage classes, teachers, and client relationships.
role: Freelancer Senior WordPress Developer
type: Freelance
company: "Freelance"
category: WordPress Plugin
technologies:
- PHP
- WordPress
- JavaScript
- FullCalendar
- Selectize.js
- Tailwind CSS
- Webpack
- MySQL
- WooCommerce
- WordPress REST API
- PapaParse
tags:
- WordPress Plugin
- CRM
- Booking & Scheduling
- REST API
- CSV Import
stack: "PHP - WordPress - FullCalendar - WooCommerce"
year: "2024"
image: "Class Agenda - Hero.jpg"
slug: "class-agenda"
featuredProject: true
styledTitle: "Class <br /> <span class='text-text-highlight'>Agenda</span>"
team: "Myself"
problem: "Client had no unified way to schedule classes and handle bookings."
outcome: "A self-contained WordPress plugin combining an interactive class calendar, full client CRM, teacher availability management, and native WooCommerce booking integration."
impact: "Eliminated dependency on manual, unreliable methods for scheduling classes and managing client data across multiple centers."
---

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start">
<div>
<h2>The brief</h2>
<p>The client ran an activity center juggling multiple teachers, rooms, and class types with no unified way to schedule sessions or track who showed up, who paid, and who was still pending. Bookings lived across spreadsheets and paper sign-in sheets, with no way to search a client's history without digging through binders.</p>
<p>I built this as a freelance WordPress plugin, owning the full scope: the interactive class calendar, the client CRM, teacher availability, and the WooCommerce integration that turns an online purchase into a filled seat. Everything runs inside the client's own WordPress install, with no third-party scheduling SaaS in the loop.</p>
</div>
<div class="flex flex-col gap-3 sm:mt-12">
<img src="/images/projects/class-agenda/class-agenda-1.png" alt="Class roster table showing enrolled clients with payment status, class type, class detail, session count, companions, attendance, and coupon columns" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The per-class client list: payment status, class type, attendance, and a unique coupon code, all editable inline and synced back to the calendar.</p>
</div>
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-start mt-8 sm:mt-16">
<div class="flex flex-col gap-3 order-2 sm:order-1">
<img src="/images/projects/class-agenda/class-agenda-2.png" alt="Public self-service form titled Datos del Alumno with fields for name, ID, phone, email, address, referral source, and legal consent checkboxes" class="w-full rounded-lg border border-border !my-0" />
<p class="text-xs text-text-muted !mb-0">The public update form: clients edit their own record from a one-time link, no front-desk re-entry required.</p>
</div>
<div class="order-1 sm:order-2">
<h2>Building it</h2>
<p>Classes live in their own database table keyed uniquely by day and room, so two sessions can never collide in the same space, and each class carries a JSON list of enrolled clients with per-session data: payment status, class type, attendance, companions, and a coupon code the system checks for duplicates in real time. The calendar itself runs on FullCalendar with month, week, and day views, live filtering by teacher and room, and an unsaved-changes indicator on any event still pending a save. Teachers get their own role with a restricted view of the calendar: they can mark attendance but can't reassign a class or touch its roster, and a separate vacation and leave tracker automatically excludes unavailable teachers from the assignment list.</p>
<p>The hard part was keeping client data both centralized and self-service. Clients are stored as their own post type with full contact details, legal consents, and, for minors, two complete sets of guardian data, deduplicated automatically by ID document so the same person never gets a second record. A public form lets a client update their own information from a unique one-time link that disables itself after submission, and a CSV importer brings in hundreds of existing records in one pass, skipping anything that already matches. On the sales side, a WooCommerce purchase of a dated class variation creates the client record and enrolls them in that exact session automatically, turning a purchase into a filled seat with zero manual entry.</p>
</div>
</div>
