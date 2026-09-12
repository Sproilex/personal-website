import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const needs = data.get('needs');
    const message = data.get('message');

    if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const { error } = await resend.emails.send({
        from: 'contact@stivenilarraza.com',
        to: 'stivenilarraza@gmail.com',
        replyTo: email.toString(),
        subject: `New contact from ${name}`,
        html: `
            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Needs:</b> ${needs ?? 'Not specified'}</p>
            <p><b>Message:</b></p>
            <p>${message}</p>
        `,
    });

    if (error) {
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
