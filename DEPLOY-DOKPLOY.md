# Desplegament a Dokploy

## Tipus d'aplicació
- **Application** (no Compose).
- **Build type: Dockerfile** (hi ha un `Dockerfile` a l'arrel).
- **Port: 3000**.
- Assigna un domini → Dokploy fa el reverse proxy + SSL.

## Font del codi
Dokploy necessita un **repositori Git** (GitHub/Gitea/GitLab) o una imatge Docker.
Cal pujar `residus-app` a un repo i connectar-lo a Dokploy.

## Variables d'entorn (a Environment de l'app)

```
# Base de dades (PostgreSQL)
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DBNAME

# Auth — IMPORTANT: ha de ser el domini de producció
NEXTAUTH_SECRET=<cadena llarga aleatòria>
NEXTAUTH_URL=https://EL-TEU-DOMINI

# Superadmin (login mestre)
SUPERADMIN_USER=adminsole
SUPERADMIN_PASS=<contrasenya forta>

# Emmagatzematge de fotos (Hetzner Object Storage, S3) — opcional fins que es configuri
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Webhook d'esdeveniments (Motor / n8n) — opcional fins que es configuri
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=

# Google Calendar mirall (Fase posterior) — opcional
GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=

# Enllaços (deeplinks de les notificacions) — el domini de producció
APP_BASE_URL=https://EL-TEU-DOMINI
```

## Notes
- En arrencar, el contenidor executa `prisma migrate deploy` (aplica migracions pendents) i després `next start`.
- Si la BD de producció és **la mateixa** que la de desenvolupament (`sole`), les migracions ja hi són i el seed també.
  Si és **nova**, després del primer desplegament cal executar el seed un cop (`npx tsx prisma/seed.ts`) o crear el superadmin (que ja existeix via env).
- `NEXTAUTH_URL` i `APP_BASE_URL` han d'apuntar al domini públic, si no el login i els enllaços de notificació fallaran.
