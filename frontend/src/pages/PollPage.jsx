import React, { useState, useEffect } from 'react';
import { BarChart3, Users, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export default function PollPage({ getCardClass, theme }) {
  const [polls, setPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState({}); // e.g. { "1": 0 }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial polls
  const fetchPolls = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await fetch('/api/polls');
      if (response.ok) {
        const data = await response.json();
        setPolls(data);
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPolls();

    // Live Simulator: Increment votes every 2.5 seconds to simulate other stadium fans voting
    const interval = setInterval(() => {
      setPolls(prevPolls => {
        return prevPolls.map(poll => {
          // 40% chance this poll gets a vote from another fan
          if (Math.random() > 0.6) {
            const randomOptIndex = Math.floor(Math.random() * poll.options.length);
            const updatedVotes = [...poll.votes];
            updatedVotes[randomOptIndex] += Math.floor(Math.random() * 3) + 1; // Add 1-3 votes
            return { ...poll, votes: updatedVotes };
          }
          return poll;
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleVote = async (pollId, optionIndex) => {
    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_index: optionIndex })
      });
      if (response.ok) {
        const updatedPoll = await response.json();
        // Update local polls list
        setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p));
        // Register vote locally to show results
        setVotedPolls(prev => ({ ...prev, [pollId]: optionIndex }));
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  const getPercentage = (votesList, index) => {
    const total = votesList.reduce((sum, v) => sum + v, 0);
    if (total === 0) return 0;
    return Math.round((votesList[index] / total) * 100);
  };

  const getTotalVotes = (votesList) => {
    return votesList.reduce((sum, v) => sum + v, 0).toLocaleString();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            LIVE STADIUM PREDICTOR POLLS
          </h2>
          <p className="text-xs text-zinc-400">
            Cast your predictions. Live aggregated stadium results are displayed on the big screen!
          </p>
        </div>
        <button
          onClick={() => fetchPolls(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all ${
            refreshing ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Polls'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {polls.map((poll) => {
            const hasVoted = votedPolls[poll.id] !== undefined;
            const userVoteIndex = votedPolls[poll.id];

            return (
              <div key={poll.id} className={`p-6 rounded-2xl ${getCardClass()} border border-zinc-800/80 transition-all duration-300 relative overflow-hidden`}>
                {/* Decorative live pulse */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Live Poll</span>
                </div>

                <h3 className="text-base font-bold pr-20 text-white mb-4">
                  {poll.question}
                </h3>

                {/* Poll Info Row */}
                <div className="flex items-center gap-2 mb-6 text-xs text-zinc-400 font-mono">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{getTotalVotes(poll.votes)} fans voted</span>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  {poll.options.map((option, idx) => {
                    const pct = getPercentage(poll.votes, idx);
                    const isUserChoice = userVoteIndex === idx;

                    return (
                      <div key={idx} className="relative">
                        {hasVoted ? (
                          /* Voted State (Bar Chart Representation) */
                          <div className={`p-3.5 rounded-xl border transition-all flex justify-between items-center overflow-hidden ${
                            isUserChoice 
                              ? 'bg-blue-600/10 border-blue-500 text-white' 
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
                          }`}>
                            {/* Animated Background Fill Bar */}
                            <div 
                              className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out z-0 ${
                                isUserChoice ? 'bg-blue-600/15' : 'bg-zinc-800/30'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                            
                            <span className="text-sm font-semibold z-10 flex items-center gap-2">
                              {option}
                              {isUserChoice && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                            </span>
                            
                            <span className="text-sm font-black z-10 flex items-center gap-3">
                              <span className="text-xs font-medium text-zinc-500">{poll.votes[idx].toLocaleString()} votes</span>
                              <span>{pct}%</span>
                            </span>
                          </div>
                        ) : (
                          /* Interactive Vote Button State */
                          <button
                            onClick={() => handleVote(poll.id, idx)}
                            className="w-full text-left p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/50 hover:border-zinc-700 text-sm font-semibold text-zinc-300 transition-all duration-200 flex justify-between items-center group active:scale-[0.99]"
                          >
                            <span>{option}</span>
                            <Send className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
