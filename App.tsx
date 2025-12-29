import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthState, User, Article } from './types';

// ==========================================
// Context & Services
// ==========================================

const AuthContext = createContext<{
  auth: AuthState;
  login: (user: User) => void;
  logout: () => void;
}>({
  auth: { user: null, isAuthenticated: false, isLoading: true },
  login: () => {},
  logout: () => {},
});

const API_BASE = 'http://localhost:5000/api';

// ==========================================
// Configuration
// ==========================================

const NAV_CATEGORIES = [
  { id: '', name: '首页' },
  { id: 'domestic', name: '国内资讯' },
  { id: 'international', name: '国际视野' },
  { id: 'clinical', name: '临床进展' },
  { id: 'pharmacy', name: '药学前沿' },
];

// ==========================================
// Components
// ==========================================

const Navbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const currentCat = searchParams.get('cat') || '';
  
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-medical-100 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* GRID LAYOUT: Logo | Navigation | User Actions */}
        <div className="grid grid-cols-[auto_1fr_auto] h-16 items-center gap-8">
          
          {/* Logo Section */}
          <Link to="/" className="grid grid-flow-col gap-3 items-center text-medical-700 hover:text-medical-600 transition group">
            <div className="w-8 h-8 bg-medical-50 rounded-lg grid place-items-center text-medical-600 group-hover:bg-medical-600 group-hover:text-white transition">
              <i className="fa-solid fa-staff-snake text-lg"></i>
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:block">MedCore 医核心</span>
          </Link>

          {/* Center Navigation (News Categories) */}
          <div className="grid grid-flow-col gap-1 md:gap-6 justify-center">
            {NAV_CATEGORIES.map(cat => (
              <Link 
                key={cat.id} 
                to={cat.id ? `/?cat=${cat.id}` : '/'}
                className={`
                  relative px-2 py-5 text-sm font-medium transition-colors duration-200
                  ${currentCat === cat.id ? 'text-medical-700' : 'text-slate-500 hover:text-medical-600'}
                `}
              >
                {cat.name}
                {/* Active Indicator Line */}
                {currentCat === cat.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-medical-500 rounded-t-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu Section */}
          <div className="grid grid-flow-col gap-4 items-center font-medium text-sm">
            {auth.isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hidden md:block text-slate-600 hover:text-medical-600">
                  {auth.user?.role === 'admin' ? '管理控制台' : '个人中心'}
                </Link>
                <div className="grid grid-flow-col gap-3 items-center pl-4 border-l border-slate-200">
                  <span className="text-medical-700 font-bold hidden sm:inline">{auth.user?.username}</span>
                  <button 
                    onClick={logout} 
                    className="w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-500 text-slate-400 grid place-items-center transition"
                    title="退出登录"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-medical-600">登录</Link>
                <Link to="/register" className="bg-medical-600 text-white px-5 py-2 rounded-full hover:bg-medical-700 transition shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ==========================================
// Pages
// ==========================================

const HomePage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('cat') || '';

  useEffect(() => {
    setLoading(true);
    let url = `${API_BASE}/articles`;
    if (category) url += `?category=${category}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) setArticles(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  const currentCategoryName = NAV_CATEGORIES.find(c => c.id === category)?.name || '最新资讯';

  return (
    <div className="min-h-screen">
      {/* Hero Section (Only show on main home) */}
      {!category && (
        <div className="bg-gradient-to-r from-medical-700 to-teal-600 text-white py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 grid gap-4 relative z-10">
            <span className="bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold tracking-wider backdrop-blur-sm">
              MEDCORE UPDATE 2.0
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">连接医学前沿与临床实践</h1>
            <p className="text-teal-100 text-lg max-w-2xl font-light">
              聚合全球医疗资讯，赋能专业医疗决策。
            </p>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8">
          {/* Section Header */}
          <div className="grid grid-cols-[1fr_auto] items-end border-b border-slate-200 pb-4">
            <div className="grid gap-1">
               <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-medical-500 pl-4">
                 {currentCategoryName}
               </h2>
               <p className="text-slate-400 text-sm pl-5">共找到 {articles.length} 篇相关文章</p>
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center py-20 text-slate-400">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-medical-500"></i>
              <span className="mt-4 text-sm font-medium">加载医学资讯中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.length > 0 ? (
                articles.map(article => (
                  <Link key={article.id} to={`/article/${article.id}`} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden grid grid-rows-[auto_1fr_auto]">
                    <div className="h-40 bg-slate-100 grid place-items-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                       <i className="fa-solid fa-file-medical text-4xl text-slate-300 group-hover:text-medical-500 transition-colors transform group-hover:scale-110 duration-500"></i>
                       <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded text-slate-600 shadow-sm">
                         {article.category || '综合'}
                       </span>
                    </div>
                    <div className="p-5 grid gap-2 content-start">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-medical-600 line-clamp-2 transition leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">
                        {article.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 grid grid-cols-[1fr_auto] items-center text-xs text-slate-400 font-medium">
                      <span className="grid grid-flow-col gap-2 items-center">
                        <i className="fa-regular fa-clock"></i>
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform text-medical-600">
                        阅读全文 <i className="fa-solid fa-arrow-right ml-1"></i>
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full grid place-items-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-400">暂无该分类的文章</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArticleDetail = () => {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if(!id) return;
    fetch(`${API_BASE}/article/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setArticle(data.data);
      });
  }, [id]);

  if (!article) return <div className="grid place-items-center min-h-screen text-medical-600"><i className="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white shadow-sm rounded-xl p-8 md:p-12 grid gap-8 border border-slate-100">
        <header className="grid gap-6 border-b border-slate-100 pb-8">
          <div className="grid grid-flow-col justify-start gap-2">
            <span className="bg-medical-50 text-medical-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              {article.category || '医学资讯'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            {article.title}
          </h1>
          <div className="grid grid-flow-col justify-start gap-6 text-sm text-slate-500">
            <span className="grid grid-flow-col gap-2 items-center">
              <i className="fa-regular fa-user-circle text-lg"></i> 
              <span className="font-medium text-slate-700">{article.author_name || `User ${article.author_id}`}</span>
            </span>
            <span className="grid grid-flow-col gap-2 items-center">
              <i className="fa-regular fa-calendar text-lg"></i> 
              {new Date(article.created_at).toLocaleString()}
            </span>
          </div>
        </header>

        <div className="prose prose-slate max-w-none prose-headings:text-medical-800 prose-a:text-medical-600 prose-img:rounded-xl leading-8 text-slate-700">
           <div className="whitespace-pre-wrap">
             {article.content}
           </div>
        </div>

        {article.attachment && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-[auto_1fr_auto] gap-5 items-center hover:border-medical-200 transition">
             <div className="w-12 h-12 bg-white rounded-full grid place-items-center shadow-sm text-medical-500">
               <i className="fa-solid fa-file-arrow-down text-xl"></i>
             </div>
             <div className="grid gap-1">
               <p className="text-sm font-bold text-slate-800">附件资源</p>
               <p className="text-xs text-slate-500 break-all">{article.attachment}</p>
             </div>
             <a 
               href={`http://localhost:5000/uploads/${article.attachment}`} 
               target="_blank"
               rel="noreferrer"
               className="text-sm font-bold text-white bg-medical-600 px-4 py-2 rounded hover:bg-medical-700 transition shadow-sm"
             >
               下载
             </a>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data);
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-medical-600 p-8 text-center pattern-bg">
          <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 grid place-items-center text-white backdrop-blur-sm">
             <i className="fa-solid fa-user-doctor text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">账户登录</h2>
          <p className="text-medical-100 text-sm mt-2">MedCore 专业医学资讯平台</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 grid gap-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">{error}</div>}
          
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">邮箱地址</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition"
              required 
            />
          </div>
          
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">密码</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-medical-500 outline-none transition"
              required
            />
          </div>

          <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700 transition font-bold mt-2 shadow-lg shadow-slate-200">
            立即登录
          </button>
          
          <div className="text-center text-sm text-slate-500 mt-2">
            还没有账号？ <Link to="/register" className="text-medical-600 hover:text-medical-700 font-bold hover:underline">免费注册</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const [step, setStep] = useState<1|2>(1);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirm: '' });
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      setMessage('两次密码不一致');
      return;
    }
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      setStep(2);
      setMessage('验证码已发送，请查收邮件');
    } else {
      setMessage(data.message || '注册失败');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email, code }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = '#/login';
    } else {
      setMessage(data.message || '验证失败');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid place-items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">注册新账户</h2>
          <p className="text-slate-400 text-sm mt-2">加入 MedCore 专业社区</p>
        </div>
        
        <div className="p-8">
          {message && <div className="bg-blue-50 text-blue-600 p-3 rounded text-sm text-center mb-6 border border-blue-100">{message}</div>}
          
          {step === 1 ? (
            <form onSubmit={handleRegister} className="grid gap-4">
              <input type="text" placeholder="用户名" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-medical-500 outline-none transition" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              <input type="email" placeholder="邮箱" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-medical-500 outline-none transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <input type="password" placeholder="密码" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-medical-500 outline-none transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              <input type="password" placeholder="确认密码" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-medical-500 outline-none transition" value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} required />
              <button type="submit" className="bg-medical-600 text-white py-3 rounded-lg hover:bg-medical-700 font-bold mt-2 shadow-md">获取验证码</button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="grid gap-6">
              <div className="text-center text-sm text-slate-500">已发送至 <span className="font-bold text-slate-700">{formData.email}</span></div>
              <input type="text" placeholder="输入6位验证码" className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-center tracking-[0.5em] text-2xl font-bold focus:border-medical-500 outline-none" value={code} onChange={e => setCode(e.target.value)} maxLength={6} required />
              <button type="submit" className="bg-medical-600 text-white py-3 rounded-lg hover:bg-medical-700 font-bold shadow-md">完成注册</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('domestic');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (file) formData.append('attachment', file);

    const res = await fetch(`${API_BASE}/admin/article/new`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setMsg('发布成功！');
      setTitle('');
      setContent('');
      setFile(null);
      setCategory('domestic');
    } else {
      setMsg('发布失败: ' + data.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 items-start">
        {/* Sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid gap-2 sticky top-24">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">管理菜单</div>
          <button className="text-left px-4 py-2.5 bg-medical-50 text-medical-700 font-medium rounded-lg grid grid-flow-col justify-start gap-3 items-center">
            <i className="fa-solid fa-pen-to-square"></i> 发布文章
          </button>
          <button className="text-left px-4 py-2.5 hover:bg-slate-50 text-slate-600 rounded-lg grid grid-flow-col justify-start gap-3 items-center transition">
            <i className="fa-solid fa-users"></i> 用户管理
          </button>
          <button className="text-left px-4 py-2.5 hover:bg-slate-50 text-slate-600 rounded-lg grid grid-flow-col justify-start gap-3 items-center transition">
            <i className="fa-solid fa-gear"></i> 系统设置
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">发布新文章</h2>
          {msg && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-2"><i className="fa-solid fa-check-circle"></i> {msg}</div>}
          
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="font-bold text-sm text-slate-700">文章标题</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-medical-500 outline-none transition" 
                  placeholder="请输入标题..."
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label className="font-bold text-sm text-slate-700">文章分类</label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-medical-500 outline-none appearance-none bg-white transition cursor-pointer"
                  >
                    {NAV_CATEGORIES.filter(c => c.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="font-bold text-sm text-slate-700">文章内容</label>
              {/* WangEditor Simulation */}
              <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-medical-500 transition">
                <div className="bg-slate-50 border-b border-slate-200 p-2 grid grid-flow-col justify-start gap-1">
                   {['B', 'I', 'U', 'H1', 'List', 'Link', 'Image', 'Quote'].map(tool => (
                     <button key={tool} type="button" className="w-8 h-8 rounded hover:bg-slate-200 grid place-items-center text-slate-600 text-xs font-bold transition">
                       {tool === 'Image' ? <i className="fa-regular fa-image"></i> : tool}
                     </button>
                   ))}
                </div>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full p-4 h-64 outline-none resize-none text-slate-700 leading-relaxed"
                  placeholder="在此输入正文内容..."
                  required
                ></textarea>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="font-bold text-sm text-slate-700">附件上传 (PDF/Images)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                <input 
                  type="file" 
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="grid place-items-center gap-2 pointer-events-none">
                  <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-400"></i>
                  <span className="text-sm text-slate-500 font-medium">
                    {file ? file.name : '点击或拖拽文件至此上传'}
                  </span>
                </div>
              </div>
            </div>

            <button type="submit" className="justify-self-start bg-medical-600 text-white px-8 py-3 rounded-lg hover:bg-medical-700 transition shadow-md font-bold mt-2">
              <i className="fa-solid fa-paper-plane mr-2"></i> 发布文章
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 text-center">
    <div className="bg-white p-16 rounded-2xl shadow-sm border border-slate-200 grid place-items-center gap-6">
      <div className="w-24 h-24 bg-medical-50 text-medical-600 rounded-full grid place-items-center text-4xl mb-2">
        <i className="fa-regular fa-id-card"></i>
      </div>
      <div className="grid gap-2">
        <h2 className="text-3xl font-bold text-slate-800">用户中心</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          您可以在此管理您的个人资料、查看收藏的文章以及浏览历史记录。
        </p>
      </div>
      <div className="grid grid-flow-col gap-4 mt-4">
        <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">编辑资料</button>
        <button className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition">查看收藏</button>
      </div>
    </div>
  </div>
);

// ==========================================
// Main App Wrapper
// ==========================================

export default function App() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    fetch(`${API_BASE}/me`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAuth({ user: data.data, isAuthenticated: true, isLoading: false });
        } else {
          setAuth({ user: null, isAuthenticated: false, isLoading: false });
        }
      })
      .catch(() => setAuth({ ...auth, isLoading: false }));
  }, []);

  const login = (user: User) => {
    setAuth({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = async () => {
    await fetch(`${API_BASE}/logout`);
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
  };

  if (auth.isLoading) {
    return <div className="min-h-screen bg-slate-50 grid place-items-center text-medical-600">
      <div className="grid place-items-center gap-4">
        <i className="fa-solid fa-staff-snake fa-spin text-5xl"></i>
        <span className="font-bold tracking-widest text-sm">LOADING MEDCORE</span>
      </div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <Router>
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen grid grid-rows-[auto_1fr_auto]">
          <Navbar />
          <div className="w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/dashboard" 
                element={
                  auth.isAuthenticated ? (
                    auth.user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />
                  ) : <Navigate to="/login" />
                } 
              />
            </Routes>
          </div>
          <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
             <div className="max-w-7xl mx-auto px-4 grid gap-8 md:grid-cols-3 text-sm">
               <div className="grid gap-2">
                 <h4 className="text-white font-bold text-lg mb-2">MedCore 医核心</h4>
                 <p>致力于提供最前沿的医学资讯与临床数据服务。</p>
               </div>
               <div className="grid gap-2">
                 <h4 className="text-white font-bold mb-2">快速链接</h4>
                 <div className="grid gap-1">
                   <Link to="/" className="hover:text-medical-400">首页</Link>
                   <Link to="/?cat=domestic" className="hover:text-medical-400">国内资讯</Link>
                   <Link to="/?cat=international" className="hover:text-medical-400">国际视野</Link>
                 </div>
               </div>
               <div className="grid gap-2">
                 <h4 className="text-white font-bold mb-2">联系我们</h4>
                 <p><i className="fa-regular fa-envelope mr-2"></i> contact@medcore.com</p>
                 <p><i className="fa-solid fa-phone mr-2"></i> 010-12345678</p>
               </div>
             </div>
             <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-600">
               &copy; 2023 MedCore Medical Systems. All rights reserved.
             </div>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}