import { REACT_ELEMENT } from "./constants";
function createElement(type, config, children) {
  const props = { ...config };
  let ref, key;
  if (config) {
    ref = config.ref || null;
    key = config.key || null;
    delete config.ref;
    delete config.key;
  }
  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2);
  } else if (arguments.length === 3) {
    props.children = children;
  }
  return {
    $$typeof: REACT_ELEMENT,
    props,
    type,
    ref,
    key,
  };
}

const React = {
  createElement,
};

export default React;
