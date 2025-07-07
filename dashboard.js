document.addEventListener('DOMContentLoaded', () => {
  setDashboardBackground();
  // Always hide all feature sections and show only navigation on load
  const features = [
    'microtasksSection',
    'moodSection',
    'taskTrackerSection',
    'todoSection',
    'quoteSection'
  ];
  features.forEach(id => {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = 'none';
  });
  const nav = document.getElementById('featureNav');
  if (nav) nav.style.display = '';
  setupFeatureNavigation();
});

function setDashboardBackground() {
  const bg = document.getElementById('dashboard-bg');
  const profession = localStorage.getItem('niro_profession') || 'Other';
  const bgMap = {
    'Software Engineer': 'assets/bg_engineer.jpg',
    'Student': 'assets/bg_student.jpg',
    'Teacher': 'assets/bg_teacher.jpg',
    'Healthcare Worker': 'assets/bg_healthcare.jpg',
    'Other': 'assets/bg_other.jpg'
  };
  // Blend the image with the gradient
  bg.style.backgroundImage = `linear-gradient(135deg, rgba(161,140,209,0.85) 0%, rgba(251,194,235,0.85) 100%), url('${bgMap[profession] || bgMap['Other']}')`;
  bg.style.backgroundSize = 'cover';
  bg.style.backgroundPosition = 'center';
}

function showQuote() {
  const quoteSection = document.getElementById('quoteSection');
  const quote = getRandomQuote();
  quoteSection.innerHTML = `<blockquote>"${quote.text}"<br><span>- ${quote.author}</span></blockquote>`;
}

