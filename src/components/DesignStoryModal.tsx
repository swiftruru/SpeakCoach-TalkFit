import { useCallback, useEffect, useState } from 'react'
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

const aboutCards = [
  {
    id: 'name',
    emoji: '🪪',
    title: '產品名稱由來',
    body: '「Fit」有健康、合身的意思，TalkFit 就像是在幫口語表達做健身。名稱本身直接傳達「把說話習慣練好」的概念，也保留一點輕鬆、日常、可持續練習的感覺。',
  },
  {
    id: 'author',
    emoji: '🙋',
    title: '作者資訊',
    body: '我是國立台北護理健康大學資訊管理系的學生，名字叫做潘昱如，英文姓名為 PAN, YU-RU。這個原型網站同時也是我用來整理產品想法、互動流程與作品展示方式的一個實驗場。',
  },
  {
    id: 'version',
    emoji: '🏷️',
    title: '版本資訊',
    body: '目前為 TalkFit 的 Web Prototype / Demo Build。網站重點不是實際錄音，而是完整展示產品流程、報告邏輯、設定設計與互動說明，方便在作品集、面試或 hackathon 場景快速說明產品價值。',
  },
]

const techDetails = [
  'React 19 + TypeScript 建構互動式單頁原型，讓畫面與展示流程可以快速迭代。',
  'Vite 負責開發與建置流程，維持較輕量的前端原型開發體驗。',
  'Zustand 用來管理畫面、示範流程、報告狀態與註解導引等跨頁狀態。',
  'Framer Motion 負責網站進站動畫、App 啟動動畫與各種示範轉場。',
  'Recharts 呈現語速曲線、歷史趨勢與統計圖表，讓數據展示更接近產品樣貌。',
  '分享卡匯出採專用版型，不用整頁截圖，支援穩定輸出 PNG / SVG。',
]

type ModalTab = 'story' | 'about'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function DesignStoryModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('story')
  const handleClose = useCallback(() => {
    setActiveTab('story')
    onClose()
  }, [onClose])

  // Esc to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
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
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4 px-8 pt-6 pb-4 border-b border-divider flex-shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3.5 rounded-full bg-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple tracking-widest uppercase">
                    {activeTab === 'story' ? 'Design Story' : 'About'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">
                  {activeTab === 'story' ? '為什麼做這個 App？' : '關於這個原型網站'}
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {activeTab === 'story'
                    ? '說來話長 TalkFit — 一個幫你偵測演講贅字與語速的練習工具'
                    : '版本資訊、名稱由來、作者背景與技術實作整理'}
                </p>
              </div>
              <div className="pt-1">
                <div className="rounded-2xl border border-divider bg-bg-surface p-1 flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('story')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      activeTab === 'story'
                        ? 'bg-accent-purple/12 text-accent-purple'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    設計動機
                  </button>
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      activeTab === 'about'
                        ? 'bg-accent-blue/12 text-accent-blue-light'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    關於
                  </button>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="justify-self-end mt-1 w-8 h-8 rounded-full border border-divider text-text-muted hover:text-text-primary hover:border-text-secondary transition-all flex items-center justify-center flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto phone-scroll flex-1 p-6">
              {activeTab === 'story' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

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
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5">
                  <div className="flex flex-col gap-5">
                    {aboutCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-bg-surface rounded-2xl border border-divider px-5 py-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{card.emoji}</span>
                          <h3 className="text-sm font-bold text-text-primary">{card.title}</h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                          {card.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                    <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                      <span className="text-base">🛠️</span>
                      <h3 className="text-sm font-bold text-text-primary">技術細節</h3>
                    </div>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <MetaPill label="React 19" tone="blue" />
                        <MetaPill label="TypeScript" tone="blue" />
                        <MetaPill label="Vite" tone="amber" />
                        <MetaPill label="Zustand" tone="green" />
                        <MetaPill label="Framer Motion" tone="purple" />
                        <MetaPill label="Recharts" tone="orange" />
                      </div>

                      <div className="space-y-2.5">
                        {techDetails.map((detail, index) => (
                          <div key={detail} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-blue/10 text-[10px] font-bold text-accent-blue-light">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-relaxed text-text-secondary">
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-accent-blue/15 bg-accent-blue/6 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-blue-light">
                          關於這個展示網站
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                          這個網站不是單純把 App UI 放上來，而是把示範流程、說明導引、分享卡匯出與互動式註解整合在一起，讓評審或面試官能在短時間內看懂產品價值與設計思路。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex-shrink-0 border-t border-divider px-8 py-3 flex items-center justify-between">
              <p className="text-[11px] text-text-muted">
                說來話長 TalkFit · {activeTab === 'story' ? 'Design Story' : 'About'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-px h-3 bg-divider" />
                <span className="text-xs font-medium text-text-secondary">潘昱如</span>
                <span className="text-[11px] text-text-muted tracking-wide">PAN, YU-RU</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MetaPill({
  label,
  tone,
}: {
  label: string
  tone: 'blue' | 'green' | 'amber' | 'purple' | 'orange'
}) {
  const classes = {
    blue: 'bg-accent-blue/10 text-accent-blue-light',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-accent-amber/12 text-accent-amber',
    purple: 'bg-accent-purple/12 text-accent-purple',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  } as const

  return (
    <div className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${classes[tone]}`}>
      {label}
    </div>
  )
}
