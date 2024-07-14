import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import LogIn from "./Login";
import Register from "./Register";
import Home from "./Home";
import Team from "./Team";
import Horario from "./Horario";
import Events from "./Events";
import Chat from "./Chat";
import Tasks from "./Tasks";
import News from "./News";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LogIn />,
  },
  {
    path: "sign-up",
    element: <Register />,
  },
  {
    path: "home",
    element: <Home />,
  },
  {
    path: "team",
    element: <Team />,
  },
  {
    path: "horario",
    element: <Horario />,
  },
  {
    path: "eventos",
    element: <Events />,
  },
  {
    path: "chat",
    element: <Chat />,
  },
  {
    path: "tarefas",
    element: <Tasks />,
  },
  {
    path: "noticias",
    element: <News />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
