document.addEventListener('DOMContentLoaded', () => {
  const getStartedBtn = document.getElementById('getStartedBtn');
  const questionsContainer = document.getElementById('questionsContainer');

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
      questionsContainer.innerHTML = `<h2>Thank you!</h2><p>Your preferences have been saved.</p>`;
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
}); 