import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Manager = () => {
  const ref = useRef();
  const passwordRef = useRef();
  const [form, setForm] = useState({ site: "", username: "", password: "" });
  const [passwordsArray, setPasswordsArray] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPasswords = async () => {
    setLoading(true);
    try {
      let req = await fetch("http://localhost:3000/");
      let passwords = await req.json();
      setPasswordsArray(passwords);
    } catch (error) {
      toast.error("Error fetching passwords");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPasswords();
  }, []);

  const showPassword = () => {
    if (ref.current.src.includes("notvisible.png")) {
      ref.current.src = "visible.png";
      passwordRef.current.type = "text";
    } else {
      ref.current.src = "notvisible.png";
      passwordRef.current.type = "password";
    }
  };

  const savePassword = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:3000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: uuidv4() }),
      });
      toast.success("Password saved successfully");
      setPasswordsArray([...passwordsArray, { ...form, id: uuidv4() }]);
      setForm({ site: "", username: "", password: "" });
    } catch (error) {
      toast.error("Error saving password");
    } finally {
      setLoading(false);  
    }
  };

  const deletePassword = async (id) => {
    let confirmDelete = window.confirm("Do you really want to delete this password?");
    if (confirmDelete) {
      setLoading(true);
      try {
        await fetch("http://localhost:3000/", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        setPasswordsArray(passwordsArray.filter(item => item.id !== id));
        toast.success("Password deleted successfully");
      } catch (error) {
        toast.error("Error deleting password");
      } finally {
        setLoading(false);
      }
    }
  };

  const editPassword = (id) => {
    const passwordToEdit = passwordsArray.find(i => i.id === id);
    setForm({ ...passwordToEdit });
    setPasswordsArray(passwordsArray.filter(item => item.id !== id));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const copyText = (text) => {
    toast('Copied to clipboard', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    navigator.clipboard.writeText(text);
  };

  // Function to generate a random password
  const generatePassword = async () => {
    const length = 12; // Length of the password
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    // Save the generated password to the server
    await saveGeneratedPassword(password); // Call the new function
    setForm({ ...form, password }); // Update the form state with the generated password
    toast.success("Generated a new password!");
};

const saveGeneratedPassword = async (password) => {
  setLoading(true);
  try {
      await fetch("http://localhost:3000/generated-passwords", { // New endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, id: uuidv4() }), // Include ID
      });
      toast.success("Generated password saved successfully!");
  } catch (error) {
      toast.error("Error saving generated password");
  } finally {
      setLoading(false);
  }
};

  return (
    <>
      <ToastContainer />
      <div className="relative h-full w-full bg-white">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>
      <div className="mycontainer">
        <h1 className="text-4xl">
          <span className="text-green-500">&lt;</span>
          Pass
          <span className="text-green-500">OP/&gt;</span>
        </h1>
        <p className="text-green-700 text-lg text-center">
          Your password manager
        </p>

        <div className="text-black flex flex-col p-4 text-black gap-8 items-center">
          <input
            name="site"
            value={form.site}
            onChange={handleChange}
            className="rounded-full border border-green-500 w-full p-4 py-1"
            type="text"
            placeholder="Enter the URL of the site"
          />

          <div className="flex w-full justify-between gap-8">
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter the username"
              className="rounded-full border border-green-500 w-full p-4 py-1"
              type="text"
            />

            <div className="relative">
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter the password"
                className="rounded-full border border-green-500 w-full p-4 py-1"
                type="password"
                ref={passwordRef}
              />
              <span
                className="absolute right-0 top-0 cursor-pointer"
                onClick={showPassword}
              >
                <img
                  ref={ref}
                  src="notvisible.png"
                  alt="eye"
                  width={40}
                  className="p-3"
                />
              </span>
            </div>

            <button
              onClick={savePassword}
              className="flex justify-center items-center bg-green-500 rounded-full px-2 py-2 w-fit hover:bg-green-300"
            >
              <lord-icon
                src="https://cdn.lordicon.com/jgnvfzqg.json"
                trigger="hover"
              ></lord-icon>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

          {/* New button to generate a password */}
          <button
            onClick={generatePassword}
            className="flex justify-center items-center bg-blue-500 rounded-full px-2 py-2 w-fit hover:bg-blue-300"
          >
            Generate Password
          </button>

          <div className="passwords">
            <h2 className="font-bold text-xl py-4">Your passwords</h2>
            {passwordsArray.length === 0 && <div>No passwords to show</div>}
            {passwordsArray.length !== 0 && (
              <div className="overflow-auto max-h-60">
                <table className="table-auto w-full rounded-md overflow-hidden">
                  <thead className="bg-green-800 text-white">
                    <tr>
                      <th className="py-2">Website</th>
                      <th className="py-2">Username</th>
                      <th className="py-2">Password</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-green-100">
                    {passwordsArray.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 border border-white text-center w-32">
                          <a href={item.site} target="_blank" rel="noopener noreferrer">
                            {item.site}
                          </a>
                          <div className="cursor-pointer" onClick={() => copyText(item.site)}>
                            <lord-icon
                              src="https://cdn.lordicon.com/depeqmsz.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px", paddingTop: "3px", paddingLeft: "3px" }}
                            ></lord-icon>
                          </div>
                        </td>
                        <td className="py-2 border border-white text-center w-32">
                          {item.username}
                          <div className="cursor-pointer" onClick={() => copyText(item.username)}>
                            <lord-icon
                              src="https://cdn.lordicon.com/depeqmsz.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px", paddingTop: "3px", paddingLeft: "3px" }}
                            ></lord-icon>
                          </div>
                        </td>
                        <td className="py-2 border border-white text-center w-32">
                          <span>{"*".repeat(item.password.length)}</span>
                          <div className="cursor-pointer" onClick={() => copyText(item.password)}>
                            <lord-icon
                              src="https://cdn.lordicon.com/depeqmsz.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px", paddingTop: "3px", paddingLeft: "3px" }}
                            ></lord-icon>
                          </div>
                        </td>
                        <td className="py-2 border border-white text-center w-32">
                          <span className="cursor-pointer" onClick={() => editPassword(item.id)}>
                            <lord-icon
                              src="https://cdn.lordicon.com/qnpnzlkk.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px" }}
                            />
                          </span>
                          <span className="cursor-pointer" onClick={() => deletePassword(item.id)}>
                            <lord-icon
                              src="https://cdn.lordicon.com/skkahier.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px" }}
                            />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Manager;
