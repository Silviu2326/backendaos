# Migración a Instantly API v2

## ⚠️ Cambios Críticos

### 1. **Nueva API Key requerida**
- API v2 **NO es compatible** con API v1
- Debes generar una nueva API key específica para v2
- **Ubicación**: https://app.instantly.ai/app/settings/integrations

### 2. **API v1 será deprecada en 2025**
- Migra lo antes posible para evitar interrupciones

## Archivos Actualizados

✅ `instantly_test.js` - Actualizado a v2
✅ `test_instantly.js` - Actualizado a v2
✅ `instantly_examples_v2.js` - Nuevo archivo con ejemplos

## Cambios en Endpoints

### v1 → v2 Mapping (Endpoints Correctos)

| v1 Endpoint | v2 Endpoint | Notas |
|------------|-------------|-------|
| `/api/v1/account` | `/api/v2/workspaces/current` | Cambio de concepto |
| `/api/v1/campaigns` | `/api/v2/campaigns` | Simplificado |
| `/api/v1/workspaces` | `/api/v2/workspaces/current` | Workspace actual |
| `/api/v1/email-accounts` | `/api/v2/accounts` | Simplificado |
| `/api/v1/me` | `/api/v2/workspaces/current` | Consolidado |
| `/api/v1/user` | `/api/v2/workspaces/current` | Consolidado |

## Endpoints v2 Principales

### Workspace
- `GET /api/v2/workspaces/current` - Obtener workspace actual

### Campaigns
- `GET /api/v2/campaigns` - Listar campañas (query params: limit, search, status, tag_ids)
- `GET /api/v2/campaigns/{campaign_id}` - Obtener campaña específica
- `POST /api/v2/campaigns` - Crear campaña
- `PATCH /api/v2/campaigns/{campaign_id}` - Actualizar campaña
- `DELETE /api/v2/campaigns/{campaign_id}` - Eliminar campaña

### Leads
- `POST /api/v2/leads` - Añadir lead(s) a campaña
- `GET /api/v2/leads/{lead_id}` - Obtener lead específico
- `PATCH /api/v2/leads/{lead_id}` - Actualizar lead
- `DELETE /api/v2/leads/{lead_id}` - Eliminar lead
- `POST /api/v2/leads/move` - Mover leads entre campañas

### Lead Lists
- `GET /api/v2/lead-lists/{lead_list_id}` - Obtener lista de leads
- `GET /api/v2/lead-lists/{lead_list_id}/verification-stats` - Stats de verificación

### Email Accounts
- `GET /api/v2/accounts` - Listar cuentas (query params: limit, status)
- `GET /api/v2/accounts/{account_id}` - Obtener cuenta específica

### Analytics
- `GET /api/v2/analytics/workspace` - Analytics del workspace
- `GET /api/v2/analytics/campaigns/{campaign_id}` - Analytics de campaña

### Tags
- `GET /api/v2/tags` - Listar tags
- `POST /api/v2/tags` - Crear tag

### Blocklist
- `GET /api/v2/blocklist` - Obtener blocklist
- `POST /api/v2/blocklist` - Añadir a blocklist
- `DELETE /api/v2/blocklist` - Remover de blocklist

### Unibox
- `GET /api/v2/unibox/accounts` - Obtener cuentas de unibox
- `GET /api/v2/unibox/threads` - Obtener threads de email

## Mejoras en v2

### 1. **Doble cantidad de endpoints**
v2 tiene el doble de endpoints que v1

### 2. **API Keys con Scopes**
- Permisos granulares por API key
- Mayor seguridad y control

### 3. **Estándares REST estrictos**
- Naming consistente (snake_case)
- Mejor estructura de respuestas

### 4. **Documentación interactiva**
- Prueba endpoints directamente desde https://developer.instantly.ai/api/v2
- Ejemplos en tiempo real

## Pasos de Migración

### 1. Generar nueva API Key v2
```bash
1. Ir a: https://app.instantly.ai/app/settings/integrations
2. Crear nueva API Key v2
3. Configurar scopes/permisos necesarios
4. Copiar la key
```

### 2. Actualizar configuración
```javascript
// Antiguo (v1)
const API_KEY = 'tu-api-key-v1';

// Nuevo (v2)
const API_KEY_V2 = 'tu-nueva-api-key-v2';
```

### 3. Actualizar endpoints en tu código
```javascript
// Antiguo (v1)
const response = await fetch('https://api.instantly.ai/api/v1/campaigns');

// Nuevo (v2)
const response = await fetch('https://api.instantly.ai/api/v2/campaigns');
```

