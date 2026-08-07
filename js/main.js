// ============================================================
// Comportamentos gerais do site (menu mobile + abas de programação)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Menu mobile
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Abas de programação (Dia 1 / Dia 2 / Dia 3)
  const tabs = document.querySelectorAll(".prog-tab");
  const panels = document.querySelectorAll(".prog-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-target");

      tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
      tab.setAttribute("aria-selected", "true");

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.id === target);
      });
    });
  });

  // Preenche valor da inscrição em qualquer lugar do site com [data-preco]
  document.querySelectorAll("[data-preco]").forEach((el) => {
    el.textContent = CONFIG.inscricao.valorFormatado;
  });
});
