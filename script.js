// Data
const data = {
  alphabet: {
    info: "The Norwegian alphabet is the same as the Latin alphabet but adds three additional letters at the end: Æ, Ø, and Å.",
   letters: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z Æ Ø Å"
  },
  numbers: {
    One:"En", Two:"To", Three:"Tre", Four:"Fire", Five:"Fem",
    Six:"Seks", Seven:"Sju", Eight:"Åtte", Nine:"Ni", Ten:"Ti",
    Eleven:"Elleve", Twelve:"Tolv", Thirteen:"Tretten", Fourteen:"Fjorten",
    Fifteen:"Femten", Sixteen:"Seksten", Seventeen:"Sytten", Eighteen:"Atten",
    Nineteen:"Nitten", Twenty:"Tjue"
  },
  weekdays: {
    Monday: "Mandag", Tuesday: "Tirsdag", Wednesday: "Onsdag",
    Thursday: "Torsdag", Friday: "Fredag", Saturday: "Lørdag", Sunday: "Søndag"
  },
  months: {
    January: "Januar", February: "Februar", March: "Mars", April: "April",
    May: "Mai", June: "Juni", July: "Juli", August: "August",
    September: "September", October: "Oktober", November: "November", December: "Desember"
  },
  
};

// Elements
const body = document.documentElement;
const modeToggle = document.getElementById('mode-toggle');
const landing = document.getElementById('landing');
const app = document.getElementById('app');
const btnLearning = document.getElementById('btn-learning');
const btnFlashcards = document.getElementById('btn-flashcards');
const categoryList = document.getElementById('category-list');
const panelTitle = document.getElementById('panel-title');
const learningView = document.getElementById('learning-view');
const flashcardView = document.getElementById('flashcard-view');
const learningList = document.getElementById('learning-list');
const englishEl = document.getElementById('english-word');
const hintEl = document.getElementById('hint');
const answerEl = document.getElementById('answer');
const nextBtn = document.getElementById('next-btn');
const feedbackEl = document.getElementById('feedback');
const backHome = document.getElementById('back-home');

// State
let currentSection = null; // 'learning'|'flashcards'
let currentCategory = null;
let currentWords = [];
let currentIndex = 0;
let score = 0;
let flashcardBusy = false; // prevent double submits

// Theme toggle (store choice in localStorage)
(function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved === 'dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
})();
modeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if(isDark){
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    localStorage.setItem('theme', 'dark');
  }
});

// Landing buttons: open layout with fade
btnLearning.addEventListener('click', () => openSection('learning'));
btnFlashcards.addEventListener('click', () => openSection('flashcards'));

function openSection(section){
  currentSection = section;
  // fade out landing, fade in app
  landing.classList.add('hidden');
  app.classList.remove('hidden');
  // show correct view and populate categories
  populateCategories(section);
  showView(null); // nothing selected yet
  window.scrollTo({top:0,behavior:'smooth'});
}

function populateCategories(section){
  categoryList.innerHTML = '';

  // Get all categories
  let categories = Object.keys(data);

  // Remove alphabet from flashcards
  if(section === 'flashcards') {
    categories = categories.filter(cat => cat !== 'alphabet');
  }

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-item';
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    btn.onclick = () => {
      if(section === 'learning') openLearning(cat);
      else openFlashcards(cat);
      // visually mark active
      Array.from(categoryList.children).forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
    };
    categoryList.appendChild(btn);
  });
}


// Learning
function openLearning(cat){
  currentCategory = cat;
  panelTitle.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  learningView.classList.remove('hidden');
  flashcardView.classList.add('hidden');
  learningList.innerHTML = '';

  if(cat === 'alphabet'){
    const letters = data.alphabet.letters.split(' ');

    // Split standard letters and Norwegian-only letters
    const normalLetters = letters.slice(0, letters.length - 3); // A-Z
    const norwegianLetters = letters.slice(-3); // Æ Ø Å

    // Row for standard letters
    const normalRow = document.createElement('div');
    normalRow.className = 'letter-row';
    normalLetters.forEach(letter => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      btn.className = 'letter-card';
      normalRow.appendChild(btn);
    });
    learningList.appendChild(normalRow);

    // Row for Norwegian-only letters
    const norwegianRow = document.createElement('div');
    norwegianRow.className = 'letter-row norwegian'; // add extra spacing
    norwegianLetters.forEach(letter => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      btn.className = 'letter-card';
      norwegianRow.appendChild(btn);
    });
    learningList.appendChild(norwegianRow);

  } else {
    // Normal categories
    const entries = Object.entries(data[cat]);
    entries.forEach(([eng,nor]) => {
      const p = document.createElement('p');
      p.textContent = `${eng} → ${nor}`;
      learningList.appendChild(p);
    });
  }
}


