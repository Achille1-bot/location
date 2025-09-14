import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query as qy,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";

import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import SearchBar from "../components/SearchBar";
import RoomCard from "../components/RoomCard";

const FILTERS_KEY = "home.filters.v1";

export default function Home({ navigate }) {
  const nav = useNavigate();
  const goTo = (path) => (navigate ? navigate(path) : nav(path));

  // charge filtres depuis localStorage
  const [filters, setFilters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "null");
      return (
        saved || {
          city: "",
          budgetMax: null,
          status: "all",
        }
      );
    } catch {
      return { city: "", budgetMax: null, status: "all" };
    }
  });

  const [rooms, setRooms] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // Sauvegarde auto des filtres
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  // Debounce: attend 400ms après la dernière modif
  const debounceTimer = useRef(null);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  // Normalisation
  const normalized = useMemo(() => {
    const city = (debouncedFilters.city || "").trim();
    const budgetMax = debouncedFilters.budgetMax
      ? Number(String(debouncedFilters.budgetMax).replace(/\s/g, ""))
      : null;
    const status = debouncedFilters.status || "all";
    return { city, budgetMax, status };
  }, [debouncedFilters]);

  const buildQuery = useCallback(() => {
    let query = qy(collection(db, "rooms"));

    if (normalized.city) {
      query = qy(query, where("city", "==", normalized.city));
    }

    if (normalized.status !== "all") {
      query = qy(query, where("status", "==", normalized.status));
    }

    if (normalized.budgetMax) {
      query = qy(query, where("pricePerMonth", "<=", normalized.budgetMax));
    }

    // Tri par récent
    query = qy(query,limit(12));
    return query;
  }, [normalized]);

  const fetchFirst = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const query = buildQuery();
      const snap = await getDocs(query);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(list);
      setCursor(snap.docs[snap.docs.length - 1] || null);
    } catch (e) {
      console.error(e);
      // Message plus parlant en cas d’index manquant
      const needsIndex =
        (e && (e.code === "failed-precondition" || String(e).includes("index"))) ||
        String(e.message || "").toLowerCase().includes("index");
      if (needsIndex) {
        setError(
          "Cette combinaison de filtres nécessite un index Firestore. Ouvre la console et clique sur “Create index”."
        );
      } else {
        setError("Impossible de charger les chambres. Vérifiez les règles et la connexion.");
      }
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
      let query = buildQuery();
      query = qy(query, startAfter(cursor));
      const snap = await getDocs(query);
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
    fetchFirst();
    // cleanup si on démonte pendant un chargement
    return () => clearTimeout(debounceTimer.current);
  }, [fetchFirst]);

  const resetFilters = () =>
    setFilters({ city: "", budgetMax: null, status: "all" });

  return (
    <Container className="py-3">
      <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 mb-3">
        <h1 className="m-0 me-md-auto">Locations</h1>
        <small className="text-muted">Chambres & appartements</small>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="mb-2">
        <SearchBar onChange={setFilters} />
        <div className="d-flex align-items-center gap-2 mt-2">
          <div className="form-text me-auto">
            Astuce : saisissez une <strong>ville</strong> exacte (ex. “Lomé”) et un
            <strong> budget max</strong>.
          </div>
          <Button size="sm" variant="outline-secondary" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* ÉTAT: ERREUR */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

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
              <Button
                variant="outline-primary"
                onClick={fetchMore}
                disabled={loading}
              >
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
