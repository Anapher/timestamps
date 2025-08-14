import { useState, useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./App.css";
import { format } from "date-fns-tz";
import _ from "lodash";
import { computeMonacoEdits } from "./text-utils";

type TimezoneType = "UTC" | "America/Chicago" | "Europe/Amsterdam";
type AppState = {
  inputText: string;
  replaceTimestamp: boolean;
  useJavaFormat: boolean;
  selectedTimezone: TimezoneType;
};

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

const APP_STATE_STORAGE_KEY = "timestamp-converter-app-state";
const debouncedStoreAppState = _.debounce((state: AppState) => {
  try {
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}, 1000);

const loadStateFromStorage = (): AppState => {
  try {
    const savedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState) as AppState;
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
  }

  return {
    inputText: "",
    replaceTimestamp: false,
    useJavaFormat: false,
    selectedTimezone: "America/Chicago",
  };
};

function App() {
  const [appState, setAppState] = useState<AppState>(loadStateFromStorage);
  useEffect(() => {
    debouncedStoreAppState(appState);
  }, [appState]);

  const outputEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<Monaco | null>(null);

  const decorationsCollectionRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

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
        if (appState.useJavaFormat) {
          formattedDate = format(
            date,
            "yyyy-MM-dd'T'HH:mm:ssXXX['" + appState.selectedTimezone + "']",
            {
              timeZone: appState.selectedTimezone,
            }
          );
        } else {
          formattedDate = formatTimestamp(date, appState.selectedTimezone);
        }
        return appState.replaceTimestamp
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

  const updateOutput = () => {
    const editor = outputEditorRef.current?.getModel();

    if (editor) {
      const result = convertTimestamps(appState.inputText);
      const oldText = editor.getValue();
      const newText = result.text;
      const edits = computeMonacoEdits(oldText, newText, editor);
      if (edits.length > 0) {
        editor.applyEdits(edits);
      }

      const newRanges = result.ranges.map((range) => {
        const startPos = editor.getPositionAt(range.start);
        const endPos = editor.getPositionAt(range.end);
        return new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        );
      });
      setHighlightRanges(newRanges);
    }
  };

  useEffect(() => {
    updateOutput();
  }, [
    appState.inputText,
    appState.selectedTimezone,
    appState.replaceTimestamp,
    appState.useJavaFormat,
  ]);

  // Apply decorations whenever highlightRanges changes
  useEffect(() => {
    if (outputEditorRef.current) {
      const decorations = highlightRanges.map((range) => ({
        range,
        options: {
          inlineClassName: "timestamp-highlight",
          isWholeLine: false,
        },
      }));

      // Clear previous decorations if they exist
      if (decorationsCollectionRef.current) {
        decorationsCollectionRef.current.set(decorations);
      } else {
        // Create a new decorations collection if it doesn't exist
        decorationsCollectionRef.current =
          outputEditorRef.current.createDecorationsCollection(decorations);
        return;
      }

      // Set new decorations
    }
  }, [highlightRanges]);

  // Handle Monaco editor initialization
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    outputEditorRef.current = editor;
    monacoRef.current = monaco;

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

    updateOutput();
  };
  const handleClear = () => {
    setAppState({
      ...appState,
      inputText: "",
    });
  };

  const handleInsertCurrentTimestamp = () => {
    const now = Date.now();
    const nowInSeconds = Math.floor(now / 1000);
    setAppState({
      ...appState,
      inputText: `${appState.inputText}\n\nCurrent Timestamps:\nMilliseconds: ${now}\nSeconds: ${nowInSeconds}`,
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
                appState.selectedTimezone === timezone ? "active" : ""
              }`}
              onClick={() =>
                setAppState({ ...appState, selectedTimezone: timezone })
              }
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
              checked={appState.replaceTimestamp}
              onChange={(e) =>
                setAppState({ ...appState, replaceTimestamp: e.target.checked })
              }
            />
            <label htmlFor="replace-timestamp">Replace timestamp</label>
          </div>
          <div className="checkbox-control">
            <input
              type="checkbox"
              id="java-format"
              checked={appState.useJavaFormat}
              onChange={(e) =>
                setAppState({ ...appState, useJavaFormat: e.target.checked })
              }
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
            value={appState.inputText}
            onChange={(value) =>
              setAppState({ ...appState, inputText: value || "" })
            }
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
