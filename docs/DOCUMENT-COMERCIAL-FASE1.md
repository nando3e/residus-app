# Gestió operativa de recollides de residus
## Document comercial — Fase 1

**Versió:** juny 2026  
**Estat del projecte:** Fase 1 en desenvolupament / rodatge  
**Àmbit:** Digitalització de l'execució diària sense substituir l'agendament ni l'assignació estratègica de viatges

---

## Guia de captures per al document de venda

**Ordre recomanat per muntar el PDF:** les captures marcades amb ⭐ són imprescindibles (portada + demo de 5 minuts). La resta reforcen confiança i detall.

| # | On va al document | Què capturar | Dispositiu |
|---|-------------------|--------------|------------|
| ⭐1 | Portada / §1 | Vista general del tauler amb jornada plena | Escriptori 1440px |
| ⭐2 | §1 / §4.2 | App conductor: llista de viatges del dia | iPhone real |
| ⭐3 | §4.1 | Vista setmana amb diversos camions i colors | Escriptori |
| ⭐4 | §4.1 | Mode assignació actiu (banner + viatges seleccionats) | Escriptori |
| ⭐5 | §4.1 | Modal «Verificar assignacions» abans de publicar | Escriptori |
| ⭐6 | §4.2 | Targeta de viatge expandida (Maps, telèfon, botons) | iPhone |
| ⭐7 | §4.3 | Formulari d'incidència obert | iPhone |
| ⭐8 | §4.7 | Historial amb columna Estat i filtres | Escriptori |
| 9 | §2 | Comparativa abans/després (Calendar vs app) — **montatge** | Disseny |
| 10 | §3 | Pantalla de login | Mòbil o escriptori |
| 11 | §4.1 | Vista Kanban per camions | Escriptori |
| 12 | §4.1 | Detall borrador (vora discontínua) vs publicat (vora sòlida) | Escriptori |
| 13 | §4.1 | Modal del viatge: galeria + historial de canvis | Escriptori |
| 14 | §4.1 | Tauler amb estat actualitzat en temps real | Escriptori |
| 15 | §4.2 | Viatges recollits en gris + pendents en blanc | iPhone |
| 16 | §4.2 | «Notes desades» desplegades | iPhone |
| 17 | §4.2 | «Afegir foto o nota» + foto feta | iPhone |
| 18 | §4.3 | Incidència visible al modal del viatge (tauler) | Escriptori |
| 19 | §4.4 | Bústia de fotos pendents | Escriptori |
| 20 | §4.4 | Assignació de foto a viatge (2 clics) | Escriptori |
| 21 | §4.5 | Foto del client inline a la targeta del conductor | iPhone |
| 22 | §4.6 | Missatge Telegram/WhatsApp al conductor (exemple real) | Mòbil |
| 23 | §4.7 | Exportació CSV / botó descarregar | Escriptori |
| 24 | §4.8 | Admin camions amb colors i conductors | Escriptori |
| 25 | §4.8 | Fitxa de client amb instruccions especials | Escriptori |
| 26 | §8 | **Doble pantalla:** tauler + mòbil mateix viatge | Montatge |
| 27 | Annex | PWA «Afegir a la pantalla d'inici» (iOS/Android) | Mòbil |

> **Consell de venda:** usa dades reals però anonimitzades (noms de clients genèrics si cal). Omple una jornada de demo amb 6–8 viatges, 2 camions, 1 incidència i 2–3 fotos: el document «respira» operativa real.

---

## 1. Resum executiu

Aquesta aplicació substitueix el flux manual actual — Google Calendar, paper, trucades i WhatsApp — per un sistema únic on el **despatx planifica i publica la jornada**, els **xofers executen els viatges des del mòbil** i tot queda **registrat, traçable i consultable**.

El problema que resol de manera directa: cada canvi d'estat ja no passa per una trucada al cap. El xofer prem un botó; el tauler s'actualitza en temps real; les incidències queden categoritzades; les fotos del client s'associen al viatge correcte.

