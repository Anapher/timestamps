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
  const [useJavaFormat, setUseJavaFormat] = useState<boolean>(false);

  const convertTimestamp = (timestamp: number) => {
    try {
      const date = new Date(timestamp);

      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() >= 1975 &&
        date.getFullYear() <= 2050
      ) {
        let formattedDate;
        if (useJavaFormat) {
          formattedDate = format(
            date,
            "yyyy-MM-dd'T'HH:mm:ssXXX['" + selectedTimezone + "']",
            {
              timeZone: selectedTimezone,
            }
          );
        } else {
          formattedDate = formatTimestamp(date, selectedTimezone);
        }
        return replaceTimestamp
          ? formattedDate
          : `${timestamp} [${formattedDate}]`;
      }
      return timestamp.toString();
    } catch (e) {
      return timestamp.toString();
    }
  };

  const convertTimestamps = (text: string): string => {
    if (!text) return "";

    const msTimestampRegex = /(\b\d{13}\b)/g;
    let processedText = text.replace(msTimestampRegex, (match) => {
      return convertTimestamp(parseInt(match));
    });

    const secTimestampRegex = /(\b\d{10}\b)/g;
    processedText = processedText.replace(secTimestampRegex, (match) => {
      return convertTimestamp(parseInt(match) * 1000);
    });

    return processedText;
  };

  useEffect(() => {
    setOutputText(convertTimestamps(inputText));
  }, [inputText, selectedTimezone, replaceTimestamp, useJavaFormat]);
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
        <div>
          <button className="control-button" onClick={handleClear}>
            Clear
          </button>
          <button
            className="control-button"
            onClick={handleInsertCurrentTimestamp}
          >
            Insert Current Timestamp
          </button>
        </div>
        <div className="checkbox-controls">
          <div className="checkbox-control">
            <input
              type="checkbox"
              id="replace-timestamp"
              checked={replaceTimestamp}
              onChange={(e) => setReplaceTimestamp(e.target.checked)}
            />
            <label htmlFor="replace-timestamp">Replace timestamp</label>
          </div>
          <div className="checkbox-control">
            <input
              type="checkbox"
              id="java-format"
              checked={useJavaFormat}
              onChange={(e) => setUseJavaFormat(e.target.checked)}
            />
            <label htmlFor="java-format">Use Java datetime format</label>
          </div>
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
