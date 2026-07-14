const API_BASE_URL = 'http://127.0.0.1:8080/api/v1';

const state = {
  view: 'home',
  filter: 'Tutti',
  selectedWineId: null,
  addMode: 'Manuale',
  lowImpactOnly: false,
  aiResult: null,
  translationResult: null,
  blindResult: null,
  groupResult: null,
  userPosition: null,
  nearbyStatus: 'Non ancora cercato',
  nearbyPlaces: [
    { id: 1, name: 'Cantina del Colle', type: 'Cantina', lat: 41.9022, lng: 12.4539, region: 'Lazio', specialty: 'Cesanese e bianchi vulcanici', open: 'Aperta oggi fino alle 19:00' },
    { id: 2, name: 'Enoteca Centro', type: 'Enoteca', lat: 41.8957, lng: 12.4823, region: 'Lazio', specialty: 'Selezione naturali e Champagne', open: 'Aperta oggi fino alle 21:00' },
    { id: 3, name: 'Tenuta Appia Antica', type: 'Wine Bar', lat: 41.8567, lng: 12.5182, region: 'Lazio', specialty: 'Degustazioni al calice', open: 'Apre alle 18:00' },
    { id: 4, name: 'Vigneti del Lago', type: 'Cantina', lat: 42.1018, lng: 12.1766, region: 'Lazio', specialty: 'Malvasia puntinata', open: 'Visite su prenotazione' }
  ],
  wines: [
    {
      id: 1,
      name: 'Barolo',
      producer: 'Cantina Demo',
      vintage: 2019,
      region: 'Piemonte',
      grape: 'Nebbiolo',
      denomination: 'DOCG',
      quantity: 12,
      status: 'In affinamento',
      paid: 38,
      market: 46,
      position: 'A1',
      shelf: 'A',
      idealStart: 2027,
      idealEnd: 2036,
      pairing: 'Brasato, tartufo, formaggi stagionati',
      temperature: '18 C',
      note: 'Tannino setoso, acidita viva, finale balsamico.',
      style: ['strutturato', 'tannico', 'speziato'],
      foodTags: ['carne', 'funghi', 'panna', 'formaggi'],
      sustainability: { distanceKm: 126, farming: 'biologico', bottleWeight: 620 },
      ar: { place: 'Langhe', story: 'Vigne alte su marne calcaree, maturazione lenta e lunga capacita di evoluzione.', aromas: ['ciliegia', 'rosa', 'liquirizia'] }
    },
    {
      id: 2,
      name: 'Etna Rosso',
      producer: 'Tenuta Vulcano',
      vintage: 2021,
      region: 'Sicilia',
      grape: 'Nerello Mascalese',
      denomination: 'DOC',
      quantity: 2,
      status: 'Da bere',
      paid: 24,
      market: 31,
      position: 'B3',
      shelf: 'B',
      idealStart: 2025,
      idealEnd: 2029,
      pairing: 'Tonno, funghi, arrosti leggeri',
      temperature: '16 C',
      note: 'Minerale, agile, tannino fine e frutto rosso croccante.',
      style: ['minerale', 'fresco', 'fruttato'],
      foodTags: ['pollo', 'funghi', 'tonno', 'verdure'],
      sustainability: { distanceKm: 920, farming: 'biodinamico', bottleWeight: 520 },
      ar: { place: 'Versante nord Etna', story: 'Suolo vulcanico, altitudine e sbalzi termici danno energia e sapidita.', aromas: ['lampone', 'cenere', 'erbe'] }
    },
    {
      id: 3,
      name: 'Franciacorta Brut',
      producer: 'Casa Nord',
      vintage: 2020,
      region: 'Lombardia',
      grape: 'Chardonnay, Pinot Nero',
      denomination: 'DOCG',
      quantity: 5,
      status: 'Da regalare',
      paid: 22,
      market: 28,
      position: 'C2',
      shelf: 'C',
      idealStart: 2024,
      idealEnd: 2028,
      pairing: 'Aperitivo, crudi, fritti, panna',
      temperature: '8 C',
      note: 'Bollicina cremosa, agrumi, crosta di pane e finale sapido.',
      style: ['fresco', 'cremoso', 'sapido'],
      foodTags: ['pollo', 'panna', 'pesce', 'fritti'],
      sustainability: { distanceKm: 86, farming: 'integrata', bottleWeight: 780 },
      ar: { place: 'Franciacorta', story: 'Anfiteatro morenico vicino al lago, metodo classico e lunga sosta sui lieviti.', aromas: ['limone', 'pane', 'mandorla'] }
    }
  ],
  tastings: [
    { id: 1, wine: 'Chianti Classico 2020', grape: 'Sangiovese', region: 'Toscana', rating: 4, date: '12 Lug 2026', comment: 'Sangiovese pulito, bel frutto e finale sapido.', pairing: 'Pici al ragu' },
    { id: 2, wine: 'Verdicchio 2022', grape: 'Verdicchio', region: 'Marche', rating: 5, date: '04 Lug 2026', comment: 'Fresco, agrumato, perfetto con il pesce.', pairing: 'Orata al forno' }
  ],
  friends: [
    { name: 'Giulia', likes: ['fresco', 'fruttato', 'sapido'], dislikes: ['troppo tannico'] },
    { name: 'Marco', likes: ['strutturato', 'speziato', 'minerale'], dislikes: ['dolce'] },
    { name: 'Sara', likes: ['fresco', 'cremoso', 'fruttato'], dislikes: ['amaro'] }
  ],
  wishlist: [
    { name: 'Brunello di Montalcino 2018', priority: 'Alta', price: 58 },
    { name: 'Champagne Blanc de Blancs', priority: 'Media', price: 72 }
  ]
};

