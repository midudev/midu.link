import { respondWith } from './utils.js';

// Renderizado del HTML y UI
export const createIndexHtml = ({ urls }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>midu.link - ⚡🔗 Short your urls</title>
  <style>
    :root {
      --bg: #181f2a;
      --fg: #f7fafc;
      --primary: #38bdf8;
      --accent: #facc15;
      --danger: #ef4444;
      --border: #334155;
      --input-bg: #232b3a;
      --input-fg: #f7fafc;
      --table-row-hover: #23304a;
      --focus: #facc15;
      --shadow: 0 4px 24px 0 rgba(56,189,248,0.12);
      --radius: 10px;
      --font: 'Inter', system-ui, sans-serif;
    }
    html, body {
      background: var(--bg);
      color: var(--fg);
      font-family: var(--font);
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-size: 18px;
    }
    main {
      border-radius: var(--radius);
      padding: 2.5rem 2rem;
      margin: 2rem auto;
      max-width: 700px;
      width: 95vw;
    }
    h1, h2 {
      color: var(--primary);
      margin-bottom: 0.5em;
      font-weight: 700;
      letter-spacing: -1px;
    }
    h1 {
      font-size: 2.2rem;
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    h1::after {
      content: ' ';
      display: inline-block;
      background: url('https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f517.svg') no-repeat center/1.4em;
      width: 1.4em;
      height: 1.4em;
      vertical-align: middle;
    }
    form {
      background: var(--input-bg);
      border-radius: var(--radius);
      padding: 1.2em;
      margin-bottom: 1.5em;
      display: flex;
      flex-direction: column;
      gap: 0.8em;
    }
    form input {
      background: var(--bg);
      color: var(--input-fg);
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      padding: 0.7em 1em;
      font-size: 1em;
      outline: none;
      margin-bottom: 0.5em;
      transition: border 0.2s, box-shadow 0.2s;
    }
    form input:focus {
      border-color: var(--focus);
      box-shadow: 0 0 0 2px var(--accent);
    }
    form button {
      background: var(--primary);
      color: var(--bg);
      font-weight: 700;
      border: none;
      border-radius: var(--radius);
      padding: 0.8em;
      font-size: 1.1em;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      margin-top: 0.5em;
    }
    form button:hover, form button:focus {
      background: var(--accent);
      color: var(--bg);
      outline: none;
    }
    #result {
      min-height: 1.4em;
      margin-bottom: 1em;
      font-weight: 600;
      color: var(--danger);
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 1.5em;
      background: var(--input-bg);
      border-radius: var(--radius);
      overflow: hidden;
    }
    th, td {
      padding: 0.7em 0.6em;
      text-align: left;
      font-size: 1em;
      word-break: break-all;
    }
    th {
      background: #222c3a;
      color: var(--accent);
      font-size: 1.05em;
      font-weight: 700;
    }
    tbody tr:hover {
      background: var(--table-row-hover);
      transition: background 0.2s;
    }
    .hash-cell {
      white-space: nowrap;
      width: 1%;
      max-width: 1%;
    }
    .hash-link {
      white-space: nowrap;
      display: inline-block;
      max-width: 100%;
      overflow-x: auto;
      text-overflow: clip;
    }
    a {
      color: var(--primary);
      text-decoration: underline;
      transition: color 0.2s;
      outline: none;
    }
    a:hover, a:focus {
      color: var(--accent);
      text-decoration: underline wavy;
    }
    @media (max-width: 600px) {
      main {
        padding: 1.1rem 0.4rem;
      }
      th, td {
        font-size: 0.92em;
        padding: 0.5em 0.3em;
      }
      h1 {
        font-size: 1.3rem;
      }
    }
    /* Focus visible for accessibility */
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <main>
    <form>
      <input full-width required id='link' placeholder='Shorten your link'>
      <div>
        <input id='hash' placeholder='Hash to use for the link'>
        <input id='auth' required placeholder='Auth Code' type='password' />
      </div>
      <button full-width>Shorten 🗜️!</button>
    </form>
    <div id="result"></div>
    <h2>URLs</h2>
    <table>
      <thead>
        <tr>
          <th class="hash-cell">Hash</th>
          <th>Destino</th>
        </tr>
      </thead>
      <tbody>
        ${urls.map(({ hash, destination }) => `
          <tr>
            <td class="hash-cell"><a class="hash-link" href="/${hash}">${hash}</a></td>
            <td><a href="${destination}" target="_blank" rel="noopener">${destination}</a></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
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

      const url = hash !== '' ? '/' + hash : '/'

      fetch(url, {
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
`;

export const renderUI = async (URLS) => {
  const { keys } = await URLS.list();
  const urls = [];
  for (const key of keys) {
    const hash = key.name;
    const destination = await URLS.get(hash);
    urls.push({ hash, destination });
  }
  const body = createIndexHtml({ urls });
  return respondWith({ body });
};