function showMicrotasks() {
  const section = document.getElementById('microtasksSection');
  const today = new Date().toDateString();
  // Hydration session and daily total
  let sessionCount = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
  let dailyTotal = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
  let hydrationHtml = `<div class="microtask-card hydration">
    <h3>Drink Water</h3>
    <div style="display:flex; align-items:center; gap:10px; justify-content:center;">
      <button id="waterMinusBtn" ${sessionCount <= 0 ? 'disabled' : ''}>-</button>
      <span id="waterCount" style="font-size:1.2em; min-width:24px; display:inline-block;">${sessionCount}</span>
      <button id="waterPlusBtn" ${sessionCount >= 5 ? 'disabled' : ''}>+</button>
      <span style="font-size:0.98em; color:#888; margin-left:8px;">/ 5 (this session)</span>
    </div>
    <div style="margin-top:6px; font-size:0.98em; color:#2563eb;">Today: <span id="waterDailyTotal">${dailyTotal}</span> / 8 glasses</div>
    <div id="waterSessionComplete" style="display:none; margin-top:8px;">
      <button id="completeWaterSessionBtn" style="background:#4CAF50; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:0.9em;">Complete Session (0.2 pts)</button>
    </div>
  </div>`;
  // Breathing
  let breathingHtml = `<div class="microtask-card breathing">
    <h3>Breathing Exercise</h3>
    <button id="startBreathingBtn">Start Breathing</button>
    <div id="breathingAnimation" style="display:none; margin-top:10px;"></div>
  </div>`;
  // Journal with notes
  let journalEntries = [];
  try {
    journalEntries = JSON.parse(localStorage.getItem('niro_task_journal_note_' + today) || '[]');
    if (!Array.isArray(journalEntries)) journalEntries = [];
  } catch (e) { journalEntries = []; }
  const journalNote = '';
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  let journalHtml = `<div class="microtask-card journal">
    <h3>Journal Entry for ${dateStr}</h3>
    <input id="journalHeading" type="text" placeholder="Heading (required)" style="width:100%;margin-top:8px;border-radius:8px;padding:7px 10px;border:1px solid #d1d5db;font-size:1em;">
    <textarea id="journalNote" placeholder="Write your journal entry for today..." rows="4" style="width:100%;margin-top:8px;border-radius:8px;padding:8px 10px;border:1px solid #d1d5db;resize:vertical;"></textarea>
    <button id="saveJournalNoteBtn" style="margin-top:6px;">Save Entry</button>
    <button id="viewJournalHistoryBtn" style="margin-top:8px;background:#a18cd1;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:0.9em;">View Past Entries</button>
    <div id="allJournalHistory" style="display:none;"></div>
  </div>`;
  section.innerHTML = hydrationHtml + breathingHtml + journalHtml;

  // Hydration counter interaction
  const waterMinusBtn = document.getElementById('waterMinusBtn');
  const waterPlusBtn = document.getElementById('waterPlusBtn');
  const waterCountSpan = document.getElementById('waterCount');
  const waterDailyTotalSpan = document.getElementById('waterDailyTotal');
  if (waterMinusBtn && waterPlusBtn && waterCountSpan && waterDailyTotalSpan) {
    waterMinusBtn.addEventListener('click', () => {
      let session = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
      let total = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
      if (session > 0 && total > 0) {
        session--;
        total--;
        sessionStorage.setItem('niro_task_hydration_session_' + today, session);
        localStorage.setItem('niro_task_hydration_total_' + today, total);
        if (chrome && chrome.storage && chrome.storage.local) {
          let obj = {}; obj['niro_task_hydration_total_' + today] = total;
          chrome.storage.local.set(obj);
          chrome.runtime.sendMessage({ type: 'niro_water_count_changed' });
        }
        showMicrotasks();
      }
    });
    waterPlusBtn.addEventListener('click', () => {
      let session = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
      let total = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
      let sessionStarted = sessionStorage.getItem('niro_task_hydration_session_started_' + today) === 'true';
      if (session < 5) {
        session++;
        total++;
        sessionStorage.setItem('niro_task_hydration_session_' + today, session);
        localStorage.setItem('niro_task_hydration_total_' + today, total);
        if (!sessionStarted) {
          sessionStorage.setItem('niro_task_hydration_session_started_' + today, 'true');
        }
        if (chrome && chrome.storage && chrome.storage.local) {
          let obj = {}; obj['niro_task_hydration_total_' + today] = total;
          chrome.storage.local.set(obj);
          chrome.runtime.sendMessage({ type: 'niro_water_count_changed' });
        }
        showMicrotasks();
        if (session > 0) {
          const completeDiv = document.getElementById('waterSessionComplete');
          if (completeDiv) completeDiv.style.display = 'block';
        }
      }
    });
  }

  // Complete session button
  const completeWaterSessionBtn = document.getElementById('completeWaterSessionBtn');
  if (completeWaterSessionBtn) {
    completeWaterSessionBtn.addEventListener('click', () => {
      const sessionCount = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
      if (sessionCount > 0) {
        // Award 0.2 points for completing a drinking session
        updatePoints(0.2);
        // Reset session
        sessionStorage.setItem('niro_task_hydration_session_' + today, '0');
        sessionStorage.removeItem('niro_task_hydration_session_started_' + today);
        showMicrotasks();
      }
    });
  }

  // Breathing interaction
  const startBreathingBtn = document.getElementById('startBreathingBtn');
  const breathingAnimation = document.getElementById('breathingAnimation');
  let breathingInterval = null;
  if (startBreathingBtn && breathingAnimation) {
    startBreathingBtn.addEventListener('click', () => {
      if (startBreathingBtn.textContent === 'Start Breathing') {
        startBreathingBtn.textContent = 'Stop Breathing';
        breathingAnimation.style.display = '';
        breathingAnimation.innerHTML = '<div class="breathing-circle"></div><div class="breathing-text">Breathe In</div>';
        let phase = 0;
        let cycles = 0;
        const maxCycles = 5; // 5 full cycles (in+out)
        breathingInterval = setInterval(() => {
          phase = (phase + 1) % 4;
          const text = breathingAnimation.querySelector('.breathing-text');
          const circle = breathingAnimation.querySelector('.breathing-circle');
          if (phase % 2 === 0) {
            text.textContent = 'Breathe In';
            text.style.color = '#3730a3';
            circle.style.transform = 'scale(1.2)';
            circle.style.background = '#a18cd1';
            if (phase === 0) cycles++;
            if (cycles >= maxCycles) {
              clearInterval(breathingInterval);
              startBreathingBtn.textContent = 'Start Breathing';
              text.textContent = 'Session Complete!';
              text.style.color = '#2563eb';
              setTimeout(() => {
                breathingAnimation.style.display = 'none';
                breathingAnimation.innerHTML = '';
              }, 2000);
              return;
            }
          } else {
            text.textContent = 'Breathe Out';
            text.style.color = '#222';
            circle.style.transform = 'scale(0.8)';
            circle.style.background = '#fbc2eb';
          }
        }, 4000);
      } else {
        startBreathingBtn.textContent = 'Start Breathing';
        breathingAnimation.style.display = 'none';
        breathingAnimation.innerHTML = '';
        if (breathingInterval) clearInterval(breathingInterval);
      }
    });
  }

  // Journal notes interaction
  const journalNoteArea = document.getElementById('journalNote');
  const saveJournalNoteBtn = document.getElementById('saveJournalNoteBtn');
  const journalHeadingInput = document.getElementById('journalHeading');
  if (journalNoteArea && saveJournalNoteBtn) {
    saveJournalNoteBtn.addEventListener('click', () => {
      const heading = journalHeadingInput.value.trim();
      const note = journalNoteArea.value.trim();
      if (heading.length > 0 && note.length > 0) {
        let entries = [];
        try {
          entries = JSON.parse(localStorage.getItem('niro_task_journal_note_' + today) || '[]');
          if (!Array.isArray(entries)) entries = [];
        } catch (e) { entries = []; }
        entries.push({
          heading,
          text: note,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem('niro_task_journal_note_' + today, JSON.stringify(entries));
        saveJournalNoteBtn.textContent = 'Saved!';
        setTimeout(() => { saveJournalNoteBtn.textContent = 'Save Entry'; }, 1200);
        journalNoteArea.value = '';
        journalHeadingInput.value = '';
      } else {
        saveJournalNoteBtn.textContent = 'Heading and note required!';
        setTimeout(() => { saveJournalNoteBtn.textContent = 'Save Entry'; }, 1200);
      }
    });
  }

  // Render all past journal entries (not just today)
  function renderAllJournalHistory() {
    let allEntries = [];
    const today = new Date().toDateString();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('niro_task_journal_note_')) {
        const date = key.substring('niro_task_journal_note_'.length);
        let notesArr = [];
        try {
          notesArr = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(notesArr)) notesArr = [];
        } catch (e) { notesArr = []; }
        notesArr.forEach((entry, idx) => {
          if (entry.text && entry.text.trim().length > 0 && entry.heading && entry.heading.trim().length > 0) {
            allEntries.push({ date, note: entry.text, time: entry.time, heading: entry.heading, idx });
          }
        });
      }
    }
    // Sort by date descending
    allEntries.sort((a, b) => {
      const da = Date.parse(a.date);
      const db = Date.parse(b.date);
      if (!isNaN(da) && !isNaN(db)) return db - da;
      return b.date.localeCompare(a.date);
    });
    let html = '<h4 style="margin:18px 0 8px 0;color:#2563eb;">Past Journal Entries</h4>';
    if (allEntries.length === 0) {
      html += '<div style="color:#888;">No past entries found.</div>';
    } else {
      html += allEntries.map((e, i) => {
        const entryId = `journalHistory_${e.date.replace(/\W/g, '')}_${e.idx}`;
        return `<div style="margin-bottom:10px;">
          <div class="journal-history-heading" data-entry-id="${entryId}" style="font-weight:600;color:#2563eb;cursor:pointer;">
            ${new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} <span style='color:#888;font-size:0.95em;'>${e.time ? e.time : ''}</span> — <b>${(e.heading || '').replace(/</g, '&lt;')}</b>
          </div>
          <div id="${entryId}" style="display:none;margin-top:4px;white-space:pre-line;">${(e.note || '').replace(/</g, '&lt;')}</div>
        </div>`;
      }).join('');
    }
    let historyDiv = document.getElementById('allJournalHistory');
    if (historyDiv) {
      historyDiv.innerHTML = html;
    }
    // Attach expand/collapse listeners
    setTimeout(() => {
      const headings = document.querySelectorAll('#allJournalHistory .journal-history-heading');
      headings.forEach(heading => {
        heading.addEventListener('click', function() {
          const entryId = this.getAttribute('data-entry-id');
          const bodyDiv = document.getElementById(entryId);
          if (bodyDiv) {
            bodyDiv.style.display = (bodyDiv.style.display === 'block') ? 'none' : 'block';
          }
        });
      });
    }, 0);
  }
  renderAllJournalHistory();

  // Toggle past entries visibility
  const viewJournalHistoryBtn = document.getElementById('viewJournalHistoryBtn');
  const allJournalHistoryDiv = document.getElementById('allJournalHistory');
  if (viewJournalHistoryBtn && allJournalHistoryDiv) {
    viewJournalHistoryBtn.addEventListener('click', function() {
      if (allJournalHistoryDiv.style.display === 'none' || allJournalHistoryDiv.style.display === '') {
        allJournalHistoryDiv.style.display = 'block';
        viewJournalHistoryBtn.textContent = 'Hide Past Entries';
      } else {
        allJournalHistoryDiv.style.display = 'none';
        viewJournalHistoryBtn.textContent = 'View Past Entries';
      }
    });
  }
}

