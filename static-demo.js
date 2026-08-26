(() => {
  if (window.__geoLandingStaticDemo) return;
  window.__geoLandingStaticDemo = true;

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
  const heroCounters = heroScene ? Array.from(heroScene.querySelectorAll(".heroSequenceCounter i")) : [];
  const heroCaptionNumber = heroScene?.querySelector(".heroSequenceCaption span");
  const heroCaptionTitle = heroScene?.querySelector(".heroSequenceCaption b");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentHeroFrame = -1;
  let heroAnimationRequest = 0;

  const updateHeroSequence = () => {
    heroAnimationRequest = 0;
    if (!heroScene || !heroStage || !heroFrames.length) return;

    const stickyOffset = window.innerWidth <= 720 ? 82 : 98;
    const stageRect = heroStage.getBoundingClientRect();
    const travel = Math.max(heroStage.offsetHeight - window.innerHeight + stickyOffset, 1);
    const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, (stickyOffset - stageRect.top) / travel));
    const nextFrame = Math.min(heroFrames.length - 1, Math.floor(progress * heroFrames.length));

    heroScene.style.setProperty("--hero-sequence-progress", String(progress));
    heroStage.dataset.sequenceFrame = String(nextFrame);
    if (nextFrame === currentHeroFrame) return;
    currentHeroFrame = nextFrame;

    heroFrames.forEach((frame, index) => {
      frame.classList.toggle("isActive", index === nextFrame);
      frame.setAttribute("aria-hidden", String(index !== nextFrame));
    });
    heroCounters.forEach((counter, index) => counter.classList.toggle("isActive", index === nextFrame));

    const activeFrame = heroFrames[nextFrame];
    if (heroCaptionNumber) heroCaptionNumber.textContent = `${activeFrame.dataset.sequenceNum ?? "01"} / 08`;
    if (heroCaptionTitle) heroCaptionTitle.textContent = activeFrame.dataset.sequenceTitle ?? "Цельный участок";
  };

  const requestHeroSequenceUpdate = () => {
    if (!heroAnimationRequest) heroAnimationRequest = window.requestAnimationFrame(updateHeroSequence);
  };

  updateHeroSequence();
  window.addEventListener("scroll", requestHeroSequenceUpdate, { passive: true });
  window.addEventListener("resize", requestHeroSequenceUpdate);
  reducedMotion.addEventListener("change", requestHeroSequenceUpdate);

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