const screen = document.querySelector('#screen');
const reviewDialog = document.querySelector('#reviewDialog');
const reviewForm = document.querySelector('#reviewForm');
const reviewTitle = document.querySelector('#reviewTitle');
let pendingWineId = null;

const currentYear = 2026;

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

reviewForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const form = new FormData(reviewForm);
  const wine = state.wines.find((item) => item.id === pendingWineId);
  if (!wine) return;
  wine.quantity = Math.max(0, wine.quantity - 1);
  if (wine.quantity === 0) wine.status = 'Terminato';
  state.tastings.unshift({
    id: Date.now(),
    wine: `${wine.name} ${wine.vintage}`,
    grape: wine.grape.split(',')[0],
    region: wine.region,
    rating: Number(form.get('rating')),
    date: 'Oggi',
    comment: form.get('comment'),
    pairing: form.get('pairing')
  });
  reviewForm.reset();
  reviewDialog.close();
  toast('Recensione salvata. Bottiglia scalata dalla cantina.');
  render();
});

function setView(view) {
  state.view = view;
  if (view !== 'detail') state.selectedWineId = null;
  document.querySelectorAll('.tabbar [data-view]').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  render();
}

function render() {
  const views = {
    home: renderHome,
    sommelier: renderSommelier,
    cellar: renderCellar,
    add: renderAdd,
    game: renderGame,
    smart: renderSmart,
    profile: renderProfile,
    detail: renderDetail
  };
  views[state.view]();
}

function renderHome() {
  const total = state.wines.reduce((sum, wine) => sum + wine.quantity, 0);
  const value = state.wines.reduce((sum, wine) => sum + wine.quantity * wine.market, 0);
  const drinkNow = state.wines.filter(isDrinkNow).length;
  screen.innerHTML = `
    <article class="hero-card">
      <h2>${total} bottiglie, ${drinkNow} da bere ora</h2>
      <p>Valore stimato EUR ${value.toLocaleString('it-IT')}. Il sommelier AI usa la tua cantina, non dati generici.</p>
      <div class="hero-stats">
        <div><strong>${state.wines.length}</strong><span>vini diversi</span></div>
        <div><strong>${unlockedBadges().length}</strong><span>badge</span></div>
        <div><strong>${lowImpactWines().length}</strong><span>basso impatto</span></div>
      </div>
    </article>

    <div class="quick-grid">
      <button class="feature-tile" type="button" onclick="setView('sommelier')"><strong>Cosa c'e in frigo</strong><span>Abbina ingredienti e cantina</span></button>
      <button class="feature-tile" type="button" onclick="setView('game')"><strong>Blind tasting</strong><span>Gioca con amici e punti</span></button>
      <button class="feature-tile" type="button" onclick="setView('smart')"><strong>Smart cellar</strong><span>Mappa scaffale e bevi ora</span></button>
      <button class="feature-tile" type="button" onclick="setView('smart'); setTimeout(locateNearbyWineries, 80)"><strong>Cantine vicine</strong><span>Usa la tua posizione</span></button>
    </div>

    <div class="section-title"><h2>Avvisi intelligenti</h2><button type="button" onclick="setView('smart')">Apri</button></div>
    <div class="wine-list">${state.wines.filter(isDrinkNow).map(alertCard).join('') || '<p class="card empty">Nessuna urgenza oggi.</p>'}</div>
  `;
}

