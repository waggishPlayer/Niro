document.addEventListener('DOMContentLoaded', () => {
  const getStartedBtn = document.getElementById('getStartedBtn');
  const questionsContainer = document.getElementById('questionsContainer');
  const dashboardBg = document.getElementById('dashboard-bg');
  const dashboardContainer = document.querySelector('.dashboard-container');
  const popupContainer = document.querySelector('.popup-container');

  // Always hide dashboard and background until onboarding is complete
  if (dashboardBg) dashboardBg.style.display = 'none';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
  if (popupContainer) popupContainer.style.display = '';
  document.body.style.overflow = 'hidden';

  // Helper to show dashboard and hide onboarding
  function showDashboardUI() {
    if (popupContainer) popupContainer.style.display = 'none';
    if (dashboardBg) dashboardBg.style.display = '';
    if (dashboardContainer) dashboardContainer.style.display = '';
    document.body.style.overflow = '';
    // Call personalized tasks after dashboard is visible
    if (typeof showPersonalizedTasks === 'function') {
      showPersonalizedTasks();
    }
    renderPopupTodoSection();
  }

  // Check if onboarding is already complete
  if (localStorage.getItem('niro_onboarding_complete') === 'true') {
    showDashboardUI();
    return;
  }

  let personalityData = null;
  let selectedProfession = null;
  let answers = [];

  // Disable Get Started until data is loaded
  getStartedBtn.disabled = true;
  getStartedBtn.textContent = 'Loading...';

  // Load personalityData.json dynamically
  fetch(chrome.runtime.getURL('personalityData.json'))
    .then(response => response.json())
    .then(data => {
      personalityData = data.profiles;
      getStartedBtn.disabled = false;
      getStartedBtn.textContent = 'Get Started';
    });

  getStartedBtn.addEventListener('click', () => {
    if (!personalityData) return; // Block if not loaded
    getStartedBtn.style.display = 'none';
    showProfessionSelect();
  });

  function showProfessionSelect() {
    questionsContainer.style.display = 'block';
    const professions = Object.keys(personalityData);
    questionsContainer.innerHTML = `
      <h2>Select your profession</h2>
      <form id="professionForm">
        ${professions.map(p => `<label><input type="radio" name="profession" value="${p}" required> ${p}</label><br>`).join('')}
        <button type="submit">Continue</button>
      </form>
    `;
    document.getElementById('professionForm').addEventListener('submit', (e) => {
      e.preventDefault();
      selectedProfession = document.querySelector('input[name="profession"]:checked').value;
      localStorage.setItem('niro_profession', selectedProfession);
      answers = [];
      showQuestions(0);
    });
  }

  function showQuestions(index) {
    const profile = personalityData[selectedProfession];
    const questions = profile.questions;
    if (index >= questions.length) {
      // Save answers and traits
      localStorage.setItem('niro_answers', JSON.stringify(answers));
      localStorage.setItem('niro_traits', JSON.stringify(profile.traits));
      localStorage.setItem('niro_onboarding_complete', 'true');
      questionsContainer.innerHTML = `<h2>Thank you!</h2><p>Your preferences have been saved.</p>`;
      // Show dashboard after a short delay
      setTimeout(() => {
        showDashboardUI();
      }, 1200);
      return;
    }
    let optionsHtml = '';
    const options = profile.options && profile.options[(index+1).toString()];
    if (options) {
      optionsHtml = options.map(opt => `<label><input type="radio" name="option" value="${opt}" required> ${opt}</label><br>`).join('');
    }
    questionsContainer.innerHTML = `
      <h2>Question ${index+1} of ${questions.length}</h2>
      <form id="questionForm">
        <p>${questions[index]}</p>
        ${optionsHtml}
        ${!options ? `<input type="text" name="answer" required placeholder="Your answer">` : ''}
        <button type="submit">Next</button>
      </form>
    `;
    document.getElementById('questionForm').addEventListener('submit', (e) => {
      e.preventDefault();
      let answer;
      if (optionsHtml) {
        answer = document.querySelector('input[name="option"]:checked').value;
      } else {
        answer = document.querySelector('input[name="answer"]').value;
      }
      answers.push(answer);
      showQuestions(index + 1);
    });
  }

  // --- To-Do List CRUD in Popup ---
  function renderPopupTodoSection() {
    const section = document.getElementById('popupTodoSection');
    const list = document.getElementById('popupTodoList');
    const descInput = document.getElementById('popupTodoDesc');
    const deadlineInput = document.getElementById('popupTodoDeadline');
    const addBtn = document.getElementById('popupAddTodoBtn');
    if (!section || !list || !descInput || !deadlineInput || !addBtn) return;

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
        });
        // Add event listeners
        list.querySelectorAll('.completeBtn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-idx');
            getTasks((tasks) => {
              tasks[idx].completed = !tasks[idx].completed;
              saveTasks(tasks, renderTasks);
            });
          });
        });
        list.querySelectorAll('.deleteBtn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-idx');
            getTasks((tasks) => {
              tasks.splice(idx, 1);
              saveTasks(tasks, renderTasks);
            });
          });
        });
        list.querySelectorAll('.editBtn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = e.target.getAttribute('data-idx');
            getTasks((tasks) => {
              const task = tasks[idx];
              descInput.value = task.description;
              deadlineInput.value = task.deadlineType;
              addBtn.textContent = 'Update Task';
              addBtn.setAttribute('data-edit-idx', idx);
            });
          });
        });
      });
    }

    addBtn.onclick = function() {
      const desc = descInput.value.trim();
      const deadlineType = deadlineInput.value;
      if (!desc) return;
      getTasks((tasks) => {
        const editIdx = addBtn.getAttribute('data-edit-idx');
        if (editIdx !== null && editIdx !== undefined) {
          tasks[editIdx].description = desc;
          tasks[editIdx].deadlineType = deadlineType;
          addBtn.textContent = 'Add Task';
          addBtn.removeAttribute('data-edit-idx');
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
    };

    renderTasks();
    // Listen for changes from other extension pages
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.niro_todos) {
        renderTasks();
      }
    });
  }

  // Show streak summary in popup
  function showPopupStreakSummary() {
    const streakDiv = document.getElementById('popupStreakSummary');
    if (!streakDiv) return;
    const now = new Date();
    const today = now.toDateString();
    let streakData = [];
    try {
      streakData = JSON.parse(localStorage.getItem('niro_mood_streak') || '[]');
    } catch (e) { streakData = []; }
    // Build streak: count consecutive days with at least 2 check-ins
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
    if (streak >= 2) {
      streakDiv.style.display = '';
      streakDiv.innerHTML = `<span title="Mood Check-In Streak!" style="color:#ff9800;font-size:1.15em;vertical-align:middle;">🔥 ${streak}</span> <span style="color:#2563eb;font-size:0.98em;">Streak!</span>`;
    } else {
      streakDiv.style.display = 'none';
    }
  }
  showPopupStreakSummary();
}); 