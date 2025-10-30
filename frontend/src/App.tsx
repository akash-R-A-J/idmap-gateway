import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Login } from "./components/login";
import { Register } from "./components/register";
import { SendTransaction } from "./components/send";

function App() {
  const [publickKey, setPublicKey] = useState<string>("");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register setPublicKey={setPublicKey} />} />
        <Route path="/signin" element={<Login />} />
        <Route
          path="/transfer"
          element={<SendTransaction publicKey={publickKey} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
