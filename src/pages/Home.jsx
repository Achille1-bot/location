import MyNavbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <MyNavbar />
      <div className="container mt-4">
        <h1 className="mb-4">Locations disponibles</h1>
        <p>Ici, nous afficherons la liste des chambres avec un filtre localisation et budget.</p>
      </div>
    </>
  );
}
import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import RoomCard from "../components/RoomCard";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";

export default function Home({ navigate }) {
  const [filters, setFilters] = useState({ city: "", budgetMax: null, status: "all" });
  const [rooms, setRooms] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const buildQuery = useCallback(() => {
    let q = query(collection(db, "rooms"));

    // Filtre ville
    if (filters.city) q = query(q, where("city", "==", filters.city));

    // Filtre statut
    if (filters.status !== "all") q = query(q, where("status", "==", filters.status));

    // Budget max (<=)
    if (filters.budgetMax) q = query(q, where("pricePerMonth", "<=", filters.budgetMax));

    // Tri par récent
    q = query(q, orderBy("createdAt", "desc"), limit(12));
    return q;
  }, [filters]);

  const fetchFirst = useCallback(async () => {
    setLoading(true);
    const q = buildQuery();
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setRooms(list);
    setCursor(snap.docs[snap.docs.length - 1] || null);
    setLoading(false);
  }, [buildQuery]);

  const fetchMore = useCallback(async () => {
    if (!cursor) return;
    setLoading(true);
    let q = buildQuery();
    q = query(q, startAfter(cursor));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setRooms(prev => [...prev, ...list]);
    setCursor(snap.docs[snap.docs.length - 1] || null);
    setLoading(false);
  }, [cursor, buildQuery]);

  useEffect(() => { fetchFirst(); }, [filters, fetchFirst]);

  return (
    <div className="container">
      <h1>Locations (chambres & appartements)</h1>
      <SearchBar onChange={setFilters} />

      {loading && rooms.length === 0 && <p>Chargement…</p>}

      <div className="grid">
        {rooms.map(r => (
          <RoomCard key={r.id} room={r} onClick={() => navigate(`/room/${r.id}`)} />
        ))}
      </div>

      <div className="more">
        {cursor && <button onClick={fetchMore} disabled={loading}>{loading ? "…" : "Charger plus"}</button>}
      </div>
    </div>
  );
}