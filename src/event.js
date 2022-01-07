import { updateQueue } from "./component";

export function addEvent(dom, eventType, handler) {
  let store = dom.store || (dom.store = {});
  store[eventType] = handler;
  if (!document[eventType]) {
    document[eventType] = dispatchEvent;
  }
}

function dispatchEvent(event) {
  let { target, type } = event;
  let eventType = `on${type}`;
  let syntheticEvent = createSyntheticEvent(event);
  updateQueue.isBatchingUpdate = true;
  while (target) {
    let { store } = target;
    let handler = store && store[eventType];
    handler && handler(syntheticEvent);
    if (syntheticEvent.isPropagationStopped) {
      break;
    }
    target = target.parentNode;
  }
  updateQueue.isBatchingUpdate = false;
  updateQueue.batchUpdate();
}

function createSyntheticEvent(nativeEvent) {
  let syntheticEvent = {};
  for (let key in nativeEvent) {
    syntheticEvent[key] = nativeEvent[key];
  }
  syntheticEvent.nativeEvent = nativeEvent;
  syntheticEvent.isDefaultPrevented = false;
  syntheticEvent.isPropagationStopped = false;
  syntheticEvent.preventDefault = preventDefault;
  syntheticEvent.stopPropagation = stopPropagation;
  return syntheticEvent;
}

function preventDefault() {
  this.defaultPrevented = true;
  const event = this.nativeEvent;
  if (event.preventDefault) {
    event.preventDefault();
  } else {
    //IE
    event.returnValue = false;
  }
  this.isDefaultPrevented = true;
}

function stopPropagation() {
  const event = this.nativeEvent;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    //IE
    event.cancelBubble = true;
  }
  this.isPropagationStopped = true;
}
