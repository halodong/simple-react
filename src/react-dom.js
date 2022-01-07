import { REACT_TEXT, REACT_FORWARD_REF, MOVE, PLACEMENT, REACT_CONTEXT, REACT_PROVIDER, REACT_MEMO } from "./constants";
import { addEvent } from './event';

let hookStates = [];
let hookIndex = 0;
let scheduleUpdate;

function render(vdom, container) {
    mount(vdom, container);
    scheduleUpdate = () => {
        hookIndex = 0;
        compareTwoVdom(container, vdom, vdom);
    }
}
export function useState(initialState) {
    return useReducer(null, initialState)
}
export function useReducer(reducer, initialState) {
    hookStates[hookIndex] = hookStates[hookIndex] || initialState;
    let currentIndex = hookIndex;
    function dispatch(action) {
        if (typeof action === 'function') {
            action = action(hookStates[currentIndex]);
        }
        hookStates[currentIndex] = reducer ? reducer(hookStates[currentIndex], action) : action;
        scheduleUpdate();
    }
    return [hookStates[hookIndex++], dispatch];
}
export function useMemo(factory, deps) {
    if (hookStates[hookIndex]) {
        // update render
        let [lastMemo, lastDeps] = hookStates[hookIndex];
        let allTheSame = deps.every((item, index) => item === lastDeps[index]);
        if (allTheSame) {
            hookIndex++;
            return lastMemo;
        } else {
            let newMemo = factory();
            hookStates[hookIndex++] = [newMemo, deps];
            return newMemo;
        }
    } else {
        // first render
        let newMemo = factory();
        hookStates[hookIndex++] = [newMemo, deps];
        return newMemo;
    }
}
export function useCallback(callback, deps) {
    if (hookStates[hookIndex]) {
        let [lastCallback, lastDeps] = hookStates[hookIndex];
        let allTheSame = deps.every((item, index) => item === lastDeps[index]);
        if (allTheSame) {
            hookIndex++;
            return lastCallback;
        } else {
            hookStates[hookIndex++] = [callback, deps];
            return callback;
        }
    } else {
        hookStates[hookIndex++] = [callback, deps];
        return callback;
    }
}
export function useEffect(callback, deps) {
    let currentIndex = hookIndex;
    if (hookStates[hookIndex]) {
        let [destroy, lastDeps] = hookStates[hookIndex];
        let allTheSame = deps && deps.every((item, index) => item === lastDeps[index]);
        if (allTheSame) {
            hookIndex++;
        } else {
            destroy && destroy();
            setTimeout(() => {
                hookStates[currentIndex] = [callback(), deps];
            });
            hookIndex++;
        }
    } else {
        setTimeout(() => {
            hookStates[currentIndex] = [callback(), deps];
        });
        hookIndex++;
    }
}
export function useLayoutEffect(callback, deps) {
    let currentIndex = hookIndex;
    if (hookStates[hookIndex]) {
        let [destroy, lastDeps] = hookStates[hookIndex];
        let allTheSame = deps && deps.every((item, index) => item === lastDeps[index]);
        if (allTheSame) {
            hookIndex++;
        } else {
            destroy && destroy();
            queueMicrotask(() => {
                hookStates[currentIndex] = [callback(), deps];
            });
            hookIndex++;
        }
    } else {
        queueMicrotask(() => {
            hookStates[currentIndex] = [callback(), deps];
        });
        hookIndex++;
    }
}
function mount(vdom, parentDOM) {
    let newDOM = createDOM(vdom);
    if (newDOM) parentDOM.appendChild(newDOM);
    if (newDOM && newDOM.componentDidMount)
        newDOM.componentDidMount();
}

