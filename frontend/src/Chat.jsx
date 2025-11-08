import React, { useEffect, useRef, useState } from "react";
import answersData from "./answers.json"; // Vite allows importing JSON
import "./styles.css";

/*
  Chat component with:
  - answers loaded from answers.json
  - typing animation
  - speech recognition (voice input)
  - speech synthesis (voice output)
  - settings panel (toggle voice in/out, auto speak, dark mode)
  - export chat to TXT
  - localStorage persistence (chat + settings)
*/

const CHAT_STORAGE = "simplebot_chat_v2";
const SETTINGS_STORAGE = "simplebot_settings_v2";

export default function Chat() {
  const [messages, setMessages] = useState([]); // { text, user: bool, time }
  const [input, setInput] = useState("");
  const [boxPosition, setBoxPosition] = useState("top"); // "top" or "bottom"
  const [isTyping, setIsTyping] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizerAvailable, setRecognizerAvailable] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    voiceInput: true,
    voiceOutput: true,
    autoSpeak: true,
    darkMode: false
  });

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // merge JSON answers (keys lowercased)
  const answers = {};
  Object.keys(answersData).forEach((k) => {
    answers[k.toLowerCase()] = answersData[k];
  });

  // load chat + settings from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(CHAT_STORAGE);
    if (raw) {
      try {
        setMessages(JSON.parse(raw));
      } catch {}
    }
    const rawSet = localStorage.getItem(SETTINGS_STORAGE);
    if (rawSet) {
      try {
        const s = JSON.parse(rawSet);
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.darkMode) document.documentElement.classList.add("dark");
      } catch {}
    }
  }, []);

  // save messages/settings
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE, JSON.stringify(messages));
    // scroll to bottom if bottom-positioned
    if (boxPosition === "bottom") messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, boxPosition]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(settings));
    if (settings.darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [settings]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      setRecognizerAvailable(false);
      return;
    }
    setRecognizerAvailable(true);
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => setRecognizing(true);
    recog.onend = () => setRecognizing(false);
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      // append recognized text to input so user can edit
      setInput((prev) => (prev ? prev + " " + text : text));
    };
    recog.onerror = (err) => {
      console.error("Speech recognition error", err);
      setRecognizing(false);
    };

    recognitionRef.current = recog;
    return () => {
      try { recog.onstart = null; recog.onend = null; recog.onresult = null; } catch {}
    };
  }, []);

  // Utility: normalize user text
  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();

  // compute reply from answers map (exact match first, then contains)
  const computeReply = (text) => {
    const norm = normalize(text);
    if (!norm) return "Sorry, I didn't catch that.";
    // exact
    if (answers[norm]) return answers[norm];
    // contains match
    for (const k of Object.keys(answers)) {
      if (norm.includes(k)) return answers[k];
    }
    // dynamic time/date support
    if (norm === "time") return `Current time is ${new Date().toLocaleTimeString()}`;
    if (norm === "date") return `Today's date is ${new Date().toLocaleDateString()}`;
    return "Sorry, I am a simple bot. I did not understand what you mean.";
  };

  // speak text if allowed
  const speak = (text) => {
    if (!settings.voiceOutput || !settings.autoSpeak) return;
    if (!("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      // optional: choose voice if you want
      window.speechSynthesis.cancel(); // cancel ongoing
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("TTS error", e);
    }
  };

  // send message
  const sendMessage = () => {
    if (!input.trim()) return;
    const text = input.trim();
    const userMsg = { text, user: true, time: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // show toggle after first message
    // Mark typing
    setIsTyping(true);

    const replyText = computeReply(text);

    // delay based on reply length
    const delay = Math.min(1000 + replyText.length * 20, 2400);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg = { text: replyText, user: false, time: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
      // speak if allowed
      if (settings.voiceOutput && settings.autoSpeak) speak(replyText);
    }, delay);
  };

  // toggle recognition
  const toggleRecognition = () => {
    const recog = recognitionRef.current;
    if (!recog) return;
    if (recognizing) {
      recog.stop();
    } else {
      try {
        recog.start();
      } catch (e) {
        console.error("recognition start failed", e);
      }
    }
  };

  // export chat to TXT
  const exportChat = () => {
    const lines = messages.map((m) => {
      const who = m.user ? "You" : "Bot";
      const time = m.time ? new Date(m.time).toLocaleString() : "";
      return `[${time}] ${who}: ${m.text}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // clear chat
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_STORAGE);
  };

  // small helper to toggle settings
  const toggleSetting = (key) => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  // keyboard shortcut: Ctrl+K open settings
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="chat-container-centered">
      <div className="chat-box">
        <div className="chat-header">
          <div className="title">SIMPLE CHATBOT</div>

          <div className="header-actions">
            <button
              className="small"
              title="Export chat to text file"
              onClick={exportChat}
            >
              Export
            </button>

            <button
              className="small"
              title="Clear chat"
              onClick={clearChat}
            >
              Clear
            </button>

            <button
              className="small"
              onClick={() => setSettingsOpen((v) => !v)}
              title="Open settings (Ctrl+K)"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Top Input */}
        {boxPosition === "top" && (
          <div className="input-wrapper">
  <input
    value={input}
    placeholder="Message..."
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") sendMessage();
    }}
  />

  <button
    className={`mic-inside ${recognizing ? "rec" : ""}`}
    onClick={toggleRecognition}
    disabled={!recognizerAvailable || !settings.voiceInput}
    title="Voice input"
  >
    🎤
  </button>

  <button className="send-arrow" onClick={sendMessage}>
    ➤
  </button>
</div>

        )}

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !isTyping && (
            <div className="center-placeholder">Start the conversation…</div>
          )}

          {isTyping && (
  <div className="typing-row">
    <img src="/robot.jpg" className="avatar" alt="bot" />
    <div className="typing">
      <span className="dot" />
      <span className="dot delay" />
      <span className="dot delay2" />
    </div>
  </div>
)}


          {messages.map((m, idx) => (
            <div
              className={`msg-row ${m.user ? "user" : "bot"}`}
              key={(m.time || idx) + "-" + idx}
            >
              {!m.user && <img src="/robot.jpg" className="avatar" alt="bot" />}
              <div className={`msg-bubble ${m.user ? "user-bubble" : "bot-bubble"}`}>
                {m.text}
              </div>
              {m.user && <img src="/user.jpg" className="avatar" alt="you" />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input */}
        {boxPosition === "bottom" && (
          <div className="input-row bottom">
            <input
              value={input}
              placeholder="Send a message to SimpleBot"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>

            <button
              className={`mic-btn ${recognizing ? "rec" : ""}`}
              onClick={toggleRecognition}
              disabled={!recognizerAvailable || !settings.voiceInput}
            >
              {recognizing ? "●" : "🎤"}
            </button>
          </div>
        )}

        {/* Move textbox toggle */}
        <div className="move-link-row">
          <button
            className="toggle-position"
            onClick={() => setBoxPosition((p) => (p === "top" ? "bottom" : "top"))}
          >
            {boxPosition === "top" ? "Move textbox to bottom" : "Move textbox to top"}
          </button>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <div className="settings-panel">
            <h4>Settings</h4>
            <label>
              <input
                type="checkbox"
                checked={settings.voiceInput}
                onChange={() => toggleSetting("voiceInput")}
              />{" "}
              Voice input (mic)
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.voiceOutput}
                onChange={() => toggleSetting("voiceOutput")}
              />{" "}
              Voice output (TTS)
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={() => toggleSetting("autoSpeak")}
              />{" "}
              Auto-speak bot replies
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={() => toggleSetting("darkMode")}
              />{" "}
              Dark mode
            </label>
            <div style={{ marginTop: 8 }}>
              <small>Tip: Press <strong>Ctrl/Cmd + K</strong> to open settings.</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