function renderSommelier() {
  screen.innerHTML = `
    <div class="section-title"><h2>Sommelier virtuale</h2></div>
    <form class="form-card" id="fridgeForm">
      <label>Cosa c'e in frigo?<textarea name="ingredients" placeholder="Es. pollo, funghi e panna" required>pollo, funghi e panna</textarea></label>
      <button class="primary" type="submit">Trova abbinamento</button>
    </form>
    <div id="aiPairingResult">${state.aiResult || ''}</div>

    <div class="section-title"><h2>Traduttore degustazioni</h2></div>
    <form class="form-card" id="translateForm">
      <label>Nota tecnica<textarea name="note" required>Tannino setoso, acidita spiccata, finale balsamico e grande persistenza.</textarea></label>
      <button class="secondary" type="submit">Traduci in parole semplici</button>
    </form>
    <div id="translationResult">${state.translationResult || ''}</div>
  `;
  document.querySelector('#fridgeForm').addEventListener('submit', handleFridgePairing);
  document.querySelector('#translateForm').addEventListener('submit', handleTranslation);
}

function renderCellar() {
  const filters = ['Tutti', 'Da bere', 'In affinamento', 'Da regalare', 'Terminato'];
  let wines = state.filter === 'Tutti' ? state.wines : state.wines.filter((wine) => wine.status === state.filter);
  if (state.lowImpactOnly) wines = wines.filter((wine) => sustainabilityScore(wine) >= 75);
  screen.innerHTML = `
    <div class="section-title"><h2>Cantina</h2><button type="button" onclick="setView('add')">Aggiungi</button></div>
    <div class="filters">${filters.map((filter) => `<button class="${state.filter === filter ? 'active' : ''}" type="button" onclick="setFilter('${filter}')">${filter}</button>`).join('')}</div>
    <button class="sustain-toggle ${state.lowImpactOnly ? 'active' : ''}" type="button" onclick="toggleLowImpact()">Filtro vini a basso impatto</button>
    <div class="wine-list">${wines.map(wineCard).join('') || '<p class="card empty">Nessun vino in questa categoria.</p>'}</div>
  `;
}

function renderDetail() {
  const wine = state.wines.find((item) => item.id === state.selectedWineId) || state.wines[0];
  screen.innerHTML = `
    <section class="detail">
      <button class="ghost" type="button" onclick="setView('cellar')">Indietro</button>
      <div class="detail-cover">
        <p>${wine.producer}</p>
        <h2>${wine.name} ${wine.vintage}</h2>
        <p>${wine.region} - ${wine.denomination} - ${wine.grape}</p>
      </div>
      <div class="info-grid">
        <div><span>Giacenza</span><strong>${wine.quantity} bottiglie</strong></div>
        <div><span>Stato</span><strong>${wine.status}</strong></div>
        <div><span>Bevi ora</span><strong>${maturityLabel(wine)}</strong></div>
        <div><span>Sostenibilita</span><strong>${sustainabilityScore(wine)}/100</strong></div>
        <div><span>Posizione</span><strong>${wine.position}</strong></div>
        <div><span>Servizio</span><strong>${wine.temperature}</strong></div>
      </div>
      <div class="card"><h3>Traduzione AI della nota</h3><p>${plainLanguage(wine.note)}</p></div>
      <div class="card"><h3>Abbinamenti</h3><p>${wine.pairing}</p></div>
      <div class="action-row">
        <button class="primary full" type="button" onclick="openReview(${wine.id})">Bevi bottiglia</button>
        <button class="secondary" type="button" onclick="openArStory(${wine.id})">AR</button>
        <button class="secondary" type="button" onclick="restock(${wine.id})">+1</button>
      </div>
    </section>
  `;
}

