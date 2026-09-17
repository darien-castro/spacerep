/**
 * SpaceRep: Minimalist Spaced Repetition Web Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentView: 'decks',
    theme: 'dark',
    profile: null,
    decks: [],
    studySession: {
      deck: null,
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      isPractice: false,
      reviewedCount: 0
    },
    managingDeck: null,
    managingCards: [],
    cardSearchQuery: '',
    cardFilterType: 'all',
    distributionDeckId: 'all',
    currentDistributionData: null
  };

  // DOM Elements
  const els = {
    // Header & Nav
    navDueBadge: document.getElementById('nav-due-badge'),
    headerStreak: document.getElementById('header-streak'),
    btnBrandHome: document.getElementById('brand-home-btn'),
    btnCreateDeckTop: document.getElementById('btn-create-deck-top'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    themeText: document.getElementById('theme-text'),
    navBtns: document.querySelectorAll('.nav-btn'),

    // Views
    views: {
      decks: document.getElementById('view-decks'),
      study: document.getElementById('view-study'),
      deckManage: document.getElementById('view-deck-manage'),
      distribution: document.getElementById('view-distribution'),
      stats: document.getElementById('view-stats')
    },

    // Decks View
    decksGrid: document.getElementById('decks-grid'),
    btnCreateDeck: document.getElementById('btn-create-deck'),

    // Study View
    btnExitStudy: document.getElementById('btn-exit-study'),
    studyDeckTitle: document.getElementById('study-deck-title'),
    studyProgressText: document.getElementById('study-progress-text'),
    studyProgressBar: document.getElementById('study-progress-bar'),
    studyFlashcard: document.getElementById('study-flashcard'),
    cardLevelBadge: document.getElementById('card-level-badge'),
    cardDueTag: document.getElementById('card-due-tag'),
    cardQuestionText: document.getElementById('card-question-text'),
    studyHintContainer: document.getElementById('study-hint-container'),
    btnToggleHint: document.getElementById('btn-toggle-hint'),
    cardHintText: document.getElementById('card-hint-text'),
    cardRevealPrompt: document.getElementById('card-reveal-prompt'),
    btnShowAnswer: document.getElementById('btn-show-answer'),
    cardAnswerSection: document.getElementById('card-answer-section'),
    cardAnswerText: document.getElementById('card-answer-text'),
    rateBtns: document.querySelectorAll('.rate-btn'),
    intervalPreviews: {
      1: document.getElementById('interval-preview-1'),
      2: document.getElementById('interval-preview-2'),
      3: document.getElementById('interval-preview-3'),
      4: document.getElementById('interval-preview-4')
    },
    studyToast: document.getElementById('study-toast'),
    toastText: document.getElementById('toast-text'),
    studyCompletedCard: document.getElementById('study-completed-card'),
    completedDeckSummary: document.getElementById('completed-deck-summary'),
    btnFinishReturn: document.getElementById('btn-finish-return'),
    btnFinishPractice: document.getElementById('btn-finish-practice'),

    // Deck Manage View
    btnBackToDecks: document.getElementById('btn-back-to-decks'),
    manageDeckName: document.getElementById('manage-deck-name'),
    manageDeckDesc: document.getElementById('manage-deck-desc'),
    btnEditDeck: document.getElementById('btn-edit-deck'),
    btnDeleteDeck: document.getElementById('btn-delete-deck'),
    btnAddCard: document.getElementById('btn-add-card'),
    cardSearchInput: document.getElementById('card-search-input'),
    filterCountAll: document.getElementById('filter-count-all'),
    filterCountDue: document.getElementById('filter-count-due'),
    filterPills: document.querySelectorAll('.filter-pill'),
    cardsTableBody: document.getElementById('cards-table-body'),

    // Distribution View
    distDeckSelect: document.getElementById('dist-deck-select'),
    territoryDonutSvg: document.getElementById('territory-donut-svg'),
    donutCenterVal: document.getElementById('donut-center-val'),
    donutCenterLbl: document.getElementById('donut-center-lbl'),
    donutTotalCards: document.getElementById('donut-total-cards'),
    donutDueCards: document.getElementById('donut-due-cards'),
    territoriesPanelMount: document.getElementById('territories-panel-mount'),
    badCardsListMount: document.getElementById('bad-cards-list-mount'),
    badCardsSection: document.getElementById('bad-cards-section'),
    distributionDeckTableBody: document.getElementById('distribution-deck-table-body'),
    forecastStripMount: document.getElementById('forecast-strip-mount'),

    // Stats View
    statTotalCards: document.getElementById('stat-total-cards'),
    statDueToday: document.getElementById('stat-due-today'),
    statStreak: document.getElementById('stat-streak'),
    statReviewsLogged: document.getElementById('stat-reviews-logged'),
    activityStrip: document.getElementById('activity-strip'),
    statDbPath: document.getElementById('stat-db-path'),
    btnExportJson: document.getElementById('btn-export-json'),
    inputImportJson: document.getElementById('input-import-json'),
    btnResetDb: document.getElementById('btn-reset-db'),

    // Modals
    modalDeck: document.getElementById('modal-deck'),
    modalDeckTitle: document.getElementById('modal-deck-title'),
    deckFormId: document.getElementById('deck-form-id'),
    deckNameInput: document.getElementById('deck-name-input'),
    deckDescInput: document.getElementById('deck-desc-input'),
    btnSaveDeck: document.getElementById('btn-save-deck'),

    modalCard: document.getElementById('modal-card'),
    modalCardTitle: document.getElementById('modal-card-title'),
    cardFormId: document.getElementById('card-form-id'),
    cardFrontInput: document.getElementById('card-front-input'),
    cardBackInput: document.getElementById('card-back-input'),
    cardHintInput: document.getElementById('card-hint-input'),
    btnSaveCard: document.getElementById('btn-save-card'),
    btnSaveAddAnother: document.getElementById('btn-save-add-another')
  };

  const LEVEL_NAMES = {
    1: 'Level 1: Learning',
    2: 'Level 2: Reviewing',
    3: 'Level 3: Familiar',
    4: 'Level 4: Mastered',
    5: 'Level 5: Deep Memory'
  };

  // --- Theme Management ---
  function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      state.theme = saved;
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      state.theme = prefersLight ? 'light' : 'dark';
    }
    applyTheme(state.theme);
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (theme === 'light') {
      els.themeIcon.textContent = '☽';
      els.themeText.textContent = 'dark';
    } else {
      els.themeIcon.textContent = '☼';
      els.themeText.textContent = 'light';
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'light' ? 'dark' : 'light');
  }

  // --- API Client ---
  async function api(path, options = {}) {
    try {
      const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || 'Server request failed');
      }
      return await res.json();
    } catch (err) {
      console.error(`API Error [${path}]:`, err);
      throw err;
    }
  }

  // --- User Profile ---
  async function loadProfile() {
    try {
      state.profile = await api('/api/profile');
      const streak = state.profile.current_streak || 0;
      els.headerStreak.textContent = `${streak}d`;
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  // --- View Management ---
  function switchView(viewName) {
    state.currentView = viewName;

    Object.keys(els.views).forEach(key => {
      if (els.views[key]) {
        els.views[key].classList.toggle('active', key === viewName);
      }
    });

    els.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'decks') {
      loadDecks();
    } else if (viewName === 'distribution') {
      loadDistribution();
    } else if (viewName === 'stats') {
      loadStats();
    }
  }

  // --- Decks Grid ---
  async function loadDecks() {
    try {
      state.decks = await api('/api/decks');
      let totalDue = 0;
      state.decks.forEach(d => {
        totalDue += (d.due_cards || 0);
      });

      if (totalDue > 0) {
        els.navDueBadge.textContent = totalDue;
        els.navDueBadge.style.display = 'inline-block';
      } else {
        els.navDueBadge.style.display = 'none';
      }

      renderDecksGrid();
      populateDistributionDeckSelect();
    } catch (err) {
      console.error('Failed to load decks:', err);
    }
  }

  function renderDecksGrid() {
    els.decksGrid.innerHTML = '';

    if (state.decks.length === 0) {
      els.decksGrid.innerHTML = `
        <div class="empty-state">
          <div class="section-tag" style="margin-bottom: 8px;">// 0 DECKS INITIALIZED</div>
          <h3 class="empty-title">no decks found</h3>
          <p class="empty-desc">create a deck or import json to begin spaced repetition.</p>
          <button class="btn btn-primary btn-sm" id="btn-empty-create">+ create deck</button>
        </div>
      `;
      document.getElementById('btn-empty-create')?.addEventListener('click', () => openDeckModal());
      return;
    }

    state.decks.forEach(deck => {
      const card = document.createElement('div');
      card.className = 'deck-card';

      const total = deck.total_cards || 0;
      const due = deck.due_cards || 0;

      card.innerHTML = `
        <div class="deck-card-top">
          <div class="deck-title-row">
            <h3 class="deck-card-title">${escapeHtml(deck.name)}</h3>
            <span class="due-pill ${due > 0 ? 'has-due' : 'caught-up'}">
              ${due > 0 ? `${due} due` : 'caught up'}
            </span>
          </div>
          <p class="deck-card-desc">${escapeHtml(deck.description || 'No description.')}</p>
          <div class="deck-meta-info">
            <span>cards: ${total}</span>
            <span>·</span>
            <span>due: ${due}</span>
          </div>
        </div>

        <div class="deck-card-actions">
          <button class="btn btn-primary btn-sm btn-study" data-action="study" data-id="${deck.id}">
            ${due > 0 ? `study [${due}]` : 'study'}
          </button>
          <button class="btn btn-secondary btn-sm" data-action="manage" data-id="${deck.id}">
            cards
          </button>
          <button class="btn btn-ghost text-red btn-sm btn-deck-del" data-action="delete" data-id="${deck.id}" title="Delete deck">
            del
          </button>
        </div>
      `;

      card.querySelector('[data-action="study"]').addEventListener('click', () => {
        startStudySession(deck);
      });

      card.querySelector('[data-action="manage"]').addEventListener('click', () => {
        openDeckManagement(deck);
      });

      card.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete deck "${deck.name}" and all its ${total} cards?`)) {
          try {
            await api(`/api/decks/${deck.id}`, { method: 'DELETE' });
            await loadDecks();
          } catch (err) {
            alert(`Could not delete deck: ${err.message}`);
          }
        }
      });

      els.decksGrid.appendChild(card);
    });
  }

  // --- Study Session ---
  async function startStudySession(deck, forceAll = false, singleCardId = null) {
    state.studySession.deck = deck;

    let cards = [];
    let isPractice = forceAll;

    if (singleCardId) {
      const allCards = await api(`/api/decks/${deck.id}/cards`);
      const target = allCards.find(c => c.id === singleCardId);
      cards = target ? [target] : allCards;
      isPractice = true;
    } else {
      if (!forceAll) {
        cards = await api(`/api/decks/${deck.id}/cards?due_only=true`);
      }

      if (cards.length === 0) {
        cards = await api(`/api/decks/${deck.id}/cards`);
        isPractice = true;
      }
    }

    if (cards.length === 0) {
      alert('This deck has no cards yet. Add cards in the deck manager to start studying!');
      openDeckManagement(deck);
      return;
    }

    state.studySession = {
      deck,
      cards,
      currentIndex: 0,
      isFlipped: false,
      isPractice,
      reviewedCount: 0
    };

    els.studyDeckTitle.textContent = deck.name;
    els.studyCompletedCard.style.display = 'none';
    document.querySelector('.study-container').style.display = 'block';

    switchView('study');
    renderCurrentStudyCard();
  }

  function calculateCardIntervals(card) {
    if (card.preview_intervals) {
      return card.preview_intervals;
    }
    const interval = card.interval_days || 0;
    const reps = card.repetitions || 0;
    const ease = card.ease_factor || 2.5;

    return {
      1: 1,
      2: Math.max(1, Math.round((interval || 1) * 1.2)),
      3: reps === 0 ? 1 : reps === 1 ? 3 : Math.max(1, Math.round(interval * ease)),
      4: reps === 0 ? 2 : reps === 1 ? 5 : Math.max(1, Math.round(interval * ease * 1.3))
    };
  }

  function renderCurrentStudyCard() {
    const session = state.studySession;

    if (session.currentIndex >= session.cards.length) {
      finishStudySession();
      return;
    }

    const card = session.cards[session.currentIndex];
    session.isFlipped = false;

    // Reset card UI
    els.cardAnswerSection.style.display = 'none';
    els.cardRevealPrompt.style.display = 'block';
    els.studyToast.style.display = 'none';
    els.cardHintText.style.display = 'none';

    // Progress text & bar
    const currentNum = session.currentIndex + 1;
    const totalNum = session.cards.length;
    els.studyProgressText.textContent = `${currentNum} / ${totalNum}`;
    els.studyProgressBar.style.width = `${(currentNum / totalNum) * 100}%`;

    // Badges & text
    els.cardLevelBadge.textContent = LEVEL_NAMES[card.orbit_level || 1] || 'Learning';
    els.cardDueTag.textContent = session.isPractice ? 'Practice' : 'Due today';
    els.cardQuestionText.innerHTML = formatMarkdown(card.front);
    els.cardAnswerText.innerHTML = formatMarkdown(card.back);

    // Hint handling
    if (card.hint && card.hint.trim()) {
      els.studyHintContainer.style.display = 'block';
      els.cardHintText.textContent = card.hint.trim();
      els.cardHintText.style.display = 'none';
      els.btnToggleHint.textContent = '[ + hint (h) ]';
    } else {
      els.studyHintContainer.style.display = 'none';
    }

    // Interval previews on buttons
    const previews = calculateCardIntervals(card);
    for (let r = 1; r <= 4; r++) {
      const days = previews[r] || 1;
      els.intervalPreviews[r].textContent = `${days}d`;
    }
  }

  function revealAnswer() {
    const session = state.studySession;
    if (session.isFlipped) return;

    session.isFlipped = true;
    els.cardRevealPrompt.style.display = 'none';
    els.cardAnswerSection.style.display = 'block';
  }

  async function rateCard(rating) {
    const session = state.studySession;
    const card = session.cards[session.currentIndex];

    try {
      const res = await api(`/api/cards/${card.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating })
      });

      // Show gentle toast feedback
      els.toastText.textContent = res.outcome.message || 'Review recorded';
      els.studyToast.style.display = 'block';

      // Update state
      session.reviewedCount++;
      state.profile = res.profile;
      els.headerStreak.textContent = `${res.profile.current_streak || 0}d`;

      // Advance to next card
      setTimeout(() => {
        session.currentIndex++;
        renderCurrentStudyCard();
      }, 300);

    } catch (err) {
      alert(`Could not record review: ${err.message}`);
    }
  }

  function finishStudySession() {
    document.querySelector('.study-container').style.display = 'none';
    els.completedDeckSummary.textContent = `Completed ${state.studySession.reviewedCount} reviews in "${state.studySession.deck?.name}".`;
    els.studyCompletedCard.style.display = 'block';
    loadDecks();
  }

  // --- Deck Management & Card Browser ---
  async function openDeckManagement(deck) {
    state.managingDeck = deck;
    state.cardSearchQuery = '';
    state.cardFilterType = 'all';
    els.cardSearchInput.value = '';

    els.manageDeckName.textContent = deck.name;
    els.manageDeckDesc.textContent = deck.description || 'No description provided.';

    els.filterPills.forEach(p => {
      p.classList.toggle('active', p.dataset.filter === 'all');
    });

    switchView('deckManage');
    await loadManagingCards();
  }

  async function loadManagingCards() {
    try {
      state.managingCards = await api(`/api/decks/${state.managingDeck.id}/cards`);
      renderManagingCardsTable();
    } catch (err) {
      console.error('Failed to load deck cards:', err);
    }
  }

  function renderManagingCardsTable() {
    const today = new Date().toISOString().split('T')[0];
    const query = state.cardSearchQuery.toLowerCase().trim();
    const filter = state.cardFilterType;

    let filtered = state.managingCards.filter(c => {
      if (filter === 'due' && c.due_date > today) return false;
      if (query) {
        const frontMatch = (c.front || '').toLowerCase().includes(query);
        const backMatch = (c.back || '').toLowerCase().includes(query);
        const hintMatch = (c.hint || '').toLowerCase().includes(query);
        return frontMatch || backMatch || hintMatch;
      }
      return true;
    });

    // Update filter counts
    const dueCount = state.managingCards.filter(c => c.due_date <= today).length;
    els.filterCountAll.textContent = state.managingCards.length;
    els.filterCountDue.textContent = dueCount;

    els.cardsTableBody.innerHTML = '';

    if (filtered.length === 0) {
      const msg = query 
        ? 'No cards matched your search.' 
        : (filter === 'due' ? 'No cards due right now.' : 'No cards in this deck yet. Click "+ Add Card" above to create one.');
      els.cardsTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 36px; color: var(--text-dim);">
            ${msg}
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(card => {
      const tr = document.createElement('tr');
      const isDue = card.due_date <= today;

      tr.innerHTML = `
        <td>
          <div class="table-prompt-text">${formatMarkdown(card.front)}</div>
          ${card.hint ? `<div class="table-hint-text">hint: ${escapeHtml(card.hint)}</div>` : ''}
        </td>
        <td>
          <div class="table-answer-text">${formatMarkdown(card.back)}</div>
        </td>
        <td>
          <div class="table-interval-badge">${card.interval_days}d</div>
          <div style="font-size: 0.72rem; color: ${isDue ? 'var(--amber)' : 'var(--text-dim)'}; margin-top: 2px;">
            ${isDue ? 'Due today' : card.due_date}
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action" data-action="edit-card" data-id="${card.id}" title="Edit card">Edit</button>
            <button class="btn-icon-action text-red" data-action="delete-card" data-id="${card.id}" title="Delete card">Delete</button>
          </div>
        </td>
      `;

      tr.querySelector('[data-action="edit-card"]').addEventListener('click', () => {
        openCardModal(card);
      });

      tr.querySelector('[data-action="delete-card"]').addEventListener('click', async () => {
        if (confirm('Delete this card?')) {
          try {
            await api(`/api/cards/${card.id}`, { method: 'DELETE' });
            await loadManagingCards();
            await loadDecks();
          } catch (err) {
            alert(`Could not delete card: ${err.message}`);
          }
        }
      });

      els.cardsTableBody.appendChild(tr);
    });
  }

  // --- Distribution View & Pie Chart ---
  function populateDistributionDeckSelect() {
    els.distDeckSelect.innerHTML = '<option value="all">All Decks (Overall)</option>';
    state.decks.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.name} (${d.total_cards || 0} cards)`;
      if (String(state.distributionDeckId) === String(d.id)) {
        opt.selected = true;
      }
      els.distDeckSelect.appendChild(opt);
    });
  }

  async function loadDistribution() {
    try {
      const deckId = state.distributionDeckId || 'all';
      const data = await api(`/api/distribution?deck_id=${deckId}`);
      state.currentDistributionData = data;

      // Update basic counts
      els.donutTotalCards.textContent = data.totalCards || 0;
      els.donutDueCards.textContent = data.dueToday || 0;

      // Render Donut / Pie Chart
      renderTerritoryDonut(data);

      // Render Territory Cards
      renderTerritoriesPanel(data);

      // Render Bad Cards List
      renderBadCardsSection(data);

      // Render Deck Health Breakdown Table
      renderDeckBreakdownTable(data);

      // Render 7-day Forecast
      renderForecastSchedule(data);

    } catch (err) {
      console.error('Failed to load distribution data:', err);
    }
  }

  function renderTerritoryDonut(data) {
    const svg = els.territoryDonutSvg;
    svg.innerHTML = '';

    const territories = data.territories;
    const total = data.totalCards || 0;

    // Reset center readout
    setDefaultDonutReadout(data);

    if (total === 0) {
      // Empty placeholder ring
      svg.innerHTML = `
        <circle cx="110" cy="110" r="75" fill="none" stroke="var(--border-subtle)" stroke-width="24" />
      `;
      return;
    }

    const R = 75;
    const C = 2 * Math.PI * R; // ~471.24
    let cumulativeOffset = 0;

    // Background track ring (calibrated gauge)
    const bgTrack = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgTrack.setAttribute('cx', '110');
    bgTrack.setAttribute('cy', '110');
    bgTrack.setAttribute('r', String(R));
    bgTrack.setAttribute('fill', 'none');
    bgTrack.setAttribute('stroke', 'var(--bg-bar-track)');
    bgTrack.setAttribute('stroke-width', '24');
    svg.appendChild(bgTrack);

    // Inner & Outer subtle hairline gauge guides
    const innerGuide = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerGuide.setAttribute('cx', '110');
    innerGuide.setAttribute('cy', '110');
    innerGuide.setAttribute('r', '61');
    innerGuide.setAttribute('fill', 'none');
    innerGuide.setAttribute('stroke', 'var(--border-subtle)');
    innerGuide.setAttribute('stroke-width', '1');
    innerGuide.setAttribute('stroke-dasharray', '2 4');
    svg.appendChild(innerGuide);

    const outerGuide = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerGuide.setAttribute('cx', '110');
    outerGuide.setAttribute('cy', '110');
    outerGuide.setAttribute('r', '89');
    outerGuide.setAttribute('fill', 'none');
    outerGuide.setAttribute('stroke', 'var(--border-subtle)');
    outerGuide.setAttribute('stroke-width', '1');
    outerGuide.setAttribute('stroke-dasharray', '2 4');
    svg.appendChild(outerGuide);

    const territoryList = [territories.good, territories.learning, territories.bad, territories.new];

    territoryList.forEach(t => {
      if (!t || t.count === 0) return;

      const fraction = t.count / total;
      const arcLen = fraction * C;
      const gap = 2;
      const dashLen = Math.max(1, arcLen - gap);
      const remainingLen = C - dashLen;
      const offset = -cumulativeOffset * C;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '110');
      circle.setAttribute('cy', '110');
      circle.setAttribute('r', String(R));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', t.color);
      circle.setAttribute('stroke-width', '24');
      circle.setAttribute('stroke-dasharray', `${dashLen} ${remainingLen}`);
      circle.setAttribute('stroke-dashoffset', String(offset));
      circle.setAttribute('transform', 'rotate(-90 110 110)');
      circle.setAttribute('class', 'donut-slice');
      circle.setAttribute('data-territory', t.key);

      // Interactive hover
      circle.addEventListener('mouseenter', () => {
        highlightTerritory(t);
      });
      circle.addEventListener('mouseleave', () => {
        resetTerritoryHighlight(data);
      });

      svg.appendChild(circle);

      cumulativeOffset += fraction;
    });
  }

  function setDefaultDonutReadout(data) {
    if (data.totalCards === 0) {
      els.donutCenterVal.textContent = '0';
      els.donutCenterLbl.textContent = 'empty';
      return;
    }

    const goodPct = data.territories.good?.percentage || 0;
    els.donutCenterVal.textContent = `${goodPct}%`;
    els.donutCenterVal.style.color = 'var(--text-main)';
    els.donutCenterLbl.textContent = 'good territory';
  }

  function highlightTerritory(territory) {
    els.donutCenterVal.textContent = `${territory.percentage}%`;
    els.donutCenterVal.style.color = territory.color;
    els.donutCenterLbl.textContent = territory.label.toLowerCase();

    // Highlight card
    document.querySelectorAll('.territory-item-card').forEach(c => {
      c.classList.toggle('is-active', c.dataset.territory === territory.key);
    });
  }

  function resetTerritoryHighlight(data) {
    setDefaultDonutReadout(data);
    document.querySelectorAll('.territory-item-card').forEach(c => {
      c.classList.remove('is-active');
    });
  }

  function renderTerritoriesPanel(data) {
    const mount = els.territoriesPanelMount;
    mount.innerHTML = '';

    const list = [
      data.territories.good,
      data.territories.learning,
      data.territories.bad,
      data.territories.new
    ];

    const symbols = {
      good: '[●]',
      learning: '[▲]',
      bad: '[■]',
      new: '[○]'
    };

    list.forEach(t => {
      const card = document.createElement('div');
      card.className = 'territory-item-card';
      card.dataset.territory = t.key;
      card.style.setProperty('--card-color', t.color);

      card.innerHTML = `
        <div>
          <div class="territory-top-row">
            <span class="territory-symbol" style="color: ${t.color}; font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700;">${symbols[t.key] || '•'}</span>
            <span class="territory-title">${t.label.toUpperCase()}</span>
          </div>
          <p class="territory-desc">${t.description}</p>
        </div>

        <div class="territory-stat-row">
          <span class="territory-percent" style="color: ${t.color};">${t.percentage}%</span>
          <span class="territory-count-lbl">${t.count} card${t.count === 1 ? '' : 's'}</span>
        </div>
      `;

      card.addEventListener('mouseenter', () => highlightTerritory(t));
      card.addEventListener('mouseleave', () => resetTerritoryHighlight(data));

      mount.appendChild(card);
    });
  }

  function renderBadCardsSection(data) {
    const mount = els.badCardsListMount;
    mount.innerHTML = '';

    const badCards = data.badCards || [];

    if (badCards.length === 0) {
      mount.innerHTML = `
        <div style="padding: 16px 20px; text-align: center; color: var(--text-dim); background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem;">
          // 0 CARDS IN BAD TERRITORY — ALL REVIEWED CARDS HEALTHY
        </div>
      `;
      return;
    }

    badCards.forEach(c => {
      const row = document.createElement('div');
      row.className = 'bad-card-row';

      row.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div class="bad-card-front">${formatMarkdown(c.front)}</div>
          <div class="bad-card-meta">
            <span class="bad-reason-badge">${escapeHtml(c.reason)}</span>
            <span>interval: ${c.interval_days}d</span>
            <span>due: ${c.due_date}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" data-action="practice-bad" data-card-id="${c.id}" data-deck-id="${c.deck_id}">
          practice
        </button>
      `;

      row.querySelector('[data-action="practice-bad"]').addEventListener('click', () => {
        const deck = state.decks.find(d => d.id === c.deck_id);
        if (deck) {
          startStudySession(deck, true, c.id);
        }
      });

      mount.appendChild(row);
    });
  }

  function renderDeckBreakdownTable(data) {
    const tbody = els.distributionDeckTableBody;
    tbody.innerHTML = '';

    const decks = data.deckBreakdown || [];

    if (decks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No decks available.
          </td>
        </tr>
      `;
      return;
    }

    decks.forEach(d => {
      const total = d.total_cards || 0;
      const goodPct = total > 0 ? ((d.good_cards || 0) / total) * 100 : 0;
      const learnPct = total > 0 ? ((d.learning_cards || 0) / total) * 100 : 0;
      const badPct = total > 0 ? ((d.bad_cards || 0) / total) * 100 : 0;
      const newPct = total > 0 ? ((d.new_cards || 0) / total) * 100 : 0;

      const health = total > 0 ? Math.round(((d.good_cards || 0) / Math.max(1, (d.good_cards + d.learning_cards + d.bad_cards))) * 100) : 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(d.name)}</strong></td>
        <td>${total}</td>
        <td><span style="color: ${d.due_cards > 0 ? 'var(--amber)' : 'var(--text-dim)'}; font-weight: ${d.due_cards > 0 ? '600' : 'normal'};">${d.due_cards}</span></td>
        <td>
          <div class="mini-territory-bar" title="Good (${Math.round(goodPct)}%) · Learning (${Math.round(learnPct)}%) · Bad (${Math.round(badPct)}%) · New (${Math.round(newPct)}%)">
            <div class="mini-bar-seg seg-good" style="width: ${goodPct}%;"></div>
            <div class="mini-bar-seg seg-learning" style="width: ${learnPct}%;"></div>
            <div class="mini-bar-seg seg-bad" style="width: ${badPct}%;"></div>
            <div class="mini-bar-seg seg-new" style="width: ${newPct}%;"></div>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; color: ${health >= 70 ? 'var(--green)' : health >= 40 ? 'var(--amber)' : 'var(--red)'};">
            ${health}%
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" data-action="quick-study" data-id="${d.id}">
            Study
          </button>
        </td>
      `;

      tr.querySelector('[data-action="quick-study"]').addEventListener('click', () => {
        const found = state.decks.find(dk => dk.id === d.id);
        if (found) startStudySession(found);
      });

      tbody.appendChild(tr);
    });
  }

  function renderForecastSchedule(data) {
    const mount = els.forecastStripMount;
    mount.innerHTML = '';

    const forecast = data.forecast || [];
    forecast.forEach((f, idx) => {
      const tile = document.createElement('div');
      tile.className = `forecast-day-tile ${idx === 0 ? 'is-today' : ''} ${f.count > 0 ? 'has-due' : ''}`;

      tile.innerHTML = `
        <span class="forecast-day-name">${f.dayLabel}</span>
        <div class="forecast-day-count">${f.count}</div>
      `;

      mount.appendChild(tile);
    });
  }

  // --- Stats View ---
  async function loadStats() {
    try {
      const data = await api('/api/stats');

      els.statTotalCards.textContent = data.totalCards || 0;
      els.statDueToday.textContent = data.dueToday || 0;
      els.statStreak.textContent = `${data.profile?.current_streak || 0}d`;
      
      const totalReviews = (data.activityHistory || []).reduce((acc, curr) => acc + (curr.total_reviews || 0), 0);
      els.statReviewsLogged.textContent = totalReviews;

      if (data.dbPath) {
        els.statDbPath.textContent = data.dbPath;
      }

      // 14-day activity strip
      els.activityStrip.innerHTML = '';
      const activityMap = new Map();
      (data.activityHistory || []).forEach(h => {
        activityMap.set(h.review_date, h.total_reviews);
      });

      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const count = activityMap.get(dateKey) || 0;
        const displayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

        const tile = document.createElement('div');
        tile.className = `activity-tile ${count > 0 ? 'has-activity' : ''}`;
        tile.innerHTML = `
          <span class="activity-tile-date">${displayLabel}</span>
          <span class="activity-tile-count">${count > 0 ? count : '—'}</span>
        `;
        els.activityStrip.appendChild(tile);
      }

    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  // --- Modals ---
  function openDeckModal(deck = null) {
    els.deckFormId.value = deck ? deck.id : '';
    els.deckNameInput.value = deck ? deck.name : '';
    els.deckDescInput.value = deck ? deck.description : '';
    els.modalDeckTitle.textContent = deck ? 'Edit Deck' : 'New Deck';

    els.modalDeck.classList.add('open');
    els.deckNameInput.focus();
  }

  function openCardModal(card = null) {
    els.cardFormId.value = card ? card.id : '';
    els.cardFrontInput.value = card ? card.front : '';
    els.cardBackInput.value = card ? card.back : '';
    els.cardHintInput.value = card ? (card.hint || '') : '';
    els.modalCardTitle.textContent = card ? 'Edit Card' : 'Add Card';

    els.btnSaveAddAnother.style.display = card ? 'none' : 'inline-flex';

    els.modalCard.classList.add('open');
    els.cardFrontInput.focus();
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }

  async function saveDeck() {
    const id = els.deckFormId.value;
    const name = els.deckNameInput.value.trim();
    const description = els.deckDescInput.value.trim();

    if (!name) {
      alert('Please enter a deck name.');
      els.deckNameInput.focus();
      return;
    }

    try {
      if (id) {
        await api(`/api/decks/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description })
        });
      } else {
        await api('/api/decks', {
          method: 'POST',
          body: JSON.stringify({ name, description })
        });
      }

      closeAllModals();
      await loadDecks();

      if (state.managingDeck && state.managingDeck.id == id) {
        state.managingDeck.name = name;
        state.managingDeck.description = description;
        els.manageDeckName.textContent = name;
        els.manageDeckDesc.textContent = description;
      }
    } catch (err) {
      alert(`Could not save deck: ${err.message}`);
    }
  }

  async function saveCard(keepOpenForNext = false) {
    const id = els.cardFormId.value;
    const front = els.cardFrontInput.value.trim();
    const back = els.cardBackInput.value.trim();
    const hint = els.cardHintInput.value.trim();

    if (!front || !back) {
      alert('Both prompt (question) and solution (answer) are required.');
      return;
    }

    try {
      if (id) {
        await api(`/api/cards/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ front, back, hint })
        });
      } else {
        const deckId = state.managingDeck ? state.managingDeck.id : (state.decks[0]?.id);
        if (!deckId) {
          alert('No active deck found. Please create a deck first.');
          return;
        }
        await api(`/api/decks/${deckId}/cards`, {
          method: 'POST',
          body: JSON.stringify({ front, back, hint })
        });
      }

      await loadManagingCards();
      await loadDecks();

      if (keepOpenForNext) {
        els.cardFrontInput.value = '';
        els.cardBackInput.value = '';
        els.cardHintInput.value = '';
        els.cardFrontInput.focus();
      } else {
        closeAllModals();
      }
    } catch (err) {
      alert(`Could not save card: ${err.message}`);
    }
  }

  // --- Event Listeners ---

  // Theme Toggle
  els.btnThemeToggle.addEventListener('click', toggleTheme);

  // Navigation
  els.btnBrandHome.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('decks');
  });

  els.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    });
  });

  els.btnCreateDeck.addEventListener('click', () => openDeckModal());
  els.btnCreateDeckTop.addEventListener('click', () => openDeckModal());

  // Distribution Deck Select Change
  els.distDeckSelect.addEventListener('change', (e) => {
    state.distributionDeckId = e.target.value;
    loadDistribution();
  });

  // Study View
  els.btnExitStudy.addEventListener('click', () => switchView('decks'));

  els.studyFlashcard.addEventListener('click', (e) => {
    if (e.target.closest('.review-ratings')) return;
    revealAnswer();
  });

  els.btnShowAnswer.addEventListener('click', (e) => {
    e.stopPropagation();
    revealAnswer();
  });

  els.btnToggleHint.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = els.cardHintText.style.display === 'none';
    els.cardHintText.style.display = isHidden ? 'block' : 'none';
    els.btnToggleHint.textContent = isHidden ? '[ - hint (h) ]' : '[ + hint (h) ]';
  });

  els.rateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rating = parseInt(btn.dataset.rating, 10);
      rateCard(rating);
    });
  });

  els.btnFinishReturn.addEventListener('click', () => switchView('decks'));
  els.btnFinishPractice.addEventListener('click', () => {
    if (state.studySession.deck) {
      startStudySession(state.studySession.deck, true);
    }
  });

  // Deck Management View
  els.btnBackToDecks.addEventListener('click', () => switchView('decks'));
  els.btnEditDeck.addEventListener('click', () => {
    if (state.managingDeck) openDeckModal(state.managingDeck);
  });

  els.btnDeleteDeck.addEventListener('click', async () => {
    if (!state.managingDeck) return;
    const deck = state.managingDeck;
    if (confirm(`Are you sure you want to delete deck "${deck.name}" and all its cards?`)) {
      try {
        await api(`/api/decks/${deck.id}`, { method: 'DELETE' });
        state.managingDeck = null;
        switchView('decks');
        await loadDecks();
      } catch (err) {
        alert(`Could not delete deck: ${err.message}`);
      }
    }
  });

  els.btnAddCard.addEventListener('click', () => openCardModal());

  els.cardSearchInput.addEventListener('input', (e) => {
    state.cardSearchQuery = e.target.value;
    renderManagingCardsTable();
  });

  els.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      els.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.cardFilterType = pill.dataset.filter;
      renderManagingCardsTable();
    });
  });

  // Modals Save & Close
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  els.btnSaveDeck.addEventListener('click', saveDeck);
  els.btnSaveCard.addEventListener('click', () => saveCard(false));
  els.btnSaveAddAnother.addEventListener('click', () => saveCard(true));

  // Modal input submit on Enter
  els.deckNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveDeck();
  });

  // Cmd+Enter to save in card textareas
  [els.cardFrontInput, els.cardBackInput, els.cardHintInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        saveCard(false);
      }
    });
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal-overlay.open');
      if (openModal) {
        closeAllModals();
        return;
      }
      if (state.currentView === 'study' || state.currentView === 'deckManage') {
        switchView('decks');
        return;
      }
    }

    if (isInputFocused) return;

    if (state.currentView === 'study') {
      if (e.code === 'Space') {
        e.preventDefault();
        revealAnswer();
      } else if (e.key === 'h' || e.key === 'H') {
        if (els.studyHintContainer.style.display !== 'none') {
          e.preventDefault();
          els.btnToggleHint.click();
        }
      } else if (state.studySession.isFlipped) {
        if (e.key === '1') rateCard(1);
        else if (e.key === '2') rateCard(2);
        else if (e.key === '3') rateCard(3);
        else if (e.key === '4') rateCard(4);
      }
    }
  });

  // Stats Data Management
  els.btnExportJson.addEventListener('click', () => {
    window.location.href = '/api/export';
  });

  els.inputImportJson.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await api('/api/import', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert(res.message || 'Import successful!');
      await loadDecks();
      await loadStats();
    } catch (err) {
      alert(`Could not import file: ${err.message}`);
    }
    e.target.value = '';
  });

  els.btnResetDb.addEventListener('click', async () => {
    if (confirm('Reset database to default starter decks? Current review logs and decks will be reset.')) {
      try {
        await api('/api/reset', { method: 'POST' });
        alert('Database reset to starter decks.');
        await loadProfile();
        await loadDecks();
        await loadStats();
      } catch (err) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  });

  // Helper
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdown(text) {
    if (!text) return '';
    const safe = escapeHtml(text);
    return safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // --- Initial Launch ---
  (async () => {
    initTheme();
    await loadProfile();
    await loadDecks();
  })();
});
