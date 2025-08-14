import React, { useState, useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./App.css";
import { format } from "date-fns-tz";
import _ from "lodash";

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

  // References for Monaco editor instances
  const outputEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);

  // Reference for decorations collection
  const decorationsCollectionRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  // Store the positions of converted timestamps for highlighting
  const [highlightRanges, setHighlightRanges] = useState<monaco.Range[]>([]);

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

  const convertTimestamps = (
    text: string
  ): { text: string; ranges: { start: number; end: number }[] } => {
    if (!text) return { text: "", ranges: [] };

    let result = text;

    // Process millisecond timestamps (13 digits)
    const matches: {
      index: number;
      match: string;
      processor: (match: string) => string;
    }[] = [];

    const addMatches = (
      regexPattern: RegExp,
      processor: (match: string) => string
    ) => {
      let match: RegExpExecArray | null;
      while ((match = regexPattern.exec(text)) !== null) {
        matches.push({ index: match.index, match: match[0], processor });
      }
    };

    addMatches(/(\b\d{13}\b)/g, (match) => convertTimestamp(parseInt(match)));
    addMatches(/(\b\d{10}\b)/g, (match) =>
      convertTimestamp(parseInt(match) * 1000)
    );

    const sortedMatches = _.orderBy(matches, ["index"], ["asc"]);
    const processedRanges: { start: number; end: number }[] = [];
    let offset = 0;

    for (let i = 0; i < sortedMatches.length; i++) {
      const { index, match: matchText, processor } = sortedMatches[i];
      const converted = processor(matchText);

      if (converted !== matchText) {
        result =
          result.substring(0, index + offset) +
          converted +
          result.substring(index + matchText.length + offset);

        processedRanges.push({
          start: index + offset,
          end: index + converted.length + offset,
        });
        offset += converted.length - matchText.length;
      }
    }
    return { text: result, ranges: processedRanges };
  };

  useEffect(() => {
    const result = convertTimestamps(inputText);
    setOutputText(result.text);

    // Convert the ranges to Monaco Range objects
    if (monacoRef.current && outputEditorRef.current) {
      const monaco = monacoRef.current;
      const newRanges = result.ranges.map((range) => {
        const startPos = outputEditorRef
          .current!.getModel()!
          .getPositionAt(range.start);
        const endPos = outputEditorRef
          .current!.getModel()!
          .getPositionAt(range.end);
        return new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        );
      });

      setHighlightRanges(newRanges);
    }
  }, [inputText, selectedTimezone, replaceTimestamp, useJavaFormat]);

  // Apply decorations whenever highlightRanges changes
  useEffect(() => {
    if (outputEditorRef.current && highlightRanges.length > 0) {
      const decorations = highlightRanges.map((range) => ({
        range,
        options: {
          inlineClassName: "timestamp-highlight",
          isWholeLine: false,
        },
      }));

      // Clear previous decorations if they exist
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.clear();
      } else {
        // Create a new decorations collection if it doesn't exist
        decorationsCollectionRef.current =
          outputEditorRef.current.createDecorationsCollection(decorations);
        return;
      }

      // Set new decorations
      decorationsCollectionRef.current.set(decorations);
    }
  }, [highlightRanges, outputText]);

  // Handle Monaco editor initialization
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    outputEditorRef.current = editor;
    monacoRef.current = monaco;

    // Create initial decorations collection
    if (highlightRanges.length > 0) {
      const decorations = highlightRanges.map((range) => ({
        range,
        options: {
          inlineClassName: "timestamp-highlight",
          isWholeLine: false,
        },
      }));
      decorationsCollectionRef.current =
        editor.createDecorationsCollection(decorations);
    }
  };
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
            onMount={handleEditorDidMount}
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
