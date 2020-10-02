import React from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";

import Tasks from "./Tasks";
import TodoInput from "./TodoInput";
import logo from "./logo.svg";
import "./App.css";

const client = new ApolloClient({
  uri: "GRAPHQL_ENDPOINT", // TODO: replace with actual URL
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>ToDo App</p>
        </header>
        <br />
        <TodoInput />
        <Tasks />
      </div>
    </ApolloProvider>
  );
}

export default App;
