/*jshint esversion: 6, asi: true, laxbreak: true*/

// xrcontroller.js: Opens the browser's web camera and runs AR. Attach this to an entity in the
// PlayCanvas scene.

var xrcontroller = pc.createScript('xrcontroller')

// Optionally, world tracking can be disabled to increase efficiency when tracking image targets.
xrcontroller.attributes.add('disableWorldTracking', {type: 'boolean', default: false})

xrcontroller.prototype.initialize = function() {
  const disableWorldTracking = this.disableWorldTracking

  // After XR has fully loaded, open the camera feed and start displaying AR.
  const runOnLoad = ({pcCamera, pcApp}, extramodules) => () => {
    XR8.XrController.configure({disableWorldTracking})
    const config = {
        // Pass in your canvas name. Typically this is 'application-canvas'.
        canvas: document.getElementById('application-canvas')
    }
    XR8.PlayCanvas.run({pcCamera, pcApp}, extramodules, config)
  }

  // Find the camera in the playcanvas scene, and tie it to the motion of the user's phone in the
  // world.
  const pcCamera = XRExtras.PlayCanvas.findOneCamera(this.entity)

  // While XR is still loading, show some helpful things.
  // Almost There: Detects whether the user's environment can support web ar, and if it doesn't,
  //     shows hints for how to view the experience.
  // Loading: shows prompts for camera permission and hides the scene until it's ready for display.
  // Runtime Error: If something unexpected goes wrong, display an error screen.
  XRExtras.Loading.showLoading({onxrloaded: runOnLoad({pcCamera, pcApp: this.app}, [
    // Optional modules that developers may wish to customize or theme.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    XR8.XrController.pipelineModule(),           // Powers the SLAM engine.
  ])})
}