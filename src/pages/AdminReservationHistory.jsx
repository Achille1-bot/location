import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Table, Badge, Spinner, Form } from "react-bootstrap";

export default function AdminReservationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.status === "validée" || r.status === "refusée");
        setHistory(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = history.filter(r => statusFilter === "all" ? true : r.status === statusFilter);

  if (loading) return <div className="text-center mt-4"><Spinner animation="border" /> Chargement…</div>;

  return (
    <div className="container mt-4">
      <h2 className="h4 mb-3">Historique des réservations</h2>

      <Form.Select
        className="mb-3 w-auto"
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
      >
        <option value="all">Tous les statuts</option>
        <option value="validée">Validées</option>
        <option value="refusée">Refusées</option>
      </Form.Select>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Chambre</th>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Période</th>
            <th>Message</th>
            <th>Statut</th>
            <th>Date création</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td>{r.roomId}</td>
              <td>{r.name}</td>
              <td>{r.phone}</td>
              <td>{r.dateStart} → {r.dateEnd}</td>
              <td>{r.message}</td>
              <td>
                <Badge bg={r.status === "validée" ? "success" : "danger"}>
                  {r.status}
                </Badge>
              </td>
              <td>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ""}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