**Fase 1** cobreix el nucli operatiu: tauler de despatx, publicació de jornada, app del conductor, incidències, historial, emmagatzematge de fotos i notificacions via integració externa (n8n). L'agendament de recollides i l'optimització de rutes **continuen sent decisions humanes** del client, com es va acordar al boceto inicial.

**************** CAPTURA DE PANTALLA DE PORTADA: tauler de despatx (vista setmana) amb una jornada completa — diversos camions, colors, viatges de 8h a 18h, sensació de «tot sota control» ****************

**************** CAPTURA DE PANTALLA DE PORTADA 2 (opcional): mateixa jornada a l'app del conductor al mòbil — llista de viatges ordenats per hora ****************

---

## 2. Context i objectiu

| Situació actual | Objectiu Fase 1 |
|-----------------|-----------------|
| ~6 camions, ~30 recollides/dia | Una font de veritat per a l'execució del dia |
| Google Calendar com a agenda visual | El tauler de l'app com a centre operatiu; Calendar queda fora d'abast (Fase 1) o com a mirall futur |
| Comunicació xofer → cap per telèfon | Botons d'estat + incidències tipificades + notes |
| Fotos del client per WhatsApp/correu disperses | Bústia centralitzada + assignació al viatge |
| Historial en paper o inexistent | Historial filtrable i exportació CSV |

**************** CAPTURA DE PANTALLA COMPARATIVA (MONTATGE): a l'esquerra Google Calendar amb molts colors confusos / a la dreta el tauler de l'app amb vista setmana neta — títol suggerit: «Abans → Després» ****************

---

## 3. Usuaris i rols

L'aplicació és **multiusuari** amb autenticació segura (usuari i contrasenya).

| Rol | Qui és | Accés principal |
|-----|--------|-----------------|
| **Gestió** | Cap / despatx | Tauler, bústia de fotos, historial, clients |
| **Conductor** | Xofer | App mòbil: viatges del dia, estats, incidències, fotos i notes |
| **Superadmin** | Tècnic / manteniment | Tot el anterior + camions, usuaris, documentació de fluxos |

Cada conductor pot tenir assignat un camió, telèfon i identificador de Telegram per a les notificacions automàtiques.

**************** CAPTURA DE PANTALLA DE la pantalla de login (mòbil o escriptori) — aspecte net, professional, logo «Gestió de Residus» ****************

---

## 4. Components de la solució (Fase 1)

### 4.1. Tauler de despatx (web)

Centre de control per a la gestió diària. Accessible des de navegador (escriptori o tablet).

#### Dues vistes del mateix contingut

- **Vista setmana (timeline):** graella horària (6:00–21:00) per dia. Permet veure solapaments, arrossegar viatges per canviar hora i crear viatges en franges buides.
- **Vista Kanban:** columnes per camió + columna «sense assignar». Visió ràpida de la càrrega per vehicle.

**************** CAPTURA DE PANTALLA DE la vista setmana (timeline) amb almenys 3 camions de colors diferents i 8+ viatges en un sol dia ****************

**************** CAPTURA DE PANTALLA DE la vista Kanban amb columnes per camió + columna «Sense assignar» i targetes de viatge visibles ****************

> *Nota d'implementació:* existeix un component de calendari tipus «post-it» al codi que encara no està activat a la interfície; la vista operativa principal és la setmana + Kanban.

#### Mode d'assignació ràpida

1. Prem **Assignar** i tria el camió actiu.
2. Banner fix: «Assignant a: [Camió X] — N viatges seleccionats».
3. Clica viatges a la vista: es marquen en temps real; tornar a clicar deselecciona.
4. **OK** desa com a **borrador** (vora discontínua). Els xofers **no veuen** res fins que es publiqui.
5. Clic individual sobre un viatge → modal amb selector de camió (correccions puntuals).

**************** CAPTURA DE PANTALLA DEL mode assignació actiu: banner superior «Assignant a: Camió X — N viatges seleccionats» + viatges marcats/seleccionats a la graella ****************

