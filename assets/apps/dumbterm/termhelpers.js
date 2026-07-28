// ============================================================
// TERMINAL HELPERS
// ============================================================

function appendTerminal(text = '') {
  const entry = document.createElement('div');
  entry.textContent = text;
  terminal.appendChild(entry);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createOverlay() {
  const overlay = document.createElement('div');

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'black',
    color: 'lime',
    zIndex: '9999',
    overflow: 'hidden',
    fontFamily: 'monospace'
  });

  document.body.appendChild(overlay);
  return overlay;
}

function addCloseInstructions(overlay) {
  const message = document.createElement('div');

  message.textContent = 'Press Escape or click to close';

  Object.assign(message.style, {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    color: 'lime',
    opacity: '0.7',
    zIndex: '10'
  });

  overlay.appendChild(message);
}

function makeClosable(overlay, cleanup = () => {}) {
  let closed = false;

  function close() {
    if (closed) return;

    closed = true;
    cleanup();
    overlay.remove();
    document.removeEventListener('keydown', handleEscape);
    input.focus();
  }

  function handleEscape(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', handleEscape);

  return close;
}


// ============================================================
// MORSE
// Usage:
// morse hello world
// ============================================================

const MORSE_CODE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..',
  E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',

  0: '-----', 1: '.----', 2: '..---',
  3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..',
  9: '----.'
};

function encodeMorse(text) {
  return text
    .toUpperCase()
    .split('')
    .map(character => {
      if (character === ' ') return '/';
      return MORSE_CODE[character] || '?';
    })
    .join(' ');
}

function playMorse(text) {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error('Web Audio is not supported by this browser.');
  }

  const context = new AudioContext();
  const unit = 0.08;
  const frequency = 650;

  let startTime = context.currentTime + 0.1;

  function beep(duration) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01);
    gain.gain.setValueAtTime(0.12, startTime + duration - 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    startTime += duration;
  }

  const encoded = encodeMorse(text);

  for (const symbol of encoded) {
    if (symbol === '.') {
      beep(unit);
      startTime += unit;
    } else if (symbol === '-') {
      beep(unit * 3);
      startTime += unit;
    } else if (symbol === ' ') {
      startTime += unit * 2;
    } else if (symbol === '/') {
      startTime += unit * 6;
    }
  }

  setTimeout(() => {
    context.close();
  }, Math.max(1000, (startTime - context.currentTime + 1) * 1000));
}

commands.morse = args => {
  const message = args.join(' ').trim();

  if (!message) {
    return 'Usage: morse <message>';
  }

  const encoded = encodeMorse(message);

  try {
    playMorse(message);
  } catch (error) {
    return `${encoded}\nAudio error: ${error.message}`;
  }

  return encoded;
};


// ============================================================
// CLOCK
// Usage:
// clock
// ============================================================

commands.clock = () => {
  const overlay = createOverlay();

  const clock = document.createElement('div');

  Object.assign(clock.style, {
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(3rem, 12vw, 10rem)',
    fontFamily: '"Orbitron", monospace',
    textAlign: 'center'
  });

  overlay.appendChild(clock);
  addCloseInstructions(overlay);

  function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const date = now.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    clock.innerHTML = `
      <div>${time}</div>
      <div style="font-size: 0.18em; margin-top: 1rem;">
        ${date}
      </div>
    `;
  }

  updateClock();

  const interval = setInterval(updateClock, 1000);

  makeClosable(overlay, () => {
    clearInterval(interval);
  });

  return 'Clock opened.';
};


// ============================================================
// STARS
// Usage:
// stars
// ============================================================

commands.stars = () => {
  const overlay = createOverlay();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  overlay.appendChild(canvas);
  addCloseInstructions(overlay);

  let animationFrame;
  let running = true;

  const stars = Array.from({ length: 500 }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random()
  }));

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function resetStar(star) {
    star.x = Math.random() * 2 - 1;
    star.y = Math.random() * 2 - 1;
    star.z = 1;
  }

  function animate() {
    if (!running) return;

    context.fillStyle = 'rgba(0, 0, 0, 0.35)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'lime';

    for (const star of stars) {
      star.z -= 0.012;

      if (star.z <= 0.01) {
        resetStar(star);
      }

      const screenX =
        canvas.width / 2 +
        (star.x / star.z) * canvas.width / 3;

      const screenY =
        canvas.height / 2 +
        (star.y / star.z) * canvas.height / 3;

      const size = Math.max(1, (1 - star.z) * 4);

      if (
        screenX < 0 ||
        screenX >= canvas.width ||
        screenY < 0 ||
        screenY >= canvas.height
      ) {
        resetStar(star);
        continue;
      }

      context.fillRect(screenX, screenY, size, size);
    }

    animationFrame = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  animate();

  makeClosable(overlay, () => {
    running = false;
    cancelAnimationFrame(animationFrame);
    window.removeEventListener('resize', resize);
  });

  return 'Entering hyperspace...';
};


