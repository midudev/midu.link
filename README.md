# midu.link

Acortador de URLs de [midudev](https://midu.dev). Construido con [Astro](https://astro.build). Desplegado en Vercel. Analytics de clicks con [Turso](https://turso.tech).

## Estructura

```text
/
├── public/
│   └── favicon.svg
├── scripts/
│   └── init-db.mjs            # Crea la tabla clicks_daily en Turso
├── src/
│   ├── data/
│   │   └── links.json         # Todos los enlaces cortos
│   ├── lib/
│   │   ├── db.ts              # Cliente Turso + contadores diarios
│   │   └── links.ts           # Map slug → URL
│   ├── middleware.ts          # 302 + analytics en background
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro        # Homepage con sparklines
│       ├── aws-nerdearla.astro # Landing especial (ruta estática, sin redirect)
│       └── api/
│           ├── stats.ts       # JSON de clicks (hoy + 7 días)
│           └── track.ts       # POST interno: incrementa contador
├── astro.config.mjs
└── package.json
```

## Cómo funciona

Los enlaces se definen en `src/data/links.json`. Cada entrada tiene un `slug` y una `url` destino:

```json
{ "slug": "youtube", "url": "https://www.youtube.com/channel/UC8LeXCWOalN8SxlrPcG-PaQ" }
```

El **middleware** resuelve el slug en memoria y responde `302` de inmediato. En paralelo (via `waitUntil` + `POST /api/track`) se incrementa el contador diario en Turso — el redirect **nunca** espera a la base de datos. La homepage pinta un mini gráfico de 7 días + contadores de hoy y de la semana.

## Landings especiales

Algunos slugs no redirigen: son páginas propias. Basta con crear `src/pages/<slug>.astro` — en Astro las rutas estáticas tienen prioridad sobre `[slug].ts`, y en Vercel el `handle: filesystem` sirve el HTML prerenderizado antes de llegar a la función. Ejemplo: `midu.link/aws-nerdearla`.

## Variables de entorno

Copia `.env.example` a `.env`:

```bash
TURSO_DATABASE_URL=libsql://…
TURSO_AUTH_TOKEN=…
```

En Vercel: `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` (Production / Preview / Development).

Inicializar el esquema (una vez):

```bash
node --env-file=.env scripts/init-db.mjs
```

## Comandos

| Comando          | Acción                                    |
| :--------------- | :---------------------------------------- |
| `pnpm install`   | Instala dependencias                      |
| `pnpm dev`       | Servidor de desarrollo en `localhost:4321` |
| `pnpm build`     | Build de producción en `./dist/`          |
| `pnpm preview`   | Preview del build local                   |
