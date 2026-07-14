const state = {
  view: 'dashboard',
  search: '',
  users: [
    { id: 1, name: 'Giulia Rossi', email: 'giulia@demo.it', level: 'Esperta', bottles: 142, status: 'Attivo' },
    { id: 2, name: 'Marco Bianchi', email: 'marco@demo.it', level: 'Intermedio', bottles: 58, status: 'Attivo' },
    { id: 3, name: 'Luca Verdi', email: 'luca@demo.it', level: 'Principiante', bottles: 12, status: 'Sospeso' }
  ],
  wines: [
    { id: 1, name: 'Barolo', producer: 'Cantina Demo', vintage: 2019, region: 'Piemonte', quantity: 12, status: 'In affinamento', price: 46 },
    { id: 2, name: 'Etna Rosso', producer: 'Tenuta Vulcano', vintage: 2021, region: 'Sicilia', quantity: 2, status: 'Da bere', price: 31 },
    { id: 3, name: 'Franciacorta Brut', producer: 'Casa Nord', vintage: 2020, region: 'Lombardia', quantity: 5, status: 'Da regalare', price: 28 }
  ],
  reviews: [
    { id: 4321, wine: 'Barolo 2019', user: 'Giulia Rossi', rating: 5, comment: 'Profondo, lungo, ancora giovane.', status: 'Pubblicata' },
    { id: 4322, wine: 'Etna Rosso 2021', user: 'Marco Bianchi', rating: 4, comment: 'Minerale e molto gastronomico.', status: 'In revisione' }
  ],
  events: [
    { id: 204, title: 'Degustazione Nebbiolo', type: 'Degustazione', city: 'Torino', date: '2026-09-18', status: 'Bozza' },
    { id: 205, title: 'Fiera vini naturali', type: 'Fiera', city: 'Bologna', date: '2026-10-04', status: 'Pubblicato' }
  ],
  reports: [
    { id: 1, item: 'Degustazione #4322', reason: 'Foto da verificare', status: 'In coda' },
    { id: 2, item: 'Commento #991', reason: 'Linguaggio', status: 'Assegnato' },
    { id: 3, item: 'Evento #204', reason: 'Dati incompleti', status: 'Urgente' }
  ]
};

const config = {
  dashboard: { title: 'Controllo operativo', label: 'Pannello amministratore', action: 'Sincronizza' },
  users: { title: 'Gestione utenti', label: 'Account e profili', action: 'Nuovo utente' },
  wines: { title: 'Catalogo vini', label: 'Inventario globale', action: 'Nuovo vino' },
  reviews: { title: 'Recensioni', label: 'Diario degustazioni', action: 'Esporta' },
  events: { title: 'Eventi e mappe', label: 'Enoturismo', action: 'Nuovo evento' },
  moderation: { title: 'Moderazione', label: 'Contenuti segnalati', action: 'Assegna tutto' }
};

const app = document.querySelector('#app');
const title = document.querySelector('#pageTitle');
const label = document.querySelector('#sectionLabel');
const search = document.querySelector('#globalSearch');
const primaryAction = document.querySelector('#primaryAction');
const modal = document.querySelector('#modal');
const modalForm = document.querySelector('#modalForm');
const modalTitle = document.querySelector('#modalTitle');
const modalFields = document.querySelector('#modalFields');
let pendingSave = null;

document.querySelectorAll('nav button').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

search.addEventListener('input', (event) => {
  state.search = event.target.value.toLowerCase();
  render();
});

primaryAction.addEventListener('click', () => {
  if (state.view === 'users') return openUserModal();
  if (state.view === 'wines') return openWineModal();
  if (state.view === 'events') return openEventModal();
  if (state.view === 'moderation') {
    state.reports = state.reports.map((report) => ({ ...report, status: 'Assegnato' }));
    toast('Segnalazioni assegnate al team moderazione.');
    return render();
  }
  toast('Dati sincronizzati nella demo locale.');
});

modalForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  if (pendingSave) pendingSave(new FormData(modalForm));
  modal.close();
  render();
});