// ============================================================
// UUID
// Usage:
// uuid
// uuid 5
// ============================================================

function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(
    bytes,
    byte => byte.toString(16).padStart(2, '0')
  );

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-');
}

commands.uuid = ([amount = '1']) => {
  const count = Math.min(
    Math.max(parseInt(amount, 10) || 1, 1),
    20
  );

  return Array.from(
    { length: count },
    generateUUID
  ).join('\n');
};


// ============================================================
// SCREEN INFORMATION
// Usage:
// screen
// ============================================================

commands.screen = () => {
  return [
    `Screen: ${window.screen.width} × ${window.screen.height}`,
    `Available: ${window.screen.availWidth} × ${window.screen.availHeight}`,
    `Browser viewport: ${window.innerWidth} × ${window.innerHeight}`,
    `Pixel ratio: ${window.devicePixelRatio}`,
    `Color depth: ${window.screen.colorDepth}-bit`,
    `Orientation: ${screen.orientation?.type || 'unknown'}`
  ].join('\n');
};


// ============================================================
// BROWSER INFORMATION
// Usage:
// browser
// ============================================================

commands.browser = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  return [
    `User agent: ${navigator.userAgent}`,
    `Platform: ${navigator.userAgentData?.platform || navigator.platform}`,
    `Language: ${navigator.language}`,
    `Languages: ${navigator.languages?.join(', ') || navigator.language}`,
    `Online: ${navigator.onLine ? 'yes' : 'no'}`,
    `Cookies enabled: ${navigator.cookieEnabled ? 'yes' : 'no'}`,
    `CPU threads: ${navigator.hardwareConcurrency || 'unknown'}`,
    `Device memory: ${
      navigator.deviceMemory
        ? `${navigator.deviceMemory} GB`
        : 'not reported'
    }`,
    `Connection: ${
      connection?.effectiveType || 'not reported'
    }`,
    `Touch points: ${navigator.maxTouchPoints || 0}`
  ].join('\n');
};


// ============================================================
// ROTATING ASCII CUBE
// Usage:
// cube
// ============================================================

commands.cube = () => {
  const overlay = createOverlay();

  const output = document.createElement('pre');

  Object.assign(output.style, {
    position: 'absolute',
    inset: '0',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'lime',
    fontSize: '14px',
    lineHeight: '12px'
  });

  overlay.appendChild(output);
  addCloseInstructions(overlay);

  const width = 80;
  const height = 40;

  const vertices = [
    [-1, -1, -1],
    [ 1, -1, -1],
    [ 1,  1, -1],
    [-1,  1, -1],
    [-1, -1,  1],
    [ 1, -1,  1],
    [ 1,  1,  1],
    [-1,  1,  1]
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  let angle = 0;
  let animationFrame;
  let running = true;

  function rotate([x, y, z]) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const cosB = Math.cos(angle * 0.7);
    const sinB = Math.sin(angle * 0.7);

    const x1 = x * cosA - z * sinA;
    const z1 = x * sinA + z * cosA;

    const y2 = y * cosB - z1 * sinB;
    const z2 = y * sinB + z1 * cosB;

    return [x1, y2, z2];
  }

  function project([x, y, z]) {
    const distance = 4;
    const scale = 18 / (z + distance);

    return [
      Math.round(width / 2 + x * scale * 2),
      Math.round(height / 2 + y * scale)
    ];
  }

  function drawLine(grid, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let error = dx - dy;

    while (true) {
      if (
        y0 >= 0 &&
        y0 < height &&
        x0 >= 0 &&
        x0 < width
      ) {
        grid[y0][x0] = '#';
      }

      if (x0 === x1 && y0 === y1) break;

      const error2 = error * 2;

      if (error2 > -dy) {
        error -= dy;
        x0 += sx;
      }

      if (error2 < dx) {
        error += dx;
        y0 += sy;
      }
    }
  }

  function animate() {
    if (!running) return;

    const grid = Array.from(
      { length: height },
      () => Array(width).fill(' ')
    );

    const points = vertices
      .map(rotate)
      .map(project);

    for (const [start, end] of edges) {
      drawLine(
        grid,
        points[start][0],
        points[start][1],
        points[end][0],
        points[end][1]
      );
    }

    output.textContent = grid
      .map(row => row.join(''))
      .join('\n');

    angle += 0.035;
    animationFrame = requestAnimationFrame(animate);
  }

  animate();

  makeClosable(overlay, () => {
    running = false;
    cancelAnimationFrame(animationFrame);
  });

  return 'Rendering cube...';
};