// Flashcards
function openFlashcards(cat){
  currentCategory = cat;
  currentWords = Object.entries(data[cat]);
  currentIndex = 0;
  score = 0;
  panelTitle.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  learningView.classList.add('hidden');
  flashcardView.classList.remove('hidden');
  showFlashcard();
}

function showFlashcard(){
  if(!currentWords || currentWords.length === 0) return;
  flashcardBusy = false;
  if(currentIndex < 0) currentIndex = 0;
  if(currentIndex >= currentWords.length) currentIndex = currentWords.length - 1;
  const [eng,nor] = currentWords[currentIndex];
  englishEl.textContent = eng;
  hintEl.textContent = nor[0] + ' ' + '_ '.repeat(Math.max(0,nor.length-1)).trim();
  answerEl.value = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  nextBtn.disabled = true;
  setTimeout(()=> answerEl.focus(), 60);
}

// normalize accents
function normalize(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/å/g,'a').replace(/ø/g,'o').replace(/æ/g,'ae');
}

// levenshtein
function levenshtein(a,b){
  a=a||''; b=b||'';
  const m=a.length, n=b.length;
  const dp = Array.from({length:m+1}, ()=> new Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      if(a[i-1]===b[j-1]) dp[i][j]=dp[i-1][j-1];
      else dp[i][j]=1+Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}

// next
nextBtn.addEventListener('click', nextFlashcard);

function nextFlashcard(){
  if(flashcardBusy) return;
  const val = (answerEl.value || '').trim();
  if(val === '') return;
  flashcardBusy = true;

  const [eng,nor] = currentWords[currentIndex];
  const a = normalize(val);
  const b = normalize(nor);
  const dist = levenshtein(a,b);

  if(a === b){
    score++;
    if(val.toLowerCase() === nor.toLowerCase()){
      feedbackEl.textContent = '✅ Correct!';
      feedbackEl.className = 'feedback correct';
    } else {
      feedbackEl.textContent = `✅ Correct! (Correct spelling: ${nor})`;
      feedbackEl.className = 'feedback correct';
    }
  } else if(dist <= 2){
    feedbackEl.textContent = `⚡ Close! Correct: ${nor}`;
    feedbackEl.className = 'feedback close';
  } else {
    feedbackEl.textContent = `💡 The correct word was: ${nor}`;
    feedbackEl.className = 'feedback incorrect';
  }

  nextBtn.disabled = true;
  setTimeout(()=>{
    currentIndex++;
    if(currentIndex < currentWords.length) showFlashcard();
    else {
      feedbackEl.textContent = `🎉 Finished ${currentCategory}! Your score: ${score}/${currentWords.length}`;
    }
    flashcardBusy = false;
  }, 900);
}

// enable next button on typing
answerEl.addEventListener('input', ()=> {
  nextBtn.disabled = (answerEl.value.trim() === '');
});

// keyboard navigation (Enter + arrows)
document.addEventListener('keydown', (e)=>{
  // only in flashcard view
  if(flashcardView.classList.contains('hidden')) return;

  if(e.key === 'Enter'){
    e.preventDefault();
    if(answerEl.value.trim() !== '') nextFlashcard();
  } else if(e.key === 'ArrowRight'){
    e.preventDefault();
    if(!flashcardBusy && currentIndex < currentWords.length - 1){
      currentIndex++;
      showFlashcard();
    }
  } else if(e.key === 'ArrowLeft'){
    e.preventDefault();
    if(!flashcardBusy && currentIndex > 0){
      currentIndex--;
      showFlashcard();
    }
  } else if(e.key.toLowerCase() === 'h'){
    e.preventDefault();
    alert('Type the correct word and press Enter.\nArrowLeft/Right to navigate.\nClose = small typo (1-2 letters).');
  }
  answerEl.focus();
});

// back to home
backHome.addEventListener('click', ()=>{
  app.classList.add('hidden');
  landing.classList.remove('hidden');
  // clear selection
  categoryList.innerHTML = '';
  learningList.innerHTML = '';
  englishEl.textContent = '—';
  hintEl.textContent = '';
  feedbackEl.textContent = '';
});

// helper: show/hide views when no category selected
function showView(selected){
  if(currentSection === 'learning'){
    learningView.classList.add('hidden');
    flashcardView.classList.add('hidden');
    panelTitle.textContent = 'Learning';
  } else {
    learningView.classList.add('hidden');
    flashcardView.classList.add('hidden');
    panelTitle.textContent = 'Flashcards';
  }
}

// initial: landing visible
(function init(){ landing.classList.remove('hidden'); app.classList.add('hidden'); })();
