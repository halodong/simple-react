
import { REACT_ELEMENT, REACT_FORWARD_REF, REACT_CONTEXT, REACT_PROVIDER, REACT_MEMO } from './constants';
import { wrapToVdom, shallowEqual } from './utils';
import { Component } from './component';
import { useState, useMemo, useCallback, useReducer, useEffect, useLayoutEffect } from './react-dom';
//https://github1s.com/facebook/react/blob/HEAD/packages/react/src/ReactElement.js#L427-L433
function createElement(type, config, children) {
    let ref, key;
    if (config) {
        delete config.__source;
        delete config.__self;
        ref = config.ref;
        key = config.key;
        delete config.ref;
        delete config.key;
    }
    let props = { ...config };
    if (arguments.length > 3) {
        props.children = Array.prototype.slice.call(arguments, 2).map(wrapToVdom);
    } else if (arguments.length === 3) {
        props.children = wrapToVdom(children);
    }
    return {
        $$typeof: REACT_ELEMENT,
        type,
        ref,
        key,
        props
    }

}
function createRef() {
    return { current: null };
}

function forwardRef(render) {
    return {
        $$typeof: REACT_FORWARD_REF,
        render
    }
}
function createContext() {
    let context = { $$typeof: REACT_CONTEXT, _currentValue: undefined };
    context.Provider = {
        $$typeof: REACT_PROVIDER,
        _context: context
    }
    context.Consumer = {
        $$typeof: REACT_CONTEXT,
        _context: context
    }
    return context;
}
function cloneElement(oldElement, props, children) {
    if (arguments.length > 3) {
        props.children = Array.prototype.slice.call(arguments, 2).map(wrapToVdom);
    } else if (arguments.length === 3) {
        props.children = wrapToVdom(children);
    }
    return { ...oldElement, props };
}
class PureComponent extends Component {
    //https://github1s.com/facebook/react/blob/HEAD/packages/react-reconciler/src/ReactFiberClassComponent.new.js#L308-L314
    shouldComponentUpdate(nextProps, nextState) {
        return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState)
    }
}
function memo(type, compare = shallowEqual) {
    return {
        $$typeof: REACT_MEMO,
        compare,
        type
    }
}
function useContext(context) {
    return context._currentValue;
}
function useRef() {
    return { current: null };
}
function useImperativeHandle(ref, factory) {
    ref.current = factory();
}
const React = {
    createElement,
    Component,
    createRef,
    forwardRef,
    createContext,
    cloneElement,
    PureComponent,
    memo,
    useState,
    useMemo,
    useCallback,
    useReducer,
    useContext,
    useEffect,
    useRef,
    useLayoutEffect,
    useImperativeHandle
}
export default React;
