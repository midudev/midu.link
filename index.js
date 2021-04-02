/* global addEventListener, URLS, Response,  */

/**
 * TODO:
 * - Como usuario y desarrollador,
 * - me pido a mi mismo
 * - deployar todo esto
 * - para poder utilizarlo.
 * - Poder sobreescribir en el POST si ya existe con un flag.
 * - Implementar seguridad ¿a base de un SECRET?
 * - Implementar el método PUT
 * - Al hacer GET al / listar todas las urls
 * - Hacer un frontend para todo esto
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const respondWith = ({ body = null, contentType = 'text/html', location, status = 200 }) => new Response(body,
  {
    status,
    headers:
      { Location: location, 'Content-Type': contentType }
  }
)

const handleGet = async ({ hash }) => {
  const location = await URLS.get(hash)

  return location
    ? respondWith({ status: 302, location })
    : respondWith({ status: 404 })
}

const handlePost = async ({ hash, headers }) => {
  const previousDestination = await URLS.get(hash)
  if (previousDestination) respondWith({ status: 409 })

  const destination = headers.get('x-destination')
  await URLS.put(hash, destination)
  return respondWith({ status: 201 })
}

const handleDelete = async ({ hash }) => {
  await URLS.delete(hash)
  return respondWith({ status: 204 })
}

const handleUpdate = async () => {

}

const renderUI = () => {
  return respondWith({ body: '<html><h1>Hola mundo</h1></html>' })
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest ({ headers, url, method }) {
  const urlObject = new URL(url)
  const { pathname } = urlObject

  const hash = pathname.slice(1) // transform "/pathname" to "pathname"

  if (method === 'GET') {
    return hash !== ''
      ? handleGet({ hash })
      : renderUI()
  }

  if (method === 'POST') return handlePost({ hash, headers })
  if (method === 'DELETE') return handleDelete({ hash })
  if (['PUT', 'PATCH'].includes(method)) return handleUpdate({ hash })

  return respondWith({ status: 405 })
}