function renderGame() {
  const badges = unlockedBadges();
  screen.innerHTML = `
    <div class="section-title"><h2>Degustazione alla cieca</h2></div>
    <form class="form-card" id="blindForm">
      <label>Vino coperto
        <select name="wineId">${state.wines.map((wine) => `<option value="${wine.id}">${wine.name} ${wine.vintage}</option>`).join('')}</select>
      </label>
      <label>Giocatore<input name="player" value="Marco" required></label>
      <label>Colore<input name="color" placeholder="Rubino, paglierino..." required></label>
      <label>Profumo<input name="aroma" placeholder="Frutta, spezie, fiori..." required></label>
      <label>Acidita<select name="acidity"><option>Alta</option><option>Media</option><option>Bassa</option></select></label>
      <label>Vitigno intuito<input name="grapeGuess" placeholder="Nebbiolo" required></label>
      <label>Regione intuita<input name="regionGuess" placeholder="Piemonte" required></label>
      <button class="primary" type="submit">Rivela risultato</button>
    </form>
    <div id="blindResult">${state.blindResult || ''}</div>

    <div class="section-title"><h2>Passaporto vitigni</h2></div>
    <div class="badge-grid">
      ${badges.map((badge) => `<div class="passport-badge"><strong>${badge.title}</strong><span>${badge.text}</span></div>`).join('')}
    </div>
  `;
  document.querySelector('#blindForm').addEventListener('submit', handleBlindTasting);
}

function renderSmart() {
  screen.innerHTML = `
    <div class="section-title"><h2>Smart cellar</h2></div>
    <button class="primary full" type="button" onclick="simulateShelfScan()">Scansiona scaffale</button>
    <div id="shelfMap">${shelfMapHtml()}</div>

    <div class="section-title"><h2>Cantine nelle vicinanze</h2></div>
    <button class="primary full" type="button" onclick="locateNearbyWineries()">Trova vicino a me</button>
    <div id="nearbyPlaces">${nearbyPlacesHtml()}</div>

    <div class="section-title"><h2>Bevi ora</h2></div>
    <div class="wine-list">${state.wines.filter(isDrinkNow).map(alertCard).join('') || '<p class="card empty">Nessun vino al picco oggi.</p>'}</div>

    <div class="section-title"><h2>Etichette parlanti AR</h2></div>
    <div id="arStory">${arStoryHtml(state.wines[0])}</div>

    <div class="section-title"><h2>Tinder del vino per gruppi</h2></div>
    <form class="form-card" id="groupForm">
      <label>Invitati<input name="friends" value="Giulia, Marco, Sara" required></label>
      <button class="secondary" type="submit">Calcola compatibilita</button>
    </form>
    <div id="groupResult">${state.groupResult || ''}</div>
  `;
  document.querySelector('#groupForm').addEventListener('submit', handleGroupCompatibility);
}

function renderAdd() {
  screen.innerHTML = `
    <div class="section-title"><h2>Nuovo vino</h2></div>
    <div class="segment">
      ${['OCR', 'Barcode', 'Manuale'].map((mode) => `<button class="${state.addMode === mode ? 'active' : ''}" type="button" onclick="setAddMode('${mode}')">${mode}</button>`).join('')}
    </div>
    <form class="form-card" id="catalogSearchForm">
      <label>Archivio Grapeminds<input name="query" placeholder="Cerca Barolo, Sassicaia, Franciacorta..."></label>
      <button class="secondary" type="submit">Cerca nel database vini</button>
      <div id="catalogResults"></div>
    </form>
    <form class="form-card" id="addWineForm">
      <label>Nome vino<input name="name" value="${state.addMode === 'OCR' ? 'Barbaresco' : ''}" required></label>
      <label>Produttore<input name="producer" value="${state.addMode === 'Barcode' ? 'Scan Demo' : ''}" required></label>
      <label>Annata<input name="vintage" type="number" value="2022" required></label>
      <label>Regione<input name="region" value="Toscana" required></label>
      <label>Vitigno<input name="grape" value="Sangiovese" required></label>
      <label>Quantita<input name="quantity" type="number" value="1" min="1" required></label>
      <button class="primary" type="submit">Salva in cantina</button>
    </form>
  `;
  document.querySelector('#addWineForm').addEventListener('submit', addWine);
  document.querySelector('#catalogSearchForm').addEventListener('submit', searchCatalog);
}

