import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const users = [
  { email: "admin@test.com", password: "password123", name: "Admin" },
];

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ token: "mock-jwt-token", name: user.name, email: user.email });
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
