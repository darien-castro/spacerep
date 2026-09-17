const express = require('express');
const path = require('path');
const { db, dbPath } = require('./db/database');
const { processReview, formatDate, ORBIT_NAMES, calculateIntervalPreview } = require('./db/sm2');
const { seedDatabaseIfEmpty, starterDecks } = require('./db/seed_data');

const app = express();
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3030;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed database on launch if empty
seedDatabaseIfEmpty(db);

// --- User Profile Endpoints ---
app.get('/api/profile', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/profile', (req, res) => {
  try {
    const { pilot_name, sound_enabled } = req.body;
    const current = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();

    const newName = pilot_name !== undefined ? pilot_name : current.pilot_name;
    const newSound = sound_enabled !== undefined ? (sound_enabled ? 1 : 0) : current.sound_enabled;

    db.prepare('UPDATE user_profile SET pilot_name = ?, sound_enabled = ? WHERE id = 1')
      .run(newName, newSound);

    const updated = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Decks Endpoints ---
app.get('/api/decks', (req, res) => {
  try {
    const today = formatDate(new Date());
    const decks = db.prepare(`
      SELECT 
        d.*,
        COUNT(c.id) AS total_cards,
        SUM(CASE WHEN c.due_date <= ? THEN 1 ELSE 0 END) AS due_cards,
        SUM(CASE WHEN c.orbit_level = 1 THEN 1 ELSE 0 END) AS orbit_1_count,
        SUM(CASE WHEN c.orbit_level = 2 THEN 1 ELSE 0 END) AS orbit_2_count,
        SUM(CASE WHEN c.orbit_level = 3 THEN 1 ELSE 0 END) AS orbit_3_count,
        SUM(CASE WHEN c.orbit_level = 4 THEN 1 ELSE 0 END) AS orbit_4_count,
        SUM(CASE WHEN c.orbit_level = 5 THEN 1 ELSE 0 END) AS orbit_5_count
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
      GROUP BY d.id
      ORDER BY d.created_at ASC
    `).all(today);

    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/decks', (req, res) => {
  try {
    const { name, description, icon = '🚀', color = '#38bdf8' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Deck name is required.' });
    }

    const result = db.prepare(`
      INSERT INTO decks (name, description, icon, color)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), (description || '').trim(), icon, color);

    const newDeck = db.prepare('SELECT * FROM decks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newDeck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/decks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const existing = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Deck not found.' });
    }

    db.prepare(`
      UPDATE decks 
      SET name = ?, description = ?, icon = ?, color = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      description !== undefined ? description.trim() : existing.description,
      icon || existing.icon,
      color || existing.color,
      id
    );

    const updated = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/decks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM decks WHERE id = ?').run(id);
    res.json({ success: true, message: `Deck ${id} and associated telemetry deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cards Endpoints ---
app.get('/api/decks/:deckId/cards', (req, res) => {
  try {
    const { deckId } = req.params;
    const { due_only } = req.query;
    const today = formatDate(new Date());

    let sql = 'SELECT * FROM cards WHERE deck_id = ?';
    const params = [deckId];

    if (due_only === 'true' || due_only === '1') {
      sql += ' AND due_date <= ? ORDER BY orbit_level ASC, due_date ASC';
      params.push(today);
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    const rawCards = db.prepare(sql).all(...params);
    const cards = rawCards.map(c => ({
      ...c,
      preview_intervals: calculateIntervalPreview(c)
    }));
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/decks/:deckId/cards', (req, res) => {
  try {
    const { deckId } = req.params;
    const { front, back, hint = '' } = req.body;

    if (!front || !front.trim() || !back || !back.trim()) {
      return res.status(400).json({ error: 'Front and Back content are required.' });
    }

    const today = formatDate(new Date());

    const result = db.prepare(`
      INSERT INTO cards (deck_id, front, back, hint, orbit_level, interval_days, repetitions, ease_factor, due_date)
      VALUES (?, ?, ?, ?, 1, 0, 0, 2.5, ?)
    `).run(deckId, front.trim(), back.trim(), (hint || '').trim(), today);

    const newCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { front, back, hint } = req.body;

    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    db.prepare(`
      UPDATE cards 
      SET front = ?, back = ?, hint = ?
      WHERE id = ?
    `).run(
      front !== undefined ? front.trim() : existing.front,
      back !== undefined ? back.trim() : existing.back,
      hint !== undefined ? hint.trim() : existing.hint,
      id
    );

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
    res.json({ success: true, message: `Card ${id} decommissioned.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Review Submission (SM-2 Processing) ---
app.post('/api/cards/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body; // 1, 2, 3, or 4

    if (![1, 2, 3, 4].includes(rating)) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 4.' });
    }

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    const outcome = processReview(card, rating);

    // Update Card in database
    db.prepare(`
      UPDATE cards
      SET interval_days = ?,
          repetitions = ?,
          ease_factor = ?,
          orbit_level = ?,
          lapses = ?,
          due_date = ?,
          last_reviewed_at = ?
      WHERE id = ?
    `).run(
      outcome.interval_days,
      outcome.repetitions,
      outcome.ease_factor,
      outcome.orbit_level,
      outcome.lapses,
      outcome.due_date,
      outcome.last_reviewed_at,
      id
    );

    // Log review
    db.prepare(`
      INSERT INTO review_logs (card_id, deck_id, rating, previous_interval, new_interval, orbit_level)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      card.deck_id,
      rating,
      card.interval_days,
      outcome.interval_days,
      outcome.orbit_level
    );

    // Update Pilot Profile Streak & Stardust
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    const todayStr = formatDate(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatDate(yesterdayDate);

    let newStreak = profile.current_streak || 0;
    if (profile.last_study_date === todayStr) {
      // Already studied today, keep current streak
    } else if (profile.last_study_date === yesterdayStr) {
      newStreak += 1;
    } else {
      // Streak broken or starting fresh
      newStreak = 1;
    }

    const highestStreak = Math.max(profile.highest_streak || 0, newStreak);
    const totalStardust = (profile.stardust || 0) + outcome.xpEarned;

    db.prepare(`
      UPDATE user_profile
      SET current_streak = ?,
          highest_streak = ?,
          stardust = ?,
          last_study_date = ?
      WHERE id = 1
    `).run(newStreak, highestStreak, totalStardust, todayStr);

    const updatedProfile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    const updatedCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);

    res.json({
      card: updatedCard,
      outcome,
      profile: updatedProfile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Telemetry & Stats ---
app.get('/api/stats', (req, res) => {
  try {
    const today = formatDate(new Date());

    const totalCards = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;
    const dueToday = db.prepare('SELECT COUNT(*) as count FROM cards WHERE due_date <= ?').get(today).count;

    const orbitDistribution = db.prepare(`
      SELECT orbit_level, COUNT(*) as count
      FROM cards
      GROUP BY orbit_level
      ORDER BY orbit_level ASC
    `).all();

    // Map all 5 orbits even if 0 count
    const orbits = [1, 2, 3, 4, 5].map(lvl => {
      const found = orbitDistribution.find(o => o.orbit_level === lvl);
      return {
        level: lvl,
        count: found ? found.count : 0,
        ...ORBIT_NAMES[lvl]
      };
    });

    // Recent 14-day activity
    const activityHistory = db.prepare(`
      SELECT 
        DATE(reviewed_at) as review_date,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as successful_reviews
      FROM review_logs
      WHERE reviewed_at >= DATE('now', '-14 days')
      GROUP BY DATE(reviewed_at)
      ORDER BY review_date ASC
    `).all();

    // Rating breakdown
    const ratingBreakdown = db.prepare(`
      SELECT rating, COUNT(*) as count
      FROM review_logs
      GROUP BY rating
    `).all();

    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();

    res.json({
      profile,
      totalCards,
      dueToday,
      orbits,
      activityHistory,
      ratingBreakdown,
      dbPath
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Distribution Endpoint ---
app.get('/api/distribution', (req, res) => {
  try {
    const today = formatDate(new Date());
    const { deck_id } = req.query;

    let cardWhere = '';
    const cardParams = [];
    let selectedDeckName = 'All Decks';

    if (deck_id && deck_id !== 'all') {
      const parsedId = parseInt(deck_id, 10);
      if (!isNaN(parsedId)) {
        cardWhere = 'WHERE deck_id = ?';
        cardParams.push(parsedId);
        const foundDeck = db.prepare('SELECT name FROM decks WHERE id = ?').get(parsedId);
        if (foundDeck) selectedDeckName = foundDeck.name;
      }
    }

    const cards = db.prepare(`SELECT * FROM cards ${cardWhere} ORDER BY due_date ASC`).all(...cardParams);
    const totalCards = cards.length;

    let goodCount = 0;
    let learningCount = 0;
    let badCount = 0;
    let newCount = 0;
    const badCards = [];

    for (const c of cards) {
      if (c.repetitions === 0) {
        newCount++;
      } else if (c.lapses > 0 || c.ease_factor < 2.0 || c.due_date < today) {
        badCount++;
        badCards.push({
          id: c.id,
          deck_id: c.deck_id,
          front: c.front,
          back: c.back,
          lapses: c.lapses,
          ease_factor: c.ease_factor,
          interval_days: c.interval_days,
          due_date: c.due_date,
          reason: c.lapses > 0 
            ? `${c.lapses} lapse${c.lapses === 1 ? '' : 's'}` 
            : (c.ease_factor < 2.0 ? `Low ease (${c.ease_factor})` : 'Overdue')
        });
      } else if (c.interval_days >= 7) {
        goodCount++;
      } else {
        learningCount++;
      }
    }

    const calcPct = (cnt) => totalCards > 0 ? Math.round((cnt / totalCards) * 100) : 0;

    const territories = {
      good: {
        key: 'good',
        label: 'Good Territory',
        count: goodCount,
        percentage: calcPct(goodCount),
        color: '#10b981',
        description: 'Solid retention · interval ≥ 7 days'
      },
      learning: {
        key: 'learning',
        label: 'Learning Territory',
        count: learningCount,
        percentage: calcPct(learningCount),
        color: '#8b5cf6',
        description: 'Progressing well · interval 1–6 days'
      },
      bad: {
        key: 'bad',
        label: 'Bad Territory',
        count: badCount,
        percentage: calcPct(badCount),
        color: '#f43f5e',
        description: 'Struggling cards · lapses, low ease, or overdue'
      },
      new: {
        key: 'new',
        label: 'New Queue',
        count: newCount,
        percentage: calcPct(newCount),
        color: '#94a3b8',
        description: 'Awaiting initial study'
      }
    };

    // Calculate deck health score (Good cards / Active reviewed cards)
    const activeCards = goodCount + learningCount + badCount;
    const healthScore = activeCards > 0 ? Math.round((goodCount / activeCards) * 100) : (newCount > 0 ? 100 : 0);

    // Deck-by-Deck breakdown for all decks
    const deckBreakdown = db.prepare(`
      SELECT 
        d.id,
        d.name,
        COUNT(c.id) as total_cards,
        SUM(CASE WHEN c.due_date <= ? THEN 1 ELSE 0 END) as due_cards,
        SUM(CASE WHEN c.repetitions = 0 THEN 1 ELSE 0 END) as new_cards,
        SUM(CASE WHEN c.repetitions > 0 AND c.interval_days >= 7 AND c.lapses = 0 AND c.ease_factor >= 2.0 AND c.due_date >= ? THEN 1 ELSE 0 END) as good_cards,
        SUM(CASE WHEN c.repetitions > 0 AND c.interval_days < 7 AND c.lapses = 0 AND c.ease_factor >= 2.0 AND c.due_date >= ? THEN 1 ELSE 0 END) as learning_cards,
        SUM(CASE WHEN c.repetitions > 0 AND (c.lapses > 0 OR c.ease_factor < 2.0 OR c.due_date < ?) THEN 1 ELSE 0 END) as bad_cards,
        ROUND(AVG(c.ease_factor), 2) as avg_ease
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
      GROUP BY d.id
      ORDER BY d.created_at ASC
    `).all(today, today, today, today);

    // 7-day upcoming forecast
    const forecast = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      
      let count = 0;
      if (i === 0) {
        count = cards.filter(c => c.due_date <= dateStr).length;
      } else {
        count = cards.filter(c => c.due_date === dateStr).length;
      }

      forecast.push({
        date: dateStr,
        dayLabel,
        count
      });
    }

    res.json({
      selectedDeckId: deck_id || 'all',
      selectedDeckName,
      totalCards,
      healthScore,
      territories,
      badCards,
      deckBreakdown,
      forecast
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Export & Import ---
app.get('/api/export', (req, res) => {
  try {
    const decks = db.prepare('SELECT * FROM decks').all();
    const cards = db.prepare('SELECT * FROM cards').all();
    res.setHeader('Content-Disposition', 'attachment; filename="spacerep_telemetry_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ exportDate: new Date().toISOString(), decks, cards }, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import', (req, res) => {
  try {
    const { decks = [], cards = [] } = req.body;
    if (!Array.isArray(decks) || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Invalid backup format. Must contain decks and cards arrays.' });
    }

    const today = formatDate(new Date());
    const idMap = new Map();

    const insertDeck = db.prepare(`
      INSERT INTO decks (name, description, icon, color)
      VALUES (?, ?, ?, ?)
    `);

    const insertCard = db.prepare(`
      INSERT INTO cards (deck_id, front, back, hint, orbit_level, interval_days, repetitions, ease_factor, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const d of decks) {
      const result = insertDeck.run(d.name || 'Imported Nebula', d.description || '', d.icon || '🚀', d.color || '#38bdf8');
      idMap.set(d.id, result.lastInsertRowid);
    }

    let cardCount = 0;
    for (const c of cards) {
      const mappedDeckId = idMap.get(c.deck_id) || Array.from(idMap.values())[0];
      if (mappedDeckId && c.front && c.back) {
        insertCard.run(
          mappedDeckId,
          c.front,
          c.back,
          c.hint || '',
          c.orbit_level || 1,
          c.interval_days || 0,
          c.repetitions || 0,
          c.ease_factor || 2.5,
          c.due_date || today
        );
        cardCount++;
      }
    }

    res.json({
      success: true,
      message: `Imported ${decks.length} decks and ${cardCount} cards.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reset to Default Decks ---
app.post('/api/reset', (req, res) => {
  try {
    db.exec(`
      DELETE FROM review_logs;
      DELETE FROM cards;
      DELETE FROM decks;
      UPDATE user_profile 
      SET stardust = 0, current_streak = 1, highest_streak = 1, last_study_date = NULL 
      WHERE id = 1;
    `);
    seedDatabaseIfEmpty(db);
    res.json({ success: true, message: 'Database reset to default starter decks.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend SPA fallback (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`SpaceRep server running at: http://localhost:${port}`);
    console.log(`Database saved at: ${dbPath}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
