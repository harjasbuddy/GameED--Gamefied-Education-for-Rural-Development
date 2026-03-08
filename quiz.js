// Quiz System for GameEd Rural
class QuizSystem {
    constructor(user) {
        this.user = user;
        this.quizzes = this.loadQuizzes();
        this.userQuizzes = user.quizzes || {};
        this.currentQuiz = null;
    }

    loadQuizzes() {
        return {
            'math-quiz-1': {
                id: 'math-quiz-1',
                title: 'Basic Arithmetic',
                subject: 'Mathematics',
                class: '5-7',
                description: 'Test your basic math skills with addition, subtraction, multiplication, and division',
                duration: 10,
                questions: 5,
                xp: 100,
                difficulty: 'beginner',
                icon: '🧮',
                color1: '#3b82f6',
                color2: '#1d4ed8',
                questionsList: [
                    {
                        question: "What is 15 + 27?",
                        options: ["32", "42", "52", "62"],
                        correct: 1,
                        explanation: "15 + 27 = 42"
                    },
                    {
                        question: "What is 8 × 7?",
                        options: ["48", "56", "64", "72"],
                        correct: 1,
                        explanation: "8 × 7 = 56"
                    },
                    {
                        question: "What is 96 ÷ 8?",
                        options: ["10", "12", "14", "16"],
                        correct: 1,
                        explanation: "96 ÷ 8 = 12"
                    },
                    {
                        question: "What is 45 - 18?",
                        options: ["27", "37", "47", "57"],
                        correct: 0,
                        explanation: "45 - 18 = 27"
                    },
                    {
                        question: "What is 3² + 4²?",
                        options: ["7", "12", "25", "49"],
                        correct: 2,
                        explanation: "3² = 9, 4² = 16, 9 + 16 = 25"
                    }
                ]
            },
            'science-quiz-1': {
                id: 'science-quiz-1',
                title: 'Basic Science',
                subject: 'Science',
                class: '5-7',
                description: 'Test your knowledge of basic scientific concepts',
                duration: 12,
                questions: 3,
                xp: 120,
                difficulty: 'beginner',
                icon: '🔬',
                color1: '#8b5cf6',
                color2: '#7c3aed',
                questionsList: [
                    {
                        question: "What planet is known as the Red Planet?",
                        options: ["Venus", "Mars", "Jupiter", "Saturn"],
                        correct: 1,
                        explanation: "Mars is called the Red Planet because of its reddish appearance"
                    },
                    {
                        question: "What gas do plants absorb from the atmosphere?",
                        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                        correct: 1,
                        explanation: "Plants absorb carbon dioxide during photosynthesis"
                    },
                    {
                        question: "What is the chemical symbol for water?",
                        options: ["H2O", "CO2", "O2", "NaCl"],
                        correct: 0,
                        explanation: "H2O is the chemical formula for water"
                    }
                ]
            },
            'english-quiz-1': {
                id: 'english-quiz-1',
                title: 'Vocabulary Builder',
                subject: 'English',
                class: '5-7',
                description: 'Improve your English vocabulary with this quiz',
                duration: 8,
                questions: 2,
                xp: 80,
                difficulty: 'beginner',
                icon: '📚',
                color1: '#f59e0b',
                color2: '#d97706',
                questionsList: [
                    {
                        question: "What is the synonym for 'happy'?",
                        options: ["Sad", "Joyful", "Angry", "Tired"],
                        correct: 1,
                        explanation: "Joyful means very happy"
                    },
                    {
                        question: "What is the opposite of 'big'?",
                        options: ["Large", "Small", "Tall", "Wide"],
                        correct: 1,
                        explanation: "Small is the opposite of big"
                    }
                ]
            },
            'agriculture-quiz-1': {
                id: 'agriculture-quiz-1',
                title: 'Basic Farming Knowledge',
                subject: 'Agriculture',
                class: '6-8',
                description: 'Test your knowledge of farming practices',
                duration: 15,
                questions: 2,
                xp: 150,
                difficulty: 'intermediate',
                icon: '🚜',
                color1: '#10b981',
                color2: '#059669',
                questionsList: [
                    {
                        question: "What is the best time to sow rice in most parts of India?",
                        options: ["Winter", "Summer", "Monsoon", "Autumn"],
                        correct: 2,
                        explanation: "Rice is typically sown during the monsoon season"
                    },
                    {
                        question: "Which crop is known as 'Golden Fiber'?",
                        options: ["Cotton", "Jute", "Wheat", "Sugarcane"],
                        correct: 1,
                        explanation: "Jute is called Golden Fiber because of its golden color and importance"
                    }
                ]
            }
        };
    }

    startQuiz(quizId) {
        const quiz = this.quizzes[quizId];
        if (!quiz) return null;

        this.currentQuiz = {
            ...quiz,
            startTime: Date.now(),
            currentQuestion: 0,
            score: 0,
            answers: [],
            completed: false
        };

        return this.currentQuiz;
    }

