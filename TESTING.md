# 测试文档

## 测试概述

本项目包含完整的单元测试和集成测试，覆盖前端和后端的核心功能。

---

## 测试框架

### 后端测试
- **测试框架**: Jest
- **HTTP测试**: Supertest
- **覆盖率工具**: Jest Coverage

### 前端测试
- **测试框架**: Vitest
- **组件测试**: React Testing Library
- **DOM匹配器**: @testing-library/jest-dom

---

## 测试文件结构

```
backend/
├── tests/
│   ├── unit/                      # 单元测试
│   │   ├── models/
│   │   │   └── song.test.ts      # 数据模型测试
│   │   └── utils/
│   │       └── format.test.ts    # 工具函数测试
│   ├── integration/               # 集成测试
│   │   └── api/
│   │       └── songs.test.ts     # API接口测试
│   └── utils/
│       └── testHelper.ts         # 测试辅助函数
└── jest.config.js                # Jest配置

frontend/
├── src/
│   └── tests/
│       ├── components/
│       │   └── SongItem.test.tsx # 组件测试
│       ├── store/
│       │   └── playerStore.test.ts # 状态管理测试
│       ├── utils/
│       │   ├── format.test.ts    # 工具函数测试
│       │   └── lyrics.test.ts    # 歌词解析测试
│       └── setup.ts              # 测试环境配置
└── vitest.config.ts              # Vitest配置
```

---

## 运行测试

### 后端测试

```bash
cd backend

# 运行所有测试
npm test

# 监听模式（自动重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 前端测试

```bash
cd frontend

# 运行所有测试
npm test

# 运行测试UI界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

---

## 测试覆盖的功能

### 后端测试

#### 1. 数据模型测试 (`song.test.ts`)
- 创建歌曲
- 获取所有歌曲
- 通过ID查找歌曲
- 更新歌曲信息
- 删除歌曲
- 增加播放次数

#### 2. API接口测试 (`songs.test.ts`)
- GET `/api/songs` - 获取歌曲列表
- GET `/api/songs` - 分页功能
- GET `/api/songs/search` - 搜索歌曲
- GET `/api/songs/:id` - 获取单个歌曲
- GET `/api/songs/:id` - 404错误处理
- POST `/api/songs/:id/play` - 增加播放次数

#### 3. 工具函数测试 (`format.test.ts`)
- 时间格式化
- 处理边界情况（0秒、NaN等）
- 处理小数

### 前端测试

#### 1. 组件测试 (`SongItem.test.tsx`)
- 渲染歌曲信息
- 显示正确序号
- 显示格式化时长
- 点击触发播放

#### 2. 状态管理测试 (`playerStore.test.ts`)
- 初始化默认状态
- 设置播放列表
- 设置音量
- 切换静音
- 设置播放模式
- 更新当前时间

#### 3. 工具函数测试

**格式化函数** (`format.test.ts`)
- 时间格式化
- 文件大小格式化
- 播放次数格式化
- 处理无效输入

**歌词解析** (`lyrics.test.ts`)
- 解析标准LRC格式
- 处理毫秒
- 处理多个时间标签
- 按时间排序
- 忽略无效行
- 获取当前歌词索引
- 处理边界情况

---

## 测试示例

### 后端单元测试示例

```typescript
describe('Song Model', () => {
  it('应该创建一首歌曲', async () => {
    const song = await createTestSong();
    
    expect(song).toBeDefined();
    expect(song.title).toBe('Test Song');
    expect(song.artist).toBe('Test Artist');
    expect(song.duration).toBe(180);
  });
});
```

### 后端集成测试示例

```typescript
describe('GET /api/songs', () => {
  it('应该返回所有歌曲', async () => {
    await createTestSong();
    
    const response = await request(app)
      .get('/api/songs')
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
```

### 前端组件测试示例

```typescript
describe('SongItem', () => {
  it('应该渲染歌曲信息', () => {
    render(<SongItem song={mockSong} index={0} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });
});
```

### 前端工具函数测试示例

```typescript
describe('formatTime', () => {
  it('应该正确格式化时间', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
  });
});
```

---

## 测试配置

### Jest配置 (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};
```

### Vitest配置 (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 覆盖率报告

### 查看覆盖率

运行测试后，覆盖率报告会生成在：

**后端**: `backend/coverage/index.html`  
**前端**: `frontend/coverage/index.html`

在浏览器中打开这些文件可以查看详细的覆盖率报告。

### 覆盖率目标

- **语句覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

---

## 测试最佳实践

### 1. 测试命名

使用清晰的描述性名称：

```typescript
// 好的命名
it('应该在用户未登录时显示登录按钮', () => {});

// 不好的命名
it('test1', () => {});
```

### 2. 测试隔离

每个测试应该独立运行：

```typescript
beforeEach(async () => {
  await cleanDatabase(); // 清理数据
});
```

### 3. 使用辅助函数

创建可重用的测试辅助函数：

```typescript
// testHelper.ts
export async function createTestSong() {
  return await prisma.song.create({
    data: { /* ... */ },
  });
}
```

### 4. Mock外部依赖

对外部依赖进行Mock：

```typescript
vi.mock('@/store/playerStore', () => ({
  usePlayerStore: () => ({
    currentSong: null,
    playSong: vi.fn(),
  }),
}));
```

### 5. 测试边界情况

不仅测试正常情况，也要测试边界情况：

```typescript
it('应该处理NaN', () => {
  expect(formatTime(NaN)).toBe('00:00');
});

it('应该返回404当歌曲不存在', async () => {
  await request(app)
    .get('/api/songs/nonexistent-id')
    .expect(404);
});
```

---

## 调试测试

### 后端测试调试

```bash
# 运行单个测试文件
npm test -- tests/unit/models/song.test.ts

# 运行匹配特定名称的测试
npm test -- -t "应该创建一首歌曲"

# 显示详细输出
npm test -- --verbose
```

### 前端测试调试

```bash
# 运行单个测试文件
npm test -- src/tests/utils/format.test.ts

# 运行匹配特定名称的测试
npm test -- -t "formatTime"

# 使用UI界面调试
npm run test:ui
```

---

## 持续集成

### GitHub Actions示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 测试清单

在提交代码前，确保：

- [ ] 所有测试通过
- [ ] 新功能有对应的测试
- [ ] 覆盖率达到目标
- [ ] 没有跳过的测试（`it.skip`）
- [ ] 没有仅运行的测试（`it.only`）
- [ ] 测试命名清晰
- [ ] 清理了测试数据

---

## 相关资源

### 文档
- [Jest官方文档](https://jestjs.io/)
- [Vitest官方文档](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest文档](https://github.com/visionmedia/supertest)

### 教程
- [Jest测试教程](https://jestjs.io/docs/getting-started)
- [Vitest快速开始](https://vitest.dev/guide/)
- [React组件测试](https://testing-library.com/docs/react-testing-library/intro/)

---

## 总结

完整的测试套件确保了代码质量和项目稳定性。通过持续运行测试，可以：

- 及早发现bug
- 安全重构代码
- 提高代码质量
- 增强开发信心
- 减少回归问题

记得在开发新功能时同步编写测试！
