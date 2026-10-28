const toast = document.getElementById("toast");
let toastTimeout;
let soundEnabled = false;
let audioContext;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function heartBurst(x, y, amount = 18) {
  const symbols = ["♥", "♡", "❤", "✦"];
  for (let i = 0; i < amount; i++) {
    setTimeout(() => {
      const heart = document.createElement("span");
      heart.className = "heart-particle";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.style.left = `${x + (Math.random() - 0.5) * 130}px`;
      heart.style.top = `${y + (Math.random() - 0.5) * 40}px`;
      heart.style.fontSize = `${12 + Math.random() * 24}px`;
      heart.style.setProperty("--duration", `${2.6 + Math.random() * 2.4}s`);
      heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 5200);
    }, i * 45);
  }
}

function playTone(frequency = 660, duration = 0.11) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.02);
  } catch (error) {
    soundEnabled = false;
  }
}

document.getElementById("soundToggle").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  document.querySelector("#soundToggle span").textContent = `звук: ${soundEnabled ? "вкл." : "выкл."}`;
  if (soundEnabled) {
    playTone(523, 0.12);
    setTimeout(() => playTone(659, 0.12), 100);
    setTimeout(() => playTone(784, 0.16), 200);
    notify("Звук включён ♡");
  } else {
    notify("Звук выключен");
  }
});

document.getElementById("sprinkleButton").addEventListener("click", () => {
  heartBurst(window.innerWidth * 0.5, window.innerHeight * 0.55, 32);
  playTone(659);
  notify("иди сюда, моя киса ♡");
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("open");
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => document.getElementById("nav").classList.remove("open"));
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

const progress = document.getElementById("topProgress");
window.addEventListener("scroll", () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable > 0 ? window.scrollY / scrollable * 100 : 0}%`;
}, { passive: true });

document.querySelectorAll(".word-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".word-card").forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    const box = document.getElementById("wordReveal");
    box.innerHTML = `<span>♡</span><p>${card.dataset.note}</p>`;
    heartBurst(card.getBoundingClientRect().left + card.offsetWidth / 2, card.getBoundingClientRect().top + 30, 8);
    playTone(587);
  });
});

document.getElementById("secretButton").addEventListener("click", event => {
  const message = document.getElementById("secretMessage");
  message.classList.toggle("open");
  event.currentTarget.textContent = message.classList.contains("open") ? "ещё раз прочитать ♡" : "ну давай, открывай ♡";
  if (message.classList.contains("open")) {
    heartBurst(window.innerWidth / 2, window.innerHeight * 0.7, 24);
    playTone(784, 0.18);
  }
});

document.getElementById("heartButton").addEventListener("click", event => {
  const rect = event.currentTarget.getBoundingClientRect();
  heartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 55);
  playTone(523, 0.16);
  setTimeout(() => playTone(659, 0.16), 100);
  setTimeout(() => playTone(784, 0.22), 200);
  notify("люблю тебя сильно-сильно ❤️");
});

document.addEventListener("click", event => {
  if (event.target.closest("button, a, label, input, .word-card")) return;
  heartBurst(event.clientX, event.clientY, 5);
});

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.querySelectorAll(".gallery-input").forEach((input, index) => {
  const tile = input.closest(".gallery-tile");
  const image = tile.querySelector("img");
  const storageKey = `maBelleGallery${index + 1}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      image.src = saved;
      tile.classList.add("has-image");
    }
  } catch (error) {
    console.warn("Не удалось восстановить сохранённую фотографию.");
  }

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Выбери файл изображения ♡");
      input.value = "";
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      notify("Фото слишком большое — выбери файл до 15 МБ");
      input.value = "";
      return;
    }

    try {
      const dataUrl = await compressImage(file);
      try {
        localStorage.setItem(storageKey, dataUrl);
      } catch (storageError) {
        notify("Фото добавлено, но браузер не смог сохранить его надолго");
      }
      image.src = dataUrl;
      tile.classList.add("has-image");
      notify("вот это теперь наш момент ♡");
      playTone(659);
    } catch (error) {
      notify("Не получилось открыть это фото. Попробуй другое.");
    }
  });
});

const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let stars = [];
let canvasWidth = 0;
let canvasHeight = 0;

function setupStars() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = Array.from({ length: Math.min(95, Math.floor(canvasWidth / 12)) }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    radius: Math.random() * 1.25 + 0.25,
    alpha: Math.random() * 0.45 + 0.1,
    speed: Math.random() * 0.007 + 0.002
  }));
}
function drawStars() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  for (const star of stars) {
    star.alpha += star.speed;
    if (star.alpha > 0.65 || star.alpha < 0.08) star.speed *= -1;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 211, 235, ${star.alpha})`;
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}
window.addEventListener("resize", setupStars);
setupStars();
drawStars();
