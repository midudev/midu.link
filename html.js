module.exports = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>midu.link - ⚡🔗 Short your urls</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
  <style>
    main {
      display: grid;
      place-content: center;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <main>
    <h1 center>Your URL shortener</h1>
    <form>
      <input placeholder='Shorten your link'>
      <input placeholder='Auth Code' type='password' />
      <button>Shorten 🗜️!</button>
    </form>
  </main>
  <script>
    const form = document.querySelector('form')
    form.addEvenetListener('submit', event => {
      event.preventDefault()
      fetch('')
    })
  </script>
</body>
</html>
`
