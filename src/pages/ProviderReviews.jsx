import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ProviderReviews({ isStandalone = true }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [reviews, setReviews] = useState([
    {
      id: 1,
      customer: 'Sarah Wanjiku',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      time: '2 hours ago',
      orderId: '#ORD-8921',
      rating: 5,
      comment: 'Absolutely brilliant service. They managed to get a tough coffee stain out of my favorite silk blouse. The driver was also very polite and arrived exactly on time. Highly recommend!',
      tags: ['Stain Removal', 'Punctual'],
      reply: null
    },
    {
      id: 2,
      customer: 'John Doe',
      avatarInitials: 'JD',
      avatarBg: 'bg-[#61666f] text-white',
      time: 'Yesterday',
      orderId: '#ORD-8890',
      rating: 4,
      comment: 'Good service overall. The clothes were perfectly clean and folded nicely. Deducting one star because the pickup was slightly delayed due to traffic, but communication was good.',
      tags: ['Crisp Folding'],
      reply: {
        time: 'Yesterday',
        text: 'Thank you for your feedback John! We apologize for the delay due to traffic on Uhuru Highway. Glad you loved the laundry standard!'
      }
    },
    {
      id: 3,
      customer: 'Amina Hassan',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
      time: '3 days ago',
      orderId: '#ORD-8744',
      rating: 5,
      comment: 'Mama Safi has been doing my laundry for 3 months now and I have zero complaints. Always crisp, fresh smelling, and perfectly packaged!',
      tags: ['Regular Customer', 'Super Clean'],
      reply: null
    }
  ]);

  const handleSendReply = (reviewId) => {
    if (!replyText.trim()) return;
    setReviews(prev => prev.map(rev => {
      if (rev.id === reviewId) {
        return {
          ...rev,
          reply: {
            time: 'Just now',
            text: replyText
          }
        };
      }
      return rev;
    }));
    setReplyingId(null);
    setReplyText('');
  };

  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = rev.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rev.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rev.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || rev.rating === parseInt(ratingFilter, 10);
    return matchesSearch && matchesRating;
  });

  const mainContent = (
    <div className="flex flex-col w-full h-full relative font-['Inter'] text-[#1a1c1e]">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-[#1a1c1e] tracking-tight">Customer Reviews</h1>
          <p className="text-base text-[#434656] mt-1">Manage feedback and build trust with your clients.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434656] text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-[#1a1c1e] placeholder:text-[#434656] font-['Inter'] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#c3c5d9]/30 focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 shadow-xs"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full sm:w-auto bg-white text-[#1a1c1e] font-['Geist'] text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#c3c5d9]/30 focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50 cursor-pointer shadow-xs"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Rating Summary Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#c3c5d9]/10 text-center">
            <h2 className="font-['Geist'] text-5xl font-extrabold text-[#1a1c1e] mb-2">4.8</h2>
            <div className="flex justify-center text-amber-500 mb-2">
              {[1, 2, 3, 4].map(i => (
                <span key={i} className="material-symbols-outlined text-[24px]">star</span>
              ))}
              <span className="material-symbols-outlined text-[24px]">star_half</span>
            </div>
            <p className="font-['Geist'] text-xs font-semibold text-[#434656] uppercase tracking-wider mb-6">Based on 1,248 reviews</p>

            {/* Breakdown bars */}
            <div className="space-y-3 font-['Geist'] text-xs font-medium text-[#434656]">
              {[
                { stars: '5 Stars', pct: '85%', width: 'w-[85%]' },
                { stars: '4 Stars', pct: '10%', width: 'w-[10%]' },
                { stars: '3 Stars', pct: '3%', width: 'w-[3%]' },
                { stars: '2 Stars', pct: '1%', width: 'w-[1%]' },
                { stars: '1 Star', pct: '1%', width: 'w-[1%]' },
              ].map(item => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="w-12 text-left">{item.stars}</span>
                  <div className="flex-1 h-2 bg-[#eeeef0] rounded-full overflow-hidden">
                    <div className={`h-full bg-[#00c1fd] rounded-full ${item.width}`}></div>
                  </div>
                  <span className="w-8 text-right font-bold text-[#1a1c1e]">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0052ff] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white">verified</span>
              </div>
              <h3 className="font-['Geist'] text-lg font-bold mb-1">Top Rated Provider</h3>
              <p className="font-['Inter'] text-xs text-[#dfe3ff] leading-relaxed">
                You are in the top 5% of providers in your area this month. Keep up the excellent work!
              </p>
            </div>
          </div>
        </div>

        {/* Right Reviews List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-[#434656] font-['Inter'] text-sm border border-[#c3c5d9]/10">
              No customer reviews found matching your search.
            </div>
          ) : (
            filteredReviews.map(rev => (
              <div key={rev.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#c3c5d9]/10 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {rev.avatar ? (
                      <img src={rev.avatar} alt={rev.customer} className="w-12 h-12 rounded-full object-cover shadow-xs" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full ${rev.avatarBg} flex items-center justify-center font-['Geist'] font-bold text-sm`}>
                        {rev.avatarInitials}
                      </div>
                    )}
                    <div>
                      <h4 className="font-['Geist'] text-base font-bold text-[#1a1c1e]">{rev.customer}</h4>
                      <p className="font-['Inter'] text-xs text-[#434656]">
                        {rev.time} • <span className="font-mono text-[#003ec7] font-semibold">{rev.orderId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[20px]">star</span>
                    ))}
                  </div>
                </div>

                <p className="font-['Inter'] text-sm text-[#1a1c1e] leading-relaxed">
                  {rev.comment}
                </p>

                {rev.tags && (
                  <div className="flex flex-wrap gap-2">
                    {rev.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-[#f3f3f6] text-[#434656] rounded-full font-['Geist'] text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Existing Reply */}
                {rev.reply && (
                  <div className="mt-2 p-4 bg-[#f3f3f6] rounded-2xl border-l-4 border-[#003ec7]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Geist'] text-xs font-bold text-[#003ec7]">Your Reply</span>
                      <span className="text-[10px] text-[#737688]">{rev.reply.time}</span>
                    </div>
                    <p className="font-['Inter'] text-xs text-[#434656] leading-relaxed">
                      {rev.reply.text}
                    </p>
                  </div>
                )}

                {/* Reply Button / Inline Form */}
                {!rev.reply && (
                  <div>
                    {replyingId === rev.id ? (
                      <div className="mt-2 flex flex-col gap-3">
                        <textarea
                          rows={3}
                          placeholder={`Write your response to ${rev.customer}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-[#f3f3f6] text-[#1a1c1e] placeholder:text-[#737688] p-3 rounded-xl border border-[#c3c5d9]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#003ec7]/50"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setReplyingId(null)}
                            className="px-4 py-1.5 rounded-full text-xs font-['Geist'] font-semibold text-[#434656] hover:bg-[#eeeef0] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSendReply(rev.id)}
                            className="px-5 py-1.5 rounded-full text-xs font-['Geist'] font-semibold bg-[#003ec7] text-white hover:bg-[#0038b6] transition-colors cursor-pointer"
                          >
                            Send Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingId(rev.id)}
                        className="self-start text-xs font-['Geist'] font-semibold text-[#003ec7] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        <span>Reply to {rev.customer.split(' ')[0]}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