    submitAnswer(questionIndex, selectedOption) {
        if (!this.currentQuiz || this.currentQuiz.completed) return null;

        const question = this.currentQuiz.questionsList[questionIndex];
        const isCorrect = question.correct === selectedOption;

        this.currentQuiz.answers[questionIndex] = {
            selected: selectedOption,
            correct: isCorrect,
            time: Date.now()
        };

        if (isCorrect) {
            this.currentQuiz.score++;
        }

        return {
            correct: isCorrect,
            correctAnswer: question.correct,
            explanation: question.explanation
        };
    }

    nextQuestion() {
        if (!this.currentQuiz) return null;

        this.currentQuiz.currentQuestion++;
        
        if (this.currentQuiz.currentQuestion >= this.currentQuiz.questionsList.length) {
            return this.completeQuiz();
        }

        return this.getCurrentQuestion();
    }

    getCurrentQuestion() {
        if (!this.currentQuiz || this.currentQuiz.completed) return null;

        const question = this.currentQuiz.questionsList[this.currentQuiz.currentQuestion];
        return {
            ...question,
            questionNumber: this.currentQuiz.currentQuestion + 1,
            totalQuestions: this.currentQuiz.questionsList.length
        };
    }

    completeQuiz() {
        if (!this.currentQuiz || this.currentQuiz.completed) return null;

        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - this.currentQuiz.startTime) / 1000);
        const percentage = (this.currentQuiz.score / this.currentQuiz.questionsList.length) * 100;

        const result = {
            quizId: this.currentQuiz.id,
            score: this.currentQuiz.score,
            totalQuestions: this.currentQuiz.questionsList.length,
            percentage: Math.round(percentage),
            timeTaken: timeTaken,
            xpEarned: Math.round((percentage / 100) * this.currentQuiz.xp),
            completed: true,
            completedAt: new Date().toISOString()
        };

        this.userQuizzes[this.currentQuiz.id] = result;
        this.user.xp = (this.user.xp || 0) + result.xpEarned;
        this.user.totalXP = (this.user.totalXP || 0) + result.xpEarned;
        this.user.quizzes = this.userQuizzes;

        const users = JSON.parse(localStorage.getItem('gameEdUsers')) || [];
        const index = users.findIndex(u => String(u.id) === String(this.user.id));
        if (index !== -1) {
            users[index] = {
                ...users[index],
                xp: this.user.xp,
                totalXP: this.user.totalXP,
                quizzes: this.userQuizzes
            };
            localStorage.setItem('gameEdUsers', JSON.stringify(users));
        }

        if (localStorage.getItem('gameEdUser')) {
            localStorage.setItem('gameEdUser', JSON.stringify(this.user));
        }

        fetch('/api/quiz-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: this.user.id,
                result: {
                    ...result,
                    currentXP: this.user.xp,
                    totalXP: this.user.totalXP
                }
            })
        }).catch(() => {
            // API unavailable; local persistence is still kept.
        });

        this.currentQuiz.completed = true;
        return result;
    }

    getUserQuizStats() {
        const completedQuizzes = Object.values(this.userQuizzes);
        const totalQuizzes = completedQuizzes.length;
        const totalXP = completedQuizzes.reduce((sum, quiz) => sum + (quiz.xpEarned || 0), 0);
        const averageScore = totalQuizzes > 0 
            ? Math.round(completedQuizzes.reduce((sum, quiz) => sum + quiz.percentage, 0) / totalQuizzes)
            : 0;

        return {
            totalQuizzes,
            totalXP,
            averageScore,
            completedQuizzes
        };
    }

    renderQuizCard(quizId) {
        const quiz = this.quizzes[quizId];
        const completed = this.userQuizzes[quizId];
        const completionRate = completed ? completed.percentage : 0;

        return `
            <div class="quiz-card ${completed ? 'completed' : ''}" data-quiz="${quizId}">
                <div class="quiz-header">
                    <div class="quiz-icon" style="background: linear-gradient(135deg, ${quiz.color1}, ${quiz.color2})">
                        ${quiz.icon}
                    </div>
                    <div class="quiz-info">
                        <h4>${quiz.title}</h4>
                        <div class="quiz-meta">
                            <span class="quiz-subject">${quiz.subject}</span>
                            <span class="quiz-class">Class ${quiz.class}</span>
                            <span class="quiz-xp">+${quiz.xp} XP</span>
                        </div>
                    </div>
                </div>
                <p class="quiz-desc">${quiz.description}</p>
                <div class="quiz-footer">
                    <div class="quiz-stats">
                        <span><i data-feather="clock"></i> ${quiz.duration}min</span>
                        <span><i data-feather="list"></i> ${quiz.questions} Qs</span>
                        <span><i data-feather="target"></i> ${quiz.difficulty}</span>
                    </div>
                    ${completed ? `
                        <div class="quiz-result">
                            <div class="score-circle" style="--score: ${completionRate}">
                                <span>${completionRate}%</span>
                            </div>
                            <span class="xp-earned">+${completed.xpEarned} XP</span>
                        </div>
                    ` : `
                        <button class="start-quiz-btn" data-quiz="${quizId}">
                            Start Quiz
                        </button>
                    `}
                </div>
            </div>
        `;
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizSystem;
}
