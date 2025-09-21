import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { Table, Button, Badge, Spinner, Toast, ToastContainer, Form } from "react-bootstrap";

export default function AdminReservations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState({ show: false, message: "", bg: "success" });

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRequests(list);
      } catch (e) {
        console.error(e);
        setToast({ show: true, message: "Erreur lors du chargement des demandes.", bg: "danger" });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "inquiries", id), { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setToast({ show: true, message: `Statut mis à jour : ${status}`, bg: "success" });
    } catch (e) {
      console.error(e);
      setToast({ show: true, message: "Erreur lors de la mise à jour du statut.", bg: "danger" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = requests.filter(r => statusFilter === "all" ? true : r.status === statusFilter);

  if (loading) return <div className="text-center mt-4"><Spinner animation="border" /> Chargement…</div>;

  return (
    <div className="container mt-4">
      <h2 className="h4 mb-3">Gestion des demandes de réservation</h2>

      <Form.Select className="mb-3 w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">Tous les statuts</option>
        <option value="en attente">En attente</option>
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
            <th>Actions</th>
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
                <Badge bg={r.status === "validée" ? "success" : r.status === "refusée" ? "danger" : "warning"}>
                  {r.status || "en attente"}
                </Badge>
              </td>
              <td>
                <Button variant="success" size="sm" className="me-1"
                  disabled={r.status === "validée" || updatingId === r.id}
                  onClick={() => updateStatus(r.id, "validée")}>
                  Valider
                </Button>
                <Button variant="danger" size="sm"
                  disabled={r.status === "refusée" || updatingId === r.id}
                  onClick={() => updateStatus(r.id, "refusée")}>
                  Refuser
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.bg} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3500} autohide>
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
