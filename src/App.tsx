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

  // Function to format date based on selected timezone

  // Function to detect and convert Unix timestamps
  const convertTimestamps = (text: string): string => {
    if (!text) return "";

    // Process the text in two passes - first for millisecond timestamps, then for second timestamps

    // Regular expression to match Unix millisecond timestamps (13 digits)
    const msTimestampRegex = /(\b\d{13}\b)/g;

    // First pass - convert millisecond timestamps
    let processedText = text.replace(msTimestampRegex, (match) => {
      try {
        const timestamp = parseInt(match, 10);
        const date = new Date(timestamp);

        // Check if the date is valid and within reasonable range (1975-2050)
        if (
          !isNaN(date.getTime()) &&
          date.getFullYear() >= 1975 &&
          date.getFullYear() <= 2050
        ) {
          // Format based on selected timezone
          const formattedDate = formatTimestamp(date, selectedTimezone);
          return `${match} [${formattedDate}]`;
        }
        return match; // Return original if not a valid timestamp or out of range
      } catch (e) {
        return match; // Return original on error
      }
    });

    // Regular expression to match Unix second timestamps (10 digits)
    const secTimestampRegex = /(\b\d{10}\b)/g;

    // Second pass - convert second timestamps
    processedText = processedText.replace(secTimestampRegex, (match) => {
      try {
        const timestamp = parseInt(match, 10) * 1000; // Convert seconds to milliseconds
        const date = new Date(timestamp);

        // Check if the date is valid and within reasonable range (1975-2050)
        if (
          !isNaN(date.getTime()) &&
          date.getFullYear() >= 1975 &&
          date.getFullYear() <= 2050
        ) {
          // Format based on selected timezone
          const formattedDate = formatTimestamp(date, selectedTimezone);
          return `${match} [${formattedDate}]`;
        }
        return match; // Return original if not a valid timestamp or out of range
      } catch (e) {
        return match; // Return original on error
      }
    });

    return processedText;
  };

  // Update output text whenever input text changes or timezone changes
  useEffect(() => {
    setOutputText(convertTimestamps(inputText));
  }, [inputText, selectedTimezone]);

  // Handle clear button click
  const handleClear = () => {
    setInputText("");
  };

  // Generate current timestamp
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
