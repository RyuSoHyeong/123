// Clean AR with cube + 8th Wall (legacy XR8)
(() => {
  const canvas = document.getElementById('application-canvas');

  // PlayCanvas app (важно: прозрачный фон + WebGL1)
  const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    keyboard: new pc.Keyboard(window),
    graphicsDeviceOptions: {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
      devicePixelRatio: false,
      preferWebGl2: false
    }
  });

  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  window.addEventListener('resize', () => app.resizeCanvas());

  // Камера с прозрачным клиром
  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', {
    clearColor: new pc.Color(0, 0, 0, 0),
    fov: 60
  });
  app.root.addChild(camera);

  // Немного света (не обязательно)
  const light = new pc.Entity('Light');
  light.addComponent('light', { type: 'directional', intensity: 1.2, castShadows: false });
  light.setEulerAngles(45, 30, 0);
  app.root.addChild(light);

  // Корень и куб (замена Playbot)
  const Root = new pc.Entity('Root');
  app.root.addChild(Root);

  const Cube = new pc.Entity('Cube');
  // в v2 используется render-компонент
  Cube.addComponent('render', { type: 'box' });
  Cube.setLocalScale(0.3, 0.3, 0.3);
  Cube.enabled = false; // появится после первого tap
  Root.addChild(Cube);

  // Материал для куба
  const mat = new pc.StandardMaterial();
  mat.diffuse = new pc.Color(0.2, 0.7, 1.0);
  mat.gloss = 0.6;
  mat.useMetalness = false;
  mat.update();
  Cube.render.material = mat;

  app.start();

  // ------- XR8 интеграция -------
  const startBtn = document.getElementById('start-AR');
  startBtn?.addEventListener('click', () => {
    document.getElementById('start-screen')?.remove();

    const onxrloaded = () => {
      XR8.PlayCanvas.run(
        { pcCamera: camera.camera, pcApp: app },
        [
          XRExtras.AlmostThere.pipelineModule(),
          XRExtras.Loading.pipelineModule(),
          XRExtras.RuntimeError.pipelineModule(),
          XR8.XrController.pipelineModule(),     // SLAM
          XR8.GlTextureRenderer.pipelineModule() // видео‑фон
        ],
        {
          canvas,
          webgl2: false,
          allowedDevices: XR8.XrConfig.device().MOBILE
        }
      );

      enableTapToPlaceAndRotate();
    };

    XRExtras.Loading.showLoading({ onxrloaded });
  });

  // ------- Tap‑to‑place + rotate свайпом -------
  function enableTapToPlaceAndRotate() {
    let placed = false;
    let dragging = false;
    let lastX = 0;
    let yaw = 0;

    const clamp01 = v => Math.min(1, Math.max(0, v));
    const norm = (ev) => {
      const t = ev.changedTouches ? ev.changedTouches[0] : ev;
      return { x: clamp01(t.clientX / window.innerWidth), y: clamp01(t.clientY / window.innerHeight) };
    };

    const bestHit = (hits=[]) =>
      hits.find(h => h.type === 'DETECTED_SURFACE') ||
      hits.find(h => h.type === 'ESTIMATED_SURFACE') ||
      hits[0];

    const applyHit = (ent, hit) => {
      ent.setPosition(hit.position.x, hit.position.y, hit.position.z);
      ent.setRotation(new pc.Quat(hit.rotation.x, hit.rotation.y, hit.rotation.z, hit.rotation.w));
    };

    const tryPlace = (nx, ny) => {
      const hits = XR8.XrController.hitTest(nx, ny) || [];
      if (!hits.length) return false;
      const hit = bestHit(hits);
      if (!hit) return false;

      Cube.enabled = true;
      applyHit(Cube, hit);

      if (!placed) {
        placed = true;
        yaw = Cube.getEulerAngles().y || 0;
      }
      return true;
    };

    // tap/click — поставить или перепоставить
    const onTap = (ev) => {
      ev.preventDefault();
      const { x, y } = norm(ev);
      tryPlace(x, y);
    };

    // drag — поворот по Y после размещения
    const onStart = (ev) => {
      if (!placed) return;
      dragging = true;
      lastX = norm(ev).x;
    };

    const onMove = (ev) => {
      if (!placed) {
        // до первого размещения — можно подсвечивать место
        const { x, y } = norm(ev);
        tryPlace(x, y);
        return;
      }
      if (!dragging) return;
      const { x } = norm(ev);
      const dx = x - lastX;
      lastX = x;
      yaw += dx * 180; // чувствительность
      const e = Cube.getEulerAngles();
      Cube.setEulerAngles(e.x, yaw, e.z);
    };

    const onEnd = () => { dragging = false; };

    // события
    window.addEventListener('click', onTap, { passive: false });
    window.addEventListener('touchend', onTap, { passive: false });

    window.addEventListener('mousedown', onStart, { passive: false });
    window.addEventListener('mousemove', onMove,  { passive: false });
    window.addEventListener('mouseup',   onEnd,   { passive: false });

    window.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove',  onMove,  { passive: false });
    window.addEventListener('touchend',   onEnd,   { passive: false });
    window.addEventListener('touchcancel',onEnd,   { passive: false });
  }
})();