import React from "react";
import ReactDOM from "react-dom";
import myReact from "./react";
import myReactDOM from "./react-dom";
const ReactEl = React.createElement("h1", { id: "title" }, "hello");
const ReactEl1 = myReact.createElement("h1", { id: "title" }, "hello");
console.log(ReactEl, ReactEl1);
ReactDOM.render(ReactEl, document.getElementById("root"));
myReactDOM.render(ReactEl1, document.getElementById("root"));
