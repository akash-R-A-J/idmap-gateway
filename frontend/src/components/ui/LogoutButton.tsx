import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("logging out");
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/signin");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 bg-white/10 
                 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200
                 shadow-md shadow-red-500/10 cursor-pointer"
    >
      Logout
    </button>
  );
}
