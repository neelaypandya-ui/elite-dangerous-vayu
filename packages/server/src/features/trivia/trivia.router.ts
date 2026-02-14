import { Router, type Request, type Response } from 'express';
import { triviaService } from './trivia.service.js';

export const triviaRouter = Router();

triviaRouter.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: triviaService.getStats() });
});

triviaRouter.get('/random', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const question = triviaService.getRandomQuestion(category);
  if (!question) { res.status(404).json({ success: false, error: 'No questions available' }); return; }
  // Don't send correctIndex to client
  const { correctIndex, ...safe } = question;
  res.json({ success: true, data: safe });
});

triviaRouter.post('/start', (req: Request, res: Response) => {
  const { count, category, difficulty } = req.body;
  const session = triviaService.startQuiz(count || 10, category, difficulty);
  // Strip correct answers from questions sent to client
  const safeQuestions = session.questions.map(({ correctIndex, ...q }) => q);
  res.json({ success: true, data: { ...session, questions: safeQuestions } });
});

triviaRouter.post('/answer', (req: Request, res: Response) => {
  const { questionId, selectedIndex, timeMs } = req.body;
  if (!questionId || typeof questionId !== 'string') {
    res.status(400).json({ success: false, error: 'Missing or invalid questionId' }); return;
  }
  if (typeof selectedIndex !== 'number' || selectedIndex < 0) {
    res.status(400).json({ success: false, error: 'Missing or invalid selectedIndex' }); return;
  }
  const result = triviaService.submitAnswer(questionId, selectedIndex, timeMs || 0);
  if (!result) { res.status(400).json({ success: false, error: 'No active quiz or invalid question' }); return; }
  res.json({ success: true, data: result });
});

triviaRouter.post('/end', (_req: Request, res: Response) => {
  const session = triviaService.endQuiz();
  if (!session) { res.status(400).json({ success: false, error: 'No active quiz' }); return; }
  res.json({ success: true, data: session });
});

triviaRouter.get('/history', (_req: Request, res: Response) => {
  res.json({ success: true, data: triviaService.getHistory() });
});
