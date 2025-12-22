import { useEffect, useState } from 'react'
import MusicList from './components/MusicList/MusicList'
import PlayerControls from './components/Player/PlayerControls'
import KeyboardShortcuts from './components/Help/KeyboardShortcuts'
import { usePlayerStore } from './store/playerStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const cleanup = usePlayerStore((state) => state.cleanup)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // 启用全局快捷键
  useKeyboardShortcuts(() => setShowShortcuts(true))

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return (
    <>
      <div className="min-h-screen pb-32 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        {/* 主内容区 */}
        <MusicList />
        
        {/* 播放器控制条 */}
        <PlayerControls />
      </div>

      {/* 快捷键帮助 */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}

export default App