function showMoodSection() {
  const section = document.getElementById('moodSection');
  const now = new Date();
  const today = now.toDateString();
  const moodData = JSON.parse(localStorage.getItem('niro_mood_checkins') || '{}');
  const checkins = moodData[today] || [];

  // --- Streak logic ---
  let streak = 0;
  let streakActive = false;
  let prevDate = new Date(now.getTime());
  prevDate.setDate(prevDate.getDate() - 1);
  let prevStr = prevDate.toDateString();
  let streakData = JSON.parse(localStorage.getItem('niro_mood_streak') || '[]');
  // streakData: array of {date, count}
  // Build streak: count consecutive days with at least 2 check-ins
  let days = 0;
  let lastDate = null;
  for (let i = streakData.length - 1; i >= 0; i--) {
    if (days === 0) lastDate = streakData[i].date;
    const d = streakData[i];
    if (d.count >= 2) {
      if (days === 0 || (new Date(d.date).getTime() === new Date(lastDate).getTime() - days * 24 * 60 * 60 * 1000)) {
        streak++;
        days++;
        lastDate = d.date;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  if (streak >= 2) streakActive = true;

  let html = '<h3>Mood Check-In ';
  if (streakActive) html += '<span title="Streak!" style="color:#ff9800;font-size:1.1em;vertical-align:middle;">🔥 ' + streak + '</span>';
  html += '</h3>';
  if (checkins.length >= 3) {
    html += '<p>All 3 check-ins done for today! 🎉</p>';
  } else {
    // Check if last check-in was less than 6 hours ago
    let canCheckIn = true;
    if (checkins.length > 0) {
      const lastCheckin = checkins[checkins.length - 1];
      // Use ISO timestamp for comparison
      const lastTime = new Date(lastCheckin.timestamp || lastCheckin.time);
      const diffMs = now - lastTime;
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 6) {
        canCheckIn = false;
        const nextCheckin = new Date(lastTime.getTime() + 6 * 60 * 60 * 1000);
        html += `<p>Next check-in available at <b>${nextCheckin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</b></p>`;
      }
    }
    if (canCheckIn) {
      html += `<button id="moodCheckinBtn">Check In (${checkins.length}/3)</button>`;
    }
  }
  section.innerHTML = html;
  const btn = document.getElementById('moodCheckinBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      showMoodPopup(checkins, moodData, today, streakActive, streakData);
    });
  }
}

