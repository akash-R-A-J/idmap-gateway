import "./App.css";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { SendTransaction } from "./components/sendTransaction";

function App() {
  return (
    <div className="bg-gray-900 h-screen flex items-center justify-center">
      <Register />
      <Login />
      <SendTransaction />
    </div>
  );
}

export default App;
