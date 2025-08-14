import * as monaco from "monaco-editor";
import { diff_match_patch, Diff } from "diff-match-patch";

export function computeMonacoEdits(
  oldText: string,
  newText: string,
  model: monaco.editor.ITextModel
): monaco.editor.IIdentifiedSingleEditOperation[] {
  const dmp = new diff_match_patch();
  const diffs: Diff[] = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupEfficiency(diffs);

  const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
  let index = 0;

  for (const [op, text] of diffs) {
    if (op === 0) {
      // EQUAL
      index += text.length;
    } else if (op === -1) {
      // DELETE
      const start = model.getPositionAt(index);
      const end = model.getPositionAt(index + text.length);
      edits.push({
        range: new monaco.Range(
          start.lineNumber,
          start.column,
          end.lineNumber,
          end.column
        ),
        text: "",
      });
      index += text.length;
    } else if (op === 1) {
      // INSERT
      const pos = model.getPositionAt(index);
      edits.push({
        range: new monaco.Range(
          pos.lineNumber,
          pos.column,
          pos.lineNumber,
          pos.column
        ),
        text: text,
      });
    }
  }

  return edits;
}