function showMoodPopup(checkins, moodData, today, streakActive, streakData) {
  // Render emoji options instead of prompt
  const section = document.getElementById('moodSection');
  const emojis = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😔', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '😭', label: 'Crying' },
    { emoji: '😍', label: 'Loved' }
  ];
  let html = '<h3>Mood Check-In</h3>';
  html += '<div id="moodEmojiPicker">';
  emojis.forEach(e => {
    html += `<button class="mood-emoji-btn" title="${e.label}" data-emoji="${e.emoji}">${e.emoji}</button>`;
  });
  html += '</div>';
  section.innerHTML = html;
  // Add click listeners
  document.querySelectorAll('.mood-emoji-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mood = e.target.getAttribute('data-emoji');
      checkins.push({ time: new Date().toLocaleTimeString(), timestamp: new Date().toISOString(), mood });
      moodData[today] = checkins;
      localStorage.setItem('niro_mood_checkins', JSON.stringify(moodData));
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ userMood: mood });
      }
      // --- Streak update logic ---
      let streakData = JSON.parse(localStorage.getItem('niro_mood_streak') || '[]');
      let found = false;
      for (let i = 0; i < streakData.length; i++) {
        if (streakData[i].date === today) {
          streakData[i].count = checkins.length;
          found = true;
          break;
        }
      }
      if (!found) streakData.push({ date: today, count: checkins.length });
      // Remove old entries (keep last 30 days)
      streakData = streakData.filter(d => (new Date(today) - new Date(d.date)) / (1000*60*60*24) < 30);
      localStorage.setItem('niro_mood_streak', JSON.stringify(streakData));
      // --- Points logic ---
      let streak = 0;
      let days = 0;
      let lastDate = null;
      for (let i = streakData.length - 1; i >= 0; i--) {
        if (days === 0) lastDate = streakData[i].date;
        const d = streakData[i];
        if (d.count >= 2) {
          if (days === 0 || (new Date(d.date).getTime() === new Date(lastDate).getTime() - days * 24 * 60 * 60 * 1000)) {
            streak++;
            days++;
            lastDate = d.date;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      let bonus = (streak >= 2) ? 0.2 : 0;
      updatePoints(0.5 + bonus);
      showMoodSection();
    });
  });
}

function showTaskTracker() {
  const section = document.getElementById('taskTrackerSection');
  const points = parseFloat(localStorage.getItem('niro_points') || '0');
  const league = getLeague(points);
  section.innerHTML = `<h3>Task Tracker</h3><p>Points: <b>${points.toFixed(1)}</b></p><p>League: <b>${league.name}</b></p>`;
}

function updatePoints(inc) {
  let points = parseFloat(localStorage.getItem('niro_points') || '0');
  points += inc;
  localStorage.setItem('niro_points', points);
  renderDashboardHeader();
}

// League style map
const leagueStyles = {
  'Zen Master': 'background: linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%); color: #3b185f; border: 2px solid #a18cd1;',
  'Elevated': 'background: linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%); color: #1a237e; border: 2px solid #64b5f6;',
  'Balanced': 'background: linear-gradient(90deg, #fdfbfb 0%, #ebedee 100%); color: #374151; border: 2px solid #bdbdbd;',
  'Mindful': 'background: linear-gradient(90deg, #fbc2eb 0%, #f8ffae 100%); color: #374151; border: 2px solid #ffd54f;',
  'Tranquil': 'background: linear-gradient(90deg, #cfd9df 0%, #e2ebf0 100%); color: #2563eb; border: 2px solid #90caf9;'
};

function getLeague(points) {
  if (points >= 2500) return { name: 'Zen Master' };
  if (points >= 1201) return { name: 'Elevated' };
  if (points >= 501) return { name: 'Balanced' };
  if (points >= 101) return { name: 'Mindful' };
  return { name: 'Tranquil' };
}