// ============================================================
// TREE
// Usage:
// tree
// tree 7
// ============================================================

commands.tree = ([requestedDepth = '6']) => {
  const depth = Math.min(
    Math.max(parseInt(requestedDepth, 10) || 6, 3),
    8
  );

  const width = 79;
  const height = 30;

  const grid = Array.from(
    { length: height },
    () => Array(width).fill(' ')
  );

  function drawBranch(x, y, length, angle, branchDepth) {
    if (branchDepth <= 0 || length < 1) return;

    const endX = Math.round(x + Math.cos(angle) * length);
    const endY = Math.round(y - Math.sin(angle) * length);

    const steps = Math.max(
      Math.abs(endX - x),
      Math.abs(endY - y)
    );

    for (let step = 0; step <= steps; step++) {
      const progress = step / Math.max(steps, 1);

      const drawX = Math.round(
        x + (endX - x) * progress
      );

      const drawY = Math.round(
        y + (endY - y) * progress
      );

      if (
        drawX >= 0 &&
        drawX < width &&
        drawY >= 0 &&
        drawY < height
      ) {
        grid[drawY][drawX] =
          Math.abs(Math.cos(angle)) > 0.7
            ? '-'
            : angle > Math.PI / 2
              ? '/'
              : '\\';
      }
    }

    if (branchDepth === 1) {
      if (
        endX >= 0 &&
        endX < width &&
        endY >= 0 &&
        endY < height
      ) {
        grid[endY][endX] = randomItem(['*', 'o', '+']);
      }

      return;
    }

    const spread = 0.35 + Math.random() * 0.25;

    drawBranch(
      endX,
      endY,
      length * (0.68 + Math.random() * 0.08),
      angle + spread,
      branchDepth - 1
    );

    drawBranch(
      endX,
      endY,
      length * (0.68 + Math.random() * 0.08),
      angle - spread,
      branchDepth - 1
    );
  }

  drawBranch(
    Math.floor(width / 2),
    height - 1,
    8,
    Math.PI / 2,
    depth
  );

  return grid.map(row => row.join('')).join('\n');
};


// ============================================================
// CITY
// Usage:
// city
// city 70
// ============================================================

commands.city = ([requestedWidth = '70']) => {
  const width = Math.min(
    Math.max(parseInt(requestedWidth, 10) || 70, 30),
    120
  );

  const height = 24;

  const grid = Array.from(
    { length: height },
    () => Array(width).fill(' ')
  );

  for (let x = 0; x < width;) {
    const buildingWidth = randomInt(4, 10);
    const buildingHeight = randomInt(5, 20);
    const top = height - buildingHeight;

    for (
      let buildingX = x;
      buildingX < Math.min(x + buildingWidth, width);
      buildingX++
    ) {
      for (let y = top; y < height; y++) {
        const isEdge =
          buildingX === x ||
          buildingX === x + buildingWidth - 1;

        if (y === top) {
          grid[y][buildingX] = '_';
        } else if (isEdge) {
          grid[y][buildingX] = '|';
        } else {
          const windowRow = (y - top) % 3 === 1;
          const windowColumn = (buildingX - x) % 3 === 1;

          grid[y][buildingX] =
            windowRow && windowColumn
              ? randomItem(['o', '.', '*'])
              : ' ';
        }
      }
    }

    if (
      Math.random() > 0.65 &&
      top > 2 &&
      x + Math.floor(buildingWidth / 2) < width
    ) {
      grid[top - 1][x + Math.floor(buildingWidth / 2)] = '|';
      grid[top - 2][x + Math.floor(buildingWidth / 2)] = '.';
    }

    x += buildingWidth + randomInt(1, 3);
  }

  grid[1][width - 8] = '☾';

  return grid.map(row => row.join('')).join('\n');
};


// ============================================================
// MANDELBROT
// Command spelling:
// mandelbrot
//
// Usage:
// mandelbrot
// mandelbrot 80 30
// ============================================================

