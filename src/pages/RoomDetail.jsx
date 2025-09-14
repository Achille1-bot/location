// src/pages/RoomDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { fcfa, dateStr } from "../utils/format";

export default function RoomDetail() {
  const { id: roomId } = useParams(); // ← récupère l'id depuis l'URL
  const [room, setRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "Bonjour, je suis intéressé(e)."
  });

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      const ref = doc(db, "rooms", roomId);
      const snap = await getDoc(ref);
      setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    })();
  }, [roomId]);

  const sendInquiry = async () => {
    if (!room) return;
    if (!form.name.trim() || !form.phone.trim()) {
      alert("Nom et téléphone obligatoires");
      return;
    }
    setSending(true);
    await addDoc(collection(db, "inquiries"), {
      roomId: room.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      createdAt: serverTimestamp(),
    });
    setSending(false);
    alert("Message envoyé. Nous vous recontactons vite !");
    setForm((f) => ({ ...f, message: "Bonjour, je suis intéressé(e)." }));
  };

  if (room === null) return <div className="container mt-4"><p>Chargement…</p></div>;
  if (!room) return <div className="container mt-4"><p>Chambre introuvable.</p></div>;

  const occupied = room.status === "en_location";

  return (
    <div className="container mt-4">
      <h1>{room.title}</h1>
      <p className="text-muted">
        {room.city}{room.area ? ` • ${room.area}` : ""}{room.address ? ` • ${room.address}` : ""}
      </p>
      <p className="fw-semibold">{fcfa(room.pricePerMonth)} / mois</p>

      {occupied ? (
        <div className="alert alert-warning p-2">
          Actuellement en location — libération prévue le <strong>{dateStr(room.releaseDate)}</strong>
        </div>
      ) : (
        <div className="alert alert-success p-2">Libre maintenant</div>
      )}

      {Array.isArray(room.images) && room.images.length > 0 && (
        <div className="row g-2 my-3">
          {room.images.map((src, i) => (
            <div className="col-6 col-md-3" key={i}>
              <img src={src} alt={`photo-${i}`} className="img-fluid rounded" />
            </div>
          ))}
        </div>
      )}

      {room.description && (
        <>
          <h3 className="h5 mt-3">Description</h3>
          <p>{room.description}</p>
        </>
      )}

      {Array.isArray(room.amenities) && room.amenities.length > 0 && (
        <>
          <h3 className="h5 mt-3">Équipements</h3>
          <ul>
            {room.amenities.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </>
      )}

      <h3 className="h5 mt-4">Contacter</h3>
      <div className="row g-2">
        <div className="col-12 col-md-4">
          <input
            className="form-control"
            placeholder="Votre nom"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="col-12 col-md-4">
          <input
            className="form-control"
            placeholder="Téléphone WhatsApp"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="col-12">
          <textarea
            className="form-control"
            rows={3}
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <div className="col-12 col-md-3">
          <button
            className="btn btn-primary w-100"
            disabled={sending}
            onClick={sendInquiry}
          >
            {sending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}