**************** CAPTURA DE PANTALLA DE detall visual borrador vs publicat: dos viatges junts — un amb vora discontínua (borrador) i un amb vora sòlida de color del camió (publicat) ****************

#### Verificar i publicar

- **Verificar assignacions:** resum per camió de tots els viatges del dia abans de publicar.
- **Publicar jornada:** en aquell moment els conductors reben la notificació (via integració n8n → Telegram/WhatsApp, si està configurat). Abans no veuen cap viatge.
- **Visual:** vora sòlida / estil «publicat» vs vora discontínua / «borrador».
- Es pot **republicar** després de canvis (p. ex. «Publicar canvis»).

**************** CAPTURA DE PANTALLA DEL modal «Verificar assignacions» amb resum per camió (llista de viatges agrupats) i botó de publicar visible ****************

**************** CAPTURA DE PANTALLA DEL botó «Publicar jornada» / «Publicar canvis» al tauler (context: capçalera del dia o Kanban) ****************

#### Gestió de viatges

- Crear, editar i eliminar viatges.
- Dades per viatge: client, tipus de residu, data, hora prevista, adreça, instruccions, camió, estat d'execució, pes real (quan s'informi), observacions.
- **Historial de canvis** dins del modal del viatge (hora, camió, estat, notes del conductor).
- **Galeria de fotos** del viatge (client + conductor), visibles inline.

**************** CAPTURA DE PANTALLA DEL modal del viatge (tauler): client, residu, camió, galeria de fotos en miniatura, secció «Historial de canvis» amb notes del conductor ****************

**************** CAPTURA DE PANTALLA DE una foto del viatge en gran (lightbox) des del modal — demostra que les imatges es veuen integrades, sense enllaços externs ****************

#### Actualització en temps real

El tauler es refresca automàticament quan un conductor canvia un estat, s'assignen viatges o es publica la jornada (tecnologia SSE — Server-Sent Events).

