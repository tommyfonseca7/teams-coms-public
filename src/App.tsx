import React from "react";
import logo from "./assets/aroeira_logo.png";
import { Button } from "./components/ui/button";

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={logo} alt="Logo" className="mb-8 w-32 h-32" />
      <Button className="m-5" variant="outline">
        Login
      </Button>
      <Button className="m-5" variant="outline">
        Register
      </Button>
    </div>
  );
};

export default App;
