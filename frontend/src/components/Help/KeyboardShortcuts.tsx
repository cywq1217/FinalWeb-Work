import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: '空格', action: '播放 / 暂停' },
  { key: 'Ctrl + →', action: '下一曲' },
  { key: 'Ctrl + ←', action: '上一曲' },
  { key: '↑', action: '增加音量' },
  { key: '↓', action: '减少音量' },
  { key: 'M', action: '静音 / 取消静音' },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <span className="text-gray-600">{shortcut.action}</span>
                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono text-gray-700">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 text-center">
            按 <kbd className="px-1 bg-gray-100 rounded">?</kbd> 可随时打开此帮助
          </p>
        </div>
      </div>
    </div>
  );
}
