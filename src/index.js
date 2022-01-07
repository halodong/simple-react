import React from "./react";
import ReactDOM from "./react-dom";

class ClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: props.name };
  }
  render() {
    return <div>hello{this.props.name}</div>;
  }
}
const ReactEl = <ClassComponent name="ni" />;
console.log(ReactEl);

ReactDOM.render(ReactEl, document.getElementById("root"));
