// Standard Events

// Focus Events
export const focusEvents = ['blur', 'focus', 'focusin', 'focusout'];

/**
 * Mouse Events
 * (MouseEvent)[https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent]
 */
export const mouseEvents: (keyof WindowEventMap)[] = [
  'mousedown',
  'dblclick',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'click',
];

/**
 * Wheel Events
 * (WheelEvent)[https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent]
 */
export const wheelEvents: (keyof WindowEventMap)[] = [
  // (WheelEvent)[https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent]
  'wheel',
  'mousewheel',
];

// Input Events
export const inputEvents: (keyof WindowEventMap)[] = [
  'input',
  'invalid',
  'change',
  'reset',
  'select',
  'submit',
];

/**
 * @deprecated
 */
export const formControlsEvents: (keyof WindowEventMap)[] = inputEvents;

// [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
export const keyboardEvents: (keyof WindowEventMap)[] = [
  'keydown',
  'keypress',
  'keyup',
];

// [VR]()
export const vrEvents: (keyof WindowEventMap)[] = [
  'vrdisplayactivate',
  'vrdisplayblur',
  'vrdisplayconnect',
  'vrdisplaydeactivate',
  'vrdisplaydisconnect',
  'vrdisplayfocus',
  'vrdisplaypointerrestricted',
  'vrdisplaypointerunrestricted',
  'vrdisplaypresentchange',
];

// [MSGesture]()
export const mSGestureEvents: (keyof WindowEventMap)[] = [
  'MSGestureChange',
  'MSGestureDoubleTap',
  'MSGestureEnd',
  'MSGestureHold',
  'MSGestureStart',
  'MSGestureTap',
  'MSInertiaStart',
  'MSPointerCancel',
  'MSPointerDown',
  'MSPointerEnter',
  'MSPointerLeave',
  'MSPointerMove',
  'MSPointerOut',
  'MSPointerOver',
  'MSPointerUp',
];

// [xPrint](https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint_event)
export const printEvents: (keyof WindowEventMap)[] = [
  'afterprint',
  'beforeprint',
];
// [network]()
export const networkEvents: (keyof WindowEventMap)[] = ['offline', 'online'];

// [network]()
export const audioEvents: (keyof WindowEventMap)[] = [
  'canplay',
  'canplaythrough',
  'pause',
  'play',
  'playing',
  'volumechange',
];

// Composition Events
export const compositionEvents = [
  'compositionstart',
  'compositionupdate',
  'compositionend',
];

/**
 * Touch Events
 * [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
 * [TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent)
 */
export const touchEvents: (keyof WindowEventMap)[] = [
  // [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
  'pointerover',
  'pointerenter',
  'pointerdown',
  'pointermove',
  // 'pointerrawupdate',
  'pointerup',
  'pointercancel',
  'pointerout',
  'pointerleave',
  'gotpointercapture',
  'lostpointercapture',
  'pointerup',

  // [TouchEvent](https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent)
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',

  // [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)
  'drag',
  'dragend',
  'dragexit',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
];

export const globalEvents: (keyof WindowEventMap)[] = [
  'contextmenu',
  'resize',
  'scroll',

  'abort',
  'load',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'unload',

  'error',
];

export const websocketEvents: (keyof WebSocketEventMap)[] = [
  'close',
  'error',
  'message',
  'open',
];

/**
 * Basic XHR Events
 * [Load](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/load_event)
 * [Error](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/error_event)
 * There are more events you may want to unpatch https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
// XHREvent (group is here to make it easier to target XHR in angular applications. It contains redundant events e.g. 'error')
export const xhrEvents = ['load', 'error'];

// @TODO
export const windowEvents: (keyof WindowEventMap)[] = [
  'compassneedscalibration',
  'durationchange',
  'emptied',
  'ended',

  'orientationchange',

  'ratechange',

  'seeked',
  'seeking',
  'stalled',

  'suspend',
  'timeupdate',
  'waiting',
];

/**
 * All Events combined
 */
export const allEvents: string[] = Array.from(
  new Set([
    ...focusEvents,
    ...mouseEvents,
    ...wheelEvents,
    ...inputEvents,
    ...keyboardEvents,
    ...inputEvents,
    ...vrEvents,
    ...mSGestureEvents,
    ...printEvents,
    ...networkEvents,
    ...audioEvents,
    ...compositionEvents,
    ...touchEvents,
    ...globalEvents,
    ...websocketEvents,
    ...xhrEvents,
    ...windowEvents,
  ])
);
