(function () {
  "use strict";

  var WA_NUMBER = "56926225041";
  var DEFAULT_MESSAGE = "Hola Celius Climatización, necesito orientación para un aire acondicionado.";

  // GA4 — un solo lugar. Si GTM (GTM-PGPFPL8M) también dispara GA4 al mismo ID, quita uno para no duplicar pageviews.
  var GA_MEASUREMENT_ID = "G-91S6S167R1";

  function pageSource() {
    return document.body.getAttribute("data-page") || window.location.pathname;
  }

  function whatsappUrl(message, source) {
    var leadMessage = (message || DEFAULT_MESSAGE) + "\n\nOrigen: " + (source || pageSource());
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(leadMessage);
  }

  function trackEvent(name, params) {
    var payload = Object.assign({ event: name }, params || {});
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  function initAnalytics() {
    if (!GA_MEASUREMENT_ID) return;
    if (typeof window.gtag === "function") return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function isWhatsAppHref(href) {
    if (!href) return false;
    return /wa\.me\/|api\.whatsapp\.com/i.test(href);
  }

  function bindWhatsApp() {
    var links = document.querySelectorAll("[data-wa]");
    for (var i = 0; i < links.length; i++) {
      (function (link) {
        var message = link.getAttribute("data-wa-msg") || DEFAULT_MESSAGE;
        var source = link.getAttribute("data-wa-source") || pageSource();
        link.setAttribute("href", whatsappUrl(message, source));
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        link.addEventListener("click", function () {
          trackEvent("click_whatsapp", {
            link_url: link.getAttribute("href") || "",
            lead_source: link.getAttribute("data-wa-source") || pageSource()
          });
        });
      })(links[i]);
    }
  }

  function bindPhoneClicks() {
    var links = document.querySelectorAll('a[href^="tel:"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        trackEvent("phone_click", {
          link_url: this.getAttribute("href") || "",
          lead_source: pageSource()
        });
      });
    }
  }

  function bindWhatsAppFallbacks() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var link = target.closest("a[href]");
      if (!link || link.hasAttribute("data-wa")) return;
      if (!isWhatsAppHref(link.getAttribute("href"))) return;
      trackEvent("click_whatsapp", {
        link_url: link.getAttribute("href") || "",
        lead_source: pageSource()
      });
    });
  }

  function bindLeadForms() {
    var forms = document.querySelectorAll("form[data-lead-form], form#contacto, form#cotizacion, form.contact-form, form.cotizacion-form");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", function () {
        trackEvent("generate_lead", {
          method: "form",
          form_id: this.id || this.getAttribute("name") || "contact_form",
          lead_source: pageSource()
        });
      });
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

  initAnalytics();
  bindWhatsApp();
  bindWhatsAppFallbacks();
  bindPhoneClicks();
  bindLeadForms();
})();
