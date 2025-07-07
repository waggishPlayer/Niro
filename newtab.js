document.addEventListener('DOMContentLoaded', function() {
  console.log('newtab.js loaded');
  chrome.storage.local.get(['userMood', 'selectedPersonality'], (result) => {
    let mood = result.userMood;
    const personality = result.selectedPersonality || 'softwareEngineer';
    const profession = localStorage.getItem('niro_profession') || 'Other';

    // Fallback: if userMood is not set, get latest mood from localStorage.niro_mood_checkins
    if (!mood) {
      try {
        const moodData = JSON.parse(localStorage.getItem('niro_mood_checkins') || '{}');
        const today = new Date().toDateString();
        const checkins = moodData[today] || [];
        if (checkins.length > 0) {
          mood = checkins[checkins.length - 1].mood;
        } else {
          mood = 'happy';
        }
      } catch (e) {
        mood = 'happy';
      }
    }

    // Map emoji mood to keyword
    const moodKeywordMap = {
      '😊': 'happy',
      '😐': 'neutral',
      '😔': 'sad',
      '😡': 'angry',
      '😭': 'crying',
      '😍': 'love'
    };
    let moodKeyword = moodKeywordMap[mood] || mood || 'happy';

    // Curated wallpapers for each mood
    const moodWallpapers = {
      happy: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9"
      ],
      sad: [
        "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99",
        "https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
      ],
      angry: [
        "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca"
      ],
      crying: [
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308"
      ],
      love: [
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
      ],
      neutral: [
        "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99",
        "https://images.unsplash.com/photo-1502082553048-f009c37129b9"
      ]
    };

    // Pick a random wallpaper for the mood
    let wallpapers = moodWallpapers[moodKeyword] || moodWallpapers['happy'];
    let wallpaperUrl = wallpapers[Math.floor(Math.random() * wallpapers.length)];
    document.getElementById('wallpaper').style.backgroundImage = `url('${wallpaperUrl}')`;

    // Show a single random personality quote in the overlay
    fetch(`profiles/${personality}.json`)
      .then(response => response.json())
      .then(data => {
        const quotes = data.quotes || [];
        if (quotes.length > 0) {
          const overlay = document.getElementById('quoteOverlay');
          const quoteText = overlay.querySelector('.quote-text');
          const quote = quotes[Math.floor(Math.random() * quotes.length)];
          quoteText.textContent = quote;
          overlay.style.display = '';
        }
      });

    // Ensure the personalized tasks section exists
    let taskSection = document.getElementById('taskSection');
    if (!taskSection) {
      taskSection = document.createElement('div');
      taskSection.id = 'taskSection';
      taskSection.innerHTML = '<span class="task-title">Personalized Task</span><span class="task-text"></span>';
      document.body.appendChild(taskSection);
    }
    const taskText = taskSection.querySelector('.task-text');
    taskSection.style.display = '';
    taskText.textContent = 'Loading your personalized task...';
    const fileMap = {
      'Software Engineer': 'softwareEngineer',
      'Teacher': 'teacher',
      'Student': 'student',
      'Healthcare Worker': 'healthcareWorker',
      'Other': 'other'
    };
    const fileKey = fileMap[profession] || 'other';
    fetch(chrome.runtime.getURL(`profiles/${fileKey}.json`))
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch profile: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        const allTasks = data.tasks || [];
        if (allTasks.length > 0) {
          // Deterministic shuffle for the day
          const todaySeed = new Date().toDateString();
          function seededRandom(seed) {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < seed.length; i++) {
              h ^= seed.charCodeAt(i);
              h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            }
            return function() {
              h = Math.imul(h ^ h >>> 15, 1 | h);
              return Math.abs(h % 1e9) / 1e9;
            };
          }
          const rand = seededRandom(todaySeed);
          const shuffled = allTasks.slice().sort(() => rand() - 0.5);
          // Show only one task for the day
          const dailyTask = shuffled[0];
          if (dailyTask) {
            const today = new Date().toDateString();
            const taskCompleted = localStorage.getItem('niro_personalized_task_completed_' + today) === 'true';
            if (taskCompleted) {
              taskSection.querySelector('.task-title').textContent = "yay ! today's task is completed";
              taskText.innerHTML = '';
            } else {
              taskText.innerHTML = `${dailyTask.task} <button id=\"completePersonalizedTask\" style=\"margin-left: 8px;\">Complete</button>`;
              setTimeout(() => {
                const completeBtn = document.getElementById('completePersonalizedTask');
                if (completeBtn) {
                  completeBtn.addEventListener('click', () => {
                    // Show Undo for 5 seconds, then fade out and remove
                    completeBtn.textContent = 'Undo';
                    let undo = false;
                    let undoTimeout = setTimeout(() => {
                      taskText.style.transition = 'opacity 0.25s';
                      taskText.style.opacity = '0';
                      setTimeout(() => {
                        if (!undo) {
                          localStorage.setItem('niro_personalized_task_completed_' + today, 'true');
                          let points = parseFloat(localStorage.getItem('niro_points') || '0');
                          points += 1.5;
                          localStorage.setItem('niro_points', points);
                          taskText.innerHTML = '';
                          taskText.style.opacity = '1';
                        }
                      }, 250);
                    }, 5000);
                    completeBtn.addEventListener('click', function undoHandler() {
                      clearTimeout(undoTimeout);
                      undo = true;
                      taskText.innerHTML = `${dailyTask.task} <button id=\"completePersonalizedTask\" style=\"margin-left: 8px;\">Complete</button>`;
                      setTimeout(() => {
                        const btn = document.getElementById('completePersonalizedTask');
                        if (btn) btn.addEventListener('click', completeBtn.onclick);
                      }, 100);
                      completeBtn.removeEventListener('click', undoHandler);
                    });
                  });
                }
              }, 100);
            }
            console.log('Personalized daily task:', dailyTask.task);
          } else {
            taskText.textContent = 'No personalized task available.';
            console.log('No personalized task available.');
          }
        } else {
          taskText.textContent = 'No personalized task available.';
          console.log('No personalized task available.');
        }
      })
      .catch(err => {
        console.error('Personalized task error:', err);
        taskText.textContent = 'Could not load your personalized task.';
      });
  });

  // --- To-Do List Display on New Tab ---
  function renderTodoTabSection() {
    const section = document.getElementById('todoTabSection');
    if (!section) return;
    // Detect if running as extension page
    if (!location.protocol.startsWith('chrome-extension')) {
      section.innerHTML = '<div style="color: red; background: #222; padding: 16px; font-size: 1.3em; font-weight: bold;">To-Do List is not available.<br>This page is not running as an extension new tab.<br>Please set this extension as your new tab page.<br><br>URL must start with <code>chrome-extension://</code> for full functionality.</div>';
      return;
    }
    chrome.runtime.sendMessage({ type: 'niro_todo_op', todoOp: 'get' }, (response) => {
      const tasks = response && response.todos ? response.todos : [];
      section.innerHTML = '';
      if (!tasks || tasks.length === 0 || tasks.every(t => t.completed)) {
        section.innerHTML += '<div class="todo-tab-empty">No to-do tasks yet.</div>';
        return;
      }
      // Group tasks by deadlineType
      const weekTasks = tasks.filter(t => t.deadlineType === 'week');
      const monthTasks = tasks.filter(t => t.deadlineType === 'month');
      let html = '<div class="todo-tab-list"><h3>To-Do List</h3>';
      if (weekTasks.length > 0) {
        html += '<div class="todo-group"><b>This Week</b><ul>';
        weekTasks.forEach((task, idx) => {
          const globalIdx = tasks.findIndex(t => t === task);
          html += `<li class="todo-tab-item${task.completed ? ' completed' : ''}">
            <span>${task.completed ? '<s>' : ''}${task.description}${task.completed ? '</s>' : ''}</span>
            <button class="tab-complete-btn" data-idx="${globalIdx}">${task.completed ? 'Undo' : 'Complete'}</button>
          </li>`;
        });
        html += '</ul></div>';
      }
      if (monthTasks.length > 0) {
        html += '<div class="todo-group"><b>This Month</b><ul>';
        monthTasks.forEach((task, idx) => {
          const globalIdx = tasks.findIndex(t => t === task);
          html += `<li class="todo-tab-item${task.completed ? ' completed' : ''}">
            <span>${task.completed ? '<s>' : ''}${task.description}${task.completed ? '</s>' : ''}</span>
            <button class="tab-complete-btn" data-idx="${globalIdx}">${task.completed ? 'Undo' : 'Complete'}</button>
          </li>`;
        });
        html += '</ul></div>';
      }
      html += '</div>';
      section.innerHTML += html;

      // Add event listeners for complete/undo buttons
      section.querySelectorAll('.tab-complete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = e.target.getAttribute('data-idx');
          // Show Undo for 5 seconds, then fade out and delete
          const li = btn.closest('li');
          if (!li) return;
          btn.textContent = 'Undo';
          btn.disabled = false;
          let undo = false;
          let undoTimeout = setTimeout(() => {
            li.style.transition = 'opacity 0.25s';
            li.style.opacity = '0';
            setTimeout(() => {
              if (!undo) {
                chrome.runtime.sendMessage({ type: 'niro_todo_op', todoOp: 'delete', idx }, () => {
                  renderTodoTabSection();
                });
              }
            }, 250);
          }, 5000);
          btn.addEventListener('click', function undoHandler() {
            clearTimeout(undoTimeout);
            chrome.runtime.sendMessage({ type: 'niro_todo_op', todoOp: 'toggle-complete', idx }, () => {
              renderTodoTabSection();
            });
            btn.removeEventListener('click', undoHandler);
          });
        });
      });
    });
  }

  renderTodoTabSection();
  // Listen for changes from other extension pages
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.niro_todos) {
      renderTodoTabSection();
    }
  });
}); 