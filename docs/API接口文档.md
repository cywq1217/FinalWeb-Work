# 在线音乐播放器 - API 接口文档

## 1. 概述

### 1.1 基本信息

| 项目 | 说明 |
|------|------|
| 基础URL | `http://localhost:3001/api` |
| 数据格式 | JSON |
| 认证方式 | JWT Bearer Token |
| 字符编码 | UTF-8 |

### 1.2 通用响应格式

**成功响应**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 1.3 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 2. 歌曲接口

### 2.1 获取歌曲列表

**请求**
```
GET /api/songs
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |
| genre | string | 否 | 按流派筛选 |
| artist | string | 否 | 按歌手筛选 |

**响应示例**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "title": "歌曲名称",
      "artist": "歌手",
      "album": "专辑名",
      "duration": 180.5,
      "filePath": "/uploads/audio/xxx.mp3",
      "coverUrl": "/uploads/covers/xxx.jpg",
      "lyricsPath": "/uploads/lyrics/xxx.lrc",
      "genre": "Pop",
      "playCount": 100,
      "createdAt": "2024-12-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 2.2 搜索歌曲

**请求**
```
GET /api/songs/search?q={keyword}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |

**响应示例**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "title": "匹配的歌曲",
      "artist": "歌手",
      "album": "专辑",
      "duration": 200,
      "filePath": "/uploads/audio/xxx.mp3",
      "coverUrl": "/uploads/covers/xxx.jpg"
    }
  ]
}
```

---

### 2.3 获取单个歌曲

**请求**
```
GET /api/songs/:id
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 歌曲 ID |

**响应示例**
```json
{
  "data": {
    "id": "uuid-1",
    "title": "歌曲名称",
    "artist": "歌手",
    "album": "专辑名",
    "duration": 180.5,
    "filePath": "/uploads/audio/xxx.mp3",
    "coverUrl": "/uploads/covers/xxx.jpg",
    "lyricsPath": "/uploads/lyrics/xxx.lrc",
    "genre": "Pop",
    "playCount": 100
  }
}
```

---

### 2.4 上传歌曲

**请求**
```
POST /api/songs
Content-Type: multipart/form-data
```

**表单字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio | File | 是 | 音频文件 (mp3, wav, flac) |
| cover | File | 否 | 封面图片 (jpg, png) |
| lyrics | File | 否 | 歌词文件 (lrc) |
| title | string | 否 | 歌曲标题 |
| artist | string | 否 | 歌手名称 |
| album | string | 否 | 专辑名称 |
| genre | string | 否 | 音乐流派 |

**响应示例**
```json
{
  "data": {
    "id": "new-uuid",
    "title": "上传的歌曲",
    "artist": "歌手",
    "duration": 240,
    "filePath": "/uploads/audio/new-uuid.mp3",
    "coverUrl": "/uploads/covers/new-uuid.jpg"
  },
  "message": "上传成功"
}
```

---

### 2.5 更新歌曲信息

**请求**
```
PUT /api/songs/:id
Content-Type: application/json
```

**请求体**
```json
{
  "title": "新标题",
  "artist": "新歌手",
  "album": "新专辑",
  "genre": "新流派"
}
```

**响应示例**
```json
{
  "data": {
    "id": "uuid-1",
    "title": "新标题",
    "artist": "新歌手"
  },
  "message": "更新成功"
}
```

---

### 2.6 删除歌曲

**请求**
```
DELETE /api/songs/:id
```

**响应示例**
```json
{
  "message": "删除成功"
}
```

---

### 2.7 增加播放次数

**请求**
```
POST /api/songs/:id/play
```

**响应示例**
```json
{
  "data": {
    "id": "uuid-1",
    "playCount": 101
  }
}
```

---

## 3. 用户接口

### 3.1 用户注册

**请求**
```
POST /api/users/register
Content-Type: application/json
```

**请求体**
```json
{
  "email": "user@example.com",
  "username": "用户名",
  "password": "密码"
}
```

**响应示例**
```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "用户名"
    },
    "token": "jwt-token-string"
  },
  "message": "注册成功"
}
```

---

### 3.2 用户登录

**请求**
```
POST /api/users/login
Content-Type: application/json
```

**请求体**
```json
{
  "email": "user@example.com",
  "password": "密码"
}
```

**响应示例**
```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "用户名"
    },
    "token": "jwt-token-string"
  },
  "message": "登录成功"
}
```

---

### 3.3 获取用户信息

