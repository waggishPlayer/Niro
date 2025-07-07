const QUOTES = [
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Keep going. Everything you need will come to you.", author: "Unknown" },
  { text: "You are stronger than you think.", author: "Unknown" },
  { text: "Small steps every day.", author: "Unknown" },
  { text: "Your mind is a powerful thing.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Take a deep breath and start again.", author: "Unknown" }
];

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
} 