function renderProfile() {
  const total = state.wines.reduce((sum, wine) => sum + wine.quantity, 0);
  screen.innerHTML = `
    <article class="profile-card card">
      <button class="avatar" type="button">GR</button>
      <h2>Giulia Rossi</h2>
      <p>Degustatrice esperta</p>
    </article>
    <div class="grid-2 profile-stats">
      <div class="metric"><span>Bottiglie</span><strong>${total}</strong></div>
      <div class="metric"><span>Degustate</span><strong>${state.tastings.length}</strong></div>
      <div class="metric"><span>Badge</span><strong>${unlockedBadges().length}</strong></div>
      <div class="metric"><span>Wishlist</span><strong>${state.wishlist.length}</strong></div>
    </div>
    <div class="section-title"><h2>Diario degustazioni</h2></div>
    <div class="timeline">${state.tastings.map(tastingCard).join('')}</div>
    <div class="section-title"><h2>Wishlist</h2></div>
    <div class="wine-list">${state.wishlist.map((item) => `<div class="wine-card"><div class="bottle">WL</div><div><h3>${item.name}</h3><p>Priorita ${item.priority}</p></div><span class="qty">EUR ${item.price}</span></div>`).join('')}</div>
  `;
}

function handleFridgePairing(event) {
  event.preventDefault();
  const ingredients = new FormData(event.currentTarget).get('ingredients').toLowerCase().split(/[,+\s]+/).filter(Boolean);
  const ranked = state.wines.map((wine) => {
    const foodScore = ingredients.filter((item) => wine.foodTags.includes(item)).length * 35;
    const styleScore = wine.style.includes('fresco') && ingredients.includes('panna') ? 15 : 0;
    const readyScore = wine.quantity > 0 ? 10 : -50;
    return { wine, score: foodScore + styleScore + readyScore };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const fallback = ingredients.includes('pollo') ? 'un bianco morbido o uno spumante metodo classico brut' : 'un rosso fresco, non troppo tannico';
  state.aiResult = `
    <article class="ai-card">
      <p class="kicker">Risposta del sommelier AI</p>
      <h3>${best.score > 10 ? `${best.wine.name} ${best.wine.vintage}` : `Da comprare: ${fallback}`}</h3>
      <p>${best.score > 10 ? `Lo sceglierei perche incontra ${best.wine.foodTags.filter((tag) => ingredients.includes(tag)).join(', ') || 'la struttura del piatto'} e hai ${best.wine.quantity} bottiglie in cantina.` : `In cantina non c'e una corrispondenza forte. Cerca ${fallback}.`}</p>
      <span class="badge">Compatibilita ${Math.max(62, Math.min(98, best.score + 55))}%</span>
    </article>
  `;
  renderSommelier();
}

function handleTranslation(event) {
  event.preventDefault();
  const note = new FormData(event.currentTarget).get('note');
  state.translationResult = `<article class="ai-card"><p class="kicker">Traduzione semplice</p><p>${plainLanguage(note)}</p></article>`;
  renderSommelier();
}

function handleBlindTasting(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const wine = state.wines.find((item) => item.id === Number(data.get('wineId')));
  const grapeHit = normalize(data.get('grapeGuess')) && normalize(wine.grape).includes(normalize(data.get('grapeGuess')));
  const regionHit = normalize(data.get('regionGuess')) === normalize(wine.region);
  const score = 20 + (grapeHit ? 40 : 0) + (regionHit ? 30 : 0) + (data.get('acidity') === 'Alta' && wine.style.includes('fresco') ? 10 : 0);
  const badge = score >= 80 ? 'Naso da sommelier' : score >= 50 ? 'Buona intuizione' : 'Allenamento iniziato';
  state.blindResult = `
    <article class="ai-card">
      <p class="kicker">Risultato blind tasting</p>
      <h3>${data.get('player')}: ${score} punti</h3>
      <p>Vino rivelato: ${wine.name} ${wine.vintage}, ${wine.grape}, ${wine.region}. Badge ottenuto: ${badge}.</p>
    </article>
  `;
  renderGame();
}

function handleGroupCompatibility(event) {
  event.preventDefault();
  const names = new FormData(event.currentTarget).get('friends').split(',').map((name) => name.trim().toLowerCase());
  const selectedFriends = state.friends.filter((friend) => names.includes(friend.name.toLowerCase()));
  const scored = state.wines.map((wine) => {
    const score = selectedFriends.reduce((sum, friend) => sum + wine.style.filter((style) => friend.likes.includes(style)).length * 18, 40);
    return { wine, score: Math.min(97, score) };
  }).sort((a, b) => b.score - a.score)[0];
  state.groupResult = `
    <article class="ai-card">
      <p class="kicker">Compatibilita di gruppo</p>
      <h3>${scored.wine.name} ${scored.wine.vintage}</h3>
      <p>Piace al gruppo perche incrocia preferenze come ${scored.wine.style.join(', ')}. Bottiglie disponibili: ${scored.wine.quantity}.</p>
      <span class="badge">Match ${scored.score}%</span>
    </article>
  `;
  renderSmart();
}

async function searchCatalog(event) {
  event.preventDefault();
  const results = document.querySelector('#catalogResults');
  const query = new FormData(event.currentTarget).get('query');
  results.innerHTML = '<p class="kicker">Ricerca in corso...</p>';
  try {
    const response = await fetch(`http://localhost:8080/api/v1/catalog/search?query=${encodeURIComponent(query)}&limit=5`);
    const payload = await response.json();
    const wines = payload.data || [];
    if (!wines.length) {
      results.innerHTML = '<p class="kicker">Nessun risultato. Verifica backend, API key Grapeminds o crea il vino manualmente.</p>';
      return;
    }
    results.innerHTML = wines.map((wine) => `<div class="wine-card"><div class="bottle">API</div><div><h3>${wine.name || wine.title || 'Vino trovato'}</h3><p>${wine.producer || wine.winery || 'Produttore non indicato'}</p></div><span class="qty">Importa</span></div>`).join('');
  } catch (error) {
    results.innerHTML = '<p class="kicker">Backend non raggiungibile. Avvia l API e configura GRAPEMINDS_API_KEY.</p>';
  }
}

function wineCard(wine) {
  return `
    <article class="wine-card" onclick="openDetail(${wine.id})" role="button" tabindex="0">
      <div class="bottle">${wine.name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>${wine.name} ${wine.vintage}</h3>
        <p>${wine.producer} - ${wine.region}</p>
        <p>${wine.status} - ${wine.position} - CO2 ${sustainabilityScore(wine)}/100</p>
      </div>
      <span class="qty">${wine.quantity}</span>
    </article>
  `;
}

function alertCard(wine) {
  return `<article class="alert-card"><div><h3>${wine.name} ${wine.vintage}</h3><p>${maturityLabel(wine)}. Posizione ${wine.position}.</p></div><button class="secondary" type="button" onclick="openDetail(${wine.id})">Apri</button></article>`;
}

function tastingCard(item) {
  return `<article class="timeline-item"><header><h3>${item.wine}</h3><span class="badge">${item.rating}/5</span></header><p>${item.comment}</p><p>${item.date} - ${item.pairing}</p></article>`;
}

function shelfMapHtml() {
  const slots = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
  return `<div class="shelf-grid">${slots.map((slot) => {
    const wine = state.wines.find((item) => item.position === slot);
    return `<button class="shelf-slot ${wine ? 'filled' : ''}" type="button" ${wine ? `onclick="openDetail(${wine.id})"` : ''}><strong>${slot}</strong><span>${wine ? wine.name : 'Vuoto'}</span></button>`;
  }).join('')}</div>`;
}

function arStoryHtml(wine) {
  return `
    <article class="ar-card">
      <div class="ar-scene"><span>${wine.ar.aromas[0]}</span><span>${wine.ar.aromas[1]}</span><span>${wine.ar.aromas[2]}</span></div>
      <h3>${wine.name}: ${wine.ar.place}</h3>
      <p>${wine.ar.story}</p>
      <button class="secondary full" type="button" onclick="openArStory(${wine.id})">Inquadra etichetta</button>
    </article>
  `;
}

function openArStory(id) {
  const wine = state.wines.find((item) => item.id === id) || state.wines[0];
  state.view = 'smart';
  renderSmart();
  document.querySelector('#arStory').innerHTML = arStoryHtml(wine);
  toast(`Etichetta parlante aperta: ${wine.name}.`);
}

function setFilter(filter) { state.filter = filter; render(); }
function toggleLowImpact() { state.lowImpactOnly = !state.lowImpactOnly; render(); }
function setAddMode(mode) { state.addMode = mode; render(); toast(mode === 'Manuale' ? 'Inserimento manuale attivo.' : `${mode} simulato: campi precompilati.`); }

function openDetail(id) {
  state.selectedWineId = id;
  state.view = 'detail';
  document.querySelectorAll('.tabbar [data-view]').forEach((button) => button.classList.remove('active'));
  render();
}

function addWine(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.wines.unshift({
    id: Date.now(),
    name: data.get('name'),
    producer: data.get('producer'),
    vintage: Number(data.get('vintage')),
    region: data.get('region'),
    grape: data.get('grape'),
    denomination: 'IGT',
    quantity: Number(data.get('quantity')),
    status: 'In affinamento',
    paid: 18,
    market: 24,
    position: 'Da posizionare',
    shelf: 'N',
    idealStart: 2027,
    idealEnd: 2030,
    pairing: 'Da completare dopo la prima degustazione',
    temperature: '16 C',
    note: 'Creato da app demo.',
    style: ['fruttato', 'fresco'],
    foodTags: ['pollo', 'verdure'],
    sustainability: { distanceKm: 180, farming: 'integrata', bottleWeight: 560 },
    ar: { place: data.get('region'), story: 'Scheda generata in attesa dei dati del produttore.', aromas: ['frutta', 'fiori', 'spezie'] }
  });
  toast('Vino aggiunto alla tua cantina.');
  setView('cellar');
}

function openReview(id) {
  const wine = state.wines.find((item) => item.id === id);
  if (!wine || wine.quantity <= 0) return toast('Non ci sono bottiglie disponibili.');
  pendingWineId = id;
  reviewTitle.textContent = `${wine.name} ${wine.vintage}`;
  reviewDialog.showModal();
}

function restock(id) {
  const wine = state.wines.find((item) => item.id === id);
  wine.quantity += 1;
  if (wine.status === 'Terminato') wine.status = 'In affinamento';
  toast('Bottiglia aggiunta alla giacenza.');
  render();
}

function simulateShelfScan() {
  document.querySelector('#shelfMap').innerHTML = shelfMapHtml();
  toast('Scaffale riconosciuto: 3 bottiglie posizionate nella mappa visiva.');
}

function locateNearbyWineries() {
  const target = document.querySelector('#nearbyPlaces');
  if (target) target.innerHTML = '<p class="card empty">Sto chiedendo la posizione al browser...</p>';

  if (!navigator.geolocation) {
    useDemoPosition('Geolocalizzazione non supportata: uso una posizione demo.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        source: 'Posizione reale'
      };
      state.nearbyStatus = 'Posizione rilevata, cerco cantine reali...';
      renderSmart();
      loadRealNearbyPlaces(state.userPosition);
    },
    () => useDemoPosition('Permesso posizione negato: uso una posizione demo per mostrarti il flusso.'),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

async function loadRealNearbyPlaces(position) {
  try {
    const params = new URLSearchParams({
      lat: String(position.lat),
      lng: String(position.lng),
      radius: '50000',
      limit: '10'
    });
    const response = await fetch(`${API_BASE_URL}/places/nearby?${params}`);
    if (!response.ok) throw new Error(`Backend ${response.status}`);
    const payload = await response.json();
    const places = Array.isArray(payload.data) ? payload.data : [];

    if (places.length === 0) {
      state.nearbyStatus = payload.configured === false
        ? 'Geoapify non configurato nel backend: mostro dati demo.'
        : 'Nessuna cantina reale trovata: mostro dati demo.';
      renderSmart();
      toast(state.nearbyStatus);
      return;
    }

    state.nearbyPlaces = places.map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type || 'Wine place',
      lat: place.lat,
      lng: place.lng,
      specialty: place.address || 'Luogo trovato da Geoapify',
      open: place.website ? `Sito: ${place.website}` : 'Dettagli da Geoapify'
    }));
    state.nearbyStatus = `Trovati ${places.length} luoghi reali con Geoapify`;
    renderSmart();
    toast('Cantine reali ordinate per distanza.');
  } catch (error) {
    state.nearbyStatus = 'Backend Geoapify non raggiungibile: mostro dati demo.';
    renderSmart();
    toast(state.nearbyStatus);
  }
}
function useDemoPosition(message) {
  state.userPosition = { lat: 41.9028, lng: 12.4964, source: 'Demo Roma centro' };
  state.nearbyStatus = message;
  renderSmart();
  toast(message);
}

