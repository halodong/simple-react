import { REACT_TEXT } from "./constants";

function render(vdom, container) {
  mount(vdom, container);
}

function mount(vdom, container) {
  let newDOM = createDOM(vdom);
  container.appendChild(newDOM);
}

function createDOM(vdom) {
  const { type, props } = vdom;
  let dom;
  if (type === REACT_TEXT) {
    dom = document.createTextNode(props.content);
  } else if (typeof type === "function") {
    if (type.isReactComponent) {
      dom = mountClassComponent(vdom);
    } else {
      dom = mountFunctionComponent(vdom);
    }
  } else if (typeof type === "string") {
    dom = document.createElement(type);
  }
  if (props) {
    updateProps(dom, {}, props);
    let children = props.children;
    if (typeof children === "object" && children.type) {
      props.children.mountIndex = 0;
      mount(children, dom);
    } else if (Array.isArray(children)) {
      reconcileChildren(children, dom);
    }
  }
  vdom.dom = dom;
  return dom;
}
function mountClassComponent(vdom) {
  const { type: classComponent, props } = vdom;
  const instance = new classComponent(props);
  return createDOM(instance.render());
}
function mountFunctionComponent(vdom) {
  const { type: functionComponent, props } = vdom;
  const renderVdom = functionComponent(props);
  return createDOM(renderVdom);
}
function reconcileChildren(children, parentDOM) {
  children.forEach((childVdom, index) => {
    childVdom.mountIndex = index;
    mount(childVdom, parentDOM);
  });
}
function updateProps(dom, oldProps, newProps) {
  for (let key in newProps) {
    if (key === "children") {
      //此处不处理子节点
      continue;
    } else if (key === "style") {
      let styleObj = newProps[key];
      for (let attr in styleObj) {
        dom.style[attr] = styleObj[attr];
      }
    } else {
      dom[key] = newProps[key];
    }
  }
  for (let key in oldProps) {
    if (!newProps.hasOwnProperty(key)) {
      dom[key] = null;
    }
  }
}

const ReactDOM = {
  render,
};

export default ReactDOM;
