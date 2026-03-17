import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fillerCategories = [
  { label: '填充音', words: ['嗯', '啊', 'ㄜ'], color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { label: '連接贅詞', words: ['然後', '而且', '再來', '接下來'], color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: '指示贅詞', words: ['這個', '那個'], color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: '習慣性開場白', words: ['老實說', '我覺得', '基本上', '其實'], color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: '習慣性結尾', words: ['你懂我意思嗎', '對不對', '是不是', '對'], color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
]

const highlights = [
  { num: '01', text: '不用連網也不燒 token，靠 Apple Intelligence on-device 語音辨識' },
  { num: '02', text: '即時回饋用觸覺震動，不跳通知，不打斷你的 flow' },
  { num: '03', text: 'AI 只負責語音轉文字，贅字偵測、語速計算、統計圖表都是自己寫的邏輯' },
  { num: '04', text: '歷史紀錄讓進步看得見，比「我覺得有變好」有說服力多了' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function DesignStoryModal({ isOpen, onClose }: Props) {
  // Esc to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative bg-bg-base rounded-3xl border border-divider shadow-2xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-divider flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3.5 rounded-full bg-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple tracking-widest uppercase">
                    Design Story
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">為什麼做這個 App？</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  說來話長 TalkFit — 一個幫你偵測演講贅字與語速的練習工具
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-divider text-text-muted hover:text-text-primary hover:border-text-secondary transition-all flex items-center justify-center flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto phone-scroll flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Left: App idea */}
                <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                  <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <h3 className="text-sm font-bold text-text-primary">App 點子</h3>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-5">

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-red flex-shrink-0" />
                        <p className="text-xs font-bold text-text-secondary tracking-wide">想解決的問題</p>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        練演講或簡報的時候，最頭疼的就是那些自己聽不到的壞習慣。「然後」講了三十次、每句話結尾都加一個「對」、緊張的時候瘋狂「嗯嗯嗯」。這些東西朋友不好意思跟你說，自己錄音回聽又很折磨，大部分人的結局就是上台之後才發現又犯了。
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                        <p className="text-xs font-bold text-text-secondary tracking-wide">如何解決</p>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        打開 App，按下開始，對著手機練你的演講。App 利用 Apple Intelligence 的 on-device 語音辨識，即時把你說的話轉成文字，同時在背景分析你的語速和用字習慣。如果贅字太多或語速失控，手機會輕輕震一下提醒你，不會打斷你的節奏。講完之後，App 給你一份完整的分析報告，讓你清楚看到自己哪裡需要改。
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />
                        <p className="text-xs font-bold text-text-secondary tracking-wide">特色亮點</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {highlights.map(({ num, text }) => (
                          <div key={num} className="flex items-start gap-2.5">
                            <span className="text-[10px] font-bold text-accent-blue-light bg-accent-blue/10 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 tabular-nums">
                              {num}
                            </span>
                            <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />
                        <p className="text-xs font-bold text-text-secondary tracking-wide">偵測的贅字類型</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {fillerCategories.map(({ label, words, color }) => (
                          <div key={label} className="flex items-start gap-2 flex-wrap">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${color}`}>
                              {label}
                            </span>
                            <span className="text-xs text-text-muted leading-5">{words.join('　')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Motivation */}
                <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                  <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                    <span className="text-base">🙋</span>
                    <h3 className="text-sm font-bold text-text-primary">為什麼參加這次活動？</h3>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-4">
                    <div className="rounded-xl bg-accent-blue/8 border border-accent-blue/20 px-4 py-3">
                      <p className="text-sm text-text-primary leading-relaxed font-medium">
                        最近剛開始接觸 iOS 開發，但老實說還在懵懵懂懂的階段，很多東西看得懂卻還不太會自己從頭建起來。另一方面，平常雖然會用 AI 工具輔助寫程式，但一直很好奇在真正的產品開發流程裡，AI Coding 到底是怎麼運作的。這兩件事加在一起，就是想參加這次活動最大的原因。
                      </p>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      程式基礎方面，平常主要寫 Web 前端、Python 和 .NET，面對新語言和框架時有一些可以借力的基礎。比較缺的是 iOS 的實戰經驗，還有和其他開發者合作碰撞想法的機會。能在三天內走完從想法到產品的流程，是平常自學很難得到的體驗。
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      目前已經有一個想做的 App 點子（說來話長 TalkFit，一個幫你偵測演講贅字和語速的練習工具），很想趁這個機會驗證看看它到底能不能實現。
                    </p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      也很期待 Hackathon 當天能認識一群對 AI 和 App 同樣有熱情的人，直接在實戰中跟大家互相學習。對我來說這不只是學一個新技術，更像是幫自己打開一個新的可能性。
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
