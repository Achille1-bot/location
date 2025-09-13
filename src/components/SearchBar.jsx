import { useState, useEffect } from "react";

export default function SearchBar({ onChange }) {
  const [city, setCity] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [status, setStatus] = useState("all"); // all | libre | en_location

  useEffect(() => {
    const h = setTimeout(() => onChange({ city: city.trim(), budgetMax: Number(budgetMax) || null, status }), 300);
    return () => clearTimeout(h);
  }, [city, budgetMax, status, onChange]);

  return (
    <div className="searchbar">
      <input
        type="text"
        placeholder="Ville (ex: Lomé)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <input
        type="number"
        placeholder="Budget max (FCFA)"
        value={budgetMax}
        onChange={(e) => setBudgetMax(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">Tous les statuts</option>
        <option value="libre">Libre</option>
        <option value="en_location">En location</option>
      </select>
    </div>
  );
}