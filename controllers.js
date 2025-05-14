// Controladores de rutas
import { respondWith } from './utils.js';

export const handleGet = async ({ hash, URLS }) => {
  const location = await URLS.get(hash);
  if (!location) return respondWith({ status: 404 });
  const validUrlLocation = location.startsWith('http') ? location : `https://${location}`;
  return respondWith({ status: 302, location: `${validUrlLocation}` });
};

export const handlePost = async ({ hash, headers, URLS }) => {
  hash = hash || Math.random().toString(36).slice(2, 10);
  const previousDestination = await URLS.get(hash);
  if (previousDestination) return respondWith({ status: 409 });
  const destination = headers.get('x-destination');
  await URLS.put(hash, destination);
  return respondWith({ status: 201 });
};

export const handleDelete = async ({ hash, URLS }) => {
  await URLS.delete(hash);
  return respondWith({ status: 204 });
};

export const handleUpdate = async ({ hash }) => {
  // Implementación futura
};
