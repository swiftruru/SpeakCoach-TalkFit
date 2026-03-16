const fillerCategories = [
  { label: '填充音', words: '嗯、啊、ㄜ', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { label: '連接贅詞', words: '然後、而且、再來', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: '指示贅詞', words: '這個、那個', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: '習慣性開場', words: '老實說、我覺得、其實', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: '習慣性結尾', words: '對不對、是不是、對', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
]

const highlights = [
  { num: '01', text: '不用連網、不燒 token，靠 Apple Intelligence on-device 辨識' },
  { num: '02', text: '觸覺震動即時回饋，不跳通知，不打斷你的 flow' },
  { num: '03', text: 'AI 只負責語音轉文字，其餘偵測與統計都是自己寫的邏輯' },
  { num: '04', text: '歷史紀錄讓進步看得見，比「我覺得有變好」有說服力' },
]

export function DesignStoryPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent-purple" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            設計動機
          </span>
        </div>
        <h2 className="text-base font-semibold text-text-primary leading-snug">
          為什麼做這個 App？
        </h2>
      </div>

      <div className="w-full h-px bg-border-divider flex-shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 phone-scroll">

        {/* App concept section */}
        <div>
          <p className="text-[10px] font-bold text-accent-blue-light uppercase tracking-widest mb-3">
            💡 App 點子
          </p>

          {/* Problem */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-red flex-shrink-0" />
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">想解決的問題</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              練演講時，自己聽不到的壞習慣最難改。「然後」講了三十次、緊張時瘋狂「嗯嗯嗯」——朋友不好意思說，自己錄音回聽又很折磨，多數人上台才發現又犯了。
            </p>
          </div>

          {/* Solution */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">如何解決</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              對著手機練習，App 利用 Apple Intelligence on-device 語音辨識即時分析。贅字太多或語速失控時，輕震提醒。練完生成完整分析報告。
            </p>
          </div>

          {/* Highlights */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">特色亮點</p>
            </div>
            <div className="space-y-1.5">
              {highlights.map(({ num, text }) => (
                <div key={num} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-accent-blue-light bg-accent-blue/10 rounded px-1 py-0.5 flex-shrink-0 mt-0.5 tabular-nums">
                    {num}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filler categories */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">偵測的贅字類型</p>
            </div>
            <div className="space-y-1.5">
              {fillerCategories.map(({ label, words, color }) => (
                <div key={label} className="flex items-start gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${color}`}>
                    {label}
                  </span>
                  <span className="text-[11px] text-text-muted leading-5">{words}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border-divider" />

        {/* Motivation section */}
        <div>
          <p className="text-[10px] font-bold text-accent-blue-light uppercase tracking-widest mb-3">
            🙋 參加動機
          </p>

          {/* Pull quote */}
          <div className="rounded-xl bg-accent-blue/8 border border-accent-blue/20 px-3 py-2.5 mb-3">
            <p className="text-xs text-text-primary leading-relaxed font-medium">
              想接觸 iOS 開發，也很好奇在真正的產品流程裡 AI Coding 是怎麼運作的——這是想參加的最大原因。
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs text-text-secondary leading-relaxed">
              平常主要寫 Web 前端、Python 和 .NET，面對新語言和框架時有一些可以借力的基礎。比較缺的是 iOS 的實戰經驗，還有和其他開發者合作碰撞想法的機會。
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              已經有一個想做的 App 點子（說來話長 TalkFit），很想趁這個機會驗證看看它到底能不能實現。
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              期待 Hackathon 當天認識對 AI 和 App 有熱情的人，在實戰中互相學習。對我來說這不只是學新技術，更像是幫自己打開一個新的可能性。
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0 border-t border-divider">
        <p className="text-[11px] text-text-muted">說來話長 TalkFit · Design Story</p>
      </div>
    </div>
  )
}
