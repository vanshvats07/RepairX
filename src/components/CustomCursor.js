"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "button, a, input, textarea, select, [role=button], [data-cursor]";
const MAGNETIC_SELECTOR = ".rx-button, [data-magnetic]";
const DEVICE_SELECTOR = ".hero-stage, .hero-device, .workspace-phone";

export function MagneticElement({ children, className = "", ...props }) {
  return <span className={`cursor-magnetic ${className}`} data-magnetic {...props}>{children}</span>;
}

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const pointerRef = useRef({ targetX: -100, targetY: -100, x: -100, y: -100, trailX: -100, trailY: -100 });
  const hoveredRef = useRef(null);
  const magneticRef = useRef(null);
  const deviceRef = useRef(null);
  const frameRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const desktop = window.matchMedia("(pointer: fine) and (min-width: 901px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!desktop.matches || reducedMotion.matches || touchDevice) return undefined;

    activeRef.current = true;
    document.documentElement.classList.add("cursor-enabled");

    const pointer = pointerRef.current;
    const cursor = cursorRef.current;
    const trail = trailRef.current;

    const clearHover = () => {
      if (hoveredRef.current) hoveredRef.current.classList.remove("cursor-hover-target");
      if (magneticRef.current) magneticRef.current.style.translate = "";
      if (deviceRef.current) deviceRef.current.classList.remove("cursor-near-device");
      hoveredRef.current = null;
      magneticRef.current = null;
      deviceRef.current = null;
      cursor?.classList.remove("cursor-hover", "cursor-button", "cursor-link", "cursor-device");
    };

    const updateTarget = (event) => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      const target = event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null;
      const magnetic = event.target instanceof Element ? event.target.closest(MAGNETIC_SELECTOR) : null;
      const device = event.target instanceof Element ? event.target.closest(DEVICE_SELECTOR) : null;

      if (target !== hoveredRef.current) {
        if (hoveredRef.current) hoveredRef.current.classList.remove("cursor-hover-target");
        hoveredRef.current = target;
        target?.classList.add("cursor-hover-target");
      }
      if (magnetic !== magneticRef.current) {
        if (magneticRef.current) magneticRef.current.style.translate = "";
        magneticRef.current = magnetic;
      }
      if (device !== deviceRef.current) {
        deviceRef.current?.classList.remove("cursor-near-device");
        deviceRef.current = device;
        device?.classList.add("cursor-near-device");
      }

      cursor?.classList.toggle("cursor-hover", Boolean(target));
      cursor?.classList.toggle("cursor-button", Boolean(magnetic));
      cursor?.classList.toggle("cursor-link", Boolean(target?.matches("a")) && !magnetic);
      cursor?.classList.toggle("cursor-device", Boolean(device));

      if (magnetic) {
        const bounds = magnetic.getBoundingClientRect();
        const maxOffset = 6;
        const x = Math.max(-maxOffset, Math.min(maxOffset, (event.clientX - (bounds.left + bounds.width / 2)) * 0.08));
        const y = Math.max(-maxOffset, Math.min(maxOffset, (event.clientY - (bounds.top + bounds.height / 2)) * 0.08));
        magnetic.style.translate = `${x}px ${y}px`;
      }
    };

    const handleLeave = () => {
      pointer.targetX = -100;
      pointer.targetY = -100;
      clearHover();
    };

    const handlePointerOut = (event) => { if (!event.relatedTarget) handleLeave(); };

    const animate = () => {
      pointer.x += (pointer.targetX - pointer.x) * 0.14;
      pointer.y += (pointer.targetY - pointer.y) * 0.14;
      pointer.trailX += (pointer.targetX - pointer.trailX) * 0.09;
      pointer.trailY += (pointer.targetY - pointer.trailY) * 0.09;
      const cursorTransform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate3d(-50%, -50%, 0)`;
      const trailTransform = `translate3d(${pointer.trailX}px, ${pointer.trailY}px, 0) translate3d(-50%, -50%, 0)`;
      if (cursor) cursor.style.transform = cursorTransform;
      if (trail) trail.style.transform = trailTransform;
      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", updateTarget, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("pointermove", updateTarget);
      window.removeEventListener("pointerout", handlePointerOut);
      document.documentElement.classList.remove("cursor-enabled");
      clearHover();
    };
  }, []);

  return <><span ref={trailRef} className="repairx-cursor repairx-cursor-trail" aria-hidden="true" /><span ref={cursorRef} className="repairx-cursor" aria-hidden="true" /></>;
}