function createDOM(vdom) {
    let { type, props, ref } = vdom;
    let dom;
    if (type && type.$$typeof === REACT_MEMO) {
        return mountMemoComponent(vdom);
    } else if (type && type.$$typeof === REACT_PROVIDER) {
        return mountProviderComponent(vdom);
    } else if (type && type.$$typeof === REACT_CONTEXT) {
        return mountContextComponent(vdom);
    } else if (type && type.$$typeof === REACT_FORWARD_REF) {
        return mountForwardComponent(vdom);
    } else if (type === REACT_TEXT) {
        dom = document.createTextNode(props.content);
    } else if (typeof type === 'function') {
        if (type.isReactComponent) {
            return mountClassComponent(vdom);
        } else {
            return mountFunctionComponent(vdom);
        }
    } else if (typeof type === 'string') {
        dom = document.createElement(type);
    }
    if (props) {
        updateProps(dom, {}, props);
        let children = props.children;
        if (typeof children === 'object' && children.type) {
            props.children.mountIndex = 0;
            mount(children, dom)
        } else if (Array.isArray(children)) {
            reconcileChildren(children, dom);
        }
    }
    vdom.dom = dom;
    if (ref) ref.current = dom;
    return dom;
}
function mountMemoComponent(vdom) {
    let { type, props } = vdom;
    let renderVdom = type.type(props);
    vdom.prevProps = props;
    vdom.oldRenderVdom = renderVdom;
    if (!renderVdom) return null;
    return createDOM(renderVdom);
}
function mountProviderComponent(vdom) {
    let { type, props } = vdom;
    let context = type._context;
    context._currentValue = props.value;
    let renderVdom = props.children;
    vdom.oldRenderVdom = renderVdom;
    if (!renderVdom) return null;
    return createDOM(renderVdom);
}
function mountContextComponent(vdom) {
    //type = {$$typeof: REACT_CONTEXT,_context: context}
    let { type, props } = vdom;
    let context = type._context;
    let renderVdom = props.children(context._currentValue);
    vdom.oldRenderVdom = renderVdom;
    if (!renderVdom) return null;
    return createDOM(renderVdom);
}
function mountForwardComponent(vdom) {
    let { type, props, ref } = vdom;
    let renderVdom = type.render(props, ref);
    if (!renderVdom) return null;
    return createDOM(renderVdom);
}
function mountClassComponent(vdom) {
    let { type: ClassComponent, props, ref } = vdom;
    let classInstance = new ClassComponent(props);
    if (ClassComponent.contextType) {
        classInstance.context = ClassComponent.contextType._currentValue;
    }
    vdom.classInstance = classInstance;
    if (ref) ref.current = classInstance;
    if (classInstance.componentWillMount) {
        classInstance.componentWillMount();
    }
    let renderVdom = classInstance.render();
    vdom.oldRenderVdom = classInstance.oldRenderVdom = renderVdom;
    if (!renderVdom) return null;
    let dom = createDOM(renderVdom);
    if (classInstance.componentDidMount) {
        dom.componentDidMount = classInstance.componentDidMount.bind(classInstance);
    }
    return dom;
}
function mountFunctionComponent(vdom) {
    let { type: functionComponent, props } = vdom;
    let renderVdom = functionComponent(props);
    vdom.oldRenderVdom = renderVdom;
    if (!renderVdom) return null;
    return createDOM(renderVdom);
}
function reconcileChildren(children, parentDOM) {
    children.forEach((childVdom, index) => {
        childVdom.mountIndex = index;
        mount(childVdom, parentDOM)
    });
}
function updateProps(dom, oldProps, newProps) {
    for (let key in newProps) {
        if (key === 'children') {
            continue;
        } else if (key === 'style') {
            let styleObj = newProps[key];
            for (let attr in styleObj) {
                dom.style[attr] = styleObj[attr];
            }
        } else if (/^on[A-Z].*/.test(key)) {
            addEvent(dom, key.toLowerCase(), newProps[key]);
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

export function compareTwoVdom(parentDOM, oldVdom, newVdom, nextDOM) {
    if (!oldVdom && !newVdom) {
        return;
    } else if (oldVdom && !newVdom) {
        unMountVdom(oldVdom);
    } else if (!oldVdom && newVdom) {
        mountVdom(parentDOM, newVdom, nextDOM);
    } else if (oldVdom && newVdom && oldVdom.type !== newVdom.type) {
        unMountVdom(oldVdom);
        mountVdom(parentDOM, newVdom, nextDOM);
    } else {
        updateElement(oldVdom, newVdom);
    }
}
function  updateElement(oldVdom, newVdom) {
    if (oldVdom.type.$$typeof === REACT_MEMO) {
        updateMemoComponent(oldVdom, newVdom);
    } else if (oldVdom.type.$$typeof === REACT_CONTEXT) {
        updateContextComponent(oldVdom, newVdom);
    } else if (oldVdom.type.$$typeof === REACT_PROVIDER) {
        updateProviderComponent(oldVdom, newVdom);
    } else if (oldVdom.type === REACT_TEXT && newVdom.type === REACT_TEXT) {
        let currentDOM = newVdom.dom = findDOM(oldVdom);
        currentDOM.textContent = newVdom.props.content;
    } else if (typeof oldVdom.type === 'string') {
        let currentDOM = newVdom.dom = findDOM(oldVdom);
        updateProps(currentDOM, oldVdom.props, newVdom.props);
        updateChildren(currentDOM, oldVdom.props.children, newVdom.props.children);
    } else if (typeof oldVdom.type === 'function') {
        if (oldVdom.type.isReactComponent) {
            newVdom.classInstance = oldVdom.classInstance;
            updateClassComponent(oldVdom, newVdom);
        } else {
            updateFunctionComponent(oldVdom, newVdom);
        }
    }
}
function updateMemoComponent(oldVdom, newVdom) {
    let { type, prevProps } = oldVdom;
    if (!type.compare(prevProps, newVdom.props)) {
        let oldDOM = findDOM(oldVdom);
        let parentDOM = oldDOM.parentNode;
        let { type, props } = newVdom;
        let renderVdom = type.type(props);
        compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
        newVdom.prevProps = props;
        newVdom.oldRenderVdom = renderVdom;
    } else {
        newVdom.prevProps = prevProps;
        newVdom.oldRenderVdom = oldVdom.oldRenderVdom;
    }
}
function updateProviderComponent(oldVdom, newVdom) {
    let oldDOM = findDOM(oldVdom);
    let parentDOM = oldDOM.parentNode;
    let { type, props } = newVdom;
    let context = type._context;
    context._currentValue = props.value;
    let renderVdom = props.children;
    compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
    newVdom.oldRenderVdom = renderVdom;
}
function updateContextComponent(oldVdom, newVdom) {
    let oldDOM = findDOM(oldVdom);
    let parentDOM = oldDOM.parentNode;
    let { type, props } = newVdom;
    let context = type._context;
    let renderVdom = props.children(context._currentValue);
    compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, renderVdom);
    newVdom.oldRenderVdom = renderVdom;
}

function updateClassComponent(oldVdom, newVdom) {
    let classInstance = newVdom.classInstance = oldVdom.classInstance;
    if (classInstance.componentWillReceiveProps) {
        classInstance.componentWillReceiveProps(newVdom.props);
    }
    classInstance.updater.emitUpdate(newVdom.props);
}

function updateFunctionComponent(oldVdom, newVdom) {
    let parentDOM = findDOM(oldVdom).parentNode;
    let { type, props } = newVdom;
    let newRenderVdom = type(props);
    compareTwoVdom(parentDOM, oldVdom.oldRenderVdom, newRenderVdom);
    newVdom.oldRenderVdom = newRenderVdom
}
function updateChildren(parentDOM, oldVChildren, newVChildren) {

    oldVChildren = (Array.isArray(oldVChildren) ? oldVChildren : [oldVChildren]).filter(item => item);
    newVChildren = (Array.isArray(newVChildren) ? newVChildren : [newVChildren]).filter(item => item);
    let keyedOldMap = {};
    oldVChildren.forEach((oldVChild, index) => {
        let oldKey = oldVChild.key ? oldVChild.key : index;
        keyedOldMap[oldKey] = oldVChild;
    });
    let patch = [];
    let lastPlacedIndex = 0;
    newVChildren.forEach((newVChild, index) => {
        newVChild.mountIndex = index;
        let newKey = newVChild.key ? newVChild.key : index;
        let oldVChild = keyedOldMap[newKey];
        if (oldVChild) {
            updateElement(oldVChild, newVChild);
            if (oldVChild.mountIndex < lastPlacedIndex) {
                patch.push({
                    type: MOVE,
                    oldVChild,
                    newVChild,
                    mountIndex: index
                });
            }
            delete keyedOldMap[newKey];
            lastPlacedIndex = Math.max(oldVChild.mountIndex, lastPlacedIndex);
        } else {
            patch.push({
                type: PLACEMENT,
                newVChild,
                mountIndex: index
            });
        }
    });
    let moveChildren = patch.filter(action => action.type === MOVE).map(action => action.oldVChild);
    Object.values(keyedOldMap).concat(moveChildren).forEach(oldVChild => {
        let currentDOM = findDOM(oldVChild);
        parentDOM.removeChild(currentDOM);
    });
    patch.forEach(action => {
        let { type, oldVChild, newVChild, mountIndex } = action;
        let childNodes = parentDOM.childNodes;
        if (type === PLACEMENT) {
            let newDOM = createDOM(newVChild);
            let childNode = childNodes[mountIndex];
            if (childNode) {
                parentDOM.insertBefore(newDOM, childNode);
            } else {
                parentDOM.appendChild(newDOM);
            }
        } else if (type === MOVE) {
            let oldDOM = findDOM(oldVChild);
            let childNode = childNodes[mountIndex];
            if (childNode) {
                parentDOM.insertBefore(oldDOM, childNode);
            } else {
                parentDOM.appendChild(oldDOM);
            }
        }

    })

}
function mountVdom(parentDOM, vdom, nextDOM) {
    let newDOM = createDOM(vdom);
    if (nextDOM) {
        parentDOM.insertBefore(newDOM, nextDOM);
    } else {
        parentDOM.appendChild(newDOM);
    }
    if (newDOM.componentDidMount) {
        newDOM.componentDidMount();
    }
}

function unMountVdom(vdom) {
    let { props, ref } = vdom;
    let currentDOM = findDOM(vdom);
    if (vdom.classInstance && vdom.classInstance.componentWillUnmount) {
        vdom.classInstance.componentWillUnmount();
    }
    if (ref) {
        ref.current = null;
    }
    if (props.children) {
        let children = Array.isArray(props.children) ? props.children : [props.children]
        children.forEach(unMountVdom);
    }
    if (currentDOM) currentDOM.parentNode.removeChild(currentDOM);
}

export function findDOM(vdom) {
    if (!vdom) return null;
    if (vdom.dom) {
        return vdom.dom;;
    } else {
        return findDOM(vdom.oldRenderVdom);
    }
}
const ReactDOM = {
    render,
    createPortal: render
}
export default ReactDOM;