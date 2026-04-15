import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { vscodeLight } from '@uiw/codemirror-theme-vscode'
import { useState } from 'react'

const languages = {
  javascript: javascript(),
  python: python(),
  java: java(),
  cpp: cpp(),
}

function Editor() {
  const [code, setCode] = useState('// start coding here...')
  const [language, setLanguage] = useState('javascript')

  return (
    <div className="flex h-screen bg-gray-900 text-white">

      {/* Left sidebar */}
      <div className="w-48 bg-gray-800 p-4 flex flex-col gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">File</p>
        <p className="text-sm text-white">main.js</p>
      </div>

      {/* Main editor area */}
      <div className="flex flex-col flex-1">

        {/* Top bar with language dropdown */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-gray-400">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {/* The actual code editor */}
        <div className="flex-1">
          <CodeMirror
            value={code}
            height="100%"
            theme={vscodeLight}
            extensions={[languages[language]]}
            onChange={(val) => setCode(val)}
          />
        </div>
      </div>

      {/* Right panel (empty for now) */}
      <div className="w-48 bg-gray-800 p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Panel</p>
      </div>

    </div>
  )
}

export default Editor