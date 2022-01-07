
import { compareTwoVdom, findDOM } from './react-dom';
export let updateQueue = {
    isBatchingUpdate: false,
    updaters: new Set(),
    batchUpdate() {
        for (var updater of updateQueue.updaters) {
            updater.updateComponent();
        }
        updateQueue.isBatchingUpdate = false;
        updateQueue.updaters.clear();
    }
}
class Updater {
    constructor(classInstance) {
        this.classInstance = classInstance;
        this.pendingStates = [];
    }
    addState(partialState) {
        this.pendingStates.push(partialState);
        this.emitUpdate();
    }
    emitUpdate(nextProps) {
        this.nextProps = nextProps;
        if (updateQueue.isBatchingUpdate) {
            updateQueue.updaters.add(this);
        } else {
            this.updateComponent();
        }
    }
    updateComponent() {
        let { nextProps, classInstance, pendingStates } = this;
        if (nextProps || pendingStates.length > 0) {
            shouldUpdate(classInstance, nextProps, this.getState());
        }
    }
    getState() {
        let { classInstance, pendingStates } = this;
        let { state } = classInstance;
        pendingStates.forEach((nextState) => {
            if (typeof nextState === 'function') {
                nextState = nextState(state);
            }
            state = { ...state, ...nextState };
        });
        pendingStates.length = 0;
        return state;
    }
}
function shouldUpdate(classInstance, nextProps, nextState) {
    let willUpdate = true;
    if (classInstance.shouldComponentUpdate
        && !classInstance.shouldComponentUpdate(nextProps, nextState)) {
        willUpdate = false;
    }
    if (willUpdate && classInstance.componentWillUpdate) {
        classInstance.componentWillUpdate();
    }
    if (nextProps) {
        classInstance.props = nextProps;
    }
    classInstance.state = nextState;
    if (willUpdate) {
        classInstance.forceUpdate();
    }
}
class Component {
    static isReactComponent = true
    constructor(props) {
        this.props = props;
        this.state = {};
        this.updater = new Updater(this);
    }
    setState(partialState) {
        this.updater.addState(partialState);
    }
    forceUpdate() {
        let oldRenderVdom = this.oldRenderVdom;
        let oldDOM = findDOM(oldRenderVdom);
        if (this.constructor.contextType) {
            this.context = this.constructor.contextType._currentValue;
        }
        if (this.constructor.getDerivedStateFromProps) {
            let newState = this.constructor.getDerivedStateFromProps(this.props, this.state);
            if (newState) {
                this.state = { ...this.state, ...newState };
            }
        }
        let newRenderVdom = this.render();
        let snapshot = this.getSnapshotBeforeUpdate && this.getSnapshotBeforeUpdate();
        compareTwoVdom(oldDOM.parentNode, oldRenderVdom, newRenderVdom);
        this.oldRenderVdom = newRenderVdom;
        if (this.componentDidUpdate) {
            this.componentDidUpdate(this.props, this.state, snapshot);
        }
    }
}
export {
    Component
};
