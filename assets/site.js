(function () {
  "use strict";

  var WA_NUMBER = "56926225041";
  var DEFAULT_MESSAGE = "Hola Celius Climatización, necesito orientación para un aire acondicionado.";

  // GA4 — un solo lugar. Si GTM (GTM-PGPFPL8M) también dispara GA4 al mismo ID, quita uno para no duplicar pageviews.
  var GA_MEASUREMENT_ID = "G-91S6S167R1";

  function pageSource() {
    return document.body.getAttribute("data-page") || window.location.pathname;
  }

  function pageLocation() {
    return window.location.href;
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
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[celius-analytics]", name, params || {});
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
          var liveMessage = link.getAttribute("data-wa-msg") || DEFAULT_MESSAGE;
          var liveSource = link.getAttribute("data-wa-source") || pageSource();
          var href = whatsappUrl(liveMessage, liveSource);
          link.setAttribute("href", href);
          trackEvent("click_whatsapp", {
            wa_source: liveSource,
            page_location: pageLocation(),
            link_url: href
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
          page_location: pageLocation(),
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
        wa_source: pageSource(),
        page_location: pageLocation(),
        link_url: link.getAttribute("href") || ""
      });
    });
  }

  function bindGmb() {
    var links = document.querySelectorAll("[data-gmb]");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        trackEvent("click_gmb_profile", {
          gmb_source: this.getAttribute("data-gmb-source") || pageSource(),
          page_location: pageLocation(),
          link_url: this.getAttribute("href") || ""
        });
      });
    }
  }

  function initBtuCalculator() {
    var form = document.getElementById("btu-form");
    if (!form) return;

    var m2Input = document.getElementById("btu-m2");
    var wa = document.getElementById("btu-wa");
    var lastKey = "";
    // Orientación para el valle de Cachapoal, no un cálculo NCh ni Manual J.
    // El poniente y el cielo alto pesan más porque el verano local supera los 33 °C.
    var base = { dormitorio: 560, living: 680, oficina: 780 };
    var solarFactor = { sombra: 0.86, normal: 1, sol: 1.3 };
    var heightFactor = { estandar: 1, alta: 1.2 };
    var roomLabel = { dormitorio: "Dormitorio", living: "Living-comedor", oficina: "Oficina o local" };
    var solarLabel = {
      sombra: "sombra u orientación sur",
      normal: "exposición normal",
      sol: "sol de poniente o bajo techumbre"
    };
    var heightLabel = { estandar: "cielo cercano a 2,4 m", alta: "cielo alto o doble altura" };

    function snap(raw) {
      if (raw <= 8500) return { label: "9.000 BTU", range: "9.000 BTU", code: "9000", note: "Alcanza para un dormitorio chico, sin sol directo de poniente." };
      if (raw <= 11500) return { label: "12.000 BTU", range: "9.000 a 12.000 BTU", code: "12000", note: "Es el salto habitual cuando la pieza es amplia o hay más de una persona." };
      if (raw <= 16500) return { label: "18.000 BTU", range: "12.000 a 18.000 BTU", code: "18000", note: "Cubre un living o estar familiar en el valle de Cachapoal." };
      if (raw <= 23000) return { label: "24.000 BTU", range: "18.000 a 24.000 BTU", code: "24000", note: "Corresponde a un living grande, un local o un recinto con mucha carga solar." };
      return { label: "Más de un equipo", range: "evaluación multisplit o comercial", code: "multi", note: "Un solo split muro se queda corto. Conviene repartir la carga en dos equipos o revisar un sistema mayor." };
    }

    function render() {
      var m2 = parseFloat(String(m2Input.value).replace(",", "."));
      var room = form.recinto.value;
      var solar = form.exposicion.value;
      var height = form.altura.value;
      var comuna = form.comuna.value;
      var equipo = form.equipo.value;
      var figure = document.getElementById("btu-label");
      var rawEl = document.getElementById("btu-raw");
      var note = document.getElementById("btu-note");

      if (!m2 || m2 < 6 || m2 > 180) {
        figure.textContent = "Ingresa la superficie";
        rawEl.textContent = "Usa entre 6 y 180 m². Es una orientación, no reemplaza la visita del técnico.";
        note.textContent = "Con los metros, el uso del recinto y el sol, la calculadora propone una capacidad comercial Inverter frío/calor.";
        wa.hidden = true;
        return;
      }

      var raw = m2 * base[room] * solarFactor[solar] * heightFactor[height];
      var rec = snap(raw);
      var rounded = Math.round(raw / 100) * 100;
      figure.textContent = rec.label;
      rawEl.textContent = "Carga estimada: " + rounded.toLocaleString("es-CL") + " BTU";
      note.textContent = rec.note + " Un Inverter frío/calor también calefacciona en invierno. La visita confirma drenaje, muro y punto eléctrico.";
      var equipoTxt = equipo === "tengo"
        ? "Ya tengo el equipo y quiero cotizar instalación o revisión."
        : "Busco equipo e instalación.";
      var msg = "Hola Celius Climatización, usé la calculadora BTU.\n"
        + "Comuna: " + comuna + "\n"
        + "Recinto: " + roomLabel[room] + ", " + String(m2).replace(".", ",") + " m², " + heightLabel[height] + ", " + solarLabel[solar] + ".\n"
        + "Carga estimada: " + rounded.toLocaleString("es-CL") + " BTU.\n"
        + "Recomendación: " + rec.range + " Inverter frío/calor.\n"
        + equipoTxt + "\nQuiero cotizar.";
      wa.setAttribute("data-wa-msg", msg);
      wa.hidden = false;
      wa.setAttribute("href", whatsappUrl(msg, "calculadora-btu"));

      var key = rec.code + "|" + comuna + "|" + room + "|" + solar + "|" + height;
      if (key === lastKey) return;
      lastKey = key;
      trackEvent("use_btu_calculator", {
        btu_m2: m2,
        btu_room: room,
        btu_solar: solar,
        btu_height: height,
        btu_comuna: comuna,
        btu_recommendation: rec.code,
        page_location: pageLocation()
      });
    }

    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render();
    });
  }

  function bindLeadForms() {
    var forms = document.querySelectorAll("form[data-lead-form], form#contacto, form#cotizacion, form.contact-form, form.cotizacion-form");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", function () {
        trackEvent("generate_lead", {
          method: "form",
          form_id: this.id || this.getAttribute("name") || "contact_form",
          page_location: pageLocation(),
          lead_source: pageSource()
        });
        trackEvent("form_submit", {
          method: "form",
          form_id: this.id || this.getAttribute("name") || "contact_form",
          page_location: pageLocation()
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
  bindGmb();
  bindLeadForms();
  initBtuCalculator();
})();
