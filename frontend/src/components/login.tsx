import { startAuthentication } from "@simplewebauthn/browser";
import axios from "axios";
import { useState } from "react";

export const Login = () => {
  const [email, setEmail] = useState<string>("");

  async function handleClick() {
    try {
      // get the challenge
      const response = await axios.post(
        "http://localhost:5000/api/v1/login-options",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("response data after login: ", response.data);

      // sign the challenge
      const asseResp = await startAuthentication(response.data.options);

      // verify the challenge
      const verificationResp = await axios.post(
        "http://localhost:5000/api/v1/login-verify",
        asseResp,
        {
          headers: {
            "Content-Type": "application/json",
            token: response.data.token,
          },
        }
      );

      console.log(verificationResp);
      alert(verificationResp.data.message);
      localStorage.setItem("token", response.data.token);
    } catch (error) {
      console.error("error during login.", error);
    }
  }

  return (
    <div className="bg-gray-700 w-100 h-72 rounded-md flex items-center justify-center">
      <input
        type="email"
        name="email"
        id="email-login"
        className="bg-gray-500 text-gray-100 px-4 py-2 m-2 rounded-md"
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleClick}
        className="bg-gray-800 text-gray-100 px-4 py-2 rounded-md"
      >
        Login
      </button>
    </div>
  );
};
