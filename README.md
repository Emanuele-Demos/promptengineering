# TeamFlow — Task Management

Web app per gestire il team di lavoro e i task del progetto.

## Funzionalità

- **Dashboard** — statistiche, task recenti, alert scadenze, carico di lavoro per membro
- **Board Kanban** — colonne Da fare / In corso / In revisione / Completato con drag & drop
- **Team** — CRUD membri con nome, email e ruolo
- **Task** — titolo, descrizione, priorità, assegnazione, scadenza, tag
- **Persistenza** — dati salvati in localStorage del browser

## Avvio rapido

```bash
npm install
npm run dev
```

Apri [http://localhost:5173](http://localhost:5173) nel browser.

## Build produzione

```bash
npm run build
npm run preview
```

## Stack tecnologico

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router
- Lucide Icons

## Prossimi passi suggeriti

- Backend (API REST + database) per sync multi-utente
- Autenticazione e permessi per ruolo
- Notifiche scadenze
- Progetti multipli / workspace
- Commenti e allegati sui task
