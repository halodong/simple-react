import { REACT_TEXT } from "./constants";

function render(vdom, container) {
  mount(vdom, container);
}

function mount(vdom, container) {
  let newDOM = createDOM(vdom);
  container.appendChild(newDOM.dom);
}

function createDOM(vdom) {
  const { type, props } = vdom;
  let dom;
  if (type === REACT_TEXT) {
    dom = document.createTextNode(props.content);
  } else {
    dom = document.createElement(type);
  }
  vdom.dom = dom;
  return vdom;
}

const ReactDOM = {
  render,
};

export default ReactDOM;
