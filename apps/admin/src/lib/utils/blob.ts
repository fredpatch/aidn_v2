export function openBlobInNewTab(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const targetWindow = window.open("about:blank", "_blank");
  if (!targetWindow) {
    window.alert(
      "Impossible d'ouvrir l'aperçu. Autorisez les fenêtres contextuelles pour consulter le document.",
    );
    URL.revokeObjectURL(url);
    return;
  }
  targetWindow.document.title = fileName;
  targetWindow.location.href = url;
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