**请求**
```
GET /api/users/:id
```

**响应示例**
```json
{
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "用户名",
    "createdAt": "2024-12-19T00:00:00.000Z"
  }
}
```

---

### 3.4 获取用户收藏

**请求**
```
GET /api/users/:id/favorites
```

**响应示例**
```json
{
  "data": [
    {
      "id": "favorite-uuid",
      "songId": "song-uuid",
      "createdAt": "2024-12-19T00:00:00.000Z",
      "song": {
        "id": "song-uuid",
        "title": "收藏的歌曲",
        "artist": "歌手"
      }
    }
  ]
}
```

---

### 3.5 添加收藏

**请求**
```
POST /api/users/:id/favorites
Content-Type: application/json
```

**请求体**
```json
{
  "songId": "song-uuid"
}
```

**响应示例**
```json
{
  "data": {
    "id": "favorite-uuid",
    "userId": "user-uuid",
    "songId": "song-uuid"
  },
  "message": "收藏成功"
}
```

---

### 3.6 取消收藏

**请求**
```
DELETE /api/users/:id/favorites/:songId
```

**响应示例**
```json
{
  "message": "取消收藏成功"
}
```

---

## 4. 播放列表接口

### 4.1 获取播放列表

**请求**
```
GET /api/playlists?userId={userId}
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户 ID，筛选该用户的列表 |

**响应示例**
```json
{
  "data": [
    {
      "id": "playlist-uuid",
      "name": "我的歌单",
      "description": "描述",
      "coverUrl": "/uploads/covers/xxx.jpg",
      "userId": "user-uuid",
      "songs": [
        {
          "songId": "song-uuid",
          "addedAt": "2024-12-19T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 4.2 获取播放列表详情

**请求**
```
GET /api/playlists/:id
```

**响应示例**
```json
{
  "data": {
    "id": "playlist-uuid",
    "name": "我的歌单",
    "description": "描述",
    "songs": [
      {
        "songId": "song-uuid",
        "song": {
          "id": "song-uuid",
          "title": "歌曲名",
          "artist": "歌手"
        }
      }
    ]
  }
}
```

---

### 4.3 创建播放列表

**请求**
```
POST /api/playlists
Content-Type: application/json
```

**请求体**
```json
{
  "name": "新歌单",
  "description": "歌单描述",
  "userId": "user-uuid"
}
```

**响应示例**
```json
{
  "data": {
    "id": "new-playlist-uuid",
    "name": "新歌单",
    "description": "歌单描述"
  },
  "message": "创建成功"
}
```

---

### 4.4 更新播放列表

**请求**
```
PUT /api/playlists/:id
Content-Type: application/json
```

**请求体**
```json
{
  "name": "新名称",
  "description": "新描述"
}
```

**响应示例**
```json
{
  "data": {
    "id": "playlist-uuid",
    "name": "新名称"
  },
  "message": "更新成功"
}
```

---

### 4.5 删除播放列表

**请求**
```
DELETE /api/playlists/:id
```

**响应示例**
```json
{
  "message": "删除成功"
}
```

---

### 4.6 添加歌曲到播放列表

**请求**
```
POST /api/playlists/:id/songs
Content-Type: application/json
```

**请求体**
```json
{
  "songId": "song-uuid"
}
```

**响应示例**
```json
{
  "message": "添加成功"
}
```

---

### 4.7 从播放列表移除歌曲

**请求**
```
DELETE /api/playlists/:id/songs/:songId
```

**响应示例**
```json
{
  "message": "移除成功"
}
```

---

## 5. 静态资源访问

### 5.1 音频文件

```
GET /uploads/audio/{filename}
```

### 5.2 封面图片

```
GET /uploads/covers/{filename}
```

### 5.3 歌词文件

```
GET /uploads/lyrics/{filename}
```

---

## 6. 错误码说明

| 错误码 | 说明 |
|--------|------|
| AUTH_REQUIRED | 需要登录 |
| INVALID_TOKEN | Token 无效 |
| USER_NOT_FOUND | 用户不存在 |
| SONG_NOT_FOUND | 歌曲不存在 |
| PLAYLIST_NOT_FOUND | 播放列表不存在 |
| INVALID_PARAMS | 参数错误 |
| FILE_UPLOAD_ERROR | 文件上传失败 |
| DUPLICATE_EMAIL | 邮箱已被注册 |
| WRONG_PASSWORD | 密码错误 |

---

## 7. 版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0 | 2024-12-19 | 初始版本 |

