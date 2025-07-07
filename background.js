chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.action.openPopup();
  }
});

// Set up alarms for notifications at 10am, 2pm, and 6pm
chrome.runtime.onInstalled.addListener(() => {
  scheduleTaskNotifications();
  setupWaterAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleTaskNotifications();
  setupWaterAlarm();
});

function scheduleTaskNotifications() {
  // Clear any existing alarms
  chrome.alarms.clearAll(() => {
    // Schedule alarms for 10am, 2pm, 6pm
    const times = [10, 14, 18];
    times.forEach((hour, idx) => {
      const now = new Date();
      const alarmTime = new Date();
      alarmTime.setHours(hour, 0, 0, 0);
      if (alarmTime < now) alarmTime.setDate(alarmTime.getDate() + 1);
      chrome.alarms.create('niro_task_notify_' + idx, {
        when: alarmTime.getTime(),
        periodInMinutes: 24 * 60 // repeat daily
      });
    });
  });
}

// --- Hydration Hourly Notification ---
function setupWaterAlarm() {
  chrome.alarms.clear('niro_water_reminder', () => {
    chrome.alarms.create('niro_water_reminder', {
      periodInMinutes: 60,
      when: Date.now() + 60 * 1000 // start in 1 minute for demo, change to 60*60*1000 for prod
    });
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'niro_water_reminder') {
    const today = new Date().toDateString();
    chrome.storage.local.get(['niro_task_hydration_total_' + today], (result) => {
      const total = parseInt(result['niro_task_hydration_total_' + today] || '0', 10);
      if (total < 8) {
        try {
          chrome.notifications.create('', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon128.png'),
            title: 'Hydration Reminder',
            message: 'Time to drink a glass of water! Aim for 8 glasses today.',
            priority: 1
          });
        } catch (error) {
          console.log('Notification failed:', error);
        }
      }
    });
    return;
  }
  if (!alarm.name.startsWith('niro_task_notify_')) return;
  // Get user's profession
  chrome.storage.local.get(['niro_profession'], (result) => {
    const profession = result.niro_profession;
    if (profession !== 'Software Engineer') return;
    // Load daily tasks
    fetchTaskForToday().then(task => {
      if (task) {
        try {
        chrome.notifications.create('', {
          type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon128.png'),
          title: 'Niro Wellness Task',
          message: task.task,
          priority: 1
        });
        } catch (error) {
          console.log('Notification failed:', error);
        }
      }
    });
  });
});

async function fetchTaskForToday() {
  try {
    const response = await fetch(chrome.runtime.getURL('profiles/softwareEngineer.json'));
    const data = await response.json();
    const allTasks = data.tasks;
    // Deterministic shuffle for the day
    const todaySeed = new Date().toDateString();
    function seededRandom(seed) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      return () => (h = Math.imul(h ^ h >>> 15, 1 | h)), Math.abs(h % 1e9) / 1e9;
    }
    const rand = seededRandom(todaySeed);
    const shuffled = allTasks.slice().sort(() => rand() - 0.5);
    const dailyTasks = shuffled.slice(0, 5);
    // Pick a random task from the daily set
    return dailyTasks[Math.floor(Math.random() * dailyTasks.length)];
  } catch (e) {
    return null;
  }
} 

// --- To-Do List Messaging API ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type || !message.todoOp) return;
  if (message.type !== 'niro_todo_op') return;
  const op = message.todoOp;
  if (op === 'get') {
    chrome.storage.local.get(['niro_todos'], (result) => {
      sendResponse({ todos: result.niro_todos || [] });
    });
    return true;
  }
  if (op === 'add') {
    chrome.storage.local.get(['niro_todos'], (result) => {
      const todos = result.niro_todos || [];
      todos.push(message.todo);
      chrome.storage.local.set({ niro_todos: todos }, () => {
        sendResponse({ todos });
      });
    });
    return true;
  }
  if (op === 'update') {
    chrome.storage.local.get(['niro_todos'], (result) => {
      const todos = result.niro_todos || [];
      if (todos[message.idx]) {
        todos[message.idx] = message.todo;
        chrome.storage.local.set({ niro_todos: todos }, () => {
          sendResponse({ todos });
        });
      } else {
        sendResponse({ error: 'Invalid index' });
      }
    });
    return true;
  }
  if (op === 'delete') {
    chrome.storage.local.get(['niro_todos'], (result) => {
      const todos = result.niro_todos || [];
      if (todos[message.idx]) {
        todos.splice(message.idx, 1);
        chrome.storage.local.set({ niro_todos: todos }, () => {
          sendResponse({ todos });
        });
      } else {
        sendResponse({ error: 'Invalid index' });
      }
    });
    return true;
  }
  if (op === 'toggle-complete') {
    chrome.storage.local.get(['niro_todos'], (result) => {
      const todos = result.niro_todos || [];
      if (todos[message.idx]) {
        todos[message.idx].completed = !todos[message.idx].completed;
        chrome.storage.local.set({ niro_todos: todos }, () => {
          sendResponse({ todos });
        });
      } else {
        sendResponse({ error: 'Invalid index' });
      }
    });
    return true;
  }
  if (message && message.type === 'niro_water_count_changed') {
    setupWaterAlarm();
    sendResponse({ ok: true });
  }
}); 