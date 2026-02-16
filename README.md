# midu.link

Acortador de URLs de [midudev](https://midu.dev). Construido con [Astro](https://astro.build).

## Estructura

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   └── links.json        # Todos los enlaces cortos
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro        # Homepage con lista de enlaces
├── astro.config.mjs           # Redirecciones generadas desde links.json
└── package.json
```

## Cómo funciona

Los enlaces se definen en `src/data/links.json`. Cada entrada tiene un `slug` y una `url` destino:

```json
{ "slug": "youtube", "url": "https://www.youtube.com/channel/UC8LeXCWOalN8SxlrPcG-PaQ" }
```

Al hacer build, Astro genera redirecciones 308 para cada slug. La homepage muestra todos los enlaces disponibles.

## Comandos

| Comando          | Acción                                    |
| :--------------- | :---------------------------------------- |
| `pnpm install`   | Instala dependencias                      |
| `pnpm dev`       | Servidor de desarrollo en `localhost:4321` |
| `pnpm build`     | Build de producción en `./dist/`          |
| `pnpm preview`   | Preview del build local                   |
