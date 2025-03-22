import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../assets/login.css";
import billingoLogo from "../assets/billingo1.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      
      toast.error("Invalid credentials! Please try again.");
      alert(error,"Invalid credentials! Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      alert(error,"Google Sign-In Failed! Please try again.");
      toast.error("Google Sign-In Failed! Please try again.");
    }
  };

  return (
    <div className="login-container">
      {showSuccess ? (
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
          <div className="success-text">Login Successful!</div>
        </div>
      ) : (
        <div className="card border-0 shadow rounded-3">
          <div className="card-body p-4">
            <img
              src={billingoLogo}
              alt="Billingo"
              id="logo2"
              style={{ height: "40px", cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            />
            <h5 className="card-title text-center mb-4 fw-bold">Sign In</h5>

            <form onSubmit={handleLogin}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>Email address</label>
              </div>
              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label>Password</label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" id="remember-pass" type="checkbox" />
                <label className="form-check-label">Remember password</label>
              </div>

              <button className="btn w-100 mb-3" id="button-signin" type="submit">
                Sign In
              </button>

              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={handleGoogleSignIn}
              >
                <i className="fab fa-google"></i> Sign in with Google
              </button>

              <p className="mt-3 text-center">
                New to Billingo? <Link to="/register">Create an account</Link>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;