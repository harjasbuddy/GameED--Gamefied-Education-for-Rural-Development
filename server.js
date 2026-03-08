const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'db.json');
const USERS_FILE = path.join(__dirname, 'users.json');

const defaultContent = {
  quizzes: [
    {
      id: 'math-quiz-1', title: 'Basic Arithmetic', subject: 'Mathematics', class: '5-7',
      description: 'Test your basic math skills', duration: 10, questions: 5, xp: 100,
      difficulty: 'beginner', icon: '🧮', color1: '#3b82f6', color2: '#1d4ed8', published: true,
      trophyId: '', mp3Url: '', questionsList: [
        { question: 'What is 15 + 27?', options: ['32','42','52','62'], correct: 1, explanation: '15 + 27 = 42' }
      ]
    },
    {
      id: 'science-quiz-1', title: 'Basic Science', subject: 'Science', class: '5-7',
      description: 'Test your knowledge of basic scientific concepts', duration: 12, questions: 3, xp: 120,
      difficulty: 'beginner', icon: '🔬', color1: '#8b5cf6', color2: '#7c3aed', published: true,
      trophyId: '', mp3Url: '', questionsList: [
        { question: 'What planet is known as the Red Planet?', options: ['Venus','Mars','Jupiter','Saturn'], correct: 1, explanation: 'Mars is called the Red Planet' }
      ]
    }
  ],
  trophies: [],
  grades: {},
  leaderboard: []
};

function normalizeUser(user) {
  return {
    id: user.id || Date.now() + Math.floor(Math.random() * 999),
    name: user.name,
    email: user.email,
    username: user.username,
    password: user.password,
    region: user.region || 'rural',
    age: user.age || '13-16',
    role: user.role || 'student',
    xp: user.xp ?? 100,
    totalXP: user.totalXP ?? user.xp ?? 100,
    level: user.level || 1,
    badges: user.badges || ['new-learner'],
    achievements: user.achievements || [],
    progress: user.progress || { math: 0, science: 0, agriculture: 0, language: 0 },
    quizzes: user.quizzes || {},
    quizGrades: user.quizGrades || {},
    earnedTrophies: user.earnedTrophies || [],
    joined: user.joined || new Date().toISOString(),
    lastLogin: user.lastLogin || null,
    subject: user.subject,
    grade: user.grade,
    school: user.school,
    permissions: user.permissions || []
  };
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        users: (parsed.users || []).map(normalizeUser),
        content: { ...defaultContent, ...(parsed.content || {}) }
      };
    }

    const legacyUsers = fs.existsSync(USERS_FILE)
      ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).map(normalizeUser)
      : [];

    const initial = { users: legacyUsers, content: { ...defaultContent } };
    saveDb(initial);
    return initial;
  } catch (error) {
    console.error('Error loading DB:', error);
    return { users: [], content: { ...defaultContent } };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function rebuildLeaderboard(db) {
  db.content.leaderboard = db.users
    .filter(u => u.role === 'student')
    .map(u => ({
      id: u.id,
      name: u.name,
      totalXP: u.totalXP || 0,
      highestGrade: Math.max(0, ...Object.values(u.quizGrades || {}).map(g => g.marks || 0))
    }))
    .sort((a, b) => (b.highestGrade - a.highestGrade) || (b.totalXP - a.totalXP));
}

app.get('/api/state', (req, res) => {
  const db = loadDb();
  rebuildLeaderboard(db);
  saveDb(db);
  res.json({
    users: db.users.map(sanitizeUser),
    content: db.content
  });
});

app.get('/api/users', (req, res) => {
  const db = loadDb();
  res.json(db.users.map(sanitizeUser));
});

app.post('/api/users/seed', (req, res) => {
  const incoming = req.body?.users;
  if (!Array.isArray(incoming) || !incoming.length) {
    return res.status(400).json({ error: 'users[] payload required' });
  }
  const db = loadDb();
  if (db.users.length) {
    return res.json({ seeded: false, users: db.users.map(sanitizeUser) });
  }
  db.users = incoming.map(normalizeUser);
  rebuildLeaderboard(db);
  saveDb(db);
  res.json({ seeded: true, users: db.users.map(sanitizeUser) });
});

app.post('/api/register', (req, res) => {
  const { name, email, username, password, region, age, role } = req.body;
  if (!name || !email || !username || !password || !region || !age) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = loadDb();
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  if (db.users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const isTeacher = role === 'teacher' || role === 'teacher_admin';
  const newUser = normalizeUser({
    id: Date.now(),
    name,
    email,
    username,
    password,
    region,
    age,
    role: isTeacher ? 'teacher_admin' : 'student',
    xp: isTeacher ? 1000 : 100,
    totalXP: isTeacher ? 1000 : 100,
    subject: isTeacher ? 'General' : undefined,
    grade: isTeacher ? '6-8' : undefined,
    school: isTeacher ? 'Local School' : undefined,
    permissions: isTeacher ? ['view_progress', 'create_content'] : []
  });

  db.users.push(newUser);
  saveDb(db);
  res.json({ success: true, user: sanitizeUser(newUser) });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = loadDb();
  const user = db.users.find(u => u.email === email || u.username === email);

  if (!user) {
    return res.status(404).json({ error: 'Account not found' });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  user.lastLogin = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, user: sanitizeUser(user) });
});

app.put('/api/users/:id', (req, res) => {
  const db = loadDb();
  const user = db.users.find(u => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });

  Object.assign(user, req.body || {});
  saveDb(db);
  res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/content', (req, res) => {
  const db = loadDb();
  rebuildLeaderboard(db);
  saveDb(db);
  res.json(db.content);
});

