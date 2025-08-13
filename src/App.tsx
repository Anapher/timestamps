import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";
import { format } from "date-fns-tz";

// Timezone types
type TimezoneType = "UTC" | "America/Chicago" | "Europe/Amsterdam";
const SUPPORTED_TIMEZONES: TimezoneType[] = [
  "UTC",
  "America/Chicago",
  "Europe/Amsterdam",
];

const formatTimestamp = (date: Date, timezone: TimezoneType): string => {
  return format(date, "yyyy-MM-dd HH:mm:ssXXX", {
    timeZone: timezone,
  });
};

function App() {
  const [inputText, setInputText] = useState<string>("");
  const [outputText, setOutputText] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] =
    useState<TimezoneType>("America/Chicago");
  const [replaceTimestamp, setReplaceTimestamp] = useState<boolean>(false);

  const convertTimestamp = (match: string) => {
    try {
      const timestamp = parseInt(match, 10);
      const date = new Date(timestamp);

      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() >= 1975 &&
        date.getFullYear() <= 2050
      ) {
        const formattedDate = formatTimestamp(date, selectedTimezone);
        return replaceTimestamp ? formattedDate : `${match} [${formattedDate}]`;
      }
      return match;
    } catch (e) {
      return match;
    }
  };

  const convertTimestamps = (text: string): string => {
    if (!text) return "";

    const msTimestampRegex = /(\b\d{13}\b)/g;
    let processedText = text.replace(msTimestampRegex, (match) => {
      return convertTimestamp(match);
    });

    const secTimestampRegex = /(\b\d{10}\b)/g;
    processedText = processedText.replace(secTimestampRegex, (match) => {
      return convertTimestamp(match);
    });

    return processedText;
  };

  useEffect(() => {
    setOutputText(convertTimestamps(inputText));
  }, [inputText, selectedTimezone, replaceTimestamp]);
  const handleClear = () => {
    setInputText("");
  };

  const handleInsertCurrentTimestamp = () => {
    const now = Date.now();
    const nowInSeconds = Math.floor(now / 1000);
    setInputText((prev) => {
      if (prev) {
        return `${prev}\n\nCurrent Timestamps:\nMilliseconds: ${now}\nSeconds: ${nowInSeconds}`;
      }
      return `Current Timestamps:\nMilliseconds: ${now}\nSeconds: ${nowInSeconds}`;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Timestamp Converter</h1>
        <p>Enter text with Unix timestamps (milliseconds or seconds)</p>
        <div className="timezone-toggle">
          {SUPPORTED_TIMEZONES.map((timezone) => (
            <button
              key={timezone}
              className={`timezone-button ${
                selectedTimezone === timezone ? "active" : ""
              }`}
              onClick={() => setSelectedTimezone(timezone)}
            >
              {timezone}
            </button>
          ))}
        </div>
      </header>
      <div className="controls">
        <button className="control-button" onClick={handleClear}>
          Clear
        </button>
        <button
          className="control-button"
          onClick={handleInsertCurrentTimestamp}
        >
          Insert Current Timestamp
        </button>
        <div className="checkbox-control">
          <input
            type="checkbox"
            id="replace-timestamp"
            checked={replaceTimestamp}
            onChange={(e) => setReplaceTimestamp(e.target.checked)}
          />
          <label htmlFor="replace-timestamp">Replace timestamp</label>
        </div>
      </div>
      <div className="editor-container">
        <div className="editor-wrapper">
          <h2>Input</h2>
          <Editor
            height="300px"
            defaultLanguage="plaintext"
            value={inputText}
            onChange={(value) => setInputText(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
        <div className="editor-wrapper">
          <h2>Output (Converted Timestamps)</h2>
          <Editor
            height="300px"
            defaultLanguage="plaintext"
            value={outputText}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