function nearbyPlacesHtml() {
  if (!state.userPosition) {
    return '<p class="card empty">Tocca il pulsante per cercare cantine, enoteche e wine bar vicino alla tua posizione.</p>';
  }

  return `
    <div class="nearby-status"><span>${state.userPosition.source}</span><strong>${state.nearbyStatus}</strong></div>
    <div class="nearby-list">
      ${nearbyPlacesWithDistance().map((place) => `
        <article class="nearby-card">
          <div>
            <span class="badge">${place.type}</span>
            <h3>${place.name}</h3>
            <p>${place.specialty}</p>
            <p>${place.open}</p>
          </div>
          <div class="distance">${place.distance.toFixed(1)} km</div>
        </article>
      `).join('')}
    </div>
  `;
}

function nearbyPlacesWithDistance() {
  if (!state.userPosition) return [];
  return state.nearbyPlaces
    .map((place) => ({
      ...place,
      distance: distanceKm(state.userPosition.lat, state.userPosition.lng, place.lat, place.lng)
    }))
    .sort((a, b) => a.distance - b.distance);
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
  return value * Math.PI / 180;
}
function isDrinkNow(wine) { return currentYear >= wine.idealStart && currentYear <= wine.idealEnd && wine.quantity > 0; }
function maturityLabel(wine) { return currentYear < wine.idealStart ? `Attendi fino al ${wine.idealStart}` : currentYear > wine.idealEnd ? 'Oltre il picco' : 'Al picco ideale'; }
function sustainabilityScore(wine) {
  const distance = Math.max(0, 40 - Math.round(wine.sustainability.distanceKm / 35));
  const farming = wine.sustainability.farming === 'biodinamico' ? 35 : wine.sustainability.farming === 'biologico' ? 30 : 20;
  const glass = wine.sustainability.bottleWeight <= 550 ? 25 : wine.sustainability.bottleWeight <= 650 ? 18 : 10;
  return Math.min(100, distance + farming + glass);
}
function lowImpactWines() { return state.wines.filter((wine) => sustainabilityScore(wine) >= 75); }
function averageRating() { return state.tastings.length ? (state.tastings.reduce((sum, item) => sum + item.rating, 0) / state.tastings.length).toFixed(1) : '0.0'; }
function normalize(value) { return String(value || '').trim().toLowerCase(); }

