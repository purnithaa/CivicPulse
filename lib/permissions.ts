/**
 * Request location permission and get current position (web only).
 * Triggers the browser's native location permission prompt on first use.
 * Use requestLocationWithPermission() from the report page for native/web branching.
 */
export function requestLocationPermission(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("UNSUPPORTED"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

/**
 * Request camera permission by briefly opening the camera stream.
 * Call this before opening the file input for "Take Photo" so the user sees the permission prompt.
 */
export function requestCameraPermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error("UNSUPPORTED"))
  }
  return navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      stream.getTracks().forEach((t) => t.stop())
    })
}