function showTodoList() {
  const section = document.getElementById('todoSection');
  if (!section) return;
  // Render the To-Do List UI
  section.innerHTML = `
    <div class="todo-header">
      <h3>To-Do List</h3>
      <div class="todo-input-row">
        <input id="todoDesc" type="text" placeholder="Add a new task..." style="width:60%;border-radius:8px;padding:7px 10px;border:1px solid #d1d5db;font-size:1em;">
        <select id="todoDeadline" style="margin-left:8px;border-radius:8px;padding:7px 10px;border:1px solid #d1d5db;font-size:1em;">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <button id="addTodoBtn" style="margin-left:8px;">Add Task</button>
      </div>
    </div>
    <ul id="todoList" class="todo-list"></ul>
  `;

  function getTasks(callback) {
    chrome.storage.local.get(['niro_todos'], (result) => {
      callback(result.niro_todos || []);
    });
  }
  function saveTasks(tasks, callback) {
    chrome.storage.local.set({ niro_todos: tasks }, callback);
  }

  function renderTasks() {
    getTasks((tasks) => {
      const list = section.querySelector('#todoList');
      if (!list) return;
      if (tasks.length === 0) {
        list.innerHTML = '<li>No tasks yet.</li>';
        return;
      }
      list.innerHTML = '';
      tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (task.completed ? ' completed' : '');
        li.innerHTML = `
          <span class="desc">${task.completed ? '<s>' : ''}${task.description}${task.completed ? '</s>' : ''}</span>
          <span class="deadline">[${task.deadlineType === 'week' ? 'This Week' : 'This Month'}]</span>
          <button class="completeBtn" data-idx="${idx}">${task.completed ? 'Undo' : 'Complete'}</button>
          <button class="editBtn" data-idx="${idx}">Edit</button>
          <button class="deleteBtn" data-idx="${idx}">Delete</button>
        `;
        list.appendChild(li);

        // Enhanced completion logic
        const completeBtn = li.querySelector('.completeBtn');
        if (completeBtn) {
          completeBtn.addEventListener('click', (e) => {
            getTasks((tasks) => {
              const idx = parseInt(e.target.getAttribute('data-idx'), 10);
              if (!tasks[idx].completed) {
                tasks[idx].completed = true;
                updatePoints(3);
                saveTasks(tasks, () => {
                  renderTasks();
                  // Show Undo for 5 seconds, then fade out and delete
                  const li = list.children[idx];
                  if (li) {
                    completeBtn.textContent = 'Undo';
                    completeBtn.disabled = false;
                    let undoTimeout = setTimeout(() => {
                      li.style.transition = 'opacity 0.7s';
                      li.style.opacity = '0';
                      setTimeout(() => {
                        getTasks((tasks) => {
                          tasks.splice(idx, 1);
                          saveTasks(tasks, renderTasks);
                        });
                      }, 700);
                    }, 5000);
                    completeBtn.addEventListener('click', function undoHandler() {
                      clearTimeout(undoTimeout);
                      tasks[idx].completed = false;
                      saveTasks(tasks, renderTasks);
                      completeBtn.removeEventListener('click', undoHandler);
                    });
                  }
                });
              } else {
                // Undo completion
                tasks[idx].completed = false;
                saveTasks(tasks, renderTasks);
              }
            });
          });
        }
        // ... existing code for edit/delete ...
      });
      // ... existing code for edit/delete event listeners ...
    });
  }

  section.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'addTodoBtn') {
      const descInput = section.querySelector('#todoDesc');
      const deadlineInput = section.querySelector('#todoDeadline');
      const desc = descInput.value.trim();
      const deadlineType = deadlineInput.value;
      if (!desc) return;
      getTasks((tasks) => {
        const editIdx = e.target.getAttribute('data-edit-idx');
        if (editIdx !== null && editIdx !== undefined) {
          tasks[editIdx].description = desc;
          tasks[editIdx].deadlineType = deadlineType;
          e.target.textContent = 'Add Task';
          e.target.removeAttribute('data-edit-idx');
        } else {
          tasks.push({
            description: desc,
            deadlineType: deadlineType,
            createdAt: new Date().toISOString(),
            completed: false
          });
        }
        saveTasks(tasks, renderTasks);
        descInput.value = '';
        deadlineInput.value = 'week';
      });
    }
  });

  renderTasks();
  // Listen for changes from other extension pages
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.niro_todos) {
      renderTasks();
    }
  });
}

const featureIcons = {
  'hydrationSection': `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="14" cy="18" rx="8" ry="7" fill="url(#waterGradient)"/><defs><linearGradient id="waterGradient" x1="6" y1="11" x2="22" y2="25" gradientUnits="userSpaceOnUse"><stop stop-color="#a1c4fd"/><stop offset="1" stop-color="#c2e9fb"/></linearGradient></defs></svg>`,
  'breathingSection': `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="9" cy="18" rx="5" ry="7" fill="#fbc2eb"/><ellipse cx="19" cy="18" rx="5" ry="7" fill="#a18cd1"/><ellipse cx="14" cy="10" rx="4" ry="3" fill="#b2f7ef"/></svg>`,
  'journalSection': `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="16" height="16" rx="3" fill="#fff" stroke="#a18cd1" stroke-width="2"/><rect x="9" y="10" width="10" height="2" rx="1" fill="#a18cd1"/><rect x="9" y="14" width="7" height="2" rx="1" fill="#a18cd1"/></svg>`,
  'moodSection': `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="url(#moodGradient)"/><ellipse cx="10" cy="13" rx="1.5" ry="2" fill="#fff"/><ellipse cx="18" cy="13" rx="1.5" ry="2" fill="#fff"/><path d="M10 18c1.5 1.5 6.5 1.5 8 0" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><defs><linearGradient id="moodGradient" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#fbc2eb"/><stop offset="1" stop-color="#a1c4fd"/></linearGradient></defs></svg>`,
  'todoSection': `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="7" width="16" height="14" rx="3" fill="#e0e7ff" stroke="#3730a3" stroke-width="2"/><rect x="9" y="11" width="8" height="2" rx="1" fill="#3730a3"/><rect x="9" y="15" width="5" height="2" rx="1" fill="#3730a3"/><circle cx="20" cy="12" r="2" fill="#a18cd1"/></svg>`
};

const featureButtonClasses = {
  'hydrationSection': 'feature-hydration',
  'breathingSection': 'feature-breathing',
  'journalSection': 'feature-journal',
  'moodSection': 'feature-mood',
  'todoSection': 'feature-todo'
};

