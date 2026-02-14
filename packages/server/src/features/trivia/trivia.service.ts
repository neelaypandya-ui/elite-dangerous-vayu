/**
 * Trivia & training service.
 * Delivers quiz questions and tracks scores.
 */

import * as fs from 'fs';
import * as path from 'path';

interface TriviaQuestion {
  id: number;
  question: string;
  answers: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

interface QuizSession {
  id: string;
  startTime: string;
  questions: TriviaQuestion[];
  answers: Array<{ questionId: number; selectedIndex: number; correct: boolean; timeMs: number }>;
  score: number;
  total: number;
}

class TriviaService {
  private questions: TriviaQuestion[] = [];
  private sessions: QuizSession[] = [];
  private currentSession: QuizSession | null = null;

  constructor() {
    this.loadQuestions();
  }

  private loadQuestions(): void {
    try {
      const dataPath = path.resolve('data/trivia-questions.json');
      if (fs.existsSync(dataPath)) {
        const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        if (Array.isArray(raw)) {
          this.questions = raw.map((q: any, i: number) => ({
            id: q.id || i,
            question: q.question || '',
            answers: q.answers || [],
            correctIndex: q.correctIndex ?? 0,
            category: q.category || 'general',
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation,
          }));
        }
      }
    } catch {
      console.warn('[Trivia] Failed to load questions');
    }
  }

  getQuestionCount(): number { return this.questions.length; }

  getCategories(): string[] {
    return [...new Set(this.questions.map((q) => q.category))];
  }

  startQuiz(count = 10, category?: string, difficulty?: string): QuizSession {
    let pool = [...this.questions];
    if (category) pool = pool.filter((q) => q.category === category);
    if (difficulty) pool = pool.filter((q) => q.difficulty === difficulty);

    // Shuffle and pick
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const selected = pool.slice(0, Math.min(count, pool.length));

    const session: QuizSession = {
      id: `quiz-${Date.now()}`,
      startTime: new Date().toISOString(),
      questions: selected,
      answers: [],
      score: 0,
      total: selected.length,
    };
    this.currentSession = session;
    return session;
  }

  submitAnswer(questionId: number, selectedIndex: number, timeMs: number): { correct: boolean; correctIndex: number; explanation?: string } | null {
    if (!this.currentSession) return null;
    const question = this.currentSession.questions.find((q) => q.id === questionId);
    if (!question) return null;

    const correct = selectedIndex === question.correctIndex;
    this.currentSession.answers.push({ questionId, selectedIndex, correct, timeMs });
    if (correct) this.currentSession.score++;

    return { correct, correctIndex: question.correctIndex, explanation: question.explanation };
  }

  endQuiz(): QuizSession | null {
    if (!this.currentSession) return null;
    const session = this.currentSession;
    this.sessions.push(session);
    if (this.sessions.length > 50) this.sessions.shift();
    this.currentSession = null;
    return session;
  }

  getCurrentQuiz(): QuizSession | null { return this.currentSession; }
  getHistory(): QuizSession[] { return [...this.sessions]; }

  getRandomQuestion(category?: string): TriviaQuestion | null {
    let pool = this.questions;
    if (category) pool = pool.filter((q) => q.category === category);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getStats(): object {
    const totalCorrect = this.sessions.reduce((s, sess) => s + sess.score, 0);
    const totalQuestions = this.sessions.reduce((s, sess) => s + sess.total, 0);
    return {
      questionBank: this.questions.length,
      categories: this.getCategories(),
      sessionsPlayed: this.sessions.length,
      totalCorrect,
      totalQuestions,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      currentQuiz: this.currentSession ? { id: this.currentSession.id, progress: this.currentSession.answers.length, total: this.currentSession.total } : null,
    };
  }
}

export const triviaService = new TriviaService();
