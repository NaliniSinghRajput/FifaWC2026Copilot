import React, { useState } from 'react';
import { Award, RefreshCw, Trophy, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    question: "Which country is Christian Pulisic (Captain America) playing for?",
    options: ["Mexico", "England", "USA", "Brazil"],
    answer: "USA",
    fact: "Christian Pulisic plays for AC Milan and is known as 'Captain America' by fans."
  },
  {
    id: 2,
    question: "What is the name of the new US national team coach for the 2026 World Cup?",
    options: ["Javier Aguirre", "Mauricio Pochettino", "Thomas Tuchel", "Dorival Júnior"],
    answer: "Mauricio Pochettino",
    fact: "Pochettino took over the US Men's National Team to lead them into the 2026 home tournament."
  },
  {
    id: 3,
    question: "How can you earn Green Points (GP) in the stadium concourse?",
    options: ["By buying official jerseys", "By depositing plastic bottles and aluminum cans", "By running fast on the pitch", "By taking selfies with sponsors"],
    answer: "By depositing plastic bottles and aluminum cans",
    fact: "Depositing bottles at GreenHub stations gives fans 10-15 GP which unlocks merchandise discounts!"
  },
  {
    id: 4,
    question: "Which player has the nickname 'Chucky' and scored the winner against Germany in 2018?",
    options: ["Santiago Giménez", "Hirving Lozano", "Edson Álvarez", "Uriel Antuna"],
    answer: "Hirving Lozano",
    fact: "Hirving 'Chucky' Lozano is one of Mexico's star forwards, currently playing for San Diego FC."
  },
  {
    id: 5,
    question: "What is the capacity of MetLife Stadium in East Rutherford, NJ?",
    options: ["70,240", "50,000", "82,500", "90,000"],
    answer: "82,500",
    fact: "MetLife Stadium is one of the largest venues hosting the FIFA World Cup 2026, holding over 82,500 fans."
  },
  {
    id: 6,
    question: "Which player is nickname 'Jedi' because he loves Star Wars?",
    options: ["Tyler Adams", "Antonee Robinson", "Weston McKennie", "Matt Turner"],
    answer: "Antonee Robinson",
    fact: "Antonee Robinson earned his nickname 'Jedi' at a young age due to his fascination with the sci-fi franchise."
  }
];

export default function Trivia({ getCardClass, theme }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleSelectOption = (opt) => {
    if (selectedOpt !== null) return; // Answer locked
    setSelectedOpt(opt);
    if (opt === QUESTIONS[currentIdx].answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setIsFinished(false);
  };

  const getBadge = () => {
    if (score === QUESTIONS.length) return { name: "🏆 World Cup Champion", desc: "Perfection! You know everything about the 2026 tournament." };
    if (score >= 4) return { name: "🥇 Pro Midfielder", desc: "Amazing job! You really paid attention to the guide details." };
    return { name: "🥈 World Cup Rookie", desc: "Great start! Read the team rosters to find more facts." };
  };

  if (isFinished) {
    const badge = getBadge();
    return (
      <div className={`p-8 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto animate-scaleUp ${getCardClass()}`}>
        <Trophy className="w-20 h-20 text-yellow-500 mb-4 animate-bounce" />
        <h2 className="text-3xl font-black text-white">Quiz Completed!</h2>
        <p className="text-lg mt-2 text-zinc-300">
          Your final score is: <span className="font-extrabold text-blue-400 text-2xl">{score} / {QUESTIONS.length}</span>
        </p>

        <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-sm">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">BADGE UNLOCKED</span>
          <h4 className="text-lg font-black text-yellow-400 mt-1">{badge.name}</h4>
          <p className="text-xs text-zinc-400 mt-1 font-sans">{badge.desc}</p>
        </div>

        <button
          onClick={handleRestart}
          className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md"
        >
          <RefreshCw className="w-4 h-4" /> PLAY AGAIN
        </button>
      </div>
    );
  }

  const q = QUESTIONS[currentIdx];

  return (
    <div className={`p-6 rounded-2xl max-w-2xl mx-auto animate-fadeIn ${getCardClass()}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" /> FWC26 Trivia Quiz
          </h2>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">Test your facts before kick-off!</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-bold">
          Q: {currentIdx + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Question */}
      <h3 className="text-base md:text-lg font-bold text-zinc-100 mb-6 leading-relaxed">
        {q.question}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-3 mb-6">
        {q.options.map((opt) => {
          let optStyle = 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800/80';
          let icon = null;

          if (selectedOpt !== null) {
            if (opt === q.answer) {
              optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            } else if (selectedOpt === opt) {
              optStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
              icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            } else {
              optStyle = 'bg-zinc-800/20 border-zinc-900 opacity-60';
            }
          }

          return (
            <button
              key={opt}
              type="button"
              disabled={selectedOpt !== null}
              onClick={() => handleSelectOption(opt)}
              className={`flex justify-between items-center p-4 border rounded-xl font-semibold text-sm text-left transition-all ${optStyle}`}
            >
              <span>{opt}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Explanatory Fact (Shown after answer locked) */}
      {selectedOpt !== null && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 animate-slideIn">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">DID YOU KNOW?</span>
          <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">{q.fact}</p>
        </div>
      )}

      {/* Action Button */}
      {selectedOpt !== null && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-md"
        >
          {currentIdx === QUESTIONS.length - 1 ? "FINISH QUIZ" : "NEXT QUESTION"}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