function setupFeatureNavigation() {
  const possibleFeatures = [
    { id: 'hydrationSection', name: 'Drink Water', render: showHydration },
    { id: 'breathingSection', name: 'Breathing', render: showBreathing },
    { id: 'journalSection', name: 'Journal', render: showJournal },
    { id: 'moodSection', name: 'Mood Check-In', render: showMoodSection },
    { id: 'todoSection', name: 'To-Do', render: showTodoList }
  ];
  const featureContent = document.getElementById('featureContent');
  // Remove any orphaned/duplicate feature sections
  possibleFeatures.forEach(f => {
    const all = Array.from(document.querySelectorAll(`#${f.id}`));
    if (all.length > 1) {
      all.slice(1).forEach(node => node.remove());
    }
  });
  const features = possibleFeatures.map(f => {
    let sec = document.getElementById(f.id);
    if (!sec) {
      sec = document.createElement('div');
      sec.id = f.id;
      sec.className = 'feature-card';
      sec.style.display = 'none';
    }
    sec.style.display = 'none';
    return { ...f, section: sec };
  });
  const nav = document.getElementById('featureNav');
  nav.innerHTML = features.map(f =>
    `<button class="feature-nav-btn" data-target="${f.id}">${f.name}</button>`
  ).join('');
  // Show feature on click
  nav.querySelectorAll('.feature-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      nav.style.display = 'none';
      featureContent.innerHTML = '';
      features.forEach(f => {
        f.section.style.display = (f.id === target) ? '' : 'none';
      });
      const feature = features.find(f => f.id === target);
      featureContent.appendChild(feature.section);
      // Render the selected feature's content (after appending)
      if (feature && typeof feature.render === 'function') feature.render();
      // Add back button
      let backBtn = document.getElementById('featureBackBtn');
      if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.id = 'featureBackBtn';
        backBtn.textContent = '← Back';
        backBtn.className = 'feature-back-btn';
        backBtn.style = 'margin-bottom:12px; margin-left:2px;';
        featureContent.insertBefore(backBtn, feature.section);
      } else {
        backBtn.style.display = '';
        featureContent.insertBefore(backBtn, feature.section);
      }
      backBtn.onclick = () => {
        nav.style.display = '';
        featureContent.innerHTML = '';
        backBtn.style.display = 'none';
      };
    });
  });
  // On load, show nav and hide featureContent
  nav.style.display = '';
  featureContent.innerHTML = '';
  // Hide all feature sections initially
  features.forEach(f => f.section.style.display = 'none');
  // Hide back button initially
  let backBtn = document.getElementById('featureBackBtn');
  if (backBtn) backBtn.style.display = 'none';
}

