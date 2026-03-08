(function (window) {
  const KEY = 'gameEdContent';
  const USERS_KEY = 'gameEdUsers';
  const defaultContent = {
    quizzes: [],
    trophies: [],
    grades: {},
    leaderboard: []
  };

  function mergeContent(state) {
    return { ...defaultContent, ...(state || {}) };
  }

  function read() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultContent };
    try {
      return mergeContent(JSON.parse(raw));
    } catch (e) {
      return { ...defaultContent };
    }
  }

  function write(state) {
    const merged = mergeContent(state);
    localStorage.setItem(KEY, JSON.stringify(merged));
    syncContentToServer(merged);
  }

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  }

  function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function fetchJson(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('GameEd API unavailable, using local cache:', url, error.message);
      return null;
    }
  }

  async function syncContentToServer(content) {
    await fetchJson('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    });
  }

  async function syncFromServer() {
    const payload = await fetchJson('/api/state');
    if (!payload) return;

    const merged = mergeContent(payload.content);
    localStorage.setItem(KEY, JSON.stringify(merged));
    if (Array.isArray(payload.users)) {
      setUsers(payload.users);
    }
  }

  function seedIfNeeded() {
    const state = read();
    if (state.quizzes.length) return;
    state.quizzes = [
      {
        id: 'math-quiz-1', title: 'Basic Arithmetic', subject: 'Mathematics', class: '5-7',
        description: 'Test your basic math skills', duration: 10, questions: 5, xp: 100,
        difficulty: 'beginner', icon: '🧮', color1: '#3b82f6', color2: '#1d4ed8', published: true,
        trophyId: '', mp3Url: '', questionsList: [
          { question: 'What is 15 + 27?', options: ['32', '42', '52', '62'], correct: 1, explanation: '15 + 27 = 42' }
        ]
      },
      {
        id: 'science-quiz-1', title: 'Basic Science', subject: 'Science', class: '5-7',
        description: 'Test your knowledge of basic scientific concepts', duration: 12, questions: 3, xp: 120,
        difficulty: 'beginner', icon: '🔬', color1: '#8b5cf6', color2: '#7c3aed', published: true,
        trophyId: '', mp3Url: '', questionsList: [
          { question: 'What planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 1, explanation: 'Mars is called the Red Planet' }
        ]
      }
    ];
    write(state);
  }

  window.GameEdContentStore = {
    read,
    write,
    seedIfNeeded,
    syncFromServer,
    addQuiz(quiz) {
      const state = read();
      state.quizzes.unshift(quiz);
      write(state);
    },
    upsertTrophy(trophy) {
      const state = read();
      const idx = state.trophies.findIndex(t => t.id === trophy.id);
      if (idx === -1) state.trophies.push(trophy); else state.trophies[idx] = trophy;
      write(state);
    },
    removeQuiz(quizId) {
      const state = read();
      state.quizzes = state.quizzes.filter(q => q.id !== quizId);
      write(state);
    },
    toggleQuizPublished(quizId) {
      const state = read();
      const quiz = state.quizzes.find(q => q.id === quizId);
      if (quiz) quiz.published = !quiz.published;
      write(state);
    },
    assignGrade(userId, quizId, marks, maxMarks) {
      const state = read();
      if (!state.grades[userId]) state.grades[userId] = {};
      state.grades[userId][quizId] = { marks, maxMarks, gradedAt: new Date().toISOString() };

      const users = getUsers();
      const target = users.find(u => String(u.id) === String(userId));
      if (target) {
        const gainedXP = Math.max(0, Math.round((marks / Math.max(1, maxMarks)) * 100));
        target.totalXP = (target.totalXP || 0) + gainedXP;
        target.xp = (target.xp || 0) + gainedXP;
        target.quizGrades = target.quizGrades || {};
        target.quizGrades[quizId] = { marks, maxMarks, gainedXP };
      }
      setUsers(users);
      write(state);

      fetchJson('/api/content/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quizId, marks, maxMarks })
      });

      this.rebuildLeaderboard();
    },
    awardTrophy(userId, trophyId) {
      const users = getUsers();
      const target = users.find(u => String(u.id) === String(userId));
      if (!target) return;
      target.earnedTrophies = target.earnedTrophies || [];
      if (!target.earnedTrophies.includes(trophyId)) target.earnedTrophies.push(trophyId);
      setUsers(users);

      fetchJson('/api/content/award-trophy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, trophyId })
      });
    },
    rebuildLeaderboard() {
      const users = getUsers();
      const ranked = users
        .filter(u => u.role === 'student')
        .map(u => ({
          id: u.id,
          name: u.name,
          totalXP: u.totalXP || 0,
          highestGrade: Math.max(0, ...Object.values(u.quizGrades || {}).map(g => g.marks || 0))
        }))
        .sort((a, b) => (b.highestGrade - a.highestGrade) || (b.totalXP - a.totalXP));
      const state = read();
      state.leaderboard = ranked;
      write(state);
    }
  };

  syncFromServer();
})(window);
