# 开发日志 - 第4阶段：用户系统

## 阶段概述
- **目标**: 实现用户注册、登录、收藏功能
- **涉及文件**: store/authStore.ts, components/Auth/, controllers/user.controller.ts

---

## 详细日志

### [代码] 认证状态管理
```
时间: 阶段初期
类型: 代码创建
文件: frontend/src/store/authStore.ts

核心实现:

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await userApi.login({ email, password });
        set({
          user: response.data,
          token: response.token,
          isAuthenticated: true,
        });
      },

      register: async (email, username, password) => {
        const response = await userApi.register({ email, username, password });
        set({
          user: response.data,
          token: response.token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: () => {
        const { token } = get();
        if (token) {
          // 验证token有效性
          try {
            const decoded = jwtDecode(token);
            if (decoded.exp && decoded.exp * 1000 > Date.now()) {
              set({ isAuthenticated: true });
            } else {
              get().logout();
            }
          } catch {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
```

### [代码] 登录注册模态框
```
时间: Store完成后
类型: 代码创建
文件: frontend/src/components/Auth/AuthModal.tsx

组件结构:

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        // 验证
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致');
          return;
        }
        if (password.length < 6) {
          setError('密码长度至少6位');
          return;
        }
        await register(email, username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {mode === 'login' ? '登录' : '注册'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {mode === 'register' && (
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === 'register' && (
            <input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {mode === 'login' ? '没有账号？' : '已有账号？'}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '立即注册' : '立即登录'}
          </button>
        </p>
      </div>
    </Modal>
  );
};
```

### [代码] 收藏状态管理
```
时间: 认证完成后
类型: 代码创建
文件: frontend/src/store/favoriteStore.ts

核心实现:

interface FavoriteState {
  favorites: string[];  // 收藏的歌曲ID列表
  loading: boolean;
  fetchFavorites: (userId: string) => Promise<void>;
  addFavorite: (userId: string, songId: string) => Promise<void>;
  removeFavorite: (userId: string, songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  loading: false,

  fetchFavorites: async (userId) => {
    set({ loading: true });
    try {
      const response = await userApi.getFavorites(userId);
      set({ favorites: response.data.map((s: Song) => s.id) });
    } finally {
      set({ loading: false });
    }
  },

  addFavorite: async (userId, songId) => {
    await userApi.addFavorite(userId, songId);
    set((state) => ({ favorites: [...state.favorites, songId] }));
  },

  removeFavorite: async (userId, songId) => {
    await userApi.removeFavorite(userId, songId);
    set((state) => ({ 
      favorites: state.favorites.filter((id) => id !== songId) 
    }));
  },

  isFavorite: (songId) => get().favorites.includes(songId),
}));
```

### [代码] 收藏按钮组件
```
时间: 收藏Store后
类型: 代码创建
文件: frontend/src/components/MusicList/FavoriteButton.tsx

组件实现:

interface FavoriteButtonProps {
  songId: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ songId }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const [loading, setLoading] = useState(false);

  const favorite = isFavorite(songId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    setLoading(true);
    try {
      if (favorite) {
        await removeFavorite(user!.id, songId);
      } else {
        await addFavorite(user!.id, songId);
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`p-2 transition-all duration-200 ${
        favorite 
          ? 'text-red-500 scale-110' 
          : 'text-gray-400 hover:text-red-400'
      }`}
    >
      <Heart 
        className="w-5 h-5" 
        fill={favorite ? 'currentColor' : 'none'} 
      />
    </button>
  );
};
```

### [代码] 后端收藏API
```
时间: 前端完成后
类型: 代码创建
文件: backend/src/controllers/user.controller.ts

新增函数:

// 获取用户收藏
export const getFavorites = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { favorites: true },
  });

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({ data: user.favorites });
};

// 添加收藏
export const addFavorite = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { songId } = req.body;

  await prisma.user.update({
    where: { id },
    data: {
      favorites: {
        connect: { id: songId },
      },
    },
  });

  res.json({ message: '收藏成功' });
};

// 取消收藏
export const removeFavorite = async (req: Request, res: Response) => {
  const { id, songId } = req.params;

  await prisma.user.update({
    where: { id },
    data: {
      favorites: {
        disconnect: { id: songId },
      },
    },
  });

  res.json({ message: '已取消收藏' });
};
```

### [调试] 登录状态持久化问题
```
时间: 功能完成后
类型: 问题调试

问题: 刷新页面后登录状态丢失

原因分析:
- Zustand persist中间件配置不完整
- token没有正确保存到localStorage

解决方案:
1. 检查persist配置，确保partialize正确
2. 在App初始化时调用checkAuth()

修改代码:
// App.tsx
useEffect(() => {
  useAuthStore.getState().checkAuth();
}, []);

结果: 刷新页面后登录状态正常保持
```

---

## 阶段总结

### 完成项
- [x] 用户注册功能
- [x] 用户登录功能
- [x] JWT Token认证
- [x] 登录状态持久化
- [x] 收藏功能（前端+后端）
- [x] 收藏按钮动画效果

### API接口
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/users/register | 用户注册 |
| POST | /api/users/login | 用户登录 |
| GET | /api/users/:id/favorites | 获取收藏列表 |
| POST | /api/users/:id/favorites | 添加收藏 |
| DELETE | /api/users/:id/favorites/:songId | 取消收藏 |