commands.mandelbrot = ([
  requestedWidth = '80',
  requestedHeight = '30'
]) => {
  const width = Math.min(
    Math.max(parseInt(requestedWidth, 10) || 80, 20),
    160
  );

  const height = Math.min(
    Math.max(parseInt(requestedHeight, 10) || 30, 10),
    60
  );

  const characters = ' .,:;irsXA253hMHGS#9B&@';
  const maxIterations = characters.length - 1;

  const rows = [];

  for (let y = 0; y < height; y++) {
    let row = '';

    for (let x = 0; x < width; x++) {
      const real = -2.2 + (x / width) * 3.2;
      const imaginary = -1.2 + (y / height) * 2.4;

      let zr = 0;
      let zi = 0;
      let iteration = 0;

      while (
        zr * zr + zi * zi <= 4 &&
        iteration < maxIterations
      ) {
        const nextReal =
          zr * zr - zi * zi + real;

        zi = 2 * zr * zi + imaginary;
        zr = nextReal;

        iteration++;
      }

      row += characters[iteration];
    }

    rows.push(row);
  }

  return rows.join('\n');
};

// Optional support for the common misspelling:
commands.mandlebrot = commands.mandelbrot;


// ============================================================
// PLASMA
// Usage:
// plasma
// ============================================================

commands.plasma = () => {
  const overlay = createOverlay();
  const output = document.createElement('pre');

  Object.assign(output.style, {
    margin: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    lineHeight: '10px',
    color: 'lime'
  });

  overlay.appendChild(output);
  addCloseInstructions(overlay);

  const characters = ' .:-=+*#%@';
  const width = 90;
  const height = 42;

  let time = 0;
  let animationFrame;
  let running = true;
  let lastUpdate = 0;

  function animate(timestamp) {
    if (!running) return;

    if (timestamp - lastUpdate > 50) {
      lastUpdate = timestamp;

      const rows = [];

      for (let y = 0; y < height; y++) {
        let row = '';

        for (let x = 0; x < width; x++) {
          const value =
            Math.sin(x * 0.18 + time) +
            Math.sin(y * 0.25 + time * 1.3) +
            Math.sin(
              Math.sqrt(
                Math.pow(x - width / 2, 2) +
                Math.pow(y - height / 2, 2)
              ) * 0.22 - time
            );

          const normalized = (value + 3) / 6;

          const index = Math.min(
            characters.length - 1,
            Math.floor(normalized * characters.length)
          );

          row += characters[index];
        }

        rows.push(row);
      }

      output.textContent = rows.join('\n');
      time += 0.12;
    }

    animationFrame = requestAnimationFrame(animate);
  }

  animationFrame = requestAnimationFrame(animate);

  makeClosable(overlay, () => {
    running = false;
    cancelAnimationFrame(animationFrame);
  });

  return 'Plasma field initialized.';
};


// ============================================================
// PASSWORD GENERATOR
// Usage:
// password
// password 24
// password 32 simple
// ============================================================

commands.password = ([requestedLength = '20', mode = 'full']) => {
  const length = Math.min(
    Math.max(parseInt(requestedLength, 10) || 20, 4),
    256
  );

  const characterSets = {
    simple:
      'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',

    full:
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.?'
  };

  const characters =
    characterSets[mode.toLowerCase()] ||
    characterSets.full;

  const randomBytes = new Uint32Array(length);
  crypto.getRandomValues(randomBytes);

  return Array.from(
    randomBytes,
    value => characters[value % characters.length]
  ).join('');
};


// ============================================================
// DICE
// Usage:
// dice
// dice 20
// dice 6 4
//
// dice <sides> <number of dice>
// ============================================================

commands.dice = ([requestedSides = '6', requestedCount = '1']) => {
  const sides = Math.min(
    Math.max(parseInt(requestedSides, 10) || 6, 2),
    1000000
  );

  const count = Math.min(
    Math.max(parseInt(requestedCount, 10) || 1, 1),
    100
  );

  const results = Array.from(
    { length: count },
    () => randomInt(1, sides)
  );

  const total = results.reduce(
    (sum, value) => sum + value,
    0
  );

  return count === 1
    ? `🎲 ${results[0]}`
    : `🎲 ${results.join(', ')}\nTotal: ${total}`;
};


// ============================================================
// COIN FLIP
// Usage:
// coinflip
// coinflip 10
// ============================================================

