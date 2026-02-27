/**
 * bootstrap-lite.js
 * Minimal vanilla replacements for Bootstrap's Collapse and Modal JS plugins.
 * Relies on Bootstrap 5 CSS (still loaded) for classes like .collapse,
 * .collapsing, .modal, .fade, .show, .modal-backdrop, .modal-open.
 *
 * Exposes: window.bootstrap.Modal  (same API used by main.js)
 * Auto-inits: [data-bs-toggle="collapse"] click handler
 */
(() => {
  const COLLAPSE_MS = 350;
  const MODAL_MS = 150;

  /* --- helpers --- */
  function reflow(el) {
    void el.offsetHeight;
  }

  function afterTransition(el, cb, ms, prop) {
    let fired = false;
    const done = (e) => {
      if (e && e.target !== el) return;
      if (e && prop && e.propertyName !== prop) return;
      if (fired) return;
      fired = true;
      el.removeEventListener("transitionend", done);
      clearTimeout(timer);
      cb();
    };
    el.addEventListener("transitionend", done);
    const timer = setTimeout(() => done(), ms + 50);
  }

  /* ------------------- COLLAPSE ------------------- */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('[data-bs-toggle="collapse"]');
    if (!trigger) return;

    const sel = trigger.getAttribute("data-bs-target");
    const target = sel && document.querySelector(sel);
    if (!target || target.classList.contains("collapsing")) return;

    const opening = !target.classList.contains("show");

    if (opening) {
      /* -- show -- */
      target.classList.remove("collapse");
      target.classList.add("collapsing");
      target.style.height = "0px";
      reflow(target);
      target.style.height = target.scrollHeight + "px";
      trigger.setAttribute("aria-expanded", "true");
      trigger.classList.remove("collapsed");

      afterTransition(
        target,
        () => {
          target.classList.remove("collapsing");
          target.classList.add("collapse", "show");
          target.style.height = "";
        },
        COLLAPSE_MS,
        "height",
      );
    } else {
      /* -- hide -- */
      target.style.height = target.scrollHeight + "px";
      reflow(target);
      target.classList.remove("collapse", "show");
      target.classList.add("collapsing");
      reflow(target);
      target.style.height = "";
      trigger.setAttribute("aria-expanded", "false");
      trigger.classList.add("collapsed");

      afterTransition(
        target,
        () => {
          target.classList.remove("collapsing");
          target.classList.add("collapse");
          target.style.height = "";
        },
        COLLAPSE_MS,
        "height",
      );
    }
  });

  /* ------------------- MODAL ------------------- */
  class Modal {
    static _store = new WeakMap();

    static getOrCreateInstance(el, opts) {
      if (!Modal._store.has(el)) Modal._store.set(el, new Modal(el, opts));
      return Modal._store.get(el);
    }

    constructor(el, opts = {}) {
      this._el = el;
      this._opts = { backdrop: true, keyboard: true, ...opts };
      this._shown = false;
      this._backdrop = null;
      this._onKey = null;
      this._onDismiss = null;
    }

    show() {
      if (this._shown) return;
      this._shown = true;

      /* backdrop */
      this._backdrop = document.createElement("div");
      this._backdrop.className = "modal-backdrop fade";
      document.body.appendChild(this._backdrop);
      reflow(this._backdrop);
      this._backdrop.classList.add("show");

      /* body lock */
      document.body.classList.add("modal-open");

      /* reveal */
      this._el.style.display = "block";
      this._el.removeAttribute("aria-hidden");
      this._el.setAttribute("aria-modal", "true");
      this._el.setAttribute("role", "dialog");
      reflow(this._el);
      this._el.classList.add("show");

      /* ESC key */
      if (this._opts.keyboard) {
        this._onKey = (e) => {
          if (e.key === "Escape") this.hide();
        };
        document.addEventListener("keydown", this._onKey);
      }

      /* data-bs-dismiss="modal" buttons */
      this._onDismiss = (e) => {
        if (e.target.closest('[data-bs-dismiss="modal"]')) this.hide();
      };
      this._el.addEventListener("click", this._onDismiss);

      afterTransition(
        this._el,
        () => {
          this._el.dispatchEvent(new Event("shown.bs.modal"));
        },
        MODAL_MS,
        "opacity",
      );
    }

    hide() {
      if (!this._shown) return;
      this._shown = false;

      this._el.classList.remove("show");
      if (this._backdrop) this._backdrop.classList.remove("show");

      afterTransition(
        this._el,
        () => {
          this._el.style.display = "";
          this._el.setAttribute("aria-hidden", "true");
          this._el.removeAttribute("aria-modal");
          this._el.removeAttribute("role");
          document.body.classList.remove("modal-open");

          if (this._backdrop) {
            this._backdrop.remove();
            this._backdrop = null;
          }
          if (this._onKey) {
            document.removeEventListener("keydown", this._onKey);
            this._onKey = null;
          }
          if (this._onDismiss) {
            this._el.removeEventListener("click", this._onDismiss);
            this._onDismiss = null;
          }

          this._el.dispatchEvent(new Event("hidden.bs.modal"));
        },
        MODAL_MS,
        "opacity",
      );
    }
  }

  window.bootstrap = window.bootstrap || {};
  window.bootstrap.Modal = Modal;
})();