### 4. Actualizar estructura de datos
v2 usa `snake_case` consistentemente:

```javascript
// v1 (inconsistente)
{
  firstName: "Juan",
  last_name: "Pérez"
}

// v2 (consistente snake_case)
{
  first_name: "Juan",
  last_name: "Pérez"
}
```

## Ejemplos de Uso

### Listar Campaigns
```javascript
const https = require('https');

const options = {
    hostname: 'api.instantly.ai',
    path: '/api/v2/campaigns?limit=10',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer TU_API_KEY_V2',
        'Content-Type': 'application/json'
    }
};

https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(JSON.parse(data)));
}).end();
```

### Añadir Lead a Campaign
```javascript
const https = require('https');

const leadData = {
    campaign_id: 'campaign_id_here',
    email: 'lead@example.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    company_name: 'Empresa XYZ',
    variables: {
        company: 'Empresa XYZ',
        industry: 'Technology'
    }
};

const options = {
    hostname: 'api.instantly.ai',
    path: '/api/v2/leads',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer TU_API_KEY_V2',
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(JSON.parse(data)));
});

req.write(JSON.stringify(leadData));
req.end();
```

### Obtener Analytics
```javascript
// Workspace analytics
// GET /api/v2/analytics/workspace

// Campaign analytics específica
// GET /api/v2/analytics/campaigns/{campaign_id}
```

## Testing

### Probar la conexión
```bash
# Ejecutar test básico
node instantly_test.js

# Ejecutar test alternativo
node test_instantly.js

# Ver ejemplos completos
node instantly_examples_v2.js
```

## Recursos

- **Documentación oficial v2**: https://developer.instantly.ai/api/v2
- **Guía de migración**: https://help.instantly.ai/en/articles/10432807-api-v2
- **Changelog**: https://feedback.instantly.ai/changelog/instantly-api-v2-is-officially-here
- **API Explorer**: https://developer.instantly.ai/

## Integración con tu Sistema

### Endpoints que usa tu sistema actual

Basándome en tus archivos, pareces necesitar principalmente:

1. **Campaigns** - Gestión de campañas
2. **Leads** - Crear y gestionar leads
3. **Analytics** - Métricas de rendimiento

### Ejemplo de integración para crear leads desde tu sistema

```javascript
// En tu leadController.js o similar

async function sendLeadToInstantly(leadData) {
    const instantlyLead = {
        campaign_id: 'TU_CAMPAIGN_ID', // Configurable
        email: leadData.email,
        first_name: leadData.first_name_cleaned || leadData.first_name,
        last_name: leadData.last_name_cleaned || leadData.last_name,
        company_name: leadData.company_name,
        variables: {
            // Variables personalizadas que usará la campaña en los templates
            body1: leadData.instantly_body1,
            body2: leadData.instantly_body2,
            body3: leadData.instantly_body3,
            body4: leadData.instantly_body4,
            companyName: leadData.company_name,
            industry: leadData.industry
        }
    };

    // POST a /api/v2/leads
    const response = await fetch('https://api.instantly.ai/api/v2/leads', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.INSTANTLY_API_KEY_V2}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(instantlyLead)
    });

    return await response.json();
}
```

## Troubleshooting

### Error: "Invalid API Key"
- Estás usando una API key v1 en endpoints v2
- Genera una nueva API key v2

### Error: "Endpoint not found"
- Verifica que estés usando `/api/v2/` y no `/api/v1/`
- Revisa la documentación para el endpoint correcto

### Error: "Permission denied"
- Tu API key v2 no tiene los scopes necesarios
- Actualiza los permisos de la API key en el dashboard

### Rate Limiting
- v2 tiene límites de rate
- Agrega delays entre requests (ver `instantly_examples_v2.js`)

## Próximos Pasos

1. ✅ Generar API Key v2
2. ✅ Probar conexión con `instantly_test.js`
3. ✅ Actualizar variables de entorno
4. ✅ Migrar integraciones existentes
5. ✅ Monitorear y validar funcionamiento

## Soporte

Si encuentras problemas:
1. Revisa la documentación: https://developer.instantly.ai/api/v2
2. Prueba endpoints en el API Explorer
3. Contacta soporte de Instantly

---

**Fecha de migración**: 2026-02-01
**Estado**: ✅ Archivos de prueba actualizados
**Pendiente**: Generar API Key v2 y probar