// Separate rendering for each microtask feature
function showHydration() {
  const section = document.getElementById('hydrationSection');
  if (section) {
    section.innerHTML = '';
    // Render only hydration card
    const today = new Date().toDateString();
    let sessionCount = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
    let dailyTotal = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
    let hydrationHtml = `<div class="microtask-card hydration">
      <h3>Drink Water</h3>
      <div style="display:flex; align-items:center; gap:10px; justify-content:center;">
        <button id="waterMinusBtn" ${sessionCount <= 0 ? 'disabled' : ''}>-</button>
        <span id="waterCount" style="font-size:1.2em; min-width:24px; display:inline-block;">${sessionCount}</span>
        <button id="waterPlusBtn" ${sessionCount >= 5 ? 'disabled' : ''}>+</button>
        <span style="font-size:0.98em; color:#888; margin-left:8px;">/ 5 (this session)</span>
      </div>
      <div style="margin-top:6px; font-size:0.98em; color:#2563eb;">Today: <span id="waterDailyTotal">${dailyTotal}</span> / 8 glasses</div>
      <div id="waterSessionComplete" style="display:none; margin-top:8px;">
        <button id="completeWaterSessionBtn" style="background:#4CAF50; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer; font-size:0.9em;">Complete Session (0.2 pts)</button>
      </div>
    </div>`;
    section.innerHTML = hydrationHtml;
    // Attach hydration logic
    const waterMinusBtn = document.getElementById('waterMinusBtn');
    const waterPlusBtn = document.getElementById('waterPlusBtn');
    const waterCountSpan = document.getElementById('waterCount');
    const waterDailyTotalSpan = document.getElementById('waterDailyTotal');
    if (waterMinusBtn && waterPlusBtn && waterCountSpan && waterDailyTotalSpan) {
      waterMinusBtn.addEventListener('click', () => {
        let session = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
        let total = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
        if (session > 0 && total > 0) {
          session--;
          total--;
          sessionStorage.setItem('niro_task_hydration_session_' + today, session);
          localStorage.setItem('niro_task_hydration_total_' + today, total);
          if (chrome && chrome.storage && chrome.storage.local) {
            let obj = {}; obj['niro_task_hydration_total_' + today] = total;
            chrome.storage.local.set(obj);
            chrome.runtime.sendMessage({ type: 'niro_water_count_changed' });
          }
          showHydration();
        }
      });
      waterPlusBtn.addEventListener('click', () => {
        let session = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
        let total = parseInt(localStorage.getItem('niro_task_hydration_total_' + today) || '0', 10);
        let sessionStarted = sessionStorage.getItem('niro_task_hydration_session_started_' + today) === 'true';
        if (session < 5) {
          session++;
          total++;
          sessionStorage.setItem('niro_task_hydration_session_' + today, session);
          localStorage.setItem('niro_task_hydration_total_' + today, total);
          if (!sessionStarted) {
            sessionStorage.setItem('niro_task_hydration_session_started_' + today, 'true');
          }
          if (chrome && chrome.storage && chrome.storage.local) {
            let obj = {}; obj['niro_task_hydration_total_' + today] = total;
            chrome.storage.local.set(obj);
            chrome.runtime.sendMessage({ type: 'niro_water_count_changed' });
          }
          showHydration();
          if (session > 0) {
            const completeDiv = document.getElementById('waterSessionComplete');
            if (completeDiv) completeDiv.style.display = 'block';
          }
        }
      });
    }
    // Complete session button
    const completeWaterSessionBtn = document.getElementById('completeWaterSessionBtn');
    if (completeWaterSessionBtn) {
      completeWaterSessionBtn.addEventListener('click', () => {
        const sessionCount = parseInt(sessionStorage.getItem('niro_task_hydration_session_' + today) || '0', 10);
        if (sessionCount > 0) {
          updatePoints(0.2);
          sessionStorage.setItem('niro_task_hydration_session_' + today, '0');
          sessionStorage.removeItem('niro_task_hydration_session_started_' + today);
          showHydration();
        }
      });
    }
  }
}
function showBreathing() {
  const section = document.getElementById('breathingSection');
  if (section) {
    section.innerHTML = '';
    let breathingHtml = `<div class="microtask-card breathing">
      <h3>Breathing Exercise</h3>
      <button id="startBreathingBtn">Start Breathing</button>
      <div id="breathingAnimation" style="display:none; margin-top:10px;"></div>
    </div>`;
    section.innerHTML = breathingHtml;
    // Attach breathing logic
    const startBreathingBtn = document.getElementById('startBreathingBtn');
    const breathingAnimation = document.getElementById('breathingAnimation');
    let breathingInterval = null;
    if (startBreathingBtn && breathingAnimation) {
      startBreathingBtn.addEventListener('click', () => {
        if (startBreathingBtn.textContent === 'Start Breathing') {
          startBreathingBtn.textContent = 'Stop Breathing';
          breathingAnimation.style.display = '';
          breathingAnimation.innerHTML = '<div class="breathing-circle"></div><div class="breathing-text">Breathe In</div>';
          let phase = 0;
          let cycles = 0;
          const maxCycles = 5;
          breathingInterval = setInterval(() => {
            phase = (phase + 1) % 4;
            const text = breathingAnimation.querySelector('.breathing-text');
            const circle = breathingAnimation.querySelector('.breathing-circle');
            if (phase % 2 === 0) {
              text.textContent = 'Breathe In';
              text.style.color = '#3730a3';
              circle.style.transform = 'scale(1.2)';
              circle.style.background = '#a18cd1';
              if (phase === 0) cycles++;
              if (cycles >= maxCycles) {
                clearInterval(breathingInterval);
                startBreathingBtn.textContent = 'Start Breathing';
                text.textContent = 'Session Complete!';
                text.style.color = '#2563eb';
                setTimeout(() => {
                  breathingAnimation.style.display = 'none';
                  breathingAnimation.innerHTML = '';
                }, 2000);
                return;
              }
            } else {
              text.textContent = 'Breathe Out';
              text.style.color = '#222';
              circle.style.transform = 'scale(0.8)';
              circle.style.background = '#fbc2eb';
            }
          }, 4000);
        } else {
          startBreathingBtn.textContent = 'Start Breathing';
          breathingAnimation.style.display = 'none';
          breathingAnimation.innerHTML = '';
          if (breathingInterval) clearInterval(breathingInterval);
        }
      });
    }
  }
}
function showJournal() {
  const section = document.getElementById('journalSection');
  if (section) {
    section.innerHTML = '';
    const today = new Date().toDateString();
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    let journalHtml = `<div class="microtask-card journal">
      <h3>Journal Entry for ${dateStr}</h3>
      <input id="journalHeading" type="text" placeholder="Heading (required)" style="width:100%;margin-top:8px;border-radius:8px;padding:7px 10px;border:1px solid #d1d5db;font-size:1em;">
      <textarea id="journalNote" placeholder="Write your journal entry for today..." rows="4" style="width:100%;margin-top:8px;border-radius:8px;padding:8px 10px;border:1px solid #d1d5db;resize:vertical;"></textarea>
      <button id="saveJournalNoteBtn" style="margin-top:6px;">Save Entry</button>
      <button id="viewJournalHistoryBtn" style="margin-top:8px;background:#a18cd1;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:0.9em;">View Past Entries</button>
      <div id="allJournalHistory" style="display:none;"></div>
    </div>`;
    section.innerHTML = journalHtml;
    // Attach journal logic
    const journalNoteArea = document.getElementById('journalNote');
    const saveJournalNoteBtn = document.getElementById('saveJournalNoteBtn');
    const journalHeadingInput = document.getElementById('journalHeading');
    if (journalNoteArea && saveJournalNoteBtn) {
      saveJournalNoteBtn.addEventListener('click', () => {
        const heading = journalHeadingInput.value.trim();
        const note = journalNoteArea.value.trim();
        if (heading.length > 0 && note.length > 0) {
          let entries = [];
          try {
            entries = JSON.parse(localStorage.getItem('niro_task_journal_note_' + today) || '[]');
            if (!Array.isArray(entries)) entries = [];
          } catch (e) { entries = []; }
          entries.push({
            heading,
            text: note,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          localStorage.setItem('niro_task_journal_note_' + today, JSON.stringify(entries));
          saveJournalNoteBtn.textContent = 'Saved!';
          setTimeout(() => { saveJournalNoteBtn.textContent = 'Save Entry'; }, 1200);
          journalNoteArea.value = '';
          journalHeadingInput.value = '';
        } else {
          saveJournalNoteBtn.textContent = 'Heading and note required!';
          setTimeout(() => { saveJournalNoteBtn.textContent = 'Save Entry'; }, 1200);
        }
      });
    }
    // Render all past journal entries (not just today)
    function renderAllJournalHistory() {
      let allEntries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('niro_task_journal_note_')) {
          const date = key.substring('niro_task_journal_note_'.length);
          let notesArr = [];
          try {
            notesArr = JSON.parse(localStorage.getItem(key) || '[]');
            if (!Array.isArray(notesArr)) notesArr = [];
          } catch (e) { notesArr = []; }
          notesArr.forEach((entry, idx) => {
            if (entry.text && entry.text.trim().length > 0 && entry.heading && entry.heading.trim().length > 0) {
              allEntries.push({ date, note: entry.text, time: entry.time, heading: entry.heading, idx });
            }
          });
        }
      }
      // Sort by date descending
      allEntries.sort((a, b) => {
        const da = Date.parse(a.date);
        const db = Date.parse(b.date);
        if (!isNaN(da) && !isNaN(db)) return db - da;
        return b.date.localeCompare(a.date);
      });
      let html = '<h4 style="margin:18px 0 8px 0;color:#2563eb;">Past Journal Entries</h4>';
      if (allEntries.length === 0) {
        html += '<div style="color:#888;">No past entries found.</div>';
      } else {
        html += allEntries.map((e, i) => {
          const entryId = `journalHistory_${e.date.replace(/\W/g, '')}_${e.idx}`;
          return `<div style="margin-bottom:10px;">
            <div class="journal-history-heading" data-entry-id="${entryId}" style="font-weight:600;color:#2563eb;cursor:pointer;">
              ${new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} <span style='color:#888;font-size:0.95em;'>${e.time ? e.time : ''}</span> — <b>${(e.heading || '').replace(/</g, '&lt;')}</b>
            </div>
            <div id="${entryId}" style="display:none;margin-top:4px;white-space:pre-line;">${(e.note || '').replace(/</g, '&lt;')}</div>
          </div>`;
        }).join('');
      }
      let historyDiv = document.getElementById('allJournalHistory');
      if (historyDiv) {
        historyDiv.innerHTML = html;
      }
      // Attach expand/collapse listeners
      setTimeout(() => {
        const headings = document.querySelectorAll('#allJournalHistory .journal-history-heading');
        headings.forEach(heading => {
          heading.addEventListener('click', function() {
            const entryId = this.getAttribute('data-entry-id');
            const bodyDiv = document.getElementById(entryId);
            if (bodyDiv) {
              bodyDiv.style.display = (bodyDiv.style.display === 'block') ? 'none' : 'block';
            }
          });
        });
      }, 0);
    }
    renderAllJournalHistory();
    // Toggle past entries visibility
    const viewJournalHistoryBtn = document.getElementById('viewJournalHistoryBtn');
    const allJournalHistoryDiv = document.getElementById('allJournalHistory');
    if (viewJournalHistoryBtn && allJournalHistoryDiv) {
      viewJournalHistoryBtn.addEventListener('click', function() {
        if (allJournalHistoryDiv.style.display === 'none' || allJournalHistoryDiv.style.display === '') {
          allJournalHistoryDiv.style.display = 'block';
          viewJournalHistoryBtn.textContent = 'Hide Past Entries';
        } else {
          allJournalHistoryDiv.style.display = 'none';
          viewJournalHistoryBtn.textContent = 'View Past Entries';
        }
      });
    }
  }
}

