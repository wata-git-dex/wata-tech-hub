(() => {
  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (location.hostname === "app.cleanwata.org" && !installed) {
    location.replace(`https://toolkit.cleanwata.org${location.pathname}${location.search}${location.hash}`);
    return;
  }
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
