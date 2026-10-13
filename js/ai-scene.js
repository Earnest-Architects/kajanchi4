/**
 * ai-scene.js — tombol "AI" di rail kiri.
 * Capture frame 360 yang sedang tampil (sama seperti tool Print),
 * lalu buka ai.html di tab baru dan kirim gambarnya sebagai Gambar 1
 * ke workflow Qwen Image Edit.
 */
import { viewer } from "./viewer.js";

const aiBtn = document.getElementById("ai-scene-btn");

if (aiBtn) {
  aiBtn.addEventListener("click", () => {
    try {
      const dataUrl = viewer.getRenderer().getCanvas().toDataURL("image/jpeg", 0.95);
      const win = window.open("ai.html", "_blank");
      if (!win) return; // popup diblokir browser
      const onMsg = (e) => {
        if (e.source === win && e.data && e.data.type === "ai-ready") {
          win.postMessage({ type: "ai-capture", dataUrl }, "*");
          window.removeEventListener("message", onMsg);
        }
      };
      window.addEventListener("message", onMsg);
    } catch (err) {
      console.error("AI capture failed:", err);
    }
  });
}
