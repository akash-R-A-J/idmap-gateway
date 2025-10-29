import { startRegistration } from "@simplewebauthn/browser";
import axios from "axios";
import React, { useState } from "react";


export const Register = () => {
  const [email, setEmail] = useState<string>("");

  // create credential for webauthn during registration
  // also create partial private key during registration
  async function handleClick() {
    try {
      // register the user
      const response = await axios.post(
        "http://localhost:5000/api/v1/register",
        {
          email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("response", response.data);

      // register with webauthn [get the challenge]
      const resOtps = await axios.get(
        "http://localhost:5000/api/v1/register-options",
        {
          headers: {
            "Content-Type": "application/json",
            token: response.data.token,
          },
        }
      );

      console.log("got challenge", resOtps);
      // solve the challenge
      const attResp = await startRegistration(resOtps.data.options);

      // verify the challenge
      const verifyResp = await axios.post(
        "http://localhost:5000/api/v1/register-verify",
        attResp,
        {
          headers: {
            "Content-Type": "application/json",
            token: response.data.token,
          },
        }
      );

      const result = verifyResp.data;
      console.log("registration verified", result);
      
      alert(response.data.message);

      // clear the input field
      setEmail("");
    } catch (error) {
      console.error("server error", error);
    }
  }

  return (
    <div className="bg-gray-700 w-100 flex flex-col items-center gap-4 p-2 m-2 py-10 rounded-md">
      <InputField type="email" placeholder="Email" handleChange={setEmail} />

      <button
        onClick={handleClick}
        className="bg-gray-800 px-6 py-2 rounded-md text-gray-100 cursor-pointer"
      >
        Register
      </button>
    </div>
  );
};

export const InputField = ({
  type,
  placeholder,
  handleChange,
}: {
  type: string;
  placeholder: string;
  handleChange: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <input
      type={type}
      name={type}
      id={type}
      placeholder={placeholder}
      required
      className="bg-gray-500 w-60 border-md text-gray-100 px-4 py-2 rounded-md"
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};
