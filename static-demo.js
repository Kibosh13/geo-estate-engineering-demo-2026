(() => {
  if (window.__geoLandingStaticDemo) return;
  window.__geoLandingStaticDemo = true;

  const cmsText = (value) => typeof value === "string" ? value.trim() : "";
  const safeHref = (value, protocols = ["https:", "http:"]) => {
    try {
      const url = new URL(value, window.location.origin);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  const updatePublicContent = async () => {
    try {
      const response = await fetch("/cms/public-data.php", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) return;
      const content = await response.json();
      const settings = content.settings || {};

      const companyName = cmsText(settings.companyName);
      if (companyName) document.querySelectorAll("[data-cms-company]").forEach((node) => { node.textContent = companyName; });

      const contacts = [
        ["phone", cmsText(settings.phone), settings.phone ? `tel:${String(settings.phone).replace(/[^+\d]/g, "")}` : ""],
        ["email", cmsText(settings.email), settings.email ? `mailto:${settings.email}` : ""],
        ["telegram", "Telegram ↗", safeHref(settings.telegram)],
        ["whatsapp", "WhatsApp ↗", safeHref(settings.whatsapp)],
      ].filter(([, label, href]) => label && href && label !== "Телефон" && label !== "Email");

      document.querySelectorAll("[data-cms-contacts]").forEach((container) => {
        container.replaceChildren(...contacts.map(([kind, label, href]) => {
          const link = document.createElement("a");
          link.dataset.cmsContact = kind;
          link.href = href;
          link.textContent = label;
          if (kind === "telegram" || kind === "whatsapp") { link.target = "_blank"; link.rel = "noreferrer"; }
          return link;
        }));
      });

      document.querySelectorAll(".contactBody").forEach((body) => {
        let direct = body.querySelector("[data-cms-contact-direct]");
        if (!direct && contacts.length) {
          direct = document.createElement("div");
          direct.className = "contactDirect";
          direct.dataset.cmsContactDirect = "";
          const form = body.querySelector(".leadForm, .formSuccess");
          body.insertBefore(direct, form || null);
        }
        if (direct) direct.replaceChildren(...contacts.map(([, label, href]) => {
          const link = document.createElement("a"); link.href = href; link.textContent = label; return link;
        }));
      });

      const media = content.media || {};
      document.querySelectorAll("[data-cms-media]").forEach((image) => {
        const item = media[image.dataset.cmsMedia];
        if (!item) return;
        const src = safeHref(item.src);
        if (src) image.src = src;
        if (cmsText(item.alt)) image.alt = cmsText(item.alt);
      });

      const gallery = document.querySelector("[data-cms-works]");
      const works = Array.isArray(content.works) ? content.works.filter((work) => work && work.published !== false) : [];
      if (gallery && works.length) {
        gallery.replaceChildren(...works.map((work, index) => {
          const card = document.createElement("article");
          card.className = index === 0 || index === 3 ? "workCard workCard--wide" : "workCard";
          const figure = document.createElement("figure");
          const image = document.createElement("img");
          image.src = safeHref(work.image) || "/geo-estate-engineering-demo-2026/images/process-quality.webp";
          image.alt = cmsText(work.imageAlt) || cmsText(work.title);
          image.loading = index < 2 ? "eager" : "lazy";
          figure.append(image);
          const copy = document.createElement("div");
          const number = document.createElement("span"); number.textContent = String(index + 1).padStart(2, "0");
          const title = document.createElement("h2"); title.textContent = cmsText(work.title);
          const description = document.createElement("p"); description.textContent = [work.category, work.location, work.description].map(cmsText).filter(Boolean).join(" · ");
          copy.append(number, title, description); card.append(figure, copy); return card;
        }));
        const count = document.querySelector("[data-cms-works-count]");
        if (count) count.textContent = `Опубликовано объектов: ${works.length}`;
      }
    } catch {
      // The public site remains fully usable with its built-in content.
    }
  };

  const cmsHosts = new Set(["xn--80akoiirheb4bh3c.xn--p1ai", "участокмечты.рф", "rinmos.beget.tech", "localhost", "127.0.0.1"]);
  if (cmsHosts.has(window.location.hostname)) updatePublicContent();

  const hotspotSelector = ".hotspot, .serviceHotspot";
  const triggerSelector = ".hotspotTrigger, .serviceHotspotTrigger";

  const clearHotspots = (except) => {
    document.querySelectorAll(hotspotSelector).forEach((hotspot) => {
      if (hotspot === except) return;
      hotspot.classList.remove("isActive");
      hotspot.querySelector(triggerSelector)?.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".mobileHotspotCard, .serviceMobileCard").forEach((card) => card.remove());
  };

  const createMobileCard = (hotspot) => {
    const isService = hotspot.classList.contains("serviceHotspot");
    const source = hotspot.querySelector(isService ? ".serviceHotspotCard" : ".hotspotCard");
    const scene = hotspot.closest(isService ? ".serviceScene" : ".interactiveScene");
    if (!source || !scene) return;

    const card = document.createElement("div");
    card.className = isService ? "serviceMobileCard" : "mobileHotspotCard";
    card.setAttribute("role", "status");

    const close = document.createElement("button");
    close.type = "button";
    close.dataset.staticHotspotClose = "true";
    close.setAttribute("aria-label", "Закрыть");
    close.textContent = "×";

    const index = document.createElement(isService ? "small" : "span");
    index.textContent = isService
      ? source.querySelector("small")?.textContent ?? "Узел"
      : `${hotspot.querySelector(".hotspotDot")?.textContent ?? ""} / 08`;

    const title = document.createElement("b");
    title.textContent = source.querySelector("b")?.textContent ?? "Подробнее";

    const text = document.createElement("p");
    text.textContent = source.querySelector("span")?.textContent ?? "";

    const link = document.createElement("a");
    link.href = source.querySelector("a")?.getAttribute("href") ?? "#contact";
    link.textContent = isService ? "Обсудить узел ↗" : "Подробнее об услуге ↗";

    card.append(close, index, title, text, link);
    scene.append(card);
  };

  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-static-hotspot-close]");
    if (close) {
      const scene = close.closest(".interactiveScene, .serviceScene");
      scene?.querySelector(".isActive")?.classList.remove("isActive");
      close.parentElement?.remove();
      return;
    }

    const trigger = event.target.closest(triggerSelector);
    if (!trigger) return;
    const hotspot = trigger.closest(hotspotSelector);
    if (!hotspot) return;

    const activate = !hotspot.classList.contains("isActive");
    clearHotspots(hotspot);
    hotspot.classList.toggle("isActive", activate);
    trigger.setAttribute("aria-expanded", String(activate));
    if (activate) createMobileCard(hotspot);
  });

  const heroScene = document.querySelector(".engineeringSequence");
  const heroStage = heroScene?.closest(".heroSequenceStage");
  const heroFrames = heroScene ? Array.from(heroScene.querySelectorAll(".heroSequenceFrame")) : [];
  const heroCounters = heroScene ? Array.from(heroScene.querySelectorAll(".heroSequenceStep")) : [];
  const heroCaptionNumber = heroScene?.querySelector(".heroSequenceCaption span");
  const heroCaptionTitle = heroScene?.querySelector(".heroSequenceCaption b");
  const heroGiftBadge = heroScene?.querySelector(".heroGiftBadge");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentHeroFrame = -1;
  let heroAnimationRequest = 0;

  const setHeroFrame = (requestedFrame, progress = 0) => {
    if (!heroScene || !heroStage || !heroFrames.length) return;
    const nextFrame = Math.min(heroFrames.length - 1, Math.max(0, requestedFrame));
    heroScene.style.setProperty("--hero-sequence-progress", String(progress));
    heroStage.dataset.sequenceFrame = String(nextFrame);
    if (nextFrame === currentHeroFrame) return;
    currentHeroFrame = nextFrame;

    heroFrames.forEach((frame, index) => {
      frame.classList.toggle("isActive", index === nextFrame);
      frame.setAttribute("aria-hidden", String(index !== nextFrame));
    });
    heroCounters.forEach((counter, index) => {
      counter.classList.toggle("isActive", index === nextFrame);
      counter.classList.toggle("isNextCue", index === nextFrame + 1);
      counter.setAttribute("aria-pressed", String(index === nextFrame));
    });
    heroGiftBadge?.classList.toggle("isVisible", nextFrame === 0);
    heroGiftBadge?.setAttribute("aria-hidden", String(nextFrame !== 0));

    const activeFrame = heroFrames[nextFrame];
    if (heroCaptionNumber) heroCaptionNumber.textContent = `${activeFrame.dataset.sequenceNum ?? "01"} / 08`;
    if (heroCaptionTitle) heroCaptionTitle.textContent = activeFrame.dataset.sequenceTitle ?? "Геодезия участка";
  };

  const updateHeroSequence = () => {
    heroAnimationRequest = 0;
    if (!heroScene || !heroStage || !heroFrames.length) return;
    if (reducedMotion.matches || window.innerWidth <= 720) {
      if (currentHeroFrame < 0) setHeroFrame(0, 0);
      return;
    }

    const stickyOffset = 98;
    const stageRect = heroStage.getBoundingClientRect();
    const travel = Math.max(heroStage.offsetHeight - window.innerHeight + stickyOffset, 1);
    const progress = Math.min(1, Math.max(0, (stickyOffset - stageRect.top) / travel));
    const nextFrame = Math.min(heroFrames.length - 1, Math.floor(progress * heroFrames.length));
    setHeroFrame(nextFrame, progress);
  };

  const requestHeroSequenceUpdate = () => {
    if (!heroAnimationRequest) heroAnimationRequest = window.requestAnimationFrame(updateHeroSequence);
  };

  updateHeroSequence();
  window.addEventListener("scroll", requestHeroSequenceUpdate, { passive: true });
  window.addEventListener("resize", requestHeroSequenceUpdate);
  reducedMotion.addEventListener("change", requestHeroSequenceUpdate);
  heroCounters.forEach((counter, index) => {
    counter.addEventListener("click", () => setHeroFrame(index, index / Math.max(heroFrames.length - 1, 1)));
  });

  const revealTargets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("isRevealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add("isRevealed"));
  }

  const parallaxTargets = document.querySelectorAll("[data-parallax]");
  let parallaxAnimationRequest = 0;
  const updateParallax = () => {
    parallaxAnimationRequest = 0;
    const viewportCenter = window.innerHeight / 2;
    parallaxTargets.forEach((target) => {
      if (reducedMotion.matches) {
        target.style.setProperty("--parallax-y", "0px");
        return;
      }
      const targetRect = target.getBoundingClientRect();
      const targetCenter = targetRect.top + targetRect.height / 2;
      const normalized = Math.min(1, Math.max(-1, (targetCenter - viewportCenter) / window.innerHeight));
      target.style.setProperty("--parallax-y", `${normalized * -18}px`);
    });
  };
  const requestParallaxUpdate = () => {
    if (!parallaxAnimationRequest) parallaxAnimationRequest = window.requestAnimationFrame(updateParallax);
  };
  updateParallax();
  window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
  window.addEventListener("resize", requestParallaxUpdate);
  reducedMotion.addEventListener("change", requestParallaxUpdate);

  const form = document.querySelector(".leadForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const success = document.createElement("div");
    success.className = "formSuccess";
    success.innerHTML = "<span>✓</span><h3>Заявка принята</h3><p>Это демонстрация интерфейса. Подключение реального канала связи выполняется перед запуском.</p>";
    form.replaceWith(success);
  });
})();
