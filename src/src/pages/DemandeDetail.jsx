import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, Badge, Button, Spinner } from "react-bootstrap";

export default function DemandeDetail() {
  const { id } = useParams();
  const [demande, setDemande] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "inquiries", id));
      if (snap.exists()) {
        const data = snap.data();
        setDemande(data);
        // Récupère les infos de la chambre liée
        if (data.roomId) {
          const roomSnap = await getDoc(doc(db, "rooms", data.roomId));
          setRoom(roomSnap.exists() ? roomSnap.data() : null);
        }
      } else {
        setDemande(undefined);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="container mt-4"><Spinner animation="border" /> Chargement…</div>;
  if (demande === undefined) return <div className="container mt-4">Demande introuvable.</div>;

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h2 className="h5 mb-0">Demande de réservation</h2>
          
        </Card.Header>
        <Card.Body>
          <p><strong>Nom :</strong> {demande.name}</p>
          <p><strong>Téléphone :</strong> <a href={`https://wa.me/${demande.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{demande.phone}</a></p>
          <p><strong>Période :</strong> du <b>{demande.dateStart}</b> au <b>{demande.dateEnd}</b></p>
          <p><strong>Message :</strong> {demande.message}</p>
      
          {room && (
            <>
              <p><strong>Adresse :</strong> {room.address ? room.address : "—"} {room.city ? `, ${room.city}` : ""}</p>
              {Array.isArray(room.images) && room.images.length > 0 && (
                <div className="row g-2 my-2">
                  {room.images.map((src, i) => (
                    <div className="col-6 col-md-3" key={i}>
                      <img src={src} alt={`photo-${i}`} className="img-fluid rounded" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {demande.createdAt && (
            <p>
              <strong>Envoyée le :</strong>{" "}
              {demande.createdAt.toDate
                ? demande.createdAt.toDate().toLocaleString()
                : demande.createdAt}
            </p>
          )}
          
        </Card.Body>
      </Card>
    </div>
  );
}