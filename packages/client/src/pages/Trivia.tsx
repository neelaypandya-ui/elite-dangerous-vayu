import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Trivia() {
  const { data, loading, fetch: load } = useApi<any>('/trivia');
  const [question, setQuestion] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  useEffect(() => { load(); }, [load]);

  const getQuestion = async () => {
    setSelected(null); setResult(null);
    const q = await apiFetch('/trivia/random');
    setQuestion(q);
  };

  const answer = async (idx: number) => {
    setSelected(idx);
    const res = await apiFetch('/trivia/answer', { method: 'POST', body: JSON.stringify({ questionId: question.id, answerIndex: idx }) });
    setResult(res);
    await load();
  };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>TRIVIA</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Stats">
          <div className="grid-2" style={{ gap: 12, padding: 8 }}>
            {[
              ['Answered', data?.stats?.totalAnswered || 0],
              ['Correct', data?.stats?.totalCorrect || 0],
              ['Streak', data?.stats?.currentStreak || 0],
              ['Accuracy', data?.stats?.totalAnswered ? `${Math.round((data.stats.totalCorrect / data.stats.totalAnswered) * 100)}%` : '0%'],
            ].map(([l, v]) => (
              <div key={l as string} style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 4 }}>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{l as string}</div>
              </div>
            ))}
          </div>
        </HoloPanel>
        <HoloPanel title="Quiz">
          {!question ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>Test your Elite Dangerous knowledge</p>
              <HoloButton onClick={getQuestion}>Start Quiz</HoloButton>
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 14, marginBottom: 4 }}>{question.question}</div>
              {question.category && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>{question.category} \u2022 {question.difficulty || 'medium'}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {question.options?.map((opt: string, i: number) => {
                  const isCorrect = result && i === result.correctIndex;
                  const isWrong = result && i === selected && !result.correct && i !== result.correctIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => !result && answer(i)}
                      disabled={!!result}
                      style={{
                        padding: '8px 12px', fontSize: 13, textAlign: 'left', cursor: result ? 'default' : 'pointer',
                        background: isCorrect ? 'rgba(78,154,62,0.3)' : isWrong ? 'rgba(255,68,68,0.3)' : 'var(--color-bg-tertiary)',
                        border: `1px solid ${isCorrect ? '#4E9A3E' : isWrong ? '#ff4444' : 'var(--color-border)'}`,
                        color: isCorrect ? '#4E9A3E' : isWrong ? '#ff4444' : '#fff',
                      }}
                    >{opt}</button>
                  );
                })}
              </div>
              {result && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <p style={{ color: result.correct ? '#4E9A3E' : '#ff4444', fontSize: 14, marginBottom: 8 }}>{result.correct ? 'Correct!' : 'Wrong!'}</p>
                  {result.explanation && <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 8 }}>{result.explanation}</p>}
                  <HoloButton onClick={getQuestion}>Next Question</HoloButton>
                </div>
              )}
            </div>
          )}
        </HoloPanel>
      </div>
    </div>
  );
}
