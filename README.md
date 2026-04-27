# Energiza CRM MVP

SPA demo-ready para empresas electricas, asesorias energeticas e instaladores solares.

Flujo MVP:

`Lead -> Cliente -> Perfil energetico -> Factura PDF -> Simulacion -> Propuesta -> Pipeline -> Contrato/Instalacion -> Tarea -> Dashboard`

## Stack

- React 19 + TypeScript
- Vite SPA
- Tailwind CSS + componentes estilo shadcn/Radix
- React Query
- React Hook Form + Zod
- Supabase preparado: PostgreSQL, Auth, RLS, Storage
- PWA con `vite-plugin-pwa`

## Ejecutar En Local

```bash
npm install
npm run dev
```

La app arranca en modo demo local si no existen variables de Supabase. Los datos se guardan en `localStorage` para permitir una demo completa sin backend.

## Variables Supabase

Copia `.env.example` a `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Comandos

```bash
npm run dev
npm run build
npm run preview
```

## Demo

Usuarios demo disponibles desde `/login`:

- Laura Martinez · owner
- Carlos Rivas · admin
- Marta Soler · sales
- Javier Nunez · technician
- Ana Beltran · viewer

Datos demo incluidos:

- 1 organizacion
- 5 usuarios
- 15 leads
- 10 clientes
- 8 oportunidades
- 6 facturas
- 5 simulaciones
- 4 propuestas
- 3 contratos
- 5 instalaciones
- 10 tareas
- actividad reciente

## Supabase

Migraciones:

```bash
supabase db push
```

Archivos:

- `supabase/migrations/0001_initial_schema.sql`: enums, tablas, relaciones, indices y triggers.
- `supabase/migrations/0002_rls_storage.sql`: helpers RLS, politicas por rol y buckets Storage privados.

Buckets privados:

- `invoices`
- `proposals`
- `contracts`
- `customer-documents`
- `installation-photos`

Estructura de path:

```txt
{organization_id}/{customer_id}/{entity_id}/{filename}
```

## Flujo De Validacion Demo

1. Entrar como Laura Martinez.
2. Crear lead en `/leads`.
3. Convertir lead en cliente.
4. Abrir ficha del cliente y guardar perfil energetico.
5. Registrar factura en `/invoices`.
6. Crear simulacion en `/simulations`.
7. Crear propuesta en `/proposals` e imprimir la vista.
8. Crear oportunidad en `/deals`.
9. Mover oportunidad en `/pipeline`.
10. Crear contrato en `/contracts`.
11. Crear instalacion en `/installations`.
12. Guardar ubicacion puntual desde el navegador.
13. Registrar foto tecnica mockeada.
14. Crear tarea de seguimiento en `/tasks`.
15. Ver KPIs y actividad en `/dashboard`.

## Estado Actual

El MVP funciona en modo demo local y compila para produccion. La integracion Supabase real esta preparada a nivel de cliente, migraciones, RLS y Storage; el siguiente paso natural es cambiar los services demo por queries/mutations reales contra Supabase.
