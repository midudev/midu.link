# midu.link

Acortador de URLs de [midudev](https://midu.dev). Construido con [Astro](https://astro.build). Desplegado en [Cloudflare Workers](https://developers.cloudflare.com/workers/). Analytics de clicks con [D1](https://developers.cloudflare.com/d1/).

## Estructura

```text
/
├── public/
│   ├── _headers               # Cache-Control de los assets estáticos
│   └── fonts/                 # Geist Mono y Geist Pixel (subset latino)
├── src/
│   ├── worker.ts              # Entrypoint del Worker: 302 + analytics, caché de stats
│   ├── data/
│   │   └── links.json         # Todos los enlaces cortos
│   ├── lib/
│   │   ├── db.ts              # Contadores diarios en D1
│   │   └── links.ts           # Map slug → URL
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro        # Homepage con sparklines
│       ├── 404.astro
│       ├── aws-nerdearla.astro # Landing especial (ruta estática, sin redirect)
│       ├── stats/[slug].astro # Analíticas de un enlace (on demand)
│       └── api/
│           └── stats.ts       # JSON de clicks (hoy + 7 días)
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

## Cómo funciona

Los enlaces se definen en `src/data/links.json`. Cada entrada tiene un `slug` y una `url` destino:

```json
{ "slug": "youtube", "url": "https://www.youtube.com/channel/UC8LeXCWOalN8SxlrPcG-PaQ" }
```

Todas las páginas se prerenderizan y Cloudflare las sirve como assets estáticos (gratis, sin ejecutar el Worker). Solo llegan a `src/worker.ts` las peticiones que no coinciden con ningún archivo y las de las landings especiales:

- **Enlace corto** (`/youtube`): el Worker resuelve el slug en memoria y responde `302` sin pasar por Astro. El contador diario se incrementa en D1 después de responder (`ctx.waitUntil`): el redirect **nunca** espera a la base de datos.
- **Landing especial** (`/mwc`): el Worker cuenta la visita igual que un enlace corto y sirve el HTML estático.
- **`/api/stats` y `/stats/<slug>`**: los renderiza Astro bajo demanda y el Worker guarda la respuesta en la caché del colo durante su `max-age` (30 s y 60 s), así que D1 recibe como mucho una consulta por colo y ventana.
- Cualquier otra ruta: Astro responde con la página 404 prerenderizada.

La homepage pinta un mini gráfico de 7 días + contadores de hoy y de la semana.

## Landings especiales

Algunos slugs no redirigen: son páginas propias. Basta con crear `src/pages/<slug>.astro`: el HTML prerenderizado se sirve como asset estático antes de llegar al Worker. Ejemplo: `midu.link/aws-nerdearla`. Para contar sus visitas, su slug tiene que estar en `specialLandings` (`src/lib/links.ts`) y su ruta en `assets.run_worker_first` (`wrangler.jsonc`): el Worker cuenta la visita y sirve el HTML estático. No hay ningún endpoint público para sumar clics.

## Base de datos

Los clics se guardan en D1 (binding `DB`, base de datos `midu-link`), en una tabla `clicks_daily` con un contador por slug y día UTC. No hay que configurar nada:

- **En local**, `pnpm dev` y `pnpm preview` usan una copia SQLite en `.wrangler/state`, así que nunca tocan los datos de producción.
- **En producción** se usa la base de datos `midu-link`, con su `database_id` fijado en `wrangler.jsonc`.
- **La tabla** la crea el Worker en la primera consulta que no la encuentra.

Para consultar los datos de producción:

```bash
pnpm wrangler d1 execute DB --remote --command "SELECT * FROM clicks_daily ORDER BY day DESC LIMIT 20"
```

## Comandos

| Comando        | Acción                                                     |
| :------------- | :--------------------------------------------------------- |
| `pnpm install` | Instala dependencias                                       |
| `pnpm dev`     | Servidor de desarrollo (workerd) en `localhost:4321`       |
| `pnpm build`   | Build de producción en `./dist/`                           |
| `pnpm preview` | Preview del build en workerd, igual que en producción      |
| `pnpm deploy`  | Build + `wrangler deploy` (Worker en el dominio midu.link) |

`pnpm dev` y `pnpm build` ejecutan antes `wrangler types`, que genera `worker-configuration.d.ts` con los tipos de los bindings.
