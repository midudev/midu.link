import { handleGet, handlePost, handleDelete, handleUpdate } from './controllers.js';
import { renderUI } from './render.js';
import { checkAuth } from './utils.js';

/* global addEventListener, URLS, AUTH_SECRET */

/**
 * TODO:
 * - Hacer un frontend para todo esto
 * - Implementar el método PUT
 * - Poder sobreescribir en el POST si ya existe con un flag.
 * - Revisar los environments para el worker (https://developers.cloudflare.com/workers/platform/environments)
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const { headers, url, method } = request;
  const auth = headers.get('Authorization');
  const { pathname } = new URL(url);
  const hash = pathname.slice(1); // transform "/pathname" to "pathname"

  // URLS y AUTH_SECRET deben estar en el global scope del Worker
  if (method === 'GET') {
    return hash !== ''
      ? handleGet({ hash, URLS })
      : renderUI(URLS);
  }

  if (method === 'POST') {
    return checkAuth({ auth, AUTH_SECRET }, () => handlePost({ hash, headers, URLS }));
  }

  if (method === 'DELETE') {
    return checkAuth({ auth, AUTH_SECRET }, () => handleDelete({ hash, URLS }));
  }

  if (["PUT", "PATCH"].includes(method)) {
    return checkAuth({ auth, AUTH_SECRET }, () => handleUpdate({ hash, URLS }));
  }

  // 405 Method Not Allowed
  return new Response(null, { status: 405 });
}
