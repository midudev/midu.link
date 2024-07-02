/* global addEventListener, URLS, Response, AUTH_SECRET  */
const createIndexHtml = ({ allKeys }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>midu.link - ⚡🔗 Short your urls</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      display: grid;
      place-content: center;
    }

    main {
      display: grid;
      place-content: center;
      min-height: 100vh;
    }

    div {
      display: flex;
    }

    [full-width] {
      width: 100%;
    }
  </style>
</head>
<body>
  <main>
    <h1>Your URL shortener 🔗</h1>
    <h2>Create a short url</h2>
    <form>
      <input full-width required id='link' placeholder='Shorten your link'>
      <div>
        <input id='hash' placeholder='Hash to use for the link'>
        <input id='auth' required placeholder='Auth Code' type='password' />
      </div>
      <button full-width>Shorten 🗜️!</button>
    </form>
    <div id="result"></div>
    <h2>Already used URLs</h2>
    <strong>${allKeys.map(key => `<a href="/${key}">${key}</a><br />`).join('')}</strong>
  </main>
  <script>
    const $ = el => document.querySelector(el)
    const $form = $('form')
    const $result = $('#result')

    $form.addEventListener('submit', event => {
      event.preventDefault()
      const auth = $('#auth').value
      const hash = $('#hash').value
      const link = $('#link').value

      fetch(\`/\${hash}\`, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'X-Destination': link 
        }
      }).then(res => {
        const text = res.ok
          ? '✅ Created shorten URL!'
          : '❌ Something went BAD!'

        $result.innerText = text
      })
    })
  </script>
</body>
</html>
`

/**
 * TODO:
 * - Hacer un frontend para todo esto
 * - Implementar el método PUT
 * - Poder sobreescribir en el POST si ya existe con un flag.
 * - Revisar los environments para el worker (https://developers.cloudflare.com/workers/platform/environments)
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

  const validUrlLocation = location.startsWith('http') ? location : `https://${location}`

  return location
    ? respondWith({ status: 302, location: `${validUrlLocation}` })
    : respondWith({ status: 404 })
}

const handlePost = async ({ hash, headers }) => {
  hash = hash || Math.random().toString(36).slice(2, 10)

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

const renderUI = async () => {
  const { keys } = await URLS.list()
  const allKeys = keys.map(key => key.name)
  const body = createIndexHtml({ allKeys })

  return respondWith({ body })
}

const checkAuth = ({ auth }, callback) =>
  auth === AUTH_SECRET
    ? callback()
    : respondWith({ status: 401 })

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest (request) {
  const { headers, url, method } = request
  const auth = request.headers.get('Authorization')

  const { pathname } = new URL(url)
  const hash = pathname.slice(1) // transform "/pathname" to "pathname"

  if (method === 'GET') {
    return hash !== ''
      ? handleGet({ hash })
      : renderUI()
  }

  if (method === 'POST') {
    return checkAuth({ auth }, () => handlePost({ hash, headers }))
  }

  if (method === 'DELETE') {
    return checkAuth({ auth }, () => handleDelete({ hash }))
  }

  if (['PUT', 'PATCH'].includes(method)) {
    return checkAuth({ auth }, () => handleUpdate({ hash }))
  }

  return respondWith({ status: 405 })
}
