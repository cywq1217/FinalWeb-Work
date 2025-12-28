import { useState, useRef } from 'react';
import { Upload, X, Music, Image as ImageIcon, FileText, Loader } from 'lucide-react';
import { songApi } from '@/services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: new Date().getFullYear(),
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // 自动从文件名提取标题
      if (!formData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setFormData({ ...formData, title: fileName });
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLyricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLyricsFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      alert('请选择音频文件');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('audio', audioFile);
      uploadData.append('title', formData.title);
      uploadData.append('artist', formData.artist);
      
      if (formData.album) uploadData.append('album', formData.album);
      if (formData.genre) uploadData.append('genre', formData.genre);
      if (formData.year) uploadData.append('year', formData.year.toString());
      if (coverFile) uploadData.append('cover', coverFile);
      if (lyricsFile) uploadData.append('lyrics', lyricsFile);

      await songApi.upload(uploadData);
      
      // 重置表单
      setFormData({
        title: '',
        artist: '',
        album: '',
        genre: '',
        year: new Date().getFullYear(),
      });
      setAudioFile(null);
      setCoverFile(null);
      setLyricsFile(null);
      setCoverPreview('');
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('上传失败:', error);
      const errorMsg = error?.response?.data?.error || error?.message || '未知错误';
      alert(`上传失败: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">上传音乐</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 音频文件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音频文件 <span className="text-red-500">*</span>
            </label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 transition-colors"
            >
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {audioFile ? audioFile.name : '点击选择音频文件（MP3, WAV等）'}
              </p>
            </button>
          </div>

          {/* 封面图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              专辑封面（可选）
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 transition-colors"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="w-32 h-32 object-cover mx-auto rounded-lg" />
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击选择封面图片</p>
                </>
              )}
            </button>
          </div>

          {/* 歌词文件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              歌词文件（可选）
            </label>
            <input
              ref={lyricsInputRef}
              type="file"
              accept=".lrc,.txt"
              onChange={handleLyricsChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => lyricsInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 transition-colors"
            >
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {lyricsFile ? lyricsFile.name : '点击选择歌词文件（LRC格式）'}
              </p>
            </button>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                歌曲名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="请输入歌曲名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                艺术家 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="请输入艺术家"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专辑
              </label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="请输入专辑名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                流派
              </label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">选择流派</option>
                <option value="流行">流行</option>
                <option value="摇滚">摇滚</option>
                <option value="电子">电子</option>
                <option value="古典">古典</option>
                <option value="爵士">爵士</option>
                <option value="民谣">民谣</option>
                <option value="说唱">说唱</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年份
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploading || !audioFile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  上传
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
