// ICON DATA

const icons = [
  {
    name: "dumb term",
    icon: "assets/termm.png",
    contentUrl: "assets/apps/terminal.html"
  },

  {
    name: "word",
    icon: "assets/apps/word/word_icon2.gif",
    contentUrl: "assets/apps/word_index.html"
  },

    {
    name: "did u know:",
    icon: "assets/apps/diduknow/diduknow_icon.png",
    contentUrl: "assets/apps/diduknow/diduknow_index.html"
  },
    {
    name: "derpy cats!",
    icon: "assets/dcicon.png",
    contentUrl: "assets/apps/derpycats/derpy_cat_home.html"
  },
      {
    name: "sound",
    icon: "assets/apps/sound/ear.gif",
    contentUrl: "assets/apps/sound/sound_index.html"
  },
        {
    name: "face",
    icon: "assets/apps/face/faces-cover2.jpeg",
    contentUrl: "assets/apps/face/face_index.html"
  },
  {
    name: "equipment test",
    icon: "assets/apps/equipmenttest/equiptest_icon.png",
    contentUrl: "assets/apps/test.html"
  },
  {
    name: "Cooking School FAQ!",
    icon: "assets/apps/cookingschool/chicken_cover.png",
    contentUrl: "assets/apps/cookingschool/cooking_index.html"
  },
    {
    name: "paint.jpegs",
    icon: "assets/apps/paintjpegs/painjpegs_icon.png",
    contentUrl: "assets/apps/derpycats/paintjpeg_index.html"
  },
  {
    name: "videobeaux",
    icon: "assets/apps/videobeaux/logo.png",
    contentUrl: "https://videobeaux.online"
  },

          {
    name: "Schwwaaa",
    icon: "assets/apps/schwwaaa/old_sch_logo.png",
    contentUrl: "https://schwwaaa.net"
  },

            {
    name: "CardQuest.Zone",
    icon: "assets/apps/cardquestzone/CardQuestZone-banner.gif",
    contentUrl: "https://cardquest.zone"
  },

  /*
  {
    name: "Displays",
    icon: "assets/face.jpeg",
    contentUrl: "assets/apps/derpycats/derpy_cat_home.html"
  },
  */

                {
    name: "Vondas Network",
    icon: "assets/apps/vondas/vondaslogo.png",
    contentUrl: "https://vondas.network"
  },
  
  // etc...
];

const desktop = document.getElementById("desktop-icons");
const windows = document.getElementById("windows-container");

const iconSize = 100;
const placedRects = [];

icons.forEach((item, index) => {
  const div = document.createElement("div");
  div.className = "icon";
  div.innerHTML = `<img src="${item.icon}" alt="${item.name}"><span>${item.name}</span>`;

  let tries = 0;
  let x, y;
  let hasOverlap;

  do {
    hasOverlap = false;
    x = Math.floor(Math.random() * (window.innerWidth - iconSize));
    y = Math.floor(Math.random() * (window.innerHeight - iconSize));
    const newRect = { x, y, width: iconSize, height: iconSize };

    for (const rect of placedRects) {
      if (rectsOverlap(rect, newRect)) {
        hasOverlap = true;
        break;
      }
    }

    tries++;
    if (tries > 1000) break; // Fail-safe to prevent infinite loop
  } while (hasOverlap);

  placedRects.push({ x, y, width: iconSize, height: iconSize });
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;

  div.addEventListener("click", () => openWindow(item.name, item.contentUrl));
  desktop.appendChild(div);
});

// Helper function to check if two rectangles overlap
function rectsOverlap(r1, r2) {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}


let currentWindow = null;

function openWindow(title, contentUrl) {
  // Close existing window
  if (currentWindow) {
    currentWindow.remove();
    currentWindow = null;
  }

  const win = document.createElement("div");
  win.className = "window";

  const winWidth = Math.min(window.innerWidth * 0.9, 1100);  // max 1100px or 90% of screen
  const winHeight = Math.min(window.innerHeight * 0.8, 700); // max 700px or 80% of screen


  win.style.position = "fixed";
  win.style.left = "50%";
  win.style.top = "50%";
  win.style.transform = "translate(-50%, -50%)";

  win.style.width = `${winWidth}px`;
  win.style.height = `${winHeight}px`;


  if (contentUrl.includes('https://')) {
    title = `<a id='extlink' href='${contentUrl}' target='_blank' style='color:white;'/>${contentUrl} </a>`
  }
  win.innerHTML = `
    <div class="window-header">
      <span>${title}</span>
      <button class="close-btn">&times;</button>
    </div>
    <div class="window-content">
      <iframe src="${contentUrl}" frameborder="0"></iframe>
    </div>
  `;

  win.querySelector(".close-btn").onclick = () => {
    win.remove();
    currentWindow = null;
  };

  makeDraggable(win);

  windows.appendChild(win);
  currentWindow = win;
}

function makeDraggable(el) {
  const header = el.querySelector('.window-header');
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "c") ctx.clearRect(0, 0, canvas.width, canvas.height);
});





const canvas = document.getElementById("dvd-logo");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const logo = new Image();
logo.src = "assets/floatingface1.png";

let x = 100, y = 100;
let dx = 2, dy = 2;
const size = 100;
let lastX = x, lastY = y;
let currentColor = getRandomColor();

// randomness factor for motion variation
const wobble = 0.4;

function resizeCanvas() {
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  const oldImage = ctx.getImageData(0, 0, oldWidth, oldHeight);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.putImageData(oldImage, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function draw() {
  // Draw colored trail line (like MS Paint brush)
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lastX + size / 2, lastY + size / 2);
  ctx.lineTo(x + size / 2, y + size / 2);
  ctx.stroke();

  // Save previous position
  lastX = x;
  lastY = y;

  // Apply slight wobble to direction for more organic trail
  dx += (Math.random() - 0.5) * wobble;
  dy += (Math.random() - 0.5) * wobble;

  // Clamp velocity to prevent runaway speed
  const maxSpeed = 5;
  dx = Math.max(-maxSpeed, Math.min(maxSpeed, dx));
  dy = Math.max(-maxSpeed, Math.min(maxSpeed, dy));

  // Move position
  x += dx;
  y += dy;

  // Bounce and change color
  let bounced = false;
  if (x + size > canvas.width || x < 0) {
    dx *= -1;
    bounced = true;
  }
  if (y + size > canvas.height || y < 0) {
    dy *= -1;
    bounced = true;
  }
  if (bounced) {
    currentColor = getRandomColor();
  }

  // Draw logo image on top
  ctx.drawImage(logo, x, y, size, size);

  requestAnimationFrame(draw);
}

logo.onload = draw;

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 100%, 50%)`;
}
