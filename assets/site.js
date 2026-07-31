(function () {
  "use strict";

  var WA_NUMBER = "56926225041";
  var DEFAULT_MESSAGE = "Hola Celius Climatización, necesito orientación para un aire acondicionado.";

  function pageSource() {
    return document.body.getAttribute("data-page") || window.location.pathname;
  }

  function whatsappUrl(message, source) {
    var leadMessage = (message || DEFAULT_MESSAGE) + "\n\nOrigen: " + (source || pageSource());
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(leadMessage);
  }

  function trackLead(link) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "generate_lead", {
      method: "WhatsApp",
      lead_source: link.getAttribute("data-wa-source") || pageSource()
    });
  }

  function bindWhatsApp() {
    var links = document.querySelectorAll("[data-wa]");
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var message = link.getAttribute("data-wa-msg") || DEFAULT_MESSAGE;
      var source = link.getAttribute("data-wa-source") || pageSource();
      link.setAttribute("href", whatsappUrl(message, source));
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.addEventListener("click", function () { trackLead(this); });
    }
  }

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
      nav.classList.toggle("is-open", !isOpen);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.tagName !== "A") return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      nav.classList.remove("is-open");
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add("is-in");
        observer.unobserve(entries[i].target);
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    for (var r = 0; r < revealItems.length; r++) observer.observe(revealItems[r]);
  } else {
    for (var j = 0; j < revealItems.length; j++) revealItems[j].classList.add("is-in");
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  bindWhatsApp();
})();
