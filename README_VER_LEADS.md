# Ver Leads - Scripts de Consulta

Scripts rápidos para ver tus leads y correos enviados.

## 🚀 Uso Rápido

### Opción 1: Menú Interactivo (Windows)
```bash
ver_leads.bat
```

### Opción 2: Comandos Directos

#### Ver solo leads con correos enviados
```bash
node ver_leads_enviados.js
```

#### Ver TODOS los leads
```bash
node ver_todos_leads.js
```

#### Exportar a CSV
```bash
node exportar_leads_csv.js
```

## 📋 Descripción de Scripts

### 1. `ver_leads_enviados.js`
Muestra únicamente los leads que ya tienen correos enviados.

**Información que muestra:**
- Lead Number
- Nombre completo
- Email
- Empresa
- Estado de Instantly (sent, replied, converted, etc.)
- Fecha de envío
- Campaign ID

**Estadísticas:**
- Total enviados
- Respondidos
- Respuestas positivas
- Convertidos
- Rebotados
- En stock

### 2. `ver_todos_leads.js`
Muestra TODOS los leads en la base de datos (últimos 1000).

**Información que muestra:**
- Lead Number
- Nombre completo
- Email
- Empresa
- Campaign ID
- Estados de todas las fases:
  - Verificación
  - CompScrap
  - Box1 (FIT/HIT)
  - Instantly

**Estadísticas por fase:**
- Conteo por estado en cada fase del workflow

### 3. `exportar_leads_csv.js`
Exporta los leads enviados a un archivo CSV.

**Ubicación del archivo:**
`exports/leads_enviados_YYYY-MM-DD_timestamp.csv`

**Columnas incluidas:**
- Lead Number
- Target ID
- First Name
- Last Name
- Email
- Company Name
- Title
- Phone
- Website
- Status (Instantly)
- Sent At
- Body 1-4 (contenido de emails)
- Campaign ID
- Created At

## 📊 Ejemplos de Salida

### Ver Leads Enviados
```
=== LEADS CON CORREOS ENVIADOS ===

Total de leads con correos enviados: 45

────────────────────────────────────────────────────────────────

1. Lead #3001
   Nombre: Juan Pérez
   Email: juan.perez@empresa.com
   Empresa: Empresa XYZ
   Estado: sent
   Enviado: 01/02/2026 14:30:00
   Campaign ID: 1
   ────────────────────────────────────────────────────────────

=== ESTADÍSTICAS ===
✉️  Enviados: 40
💬 Respondieron: 3
✅ Respuestas positivas: 2
🎯 Convertidos: 1
❌ Rebotados: 2
📦 En stock: 0
📊 TOTAL: 45
```

### Exportar a CSV
```
=== EXPORTAR LEADS A CSV ===

✅ Exportación exitosa!
📁 Archivo: C:\Users\usuario\Downloads\aos-studio\backend\exports\leads_enviados_2026-02-01_1738425000000.csv
📊 Total de leads: 45

=== ESTADÍSTICAS ===
✉️  Enviados: 40
💬 Respondieron: 3
✅ Respuestas positivas: 2
🎯 Convertidos: 1
❌ Rebotados: 2
📦 En stock: 0
```

## 🔧 Requisitos

- Node.js instalado
- Base de datos PostgreSQL configurada
- Archivo `src/config/db.js` correctamente configurado

## 📝 Estados de Instantly

| Estado | Descripción |
|--------|-------------|
| `pending` | Listo para enviar pero aún no enviado |
| `sent` | Email enviado |
| `replied` | Lead respondió |
| `positive_reply` | Respuesta positiva detectada |
| `converted` | Lead convertido/cierre exitoso |
| `bounced` | Email rebotó (dirección inválida) |
| `stock` | En stock (guardado para enviar después) |

## ⚠️ Notas

- Los scripts se conectan directamente a tu base de datos local
- No hacen llamadas a la API de Instantly
- Son de solo lectura, no modifican datos
- El límite de `ver_todos_leads.js` es 1000 leads (modificable en el código)

## 🛠️ Personalización

### Cambiar el límite de leads
En `ver_todos_leads.js`, línea 14:
```javascript
LIMIT 1000  // Cambia este número
```

### Agregar más campos al CSV
Edita `exportar_leads_csv.js` y añade campos en:
- La consulta SQL (líneas 8-20)
- Los headers (línea 38)
- Los rows (línea 64)

## 🆘 Troubleshooting

### Error: "Cannot find module './src/config/db'"
- Asegúrate de estar en el directorio `backend/`
- Verifica que existe `src/config/db.js`

### Error: "Connection refused"
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en tu archivo de configuración

### No muestra ningún lead
- Verifica que tengas leads en tu base de datos
- Para leads enviados, deben tener `step_status->>'instantly'` diferente de `'pending'`

## 📞 Soporte

Si encuentras errores, revisa:
1. Conexión a base de datos
2. Permisos de lectura
3. Estructura de la tabla `leads`