function setView(view) {
  state.view = view;
  state.search = '';
  search.value = '';
  document.querySelectorAll('nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  render();
}

function render() {
  const current = config[state.view];
  title.textContent = current.title;
  label.textContent = current.label;
  primaryAction.textContent = current.action;

  const views = {
    dashboard: renderDashboard,
    users: () => renderTable('Utenti registrati', ['Nome', 'Email', 'Livello', 'Bottiglie', 'Stato', 'Azioni'], filtered(state.users), userRow),
    wines: () => renderTable('Vini catalogati', ['Nome', 'Produttore', 'Annata', 'Regione', 'Giacenza', 'Stato', 'Azioni'], filtered(state.wines), wineRow),
    reviews: () => renderTable('Recensioni recenti', ['Vino', 'Utente', 'Voto', 'Commento', 'Stato', 'Azioni'], filtered(state.reviews), reviewRow),
    events: () => renderTable('Eventi', ['Titolo', 'Tipo', 'Citta', 'Data', 'Stato', 'Azioni'], filtered(state.events), eventRow),
    moderation: renderModeration
  };

  views[state.view]();
}

function renderDashboard() {
  const totalBottles = state.wines.reduce((sum, wine) => sum + wine.quantity, 0);
  const value = state.wines.reduce((sum, wine) => sum + wine.quantity * wine.price, 0);
  app.innerHTML = `
    <section class="metrics">
      ${metric('Utenti', state.users.length)}
      ${metric('Bottiglie', totalBottles)}
      ${metric('Valore cantina', `EUR ${value.toLocaleString('it-IT')}`)}
      ${metric('Segnalazioni aperte', state.reports.filter((item) => item.status !== 'Risolto').length)}
    </section>
    <section class="grid-2">
      <div class="card">
        <h2>Scorte basse</h2>
        <div class="list">
          ${state.wines.filter((wine) => wine.quantity <= 2).map((wine) => `
            <div class="list-row">
              <div><strong>${wine.name} ${wine.vintage}</strong><p>${wine.producer} - ${wine.region}</p></div>
              <span class="badge warn">${wine.quantity} rimaste</span>
            </div>
          `).join('') || '<p class="empty">Nessuna scorta bassa.</p>'}
        </div>
      </div>
      <div class="card">
        <h2>Azioni rapide</h2>
        <div class="list">
          <button class="secondary" type="button" onclick="setView('wines')">Apri catalogo vini</button>
          <button class="secondary" type="button" onclick="setView('reviews')">Controlla recensioni</button>
          <button class="secondary" type="button" onclick="setView('events')">Gestisci eventi</button>
          <button class="secondary" type="button" onclick="setView('moderation')">Vai alla moderazione</button>
        </div>
      </div>
    </section>
  `;
}

function renderModeration() {
  renderTable('Coda moderazione', ['Elemento', 'Motivo', 'Stato', 'Azioni'], filtered(state.reports), (report) => `
    <tr>
      <td>${report.item}</td>
      <td>${report.reason}</td>
      <td>${badge(report.status)}</td>
      <td class="actions">
        <button type="button" onclick="resolveReport(${report.id})">Risolvi</button>
        <button type="button" onclick="assignReport(${report.id})">Assegna</button>
      </td>
    </tr>
  `);
}

function renderTable(caption, headers, rows, rowTemplate) {
  app.innerHTML = `
    <section class="table-panel">
      <div class="table-head"><h2>${caption}</h2><span class="badge muted">${rows.length} elementi</span></div>
      <table>
        <thead><tr>${headers.map((head) => `<th>${head}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(rowTemplate).join('') || `<tr><td colspan="${headers.length}" class="empty">Nessun risultato trovato.</td></tr>`}</tbody>
      </table>
    </section>
  `;
}

function userRow(user) {
  return `<tr><td>${user.name}</td><td>${user.email}</td><td>${user.level}</td><td>${user.bottles}</td><td>${badge(user.status)}</td><td class="actions"><button onclick="toggleUser(${user.id})">${user.status === 'Attivo' ? 'Sospendi' : 'Riattiva'}</button></td></tr>`;
}

function wineRow(wine) {
  return `<tr><td>${wine.name}</td><td>${wine.producer}</td><td>${wine.vintage}</td><td>${wine.region}</td><td>${wine.quantity}</td><td>${badge(wine.status)}</td><td class="actions"><button onclick="drinkBottle(${wine.id})">Scala</button><button onclick="restockWine(${wine.id})">+1</button></td></tr>`;
}

function reviewRow(review) {
  return `<tr><td>${review.wine}</td><td>${review.user}</td><td>${review.rating}/5</td><td>${review.comment}</td><td>${badge(review.status)}</td><td class="actions"><button onclick="publishReview(${review.id})">Pubblica</button></td></tr>`;
}

function eventRow(event) {
  return `<tr><td>${event.title}</td><td>${event.type}</td><td>${event.city}</td><td>${event.date}</td><td>${badge(event.status)}</td><td class="actions"><button onclick="publishEvent(${event.id})">Pubblica</button></td></tr>`;
}

function metric(name, value) {
  return `<article class="metric"><span>${name}</span><strong>${value}</strong></article>`;
}

function badge(value) {
  const cls = value === 'Urgente' || value === 'Sospeso' ? 'danger' : value === 'In coda' || value === 'Bozza' || value === 'In revisione' ? 'warn' : '';
  return `<span class="badge ${cls}">${value}</span>`;
}

function filtered(items) {
  if (!state.search) return items;
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(state.search));
}

function openUserModal() {
  openModal('Nuovo utente', [
    field('name', 'Nome'), field('email', 'Email'), field('level', 'Livello'), field('bottles', 'Bottiglie', 'number')
  ], (data) => {
    state.users.push({ id: nextId(state.users), name: data.get('name'), email: data.get('email'), level: data.get('level'), bottles: Number(data.get('bottles') || 0), status: 'Attivo' });
    toast('Utente creato nella demo.');
  });
}

function openWineModal() {
  openModal('Nuovo vino', [
    field('name', 'Nome'), field('producer', 'Produttore'), field('vintage', 'Annata', 'number'), field('region', 'Regione'), field('quantity', 'Quantita', 'number'), field('price', 'Prezzo medio', 'number')
  ], (data) => {
    state.wines.push({ id: nextId(state.wines), name: data.get('name'), producer: data.get('producer'), vintage: Number(data.get('vintage')), region: data.get('region'), quantity: Number(data.get('quantity') || 1), price: Number(data.get('price') || 0), status: 'In affinamento' });
    toast('Vino aggiunto al catalogo demo.');
  });
}

function openEventModal() {
  openModal('Nuovo evento', [
    field('title', 'Titolo'), field('type', 'Tipo'), field('city', 'Citta'), field('date', 'Data', 'date')
  ], (data) => {
    state.events.push({ id: nextId(state.events), title: data.get('title'), type: data.get('type'), city: data.get('city'), date: data.get('date'), status: 'Bozza' });
    toast('Evento creato nella demo.');
  });
}

function openModal(title, fields, onSave) {
  modalTitle.textContent = title;
  modalFields.innerHTML = fields.join('');
  pendingSave = onSave;
  modal.showModal();
}

function field(name, label, type = 'text') {
  return `<label>${label}<input name="${name}" type="${type}" required></label>`;
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function toggleUser(id) {
  const user = state.users.find((item) => item.id === id);
  user.status = user.status === 'Attivo' ? 'Sospeso' : 'Attivo';
  toast(`Stato utente aggiornato: ${user.status}.`);
  render();
}

function drinkBottle(id) {
  const wine = state.wines.find((item) => item.id === id);
  if (wine.quantity === 0) return toast('Giacenza gia a zero.');
  wine.quantity -= 1;
  wine.status = wine.quantity === 0 ? 'Terminato' : wine.status;
  toast('Bottiglia scalata. Nel mobile questo richiede recensione obbligatoria.');
  render();
}

function restockWine(id) {
  const wine = state.wines.find((item) => item.id === id);
  wine.quantity += 1;
  if (wine.status === 'Terminato') wine.status = 'In affinamento';
  toast('Giacenza aumentata.');
  render();
}

function publishReview(id) {
  state.reviews.find((item) => item.id === id).status = 'Pubblicata';
  toast('Recensione pubblicata.');
  render();
}

function publishEvent(id) {
  state.events.find((item) => item.id === id).status = 'Pubblicato';
  toast('Evento pubblicato.');
  render();
}

function resolveReport(id) {
  state.reports.find((item) => item.id === id).status = 'Risolto';
  toast('Segnalazione risolta.');
  render();
}

function assignReport(id) {
  state.reports.find((item) => item.id === id).status = 'Assegnato';
  toast('Segnalazione assegnata.');
  render();
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 2600);
}

render();



