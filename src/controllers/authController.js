import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const SECRET = process.env.JWT_SECRET || "votre_secret";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exist = await User.findOne({ where: { email } });
    if (exist) return res.status(400).json({ message: "Email déjà utilisé." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ message: "Identifiants invalides." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Identifiants invalides." });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const me = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "Token manquant." });
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email"],
    });
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: "Token invalide." });
  }
};
export const logout = (req, res) => {
  res.json({ message: "Déconnexion réussie." });
};
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "Token manquant." });
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid)
      return res.status(400).json({ message: "Mot de passe incorrect." });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};
