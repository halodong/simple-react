import React from "./react";
import ReactDOM from "./react-dom";

class ClassComponent extends React.Component {
  constructor(props){
    super()
    this.props = props
  }
  render() {
    return <div>hello{this.props.name}</div>;
  }
}
const ReactEl = <ClassComponent name="ni"/>;
console.log(ReactEl);

ReactDOM.render(ReactEl, document.getElementById("root"));
