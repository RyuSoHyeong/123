import { createSplash, setSplashProgress, hideSplash, loadAssets } from './assets/scripts/loader.js';

const canvas = document.getElementById('application-canvas');
window.focus();

const app = new pc.Application(canvas, {
    mouse: new pc.Mouse(canvas),
    touch: new pc.TouchDevice(canvas),
    keyboard: new pc.Keyboard(window),
    graphicsDeviceOptions: {
        alpha: true,
        devicePixelRatio: false,
        antialias: false
    }
});

app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);

const createOptions = new pc.AppOptions();
createOptions.mouse = new pc.Mouse(document.body);
createOptions.touch = new pc.TouchDevice(document.body);
createOptions.elementInput = new pc.ElementInput(canvas);

createOptions.componentSystems = [
    pc.RenderComponentSystem,
    pc.CameraComponentSystem,
    pc.ScreenComponentSystem,
    pc.ButtonComponentSystem,
    pc.ElementComponentSystem
];

app.mouse = new pc.Mouse(canvas);
app.touch = new pc.TouchDevice(canvas);
app.elementInput = new pc.ElementInput(canvas, {
    useMouse: true,
    useTouch: true
});

const ua = navigator.userAgent;
if (/Quest/.test(ua) && /OculusBrowser/.test(ua)) {
    app.graphicsDevice.maxPixelRatio = 0.6;
} else {
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio, 1.5);
};

app.loader.addHandler("font", new pc.FontHandler(app.graphicsDevice));
app.setCanvasFillMode(pc.FILLMODE_NONE);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);
app.on('destroy', () => {
    window.removeEventListener('resize', resize);
});

const assetMap = {
};

const scriptAssets = [
    new pc.Asset("xrcontroller", "script", { url: "assets/scripts/XRController.js" }),
    new pc.Asset("taprecenter", "script", { url: "assets/scripts/taprecenter.js" })
];

scriptAssets.forEach(asset => app.assets.add(asset));
Object.values(assetMap).forEach(asset => app.assets.add(asset));

const assetList = [
    { asset: scriptAssets[0], size: 4 * 1024 },
    { asset: scriptAssets[1], size: 1024 }
];

initApp();

async function initApp() {
    createSplash();

    await loadAssets(app, assetList, null, setSplashProgress);

    hideSplash();
    document.getElementById("start-screen").style.display = "flex";

    document.getElementById("start-AR")?.addEventListener("click", async () => {        
        document.getElementById("start-screen")?.remove();
        document.getElementById("logo")?.remove();
        startApp();
    });
};

function startApp() {

    createScene();

    function createScene() {

        app.scene.ambientLight = new pc.Color(0.4, 0.4, 0.4);

        const Root = new pc.Entity();
        Root.enabled = true;
        app.root.addChild(Root);

        const Camera = new pc.Entity();
        Camera.addComponent('camera', {
            clearColor: new pc.Color(0, 0, 0, 1),
            clearColorBuffer: true,
            clearDepthBuffer: true,
            frustumCulling: true,
            farClip: 1000
        });
        Root.addChild(Camera);

        const Light = new pc.Entity();
        Light.setPosition(0, 0, 0);
        Light.setEulerAngles(45, 45, 45);
        Light.setLocalScale(1, 1, 1);
        Light.addComponent('light', {
            type: 'directional',
            color: new pc.Color(1, 1, 1),
            intensity: 1,
            castShadows: true,
            shadowUpdateMode: pc.SHADOWUPDATE_REALTIME,
            shadowDistance: 20,
            shadowResolution: 2048,
            shadowBias: 0.2,
            normalOffsetBias: 0.1,
            shadowIntensity: 0.34,
            cascades: 2,
            cascadeDistribution: 0.5,
            bake: true,
            affectDynamic: true,
            affectSpecular: true,
            bakeDir: true
        });
        Root.addChild(Light);

        const target = new pc.Entity();
        target.setPosition(0, 0, -4);
        target.addComponent('render', {
            type: 'box'
        });
        target.setLocalScale(1, 1, 1);
        Root.addChild(target);

        const XRController = new pc.Entity();
        XRController.addComponent("script");
        XRController.script.create("xrcontroller");
        XRController.script.create("taprecenter");
        Root.addChild(XRController);

        hideSplash();
        app.start();
    }
};