app.put('/api/content', (req, res) => {
  const db = loadDb();
  db.content = { ...defaultContent, ...(req.body || {}) };
  rebuildLeaderboard(db);
  saveDb(db);
  res.json({ success: true, content: db.content });
});

app.post('/api/content/grade', (req, res) => {
  const { userId, quizId, marks, maxMarks } = req.body;
  const db = loadDb();

  if (!db.content.grades[userId]) db.content.grades[userId] = {};
  db.content.grades[userId][quizId] = { marks, maxMarks, gradedAt: new Date().toISOString() };

  const target = db.users.find(u => String(u.id) === String(userId));
  if (target) {
    const gainedXP = Math.max(0, Math.round((marks / Math.max(1, maxMarks)) * 100));
    target.totalXP = (target.totalXP || 0) + gainedXP;
    target.xp = (target.xp || 0) + gainedXP;
    target.quizGrades = target.quizGrades || {};
    target.quizGrades[quizId] = { marks, maxMarks, gainedXP };
  }

  rebuildLeaderboard(db);
  saveDb(db);
  res.json({ success: true, content: db.content, user: target ? sanitizeUser(target) : null });
});

app.post('/api/content/award-trophy', (req, res) => {
  const { userId, trophyId } = req.body;
  const db = loadDb();
  const target = db.users.find(u => String(u.id) === String(userId));
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.earnedTrophies = target.earnedTrophies || [];
  if (!target.earnedTrophies.includes(trophyId)) target.earnedTrophies.push(trophyId);
  saveDb(db);

  res.json({ success: true, user: sanitizeUser(target) });
});

app.post('/api/quiz-attempt', (req, res) => {
  const { userId, result } = req.body;
  if (!userId || !result || !result.quizId) {
    return res.status(400).json({ error: 'userId and result.quizId are required' });
  }

  const db = loadDb();
  const target = db.users.find(u => String(u.id) === String(userId));
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.quizzes = target.quizzes || {};
  target.quizzes[result.quizId] = result;
  target.xp = result.currentXP ?? target.xp;
  target.totalXP = result.totalXP ?? target.totalXP;

  saveDb(db);
  res.json({ success: true, user: sanitizeUser(target) });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
