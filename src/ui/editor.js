const Ace = window.ace;

export function createEditor({ rootId = "editor", defaultCode, onDebugError }) {
  let getValue = () => defaultCode;

  if (!Ace) {
    const fallback = document.createElement("textarea");
    fallback.value = defaultCode;
    fallback.style.width = "100%";
    fallback.style.height = "100%";
    fallback.style.border = "none";
    fallback.style.padding = "12px";
    fallback.style.resize = "none";
    fallback.style.fontFamily = "Consolas, monospace";
    document.querySelector(`#${rootId}`).appendChild(fallback);
    getValue = () => fallback.value;
    onDebugError("Ace nao carregou. Editor em modo fallback (textarea).");

    return { getValue };
  }

  const aceEditor = Ace.edit(rootId);
  aceEditor.setTheme("ace/theme/textmate");
  aceEditor.session.setMode("ace/mode/javascript");
  aceEditor.setOptions({
    fontSize: "14px", // fonte do editor
    showPrintMargin: false, // desativa a linha vertical de 80 caracteres
    useWorker: false,
    tabSize: 2,
  });
  aceEditor.session.setUseSoftTabs(true);
  aceEditor.setValue(defaultCode, -1);
  getValue = () => aceEditor.getValue();

  return { getValue };
}
