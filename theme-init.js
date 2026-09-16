(() => {
  try {
    const saved = localStorage.getItem("wata-theme");
    const accent = localStorage.getItem("wata-accent");
    const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = saved || (systemDark ? "dark" : "light");
    document.documentElement.dataset.accent = accent || "cyan";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
