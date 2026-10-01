import type { APIRoute } from 'astro';
import { renderOgImage } from '../lib/og-image';

export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await renderOgImage();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
