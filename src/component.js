export let updateQueue = {
  isBatchingUpdate: false, //来控制更新是同步还是异步
  updaters: new Set(), //更新的数组
  batchUpdate() {
    //批量更新
    for (var updater of updateQueue.updaters) {
      updater.updateComponent();
    }
    updateQueue.isBatchingUpdate = false;
    updateQueue.updaters.clear();
  },
};
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
      //说明当前处于批量列新模式
      updateQueue.updaters.add(this);
    } else {
      this.updateComponent();
    }
  }

  //基于老状态和pendingStates获取新状态
  getState() {
    let { classInstance, pendingStates } = this;
    let { state } = classInstance; //老状态
    pendingStates.forEach((nextState) => {
      if (typeof nextState === "function") {
        nextState = nextState(state);
      }
      state = { ...state, ...nextState };
    });
    pendingStates.length = 0;
    return state;
  }
}

class Component {
  static isReactComponent = true;
  constructor(props) {
    this.props = props;
    this.state = {};
    this.updater = new Updater(this);
  }
}

export { Component };
