import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseService } from '../services/supabase';
import { CommunityPost } from '../types';
import { 
  Send, MessageSquare, Heart, Share2, 
  Link as LinkIcon, Plus, User, 
  Sparkles, ExternalLink, Hash, Filter, Loader2
} from 'lucide-react';

const Community: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabaseService.auth.getSession().then(s => {
      setSession(s);
      loadPosts();
    });
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await supabaseService.db.getCommunityPosts();
    setPosts(data);
    setIsLoading(false);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !session) return;

    setIsPosting(true);
    await supabaseService.db.createCommunityPost({
      user_id: session.user.id,
      content: newPostContent,
      project_link: projectLink || undefined
    });
    
    setNewPostContent('');
    setProjectLink('');
    setIsPosting(false);
    loadPosts();
  };

  if (isLoading && posts.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        {/* Community Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                 <Sparkles className="text-purple-600" /> Scholar Feed
              </h1>
              <p className="text-slate-500 font-medium">Collaborate, share breakthroughs, and accelerate together.</p>
           </div>
           <div className="flex gap-4">
              <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase text-slate-400 tracking-widest border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active Scholars: {posts.length * 2 + 5}
              </span>
           </div>
        </div>

        {/* Create Post Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl p-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><MessageSquare size={120} /></div>
           <form onSubmit={handlePostSubmit} className="space-y-6 relative z-10">
              <div className="flex gap-4 items-start">
                 <div className="w-12 h-12 rounded-2xl bg-purple-gradient flex items-center justify-center text-white shrink-0 shadow-lg overflow-hidden">
                    {session?.user?.avatar_url ? (
                       <img src={session.user.avatar_url} className="w-full h-full object-cover" />
                    ) : <User size={24} />}
                 </div>
                 <div className="flex-1 space-y-4">
                    <textarea 
                       required
                       placeholder="Share a breakthrough or ask for guidance..."
                       className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-purple-500 rounded-[1.8rem] px-8 py-5 outline-none font-medium transition-all text-sm min-h-[120px]"
                       value={newPostContent}
                       onChange={e => setNewPostContent(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                       <div className="relative flex-1 w-full">
                          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                             placeholder="Project Link (GitHub, Figma, etc.)"
                             className="w-full pl-12 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-purple-500 transition-all"
                             value={projectLink}
                             onChange={e => setProjectLink(e.target.value)}
                          />
                       </div>
                       <button 
                          disabled={isPosting}
                          type="submit"
                          className="w-full sm:w-auto px-10 py-3.5 bg-purple-gradient text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                          {isPosting ? <Loader2 className="animate-spin" size={14} /> : 'Post Update'} <Send size={14} />
                       </button>
                    </div>
                 </div>
              </div>
           </form>
        </div>

        {/* Feed */}
        <div className="space-y-8">
           {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all p-10">
                 <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                       <img src={post.user_avatar || `https://ui-avatars.com/api/?name=${post.user_name}&background=random`} className="w-14 h-14 rounded-2xl shadow-md object-cover" />
                       <div>
                          <p className="font-black text-lg">{post.user_name}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{new Date(post.created_at).toLocaleDateString()} • Synchronized</p>
                       </div>
                    </div>
                    <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors"><Filter size={18} /></button>
                 </div>

                 <div className="space-y-6 pl-4 border-l-4 border-slate-50 dark:border-slate-700 ml-7">
                    <p className="text-xl font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                       {post.content}
                    </p>

                    {post.project_link && (
                       <a 
                          href={post.project_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-purple-100 dark:border-purple-800 group hover:bg-purple-600 hover:text-white transition-all"
                       >
                          <LinkIcon size={14} /> View Project Archive <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </a>
                    )}
                 </div>

                 <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-700 flex items-center gap-8">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">
                       <Heart size={16} /> {post.likes || 0} Accelerations
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-purple-600 transition-colors">
                       <MessageSquare size={16} /> {post.comments?.length || 0} Guidance Notes
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-500 transition-colors ml-auto">
                       <Share2 size={16} /> Share Node
                    </button>
                 </div>
              </div>
           ))}

           {posts.length === 0 && !isLoading && (
              <div className="py-40 text-center opacity-30 italic font-black uppercase tracking-[0.3em] text-xs">The scholar network is awaiting your first update</div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;