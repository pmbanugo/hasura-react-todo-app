This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Tutorial

In this tutorial, we're going to build a simple todo application. That'll work as you see below.

![hasura-tutorial.gif](https://ucarecdn.com/15f67a04-4581-4fcd-acf4-3cf73b389330/)

In order to follow along, an understanding of React and GraphQL is required. We will build the frontend with React and the backend to handle the data will run on Hasura Cloud and Postgres hosted on Heroku.

## Setting Up The GraphQL API

We will store our data in a Postgres database and provision a GraphQL API that'll be used to add and modify data. We will use Hasura GraphQL engine to provision a GraphQL API that'll interact with the PostgreSQL database. The Postgres database will be hosted on Heroku, therefore, a Heroku account is needed. Go to [signup.heroku.com/](https://signup.heroku.com/) to create an account if you don't have one.

We will create an instance of Hasura on Hasura Cloud. [Hasura Cloud](https://cloud.hasura.io/) gives you a globally distributed, fully managed, and secure GraphQL API as a service. Go to [cloud.hasura.io/signup](https://cloud.hasura.io/signup) to create an account.

Once you're signed in, you should see a welcome page.

![Hasura Welcome Page](https://graphql-engine-cdn.hasura.io/learn-hasura/assets/graphql-hasura/hasura-cloud-welcome.png)

Select the **Try a free database with Heroku** option. You will get a new window where you have to log in to your Heroku account and grant access to Heroku Cloud. When that's done, Hasura Cloud will create an app on Heroku and install a Postgres add-on in it, then retrieve the Postgres database URL which it'll need to create the Hasura instance.

When the Heroku setup is done, you should click on the **Create Project** button to create an instance of Hasura.

### Create The Data Model and GraphQL Schema

After the project is created, you can open the Hasura console by clicking on the **Launch Console** button.

![console.png](https://ucarecdn.com/ff747d42-2fcb-461d-9da8-d1156b9d12b8/)

This opens the Hasura admin console and it should look like what you see in the image below.

![hasura-console-default.png](https://ucarecdn.com/113ff712-d37f-4640-9b48-c6df7d644004/)

Our next step is to create a table to store the todo items. We will name it `todos` and it'll have three columns. Namely;

| column name | type         |
| ----------- | ------------ |
| id          | Integer (PK) |
| task        | Text         |
| completed   | Boolean      |

In order to create the table on Hasura Console, head over to the _Data_ tab section and click on **Create Table**. Enter the values for the columns as mentioned in the table above, then click the **Add Table** button when you're done.

![hasura todos table.png](https://ucarecdn.com/b7fd0d2b-60f1-445d-9b09-addd5d60f5e6/)

When this is done, the Hasura GraphQL engine will automatically create schema object types and corresponding query/mutation fields with resolvers for the table. At this stage, our GraphQL API is done and we can focus on using it in the React app.

## Bootstrap The React App

With the GraphQL API ready, we can go ahead and create the React app. We will create a new React app using _create-react-app_. To do this, run the command `npx create-react-app hasura-react-todo-app && cd hasura-react-todo-app`.

We need two packages to work with GraphQL, and they're `@apollo/client` and `graphql`. Go ahead and install it by running the command `npm install @apollo/client graphql`. The _graphql_ package provides a function for parsing GraphQL queries, while _@apollo/client_ contains everything you need to set up Apollo Client to query a GraphQL backend. The _@apollo/client_ package includes the in-memory cache, local state management, error handling, and a React-based view layer.

## Create and Connect Apollo Client to your app

Now that we have all the dependencies installed, let's create an instance of `ApolloClient`. You'll need to provide it the URL of the GraphQL API on Hasura Cloud. You will find this URL in the project's console, under the _GraphiQL_ tab.

Open **App.js** and add the following import statement.

```javascript
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
```

Then instantiate `ApolloClient` :

```javascript
const client = new ApolloClient({
  uri: "YOUR_HASURA_GRAPHQL_URL",
  cache: new InMemoryCache(),
});
```

Replace the `uri` property with your GraphQL server URL.

The `client` object will be used to query the server, therefore, we need a way to make it accessible from other components which you will create later. We will do this using `ApolloProvider` which is similar to React's `Context.Provider`. In **App.js**, update the component with this code:

```javascript
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
```

In the code you just added, you wrapped your React app in `ApolloProvider`. This places the `client` on the context, which enables you to access it from anywhere in your component tree. We have two components, `TodoInput` and `Tasks`, which you'll add shortly.

Add import statements for those components.

```javascript
import Tasks from "./Tasks";
import TodoInput from "./TodoInput";
```

Open `App.css` and update the `.App` class as follows

```css
.App {
  text-align: center;
  text-align: -webkit-center;
}
```

Then add a `min-height: 20vh;` style to `.App-header`.

## Add Todo

Now we're going to create a component that'll be used to add new items to the list.

Add a new file **TodoInput.css** with the content below.

```css
.taskInput {
  min-width: 365px;
  margin-right: 10px;
}
```

Then add another file **TodoInput.js** and paste the code below in it.

```javascript
import React, { useState } from "react";
import { useMutation } from "@apollo/client";

import { ADD_TODO, GET_TODOS } from "./graphql/queries";
import "./TodoInput.css";

const updateCache = (cache, { data }) => {
  const existingTodos = cache.readQuery({
    query: GET_TODOS,
  });

  const newTodo = data.insert_todos_one;
  cache.writeQuery({
    query: GET_TODOS,
    data: { todos: [...existingTodos.todos, newTodo] },
  });
};

export default () => {
  const [task, setTask] = useState("");
  const [addTodo] = useMutation(ADD_TODO, { update: updateCache });

  const submitTask = () => {
    addTodo({ variables: { task } });
    setTask("");
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Add a new task"
        className="taskInput"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") submitTask();
        }}
      />
      <button onClick={submitTask}>Add</button>
    </div>
  );
};
```

Here we're using the `useMutation` React hook for executing mutation. We call this hook with the query to run and an update function to update the cache afterward. The `updateCache` function receives the current `cache` and the `data` as arguments. We call `cache.readQuery` to read data from the cache (rather than the server), passing it the GraphQL query string to retrieve the needed data. Then we update the cache for this query (i.e `GET_TODOS`) by calling `cache.writeQuery` with the new value for `todos`.

The `useMutation` hook returns a **mutate function** that you can call at any time to execute the mutation. In our case, it's called `addTodo`. The `addTodo` function is called in the `submitTask` function which is triggered when the _Add_ button is clicked.

Now we have the code to perform the mutation, but we need the actual queries that'll be executed since we referenced `import { ADD_TODO, GET_TODOS } from "./graphql/queries";` on line 4.

Create a new file **queries.js** under a new directory called **graphql**. Then add the following exports to it.

```javascript
import { gql } from "@apollo/client";

export const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      task
      completed
    }
  }
`;

export const ADD_TODO = gql`
  mutation($task: String!) {
    insert_todos_one(object: { task: $task }) {
      id
      task
      completed
    }
  }
`;
```

There you have it! The feature to add todo is done. Next up is to allow users to mark a todo as completed or delete one.

## Remove Todo

Since you still have the **queries.js** file open, go ahead and add two more queries to remove a todo, and to toggle the completed status.

```javascript
export const TOGGLE_COMPLETED = gql`
  mutation($id: Int!, $completed: Boolean!) {
    update_todos_by_pk(
      pk_columns: { id: $id }
      _set: { completed: $completed }
    ) {
      id
    }
  }
`;

export const REMOVE_TODO = gql`
  mutation($id: Int!) {
    delete_todos_by_pk(id: $id) {
      id
    }
  }
`;
```

Now we need a component that'll display a todo item and allow it to be deleted, or marked as complete or incomplete. Add a new file **Task.css** and paste the style definition below in it.

```css
.task {
  margin: 5px;
  border: 1px solid #282c34;
  height: 30px;
  max-width: 40vw;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 5px 10px;
  justify-content: space-between;
}

.completed {
  text-decoration: line-through;
}
```

Add a new file **Task.js** with the code below.

```javascript
import React from "react";
import { useMutation } from "@apollo/client";

import { GET_TODOS, REMOVE_TODO } from "./graphql/queries";
import "./Task.css";

const Task = ({ todo }) => {
  const [removeTodoMutation] = useMutation(REMOVE_TODO);

  const toggleCompleted = ({ id, completed }) => {};

  const removeTodo = (id) => {
    removeTodoMutation({
      variables: { id },
      optimisticResponse: true,
      update: (cache) => {
        const existingTodos = cache.readQuery({ query: GET_TODOS });
        const todos = existingTodos.todos.filter((t) => t.id !== id);
        cache.writeQuery({
          query: GET_TODOS,
          data: { todos },
        });
      },
    });
  };

  return (
    <div key={todo.id} className="task">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleCompleted(todo)}
      />
      <span className={todo.completed ? "completed" : ""}>{todo.task}</span>
      <button type="submit" onClick={() => removeTodo(todo.id)}>
        remove
      </button>
    </div>
  );
};

export default Task;
```

In the code above, we're using the `useMutation` hook for the `REMOVE_TODO` mutation. When the remove button is clicked, we call the `removeTodoMutation` function with the _id_ of what needs to be deleted. Then use the update function to read from the cache, filter the result, and update the cache afterward.

## Toggle Completed State

We will update the `toggleCompleted` function which is already bound to the input control on the page. We get the `id` and `completed` values and can use the `useMutation` function to execute the `TOGGLE_COMPLETED` mutation which we added in the previous section.

Import the `TOGGLE_COMPLETED` query.

```javascript
import { GET_TODOS, TOGGLE_COMPLETED, REMOVE_TODO } from "./graphql/queries";
```

Then generate a mutation function

```javascript
const [removeTodoMutation] = useMutation(REMOVE_TODO);
```

Now, update the `toggleCompleted` function:

```javascript
const toggleCompleted = ({ id, completed }) => {
  toggleCompeletedMutation({
    variables: { id, completed: !completed },
    optimisticResponse: true,
    update: (cache) => {
      const existingTodos = cache.readQuery({ query: GET_TODOS });
      const updatedTodo = existingTodos.todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !completed };
        } else {
          return todo;
        }
      });
      cache.writeQuery({
        query: GET_TODOS,
        data: { todos: updatedTodo },
      });
    },
  });
};
```

## Display A List Of Todos

Now that we can add, display, and delete a todo, we will finally render a list of the todo items from the database. This will be quite a simple component that will query the server using the `GET_TODOS` query we already added, then using the `useQuery` hook to execute the query and pass each todo to the `Task` component for it to be rendered.

Let's start by adding the CSS file. Add a new file **Tasks.css**

```css
.tasks {
  margin-top: 30px;
}
```

Now add a new component file called **Tasks.js**

```javascript
import React from "react";
import { useQuery } from "@apollo/client";

import { GET_TODOS } from "./graphql/queries";
import Task from "./Task";
import "./Tasks.css";

const Tasks = () => {
  const { loading, error, data } = useQuery(GET_TODOS);

  if (loading) {
    return <div className="tasks">Loading...</div>;
  }
  if (error) {
    return <div className="tasks">Error!</div>;
  }

  return (
    <div className="tasks">
      {data.todos.map((todo) => (
        <Task key={todo.id} todo={todo} />
      ))}
    </div>
  );
};

export default Tasks;
```

When this component renders, the `useQuery` hook runs, and a result object is returned that contains `loading`, `error`, and `data` properties. The loading property tells if it has finished executing the query, while the `error` property denotes if it loaded with an error. Then the data property contains the data that we can work with. When the data is loaded, we use the _Array.map_ function to render each todo with the `Task` component.

## Conclusion

At this point, you have a fully functional todo application. You can start it by running the `npm start` command from the command line.

![hasura todos table.png](https://ucarecdn.com/b7fd0d2b-60f1-445d-9b09-addd5d60f5e6/)

With what you've learnt so far, this leaves you empowered to build GraphQL powered-apps using Hasura and Apollo Client. You should now be familiar with Hasura Cloud and Hasura console, and how to connect Apollo Client to your server and use the provided hook functions to simplify querying the API and updating the UI when the data changes.