// Prompt for user name if not set
function getUserName(callback) {
  let name = localStorage.getItem('niro_user_name');
  if (name) return callback(name);
  // Prompt for name (modal)
  const modal = document.createElement('div');
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:#fff;border-radius:18px;box-shadow:0 4px 32px #a18cd144;padding:32px 28px;min-width:260px;display:flex;flex-direction:column;align-items:center;">
    <h2 style='margin-bottom:18px;color:#3730a3;'>Welcome!</h2>
    <label for='userNameInput' style='font-size:1.1em;margin-bottom:8px;'>What's your name?</label>
    <input id='userNameInput' type='text' maxlength='24' style='font-size:1.1em;padding:8px 14px;border-radius:10px;border:1.5px solid #a18cd1;width:180px;margin-bottom:14px;'>
    <button id='userNameSubmitBtn' style='margin-top:4px;'>Continue</button>
  </div>`;
  document.body.appendChild(modal);
  const input = modal.querySelector('#userNameInput');
  const btn = modal.querySelector('#userNameSubmitBtn');
  btn.onclick = () => {
    const val = input.value.trim();
    if (val.length > 0) {
      localStorage.setItem('niro_user_name', val);
      document.body.removeChild(modal);
      callback(val);
    } else {
      input.style.borderColor = '#f87171';
      input.focus();
    }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  input.focus();
}

function renderDashboardHeader() {
  getUserName(name => {
    // Render greeting
    let header = document.getElementById('dashboardHeader');
    if (!header) {
      header = document.createElement('div');
      header.id = 'dashboardHeader';
      header.style = 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;min-height:64px;';
      document.querySelector('.dashboard-container').insertBefore(header, document.querySelector('.feature-grid'));
    }
    // League icon, name, score
    let points = parseFloat(localStorage.getItem('niro_points') || '0');
    let leagueObj = getLeague(points);
    header.innerHTML = `
      <div style='display:flex;flex-direction:column;align-items:flex-start;'>
        <h2 style='margin:0 0 2px 0;font-size:1.5em;font-weight:800;color:#3730a3;'>Hello, ${name}</h2>
      </div>
      <div style='display:flex;flex-direction:column;align-items:center;min-width:80px;'>
        <span style='font-size:2.1em;line-height:1;'>${leagueObj.icon || ''}</span>
        <span style='font-size:1em;font-weight:700;color:#3730a3;margin-top:2px;'>${leagueObj.name}</span>
        <span style='font-size:0.98em;color:#a18cd1;'>${points.toFixed(1)} pts</span>
      </div>
    `;
  });
}

// On DOMContentLoaded, render header and navigation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderDashboardHeader();
    setupFeatureNavigation();
  });
} else {
  renderDashboardHeader();
  setupFeatureNavigation();
} 