function plainLanguage(note) {
  let text = String(note).toLowerCase();
  const dictionary = [
    ['tannino setoso', 'ha una sensazione morbida in bocca, non ruvida'],
    ['acidita spiccata', 'e fresco e fa venire voglia di un altro sorso'],
    ['acidita viva', 'e fresco e vivace'],
    ['finale balsamico', 'lascia una nota che ricorda erbe aromatiche e liquirizia'],
    ['grande persistenza', 'il sapore resta a lungo dopo averlo bevuto'],
    ['minerale', 'ha una sensazione sapida e pulita'],
    ['bollicina cremosa', 'le bolle sono fini e morbide']
  ];
  dictionary.forEach(([technical, simple]) => { text = text.replaceAll(technical, simple); });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function unlockedBadges() {
  const grapes = new Set(state.tastings.map((item) => item.grape));
  const regions = new Set(state.tastings.map((item) => item.region));
  const badges = [{ title: 'Diario avviato', text: 'Prime degustazioni salvate' }];
  if (grapes.has('Verdicchio')) badges.push({ title: 'Esploratore Adriatico', text: 'Hai assaggiato Verdicchio' });
  if (regions.has('Sicilia') || state.wines.some((wine) => wine.region === 'Sicilia')) badges.push({ title: 'Esploratore dell Etna', text: 'Cantina con vino vulcanico' });
  if (grapes.size >= 2) badges.push({ title: 'Passaporto vitigni', text: `${grapes.size} vitigni degustati` });
  return badges;
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