**************** CAPTURA DE PANTALLA DEL tauler amb un viatge en estat «En camí» o «Arribada a client» (etiqueta d'estat visible a la targeta) — idealment just després que el conductor hagi premut el botó al mòbil ****************

---

### 4.2. App del conductor (PWA mòbil)

Aplicació web optimitzada per a mòbil, instal·lable des del navegador (sense App Store). Funciona a Android i iOS.

**************** CAPTURA DE PANTALLA DE «Afegir a la pantalla d'inici» a iOS o Android + icona de l'app al costat de les altres — demostra que no cal App Store ****************

#### Pantalla principal

- Llista vertical dels **viatges publicats del dia** del camió assignat, ordenats per hora.
- Cada targeta mostra: hora, client, tipus de residu, estat actual, instruccions.
- En expandir: adreça amb enllaç a **Google Maps**, telèfon del client (trucada directa), fotos del client, botons d'acció.

**************** CAPTURA DE PANTALLA DE la llista de viatges del conductor (mòbil): capçalera «X viatges avui», diverses targetes amb hora + client + residu + etiqueta d'estat ****************

**************** CAPTURA DE PANTALLA DE una targeta de viatge expandida: botons «Navegar» i «Telèfon», instruccions en groc/àmbar si n'hi ha, fotos del client en miniatura ****************

#### Flux d'estats (botons grans)

| Botó | Estat al sistema | Descripció |
|------|------------------|------------|
| En camí | `en_cami` | El xofer surt cap al client |
| Arribada a client | `arribat` | Ha arribat a les instal·lacions |
| Recollit | `recollit_ok` | Recollida completada sense incidència greu |
| No recollit | `recollit_incidencia` | Obre flux de motiu (incidència associada) |
| Afegir incidència | — | Formulari amb tipus predefinits (vegeu 4.3) |
| Fer foto / adjuntar | — | Càmera o galeria; compressió automàtica |
| Nota lliure | — | Text opcional; queda al historial del viatge |

**************** CAPTURA DE PANTALLA DELS botons d'estat grans («En camí», «Arribada a client», «Recollit», «No recollit») en un viatge a nivell «Arribada» — botó següent ressaltat ****************

**Visualització intel·ligent:** els viatges ja tancats (recollit / no recollit) es mostren amb fons gris per destacar els pendents. El conductor pot consultar les **notes ja enviades** en un desplegable compacte («Notes desades»).

**************** CAPTURA DE PANTALLA DE la mateixa llista amb viatges recollits en fons gris i un viatge pendent en blanc — contraste visual clar ****************

**************** CAPTURA DE PANTALLA DE «Notes desades (N)» desplegades amb hora + text de cada nota ****************

**************** CAPTURA DE PANTALLA DE la secció «Afegir foto o nota» amb textarea + botó càmera + missatge «Nota desada ✓» ****************

> *Pendent a Fase 1 (codi preparat, UI no activada):* botons **A la planta** i **Descàrrega completada** (amb pes i observacions). Aquests estats existeixen a la base de dades i apareixen a l'historial, però el conductor encara no els disposa a la pantalla principal.

#### Canvis després de sortir

Si el despatx modifica hora, dia o camió d'un viatge ja publicat, el sistema pot enviar notificació al conductor amb el detall del canvi (via webhook n8n).

---

### 4.3. Incidències tipificades

No és un camp de text lliure sense estructura: cada incidència té **tipus** per poder analitzar i actuar.

| Tipus | Comportament |
|-------|----------------|
| **Retard** | Estimació de temps (minuts) |
| **Client tancat / ningú** | Detall obligatori; alerta al despatx |
| **Residu no apte o diferent** | Foto obligatòria a la interfície |
| **Problema amb el camió** | Notificació crítica al gestor (n8n) |
| **Altra** | Text + foto opcional |

Cada incidència registra **data i hora**. El model preveu coordenades GPS (`lat`/`lng`), però la captura des del mòbil encara no està activada a la interfície.

El conductor pot **editar o esborrar** incidències des de la mateixa targeta del viatge. Al tauler, les incidències es veuen al modal del viatge amb les seves fotos.

**************** CAPTURA DE PANTALLA DEL formulari d'incidència al mòbil: selector de tipus, camp detall, botó afegir foto, botó enviar ****************

**************** CAPTURA DE PANTALLA DEL popup «No recollit» amb motiu (si es diferencia del formulari general d'incidència) ****************

**************** CAPTURA DE PANTALLA DEL modal del viatge al tauler amb incidència registrada + miniatures de fotos de la incidència ****************

---

### 4.4. Bústia de fotos del client

Centralitza les fotos que els clients envien abans de la recollida (contenidor, ubicació, etc.).

#### Com funciona avui

1. Les fotos arriben a la **bústia de pendents** (càrrega manual des del tauler o, en producció, via integració externa).
2. El gestor veu miniatures i tria el **viatge** correcte (client + data + residu del dia).
3. En assignar, la foto passa al viatge i és visible al **tauler** i a l'**app del conductor**.

**************** CAPTURA DE PANTALLA DE la bústia de fotos pendents: graella de miniatures + comptador de pendents ****************

**************** CAPTURA DE PANTALLA DEL flux d'assignació: modal o selector «triar viatge» (client + data + residu) amb la foto seleccionada ****************

#### Canals previstos al boceto (estat)

| Canal | Estat Fase 1 |
|-------|----------------|
| Càrrega manual / des del tauler | **Operatiu** |
| Bot de Telegram (reenviament + tria de viatge) | **Pendent** — requereix flux n8n / bot extern |
| Correu entrant + parsing + matching automàtic | **Pendent** — previst al Motor (n8n); l'app té model `FotoPendent` i origen `telegram` / `correu` |
| Matching automàtic (client + data + residu) | **Pendent** — dependència d'integració; no implementat dins l'app |

**************** CAPTURA DE PANTALLA (FUTUR / MOCKUP OPCIONAL): conversa de Telegram amb el bot demanant «a quin viatge va aquesta foto?» — només si ja teniu n8n; si no, ometre o posar «Properament» ****************

**Premissa de negoci:** un client no té dos viatges el mateix dia amb el mateix tipus de residu. Això simplifica l'assignació.

---

### 4.5. Emmagatzematge de fotos

- Producció: **Hetzner Object Storage** (compatible S3).
- Les fotos es mostren **inline** a l'aplicació (sense enllaços externs ni descàrregues obligatòries).
- Compressió automàtica al mòbil abans de pujar (menys consum de dades i emmagatzematge).
- Si S3 no està configurat, el sistema pot desar temporalment en base64 (mode desenvolupament / fallback).

**************** CAPTURA DE PANTALLA DE la mateixa foto del residu visible al conductor (targeta expandida) i al tauler (modal del viatge) — montatge «una foto, dos llocs» ****************

Estimació del boceto: ~30 recollides/dia × 2–3 fotos × 500 KB ≈ 15 GB/any; cost orientatiu ~6 €/mes (més manteniment inclòs fins a 50 GB).

---

### 4.6. Comunicacions i notificacions

L'aplicació **no envia WhatsApp/Telegram directament**: genera esdeveniments estructurats cap a un **webhook n8n** (Motor de notificacions), que el client pot configurar per Telegram, WhatsApp, correu, etc.

| Esdeveniment | Direcció | Estat |
|--------------|----------|--------|
| Publicació de jornada | Despatx → Conductor | **Implementat** (webhook) |
| Canvi post-publicació (hora, dia, camió) | Despatx → Conductor | **Implementat** |
| Cancel·lació de viatge publicat | Despatx → Conductor | **Implementat** |
| Incidència crítica (camió, client tancat) | Conductor → Gestor | **Implementat** (webhook) |
| Canvi d'estat del conductor | Conductor → Tauler | **Implementat** (temps real SSE) |
| Canvis en borrador | — | Sense notificació (com acordat) |

**Exemple de missatge al conductor:**  
*«El teu viatge a [Client] ([residu]) ha canviat d'hora: 9:00 → 11:30.»* (+ enllaç a l'app si `APP_BASE_URL` està configurat)

**************** CAPTURA DE PANTALLA D'una notificació real a Telegram o WhatsApp al conductor: «Jornada publicada» o «El teu viatge a [Client] ha canviat d'hora: 9:00 → 11:30» ****************

**************** CAPTURA DE PANTALLA (OPCIONAL): notificació al gestor per incidència crítica («Problema amb el camió» o «Client tancat») ****************

> *Pendent:* enllaç profund (`deeplink`) a un viatge concret — la ruta dedicada encara no existeix; l'enllaç pot apuntar a la pantalla general del conductor.

---

### 4.7. Historial i reporting

- Pantalla **Historial** amb filtres per **rang de dates**, camió i client.
- Mostra **tots els viatges** del període, amb qualsevol estat d'execució (no només descàrrega completada).
- Columna **Estat** amb etiqueta visual en color (Recollit, No recollit, En camí, Descàrrega completada, etc.).
- Clic a una fila → modal de detall complet (mateix que al tauler).
- **Exportació CSV** des del navegador (data, hora, client, residu, camió, conductor, estat, pes, observacions, incidències).

Útil per a facturació, reclamacions, reunions amb clients i auditoria interna.

**************** CAPTURA DE PANTALLA DE l'historial: taula completa amb columnes Data, Hora, Client, Residu, Camió, Conductor, Estat (píndoles de color), Pes, Incidències ****************

**************** CAPTURA DE PANTALLA DELS filtres d'historial (data inici → data fi, camió, client) + botó «Filtrar» ****************

**************** CAPTURA DE PANTALLA DEL botó «Exportar CSV» a la capçalera de l'historial ****************

**************** CAPTURA DE PANTALLA (OPCIONAL): full de càlcul obert amb el CSV exportat — reforça valor per a facturació ****************

---

### 4.8. Administració

| Mòdul | Funcionalitat |
|-------|----------------|
| **Clients** | Alta, edició, baixa; telèfon, adreça, instruccions especials |
| **Camions** | Nom, matrícula, color (identificació visual al tauler), conductor assignat |
| **Usuaris** | Gestió d'accés, rols, telèfon i Telegram per notificacions |
| **Fluxos** | Pàgina informativa sobre integracions previstes (n8n, Telegram, etc.) |

**************** CAPTURA DE PANTALLA DE la llista de camions amb colors, matrícula i conductor assignat a cada fila ****************

**************** CAPTURA DE PANTALLA DE la fitxa o llista de clients amb instruccions especials visibles ****************

**************** CAPTURA DE PANTALLA (OPCIONAL): pantalla d'usuaris amb rols (gestió / conductor) i camps Telegram/telèfon ****************

---

## 5. Què queda fora de la Fase 1 (com al boceto)

Aquests punts **no formen part** de l'abast actual i es mantenen per a fases posteriors:

| Fora d'abast Fase 1 | Fase prevista |
|---------------------|---------------|
| Agendament assistit de recollides | Llarg termini |
| Assignació automàtica de viatges a camions | Llarg termini |
| Optimització de rutes | Llarg termini |
| Mirall Google Calendar (només lectura) | Previst al boceto; **no iniciat** (variables d'entorn reservades) |
| Albarà digital + facturació | Fase 2 / llarg termini |

### Fase 2 — Roadmap (referència del boceto)

- Assistent de veu per assignar i consultar
- Classificació IA de fotos entrants
- Resum diari automàtic
- Mapa amb posició GPS dels camions
- Signatura digital del client a la recollida
- Integració ERP / CRM

**************** CAPTURA DE PANTALLA (OPCIONAL / CONCEPTUAL): mockup o il·lustració «Fase 2» — mapa amb camions, signatura digital — per tancar el document mirant endavant ****************

---

## 6. Estat d'implementació (transparència tècnica)

Resum honest per al client — juny 2026:

| Àrea | Completitud orientativa | Comentari |
|------|-------------------------|-----------|
| Tauler (setmana + Kanban, assignació, publicar) | ~90 % | Nucli operatiu en ús |
| App conductor (estats principals, incidències, fotos, notes) | ~75 % | Falten passos planta/descàrrega a la UI |
| Incidències tipificades | ~90 % | Sense GPS automàtic a la UI |
| Historial + CSV | ~95 % | Tots els estats al filtre |
| Emmagatzematge S3 (Hetzner) | ~85 % | Operatiu amb fallback |
| Rol multiusuari + login | ~85 % | Matriu de permisos fina pendent a API |
| Notificacions Telegram/WhatsApp | ~50 % | Depèn de n8n configurat |
| Bústia + bot Telegram + correu + auto-match | ~40 % | UI manual OK; canals automàtics pendents |
| Google Calendar | 0 % | No iniciat |
| PWA offline completa | Parcial | Manifest + instal·lable; sense service worker |

**Dependències externes recomanades per a producció:**

1. **PostgreSQL** — base de dades  
2. **Hetzner Object Storage** — fotos  
3. **n8n** (o equivalent) — Telegram, WhatsApp, correu, matching de fotos  
4. **Dokploy / Docker** — desplegament (documentat al projecte)

---

## 7. Arquitectura (visió no tècnica)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Tauler web     │     │  App conductor   │     │  Admin          │
│  (gestió)       │     │  (PWA mòbil)     │     │  (config)       │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                          │
         └───────────────────────┼──────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Servidor aplicació    │
                    │  (Next.js + API)       │
                    └───────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │ PostgreSQL   │  │ Hetzner S3   │  │ n8n webhook  │
      │ (viatges,    │  │ (fotos)      │  │ (Telegram,   │
      │  usuaris…)   │  │              │  │  WhatsApp…)  │
      └──────────────┘  └──────────────┘  └──────────────┘
```

*(Aquest diagrama es pot deixar com a gràfic vectorial; no cal captura de pantalla de l'app.)*

---

## 8. Beneficis mesurables per al client

1. **Menys trucades** — Els estats i incidències arriben sols al tauler.  
2. **Menys errors** — Publicació controlada: el xofer només veu la jornada validada.  
3. **Traçabilitat** — Qui va fer què i quan (log de canvis + incidències + notes).  
4. **Fotos centralitzades** — Un sol lloc per associar evidències al viatge.  
5. **Historial exportable** — Dades per a gestió, clients i millora contínua.  
6. **Escalable** — Mateixa plataforma per a 6 camions avui i més demà (sense canviar d'eina).

**************** CAPTURA DE PANTALLA «KILLER» (MONTATGE): escriptori amb el tauler + mòbil al costat amb el MATEIX viatge obert — el cap veu al tauler el que el conductor acaba de marcar («En camí» / «Recollit»). Títol: «Sense trucades. En temps real.» ****************

---

## 9. Proposta econòmica (referència del boceto inicial)

| Concepte | Import |
|----------|--------|
| Desenvolupament Fase 1 | 1.790 € + IVA |
| Manteniment mensual (hosting, suport, actualitzacions, fins a 50 GB fotos) | 126 €/mes + IVA |

El manteniment inclou hosting, emmagatzematge de fotos fins a 50 GB, suport tècnic i actualitzacions menors. Per sobre de 50 GB s'ajusta proporcionalment.

La **Fase 2** es pressupostarà un cop la Fase 1 estigui en producció i consolidada.

---

## 10. Propers passos recomanats

1. **Rodatge** amb jornada real: publicar, executar des del mòbil, provar incidències i historial.  
2. **Configurar n8n** per a notificacions Telegram/WhatsApp als conductors.  
3. **Activar Hetzner S3** en producció per a fotos.  
4. **Prioritzar pendents Fase 1** segons negoci:  
   - Bot Telegram + matching de fotos  
   - Passos «A la planta» / «Descàrrega completada» al conductor  
   - Mirall Google Calendar (si el client el demana)  
5. **Validar** decisions del boceto (notificacions automàtiques vs manuals, ús de Calendar).  
6. **Planificar Fase 2** un cop consolidat l'ús diari.

---

## 11. Glossari ràpid

| Terme | Significat |
|-------|------------|
| **Viatge** | Una recollida programada (client + data + residu + hora) |
| **Jornada** | Conjunt de viatges d'un dia, assignats i publicats |
| **Borrador** | Viatge assignat a camió però encara no visible pel conductor |
| **Publicat** | Viatge visible a l'app del conductor assignat |
| **Bústia** | Safata de fotos pendents d'associar a un viatge |
| **Motor (n8n)** | Automatització externa per missatges i integracions |

---

## Annex: checklist ràpida per fer les captures

Imprimeix o marca aquesta llista mentre prepares la demo:

- [ ] 1. Tauler vista setmana (jornada plena) — **portada**
- [ ] 2. Vista Kanban
- [ ] 3. Mode assignació + banner
- [ ] 4. Borrador vs publicat (zoom)
- [ ] 5. Verificar assignacions
- [ ] 6. Publicar jornada
- [ ] 7. Modal viatge + fotos + historial
- [ ] 8. Conductor: llista viatges
- [ ] 9. Conductor: targeta expandida (Maps/telèfon)
- [ ] 10. Conductor: botons d'estat
- [ ] 11. Conductor: grisos vs pendents
- [ ] 12. Notes desades
- [ ] 13. Afegir foto/nota
- [ ] 14. Formulari incidència
- [ ] 15. Incidència al tauler
- [ ] 16. Bústia + assignació foto
- [ ] 17. Historial + filtres + CSV
- [ ] 18. Login
- [ ] 19. Camions (colors)
- [ ] 20. Clients
- [ ] 21. Notificació Telegram/WhatsApp
- [ ] 22. PWA «Afegir a inici»
- [ ] 23. Montatge abans/després Calendar
- [ ] 24. Montatge tauler + mòbil temps real — **tancament**

---

*Document generat a partir del boceto de juny 2025 i de l'estat real del programari (juny 2026). Substituïu cada bloc `**************** CAPTURA... ****************` per la imatge corresponent en exportar a PDF.*
