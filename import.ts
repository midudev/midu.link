import links from "./links.json" with { type: "json" };

async function importLinksToKV() {
  // Conectar con Deno KV 
  // Para usar un KV específico, necesitas configurar la variable de entorno DENO_KV_URL
  // o usar el KV local en desarrollo
  const kv = await Deno.openKv();
  
  console.log(`🚀 Iniciando importación de ${links.length} links a Deno KV...`);
  
  let imported = 0;
  let errors = 0;
  
  for (const link of links) {
    try {
      // Guardar cada link en KV con la key como clave
      const result = await kv.set(["links", link.key], link.value);
      
      if (result.ok) {
        imported++;
        console.log(`✅ Importado: ${link.key} -> ${link.value}`);
      } else {
        console.error(`❌ Error al importar ${link.key}:`, result);
        errors++;
      }
    } catch (error) {
      console.error(`❌ Error al importar ${link.key}:`, error);
      errors++;
    }
  }
  
  console.log(`\n📊 Resumen de importación:`);
  console.log(`   ✅ Importados correctamente: ${imported}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📝 Total procesados: ${links.length}`);
  
  // Cerrar la conexión
  kv.close();
  
  if (errors === 0) {
    console.log(`\n🎉 ¡Importación completada exitosamente!`);
  } else {
    console.log(`\n⚠️  Importación completada con ${errors} errores.`);
  }
}

// Función para verificar la importación
async function verifyImport() {
  const kv = await Deno.openKv();
  
  console.log("\n🔍 Verificando algunos links importados...");
  
  // Verificar algunos links aleatorios
  const testKeys = ["1", "youtube", "42", "ai", "angular"];
  
  for (const key of testKeys) {
    const result = await kv.get(["links", key]);
    if (result.value) {
      console.log(`✅ ${key}: ${result.value}`);
    } else {
      console.log(`❌ ${key}: No encontrado`);
    }
  }
  
  kv.close();
}

// Ejecutar importación
if (import.meta.main) {
  try {
    await importLinksToKV();
    await verifyImport();
  } catch (error) {
    console.error("💥 Error durante la importación:", error);
    Deno.exit(1);
  }
}