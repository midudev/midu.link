# Importación de Links a Deno KV

Este script importa todos los links del archivo `links.json` a una base de datos Deno KV.

## Client ID del KV
- **Client ID**: `ed70483b-4e64-4fe9-b578-c3ac1cb88b57`

## Uso

### 1. Ejecutar con la tarea predefinida:
```bash
deno task import
```

### 2. Ejecutar directamente:
```bash
deno run --allow-read --allow-net --unstable-kv import.ts
```

### 3. Para usar el KV remoto específico:
Configura la variable de entorno antes de ejecutar:
```bash
export DENO_KV_URL="https://api.deno.com/databases/ed70483b-4e64-4fe9-b578-c3ac1cb88b57/connect"
deno task import
```

## Estructura de datos

Cada link se guarda en KV con la siguiente estructura:
- **Clave**: `["links", key]` donde `key` es el campo "key" del JSON
- **Valor**: El valor de la URL del campo "value" del JSON

## Ejemplo

Para un link como:
```json
{
  "key": "youtube",
  "value": "https://www.youtube.com/channel/UC8LeXCWOalN8SxlrPcG-PaQ"
}
```

Se guardará en KV como:
- **Clave**: `["links", "youtube"]`
- **Valor**: `"https://www.youtube.com/channel/UC8LeXCWOalN8SxlrPcG-PaQ"`

## Verificación

El script incluye una función de verificación que comprueba algunos links importados para asegurar que el proceso fue exitoso.