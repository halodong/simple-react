import React from "./react";
import ReactDOM from "./react-dom";

function FncComponent(props) {
  return <div>hello{props.name}</div>;
}
function FncComponent1(props) {
  return<FncComponent name="fnc"/>;
}

const ReactEl = <FncComponent1 />;
console.log(ReactEl);

ReactDOM.render(ReactEl, document.getElementById("root"));