commands.coinflip = ([requestedCount = '1']) => {
  const count = Math.min(
    Math.max(parseInt(requestedCount, 10) || 1, 1),
    100
  );

  const results = Array.from(
    { length: count },
    () => Math.random() < 0.5 ? 'Heads' : 'Tails'
  );

  if (count === 1) {
    return `🪙 ${results[0]}`;
  }

  const heads = results.filter(
    result => result === 'Heads'
  ).length;

  return [
    results.join(', '),
    `Heads: ${heads}`,
    `Tails: ${count - heads}`
  ].join('\n');
};


// ============================================================
// PANIC
// Usage:
// panic
// ============================================================

  commands.panic = () => {
    const overlay = createOverlay();

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      overflow: hidden;
      padding: clamp(1rem, 4vw, 4rem);
      box-sizing: border-box;
      background: #14001f;
      color: #d7ff00;
      font-family: monospace;
      z-index: 99999;
      cursor: pointer;
    `;

    // Add the panic styles only once.
    if (!document.getElementById('slowPanicStyles')) {
      const style = document.createElement('style');
      style.id = 'slowPanicStyles';

      style.textContent = `
        @keyframes panicUndulate {
          0% {
            transform:
              scale(1.02)
              skewX(-1deg)
              skewY(0.4deg);
            filter:
              hue-rotate(0deg)
              saturate(1.5)
              contrast(1.25);
          }

          25% {
            transform:
              scale(1.07, 0.97)
              skewX(2deg)
              skewY(-1deg);
            filter:
              hue-rotate(35deg)
              saturate(2)
              contrast(1.45);
          }

          50% {
            transform:
              scale(0.98, 1.08)
              skewX(-2deg)
              skewY(1.4deg);
            filter:
              hue-rotate(80deg)
              saturate(2.4)
              contrast(1.6);
          }

          75% {
            transform:
              scale(1.06, 1.01)
              skewX(1.5deg)
              skewY(-0.8deg);
            filter:
              hue-rotate(135deg)
              saturate(1.8)
              contrast(1.35);
          }

          100% {
            transform:
              scale(1.02)
              skewX(-1deg)
              skewY(0.4deg);
            filter:
              hue-rotate(180deg)
              saturate(1.5)
              contrast(1.25);
          }
        }

        @keyframes panicBackgroundDrift {
          0% {
            background-position:
              0% 0%,
              100% 0%,
              50% 100%;
          }

          50% {
            background-position:
              100% 60%,
              0% 100%,
              20% 0%;
          }

          100% {
            background-position:
              0% 0%,
              100% 0%,
              50% 100%;
          }
        }

        @keyframes panicMelt {
          0% {
            transform:
              translateY(0)
              scaleY(1)
              skewX(0deg);
            letter-spacing: 0.02em;
          }

          30% {
            transform:
              translateY(0.15em)
              scaleY(1.08)
              skewX(-1deg);
            letter-spacing: 0.05em;
          }

          60% {
            transform:
              translateY(-0.08em)
              scaleY(0.93)
              skewX(1.5deg);
            letter-spacing: -0.01em;
          }

          100% {
            transform:
              translateY(0)
              scaleY(1)
              skewX(0deg);
            letter-spacing: 0.02em;
          }
        }

        @keyframes panicFloat {
          0% {
            transform: translate3d(-1%, -1%, 0) rotate(-0.5deg);
          }

          50% {
            transform: translate3d(2%, 1.5%, 0) rotate(0.8deg);
          }

          100% {
            transform: translate3d(-1%, -1%, 0) rotate(-0.5deg);
          }
        }

        @keyframes panicChromatic {
          0% {
            text-shadow:
              -5px 0 #ff00d4,
              5px 0 #00ffff,
              0 0 20px #d7ff00;
          }

          50% {
            text-shadow:
              7px 2px #ff6a00,
              -7px -2px #00ff85,
              0 0 35px #9d00ff;
          }

          100% {
            text-shadow:
              -5px 0 #ff00d4,
              5px 0 #00ffff,
              0 0 20px #d7ff00;
          }
        }

        @keyframes panicPulse {
          0%, 100% {
            opacity: 0.65;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.025);
          }
        }

        .slow-panic-field {
          position: absolute;
          inset: -15%;
          background:
            radial-gradient(
              circle at 20% 30%,
              #ff00b7 0%,
              transparent 38%
            ),
            radial-gradient(
              circle at 80% 35%,
              #00f0ff 0%,
              transparent 42%
            ),
            radial-gradient(
              circle at 55% 85%,
              #d7ff00 0%,
              transparent 38%
            ),
            linear-gradient(
              120deg,
              #24003f,
              #ff6a00,
              #002d42,
              #8b00ff
            );

          background-size:
            120% 120%,
            130% 130%,
            150% 150%,
            220% 220%;

          animation:
            panicBackgroundDrift 18s ease-in-out infinite,
            panicUndulate 14s ease-in-out infinite;

          transform-origin: center;
        }

        .slow-panic-liquid {
          position: absolute;
          inset: -10%;
          opacity: 0.58;
          mix-blend-mode: screen;
          pointer-events: none;

          background:
            repeating-radial-gradient(
              ellipse at 40% 50%,
              transparent 0,
              transparent 18px,
              rgba(255, 255, 0, 0.2) 25px,
              transparent 42px
            );

          animation:
            panicFloat 12s ease-in-out infinite alternate,
            panicUndulate 20s ease-in-out infinite;
        }

        .slow-panic-scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.25;

          background:
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(0, 0, 0, 0.55) 4px,
              rgba(0, 0, 0, 0.55) 6px
            );
        }

        .slow-panic-content {
          position: relative;
          z-index: 3;
          max-width: 1100px;
          margin: 0 auto;
          animation: panicFloat 10s ease-in-out infinite alternate;
        }

        .slow-panic-title {
          margin: 0;
          font-size: clamp(4rem, 16vw, 12rem);
          line-height: 0.78;
          font-weight: 900;
          color: #d7ff00;
          animation:
            panicMelt 8s ease-in-out infinite,
            panicChromatic 12s ease-in-out infinite;
        }

        .slow-panic-subtitle {
          margin-top: 1.5rem;
          font-size: clamp(1rem, 2.8vw, 2.2rem);
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          animation: panicPulse 5s ease-in-out infinite;
        }

        .slow-panic-diagnostics {
          margin-top: clamp(2rem, 5vw, 5rem);
          padding: clamp(1rem, 2vw, 2rem);
          border: 3px solid #ff00d4;
          background: rgba(0, 0, 20, 0.38);
          color: #ffffff;
          font-size: clamp(0.8rem, 1.4vw, 1.15rem);
          line-height: 1.6;
          box-shadow:
            10px 10px 0 #00ffff,
            -10px -10px 0 #d7ff00;
          animation: panicMelt 11s ease-in-out infinite reverse;
        }

        .slow-panic-status {
          margin-top: 2rem;
          font-size: clamp(1rem, 2vw, 1.6rem);
          color: #ff6a00;
          animation:
            panicChromatic 9s ease-in-out infinite reverse,
            panicPulse 6s ease-in-out infinite;
        }

        .slow-panic-close {
          position: fixed;
          right: 1.5rem;
          bottom: 1.25rem;
          z-index: 5;
          padding: 0.6rem 0.8rem;
          background: #d7ff00;
          color: #14001f;
          font-size: 0.85rem;
          font-weight: bold;
          box-shadow:
            5px 5px 0 #ff00d4,
            -3px -3px 0 #00ffff;
        }

        @media (prefers-reduced-motion: reduce) {
          .slow-panic-field,
          .slow-panic-liquid,
          .slow-panic-content,
          .slow-panic-title,
          .slow-panic-subtitle,
          .slow-panic-diagnostics,
          .slow-panic-status {
            animation: none !important;
          }
        }
      `;

      document.head.appendChild(style);
    }

    const errorCodes = [
      'TERMINAL_REALITY_FAILURE',
      'SCHWWAAA_OVERFLOW',
      'UNEXPECTED_VIBE_EXCEPTION',
      'TOO_MUCH_COMPUTER',
      'KERNEL_OF_TRUTH_NOT_FOUND',
      'RECURSIVE_SYMBOL_COLLAPSE',
      'ENTROPY_LIMIT_EXCEEDED',
      'NULL_EXISTENCE_POINTER',
      'REALITY_BUFFER_UNDERRUN',
      'PERCEPTION_DESYNCHRONIZED'
    ];

    const states = [
      'SOFTENING',
      'UNFOLDING',
      'BECOMING NONLOCAL',
      'LEAKING SIDEWAYS',
      'PARTIALLY REMEMBERED',
      'UNMOUNTED',
      'MILDLY SENTIENT',
      'OUT OF PHASE',
      'TOO CLOSE',
      'INCOMPATIBLE WITH TUESDAY'
    ];

    const corruptCharacters = [
      '█',
      '▓',
      '▒',
      '░',
      '∆',
      'Ω',
      'Ξ',
      '¤',
      'ø',
      '※'
    ];

    const selectedError = randomItem(errorCodes);

    overlay.innerHTML = `
      <div class="slow-panic-field"></div>
      <div class="slow-panic-liquid"></div>
      <div class="slow-panic-scanlines"></div>

      <main class="slow-panic-content">
        <h1 class="slow-panic-title">PANIC</h1>

        <div class="slow-panic-subtitle">
          A slow terminal emergency is occurring
        </div>

        <pre class="slow-panic-diagnostics" id="slow-panic-diagnostics">ERROR CLASS.......${selectedError}
  STOP CODE.........0x${randomInt(10000000, 99999999)
        .toString(16)
        .toUpperCase()}
  MEMORY ADDRESS....${generateUUID()}
  PROCESS...........DUMBTERM
  REALITY...........${randomItem(states)}
  COLOR SPACE.......HOSTILE
  TIME..............FOLDING
  GEOMETRY..........UNCOOPERATIVE
  RECOVERY..........QUESTIONABLE</pre>

        <div class="slow-panic-status" id="slow-panic-status">
          THE TERMINAL IS LOSING ITS SHAPE
        </div>
      </main>

      <div class="slow-panic-close">
        ESC / CLICK TO RETURN
      </div>
    `;

    const diagnostics = overlay.querySelector(
      '#slow-panic-diagnostics'
    );

    const status = overlay.querySelector(
      '#slow-panic-status'
    );

    const statusMessages = [
      'THE TERMINAL IS LOSING ITS SHAPE',
      'REALITY HAS BECOME TOO SATURATED',
      'THE CURSOR IS MELTING UPWARD',
      'MEMORY IS DEVELOPING TEXTURE',
      'THE COLOR CHANNELS HAVE SEPARATED',
      'THE SYSTEM CAN HEAR THE BACKGROUND',
      'PLEASE REMAIN CONCEPTUALLY STILL',
      'DUMBTERM IS EXPERIENCING DUMBNESS',
      'THE SCREEN IS THINKING TOO LOUDLY',
      'NO IMMEDIATE DANGER HAS BEEN PROVEN'
    ];

    function corruptText(text, amount = 2) {
      const characters = [...text];

      for (let index = 0; index < amount; index++) {
        const position = randomInt(0, characters.length - 1);

        if (
          characters[position] !== '\n' &&
          characters[position] !== ' '
        ) {
          characters[position] = randomItem(corruptCharacters);
        }
      }

      return characters.join('');
    }

    const originalDiagnostics = diagnostics.textContent;

    const statusInterval = setInterval(() => {
      status.textContent = randomItem(statusMessages);
      status.style.transform = `
        translate(
          ${randomInt(-8, 8)}px,
          ${randomInt(-4, 4)}px
        )
        skewX(${randomInt(-3, 3)}deg)
      `;
    }, 2600);

    const corruptionInterval = setInterval(() => {
      diagnostics.textContent = corruptText(
        originalDiagnostics,
        randomInt(1, 4)
      );
    }, 1500);

    const colorInterval = setInterval(() => {
      const hue = randomInt(-25, 25);

      overlay.style.filter = `
        hue-rotate(${hue}deg)
        saturate(${1.5 + Math.random()})
        contrast(${1.1 + Math.random() * 0.5})
      `;
    }, 4000);

    makeClosable(overlay, () => {
      clearInterval(statusInterval);
      clearInterval(corruptionInterval);
      clearInterval(colorInterval);
    });

    return 'Panic is unfolding slowly.';
  };
// ============================================================
// MOVIE CHOICE
//
// Use commas or vertical bars:
//
// movie Alien, Heat, Arrival
// movie The Thing | Brazil | Videodrome
// ============================================================

commands.movie = args => {
  const inputText = args.join(' ').trim();

  if (!inputText) {
    return [
      'Usage:',
      'movie Alien, Heat, Arrival',
      'movie The Thing | Brazil | Videodrome'
    ].join('\n');
  }

  const movies = inputText
    .split(/[|,]/)
    .map(movie => movie.trim())
    .filter(Boolean);

  if (movies.length < 2) {
    return 'Please provide at least two movies separated by commas or | characters.';
  }

  const selection = randomItem(movies);

  return [
    'Tonight you are watching:',
    '',
    `🎬 ${selection}`,
    '',
    `Selected from ${movies.length} movies.`
  ].join('\n');
};

// Alternate command names:
commands.movies = commands.movie;
commands.choosemovie = commands.movie;


// ============================================================
// ECHO
//
// returns the text you typed back
//
// ============================================================

  commands.echo = args => {
    return
    (args) => args.join(' ')
  }


// ============================================================
// CLEAR
//
// Usimply clears the terminal
//
// ============================================================

  commands.clear = () => { terminal.innerHTML = ''; return ''; }

// ============================================================
// Fortune
//
// Tells a cryptic fortune
//
// movie Alien, Heat, Arrival
// movie The Thing | Brazil | Videodrome
// ============================================================

commands.fortune = ([category = 'random']) => {
  const fortunes = [
      'A small decision today will open a large door tomorrow.',
      'Your next strange idea is worth following.',
      'Someone will notice the work you thought went unseen.',
      'A delayed opportunity is still an opportunity.',
      'The answer will arrive while you are working on something else.',
      'Your persistence is about to look like luck.',
      'A useful coincidence is approaching.',
      'The project you nearly abandoned still has something to say.',
      'Today favors experiments over perfection.',
      'You are closer than your current perspective allows you to see.',
      'The machine remembers a future you have not built yet.',
      'A quiet signal is hiding beneath the noise.',
      'Do not trust the third blinking light.',
      'The hallway was longer yesterday.',
      'A forgotten file contains the beginning of something important.',
      'Your reflection has submitted a feature request.',
      'The radio will answer, but not in words.',
      'A door marked EXIT may actually be an entrance.',
      'The next error message is trying to help you.',
      'Something in the static recognizes you.',
      'Commit early. Regret asynchronously.',
      'The bug is not where you are currently looking.',
      'A restart will fix the symptom, not the cause.',
      'Your future self requests better comments.',
      'The prototype already knows what the final version needs.',
      'One dependency will betray you before sunset.',
      'The documentation is technically correct.',
      'A missing semicolon is innocent this time.',
      'The simplest solution will arrive after the most complicated one.',
      'Back up the folder before you become emotionally attached.',
      'The process is still running.',
      'Someone has already used this command.',
      'The terminal knows what you deleted.',
      'You will soon receive an unexpected response.',
      'The warning was not meant for you. Probably.',
      'A familiar file will appear in an unfamiliar place.',
      'Do not refresh the page at midnight.',
      'The next choice cannot be undone with Ctrl+Z.',
      'There are more users connected than the system reports.',
      'The cursor is waiting for you to look away.',
      'Finish one small thing before starting another large thing.',
      'Write down the next step while it is obvious.',
      'Make the first version easier, not better.',
      'Save a copy before making the interesting change.',
      'Name the problem before trying another solution.',
      'Test the smallest piece that could be broken.',
      'Remove one feature and see whether the idea improves.',
      'Stop optimizing what has not yet worked.',
      'A ten-minute experiment is better than an hour of guessing.',
      'Today, clarity is more valuable than speed.'
  ];

  const luckyNumbers = Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 99) + 1
  );

  const signs = [
    'STATIC',
    'SIGNAL',
    'VOID',
    'CIRCUIT',
    'MOON',
    'ECHO',
    'NEON',
    'MACHINE'
  ];

  const fortune =
    fortunes[Math.floor(Math.random() * fortunes.length)];

  const sign =
    signs[Math.floor(Math.random() * signs.length)];

  return [
    '╔════════════════════════════════════════╗',
    '║          SCHWWAAA ORACLE v1.0          ║',
    '╚════════════════════════════════════════╝',
    '',
    `"${fortune}"`,
    '',
    `SIGN: ${sign}`,
    `LUCKY NUMBERS: ${luckyNumbers.join(' · ')}`,
    `ENTROPY: ${Math.floor(Math.random() * 100)}%`
  ].join('\n');
};



// ============================================================
// ABOUT
//
// about dumbterm
//
// ============================================================

  commands.about = () => `
    ██████╗ ██╗   ██╗███╗   ███╗██████╗
    ██╔══██╗██║   ██║████╗ ████║██╔══██╗
    ██║  ██║██║   ██║██╔████╔██║██████╔╝
    ██║  ██║██║   ██║██║╚██╔╝██║██╔══██╗
    ██████╔╝╚██████╔╝██║ ╚═╝ ██║██████╔╝
    ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═════╝

                    t e r m

    Post-symbolic Recursive Execution Kernel
    Revision 17.4

    Current Runtime:

    CPU ........ Browser
    RAM ........ Sufficient
    Threads .... Unknown
    Status ..... Mounted

    The system is operating within nominal
    parameters.

  `;
