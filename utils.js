// Utilidades y helpers
export const respondWith = ({ body = null, contentType = 'text/html', location, status = 200 }) => new Response(body, {
  status,
  headers: { Location: location, 'Content-Type': contentType }
});

export const checkAuth = ({ auth, AUTH_SECRET }, callback) =>
  auth === AUTH_SECRET
    ? callback()
    : respondWith({ status: 401 });
