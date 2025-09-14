import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";

import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import SearchBar from "../components/SearchBar";
import RoomCard from "../components/RoomCard";

export default function Home({ navigate }) {
  // Si Home est rendu par React Router, on utilise useNavigate()
  const nav = useNavigate();
  const goTo = (path) => (navigate ? navigate(path) : nav(path));

  const [filters, setFilters] = useState({
    city: "",
    budgetMax: null,
    status: "all",
  });
  const [rooms, setRooms] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Nettoie/normalise légèrement les filtres avant la requête
  const normalized = useMemo(() => {
    const city = (filters.city || "").trim();
    const budgetMax = filters.budgetMax
      ? Number(String(filters.budgetMax).replace(/\s/g, ""))
      : null;
    const status = filters.status || "all";
    return { city, budgetMax, status };
  }, [filters]);

  const buildQuery = useCallback(() => {
    let q = query(collection(db, "rooms"));

    // Filtre ville (égalité stricte)
    if (normalized.city) q = query(q, where("city", "==", normalized.city));

    // Filtre statut
    if (normalized.status !== "all") {
      q = query(q, where("status", "==", normalized.status));
    }

    // Budget max (<=)
    if (normalized.budgetMax) {
      q = query(q, where("pricePerMonth", "<=", normalized.budgetMax));
    }

    // Tri par récent
    q = query(q, orderBy("createdAt", "desc"), limit(12));
    return q;
  }, [normalized]);

  const fetchFirst = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const q = buildQuery();
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(list);
      setCursor(snap.docs[snap.docs.length - 1] || null);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les chambres. Vérifiez vos règles Firestore et index.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [buildQuery]);

  const fetchMore = useCallback(async () => {
    if (!cursor) return;
    setLoading(true);
    setError("");
    try {
      let q = buildQuery();
      q = query(q, startAfter(cursor));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms((prev) => [...prev, ...list]);
      setCursor(snap.docs[snap.docs.length - 1] || null);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger plus de résultats.");
    } finally {
      setLoading(false);
    }
  }, [cursor, buildQuery]);

  useEffect(() => {
    // Recharge à chaque changement de filtres
    fetchFirst();
  }, [fetchFirst]);

  return (
    <Container className="py-3">
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 mb-3">
        <h1 className="m-0 me-md-auto">Locations</h1>
        <small className="text-muted">Chambres & appartements</small>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="mb-3">
        <SearchBar onChange={setFilters} />
        <div className="form-text">
          Astuce : saisissez une <strong>ville</strong> exacte (ex. “Lomé”) et un
          <strong> budget max</strong>.
        </div>
      </div>

      {/* ÉTAT: ERREUR */}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      {/* ÉTAT: CHARGEMENT INITIAL */}
      {initialLoading && (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {/* LISTE */}
      {!initialLoading && rooms.length > 0 && (
        <>
          <Row className="g-3">
            {rooms.map((r) => (
              <Col key={r.id} xs={12} sm={6} lg={4} xl={3}>
                <RoomCard room={r} onClick={() => goTo(`/room/${r.id}`)} />
              </Col>
            ))}
          </Row>

          <div className="d-flex justify-content-center my-4">
            {cursor && (
              <Button variant="outline-primary" onClick={fetchMore} disabled={loading}>
                {loading ? "Chargement…" : "Charger plus"}
              </Button>
            )}
          </div>
        </>
      )}

      {/* ÉTAT: VIDE */}
      {!initialLoading && rooms.length === 0 && !error && (
        <div className="text-center text-muted my-5">
          <p className="mb-1">Aucun résultat pour ces critères.</p>
          <small>Essayez une autre ville ou augmentez le budget.</small>
        </div>
      )}
    </Container>
  );
}
