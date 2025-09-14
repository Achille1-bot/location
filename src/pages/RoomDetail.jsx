// src/pages/RoomDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, functions } from "../firebase";            // ← functions dispo
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { fcfa, dateStr } from "../utils/format";

export default function RoomDetail() {                   // ← export default présent
  const { id: roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", message: "Bonjour, je suis intéressé(e)."
  });

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      const snap = await getDoc(doc(db, "rooms", roomId));
      setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : undefined);
    })();
  }, [roomId]);

  const sendInquiry = async () => {
    if (!room) return;
    if (!form.name.trim() || !form.phone.trim()) return alert("Nom et téléphone obligatoires");
    setSending(true);
    await addDoc(collection(db, "inquiries"), {
      roomId: room.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      createdAt: serverTimestamp(),
    });
    setSending(false);
    alert("Message envoyé !");
  };

  if (room === null) return <div className="container mt-4">Chargement…</div>;
  if (room === undefined) return <div className="container mt-4">Chambre introuvable.</div>;

  const occupied = room.status === "en_location";

  return (
    <div className="container mt-4">
      <h1 className="h4">{room.title}</h1>
      <p className="text-muted">
        {room.city}{room.area ? ` • ${room.area}` : ""}{room.address ? ` • ${room.address}` : ""}
      </p>
      <div className="fw-semibold mb-2">{fcfa(room.pricePerMonth)} / mois</div>

      {occupied ? (
        <div className="alert alert-warning p-2">
          Actuellement en location — libération prévue le <strong>{dateStr(room.releaseDate)}</strong>
        </div>
      ) : (
        <div className="alert alert-success p-2">Libre maintenant</div>
      )}

      {/* galerie */}
      {Array.isArray(room.images) && room.images.length > 0 && (
        <div className="row g-2 my-3">
          {room.images.map((src, i) => (
            <div className="col-6 col-md-3" key={i}>
              <img src={src} alt={`photo-${i}`} className="img-fluid rounded" />
            </div>
          ))}
        </div>
      )}

      {/* contact */}
      <h3 className="h6 mt-4">Contacter</h3>
      <div className="row g-2">
        <div className="col-md-4">
          <input className="form-control" placeholder="Votre nom"
                 value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        </div>
        <div className="col-md-4">
          <input className="form-control" placeholder="Téléphone WhatsApp"
                 value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
        </div>
        <div className="col-12">
          <textarea className="form-control" rows={3}
                    value={form.message} onChange={e=>setForm({...form, message:e.target.value})}/>
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary w-100" disabled={sending} onClick={sendInquiry}>
            {sending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </div>

      {/* réservation à l'heure (optionnel) */}
      <BookingWidget room={room} hourlyPrice={3000} />
    </div>
  );
}

/* ----- Widget de réservation (nommé) ----- */
function ceilHours(ms) { return Math.max(1, Math.ceil(ms / 3600000)); }

export function BookingWidget({ room, hourlyPrice = 3000 }) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);

  const total = (() => {
    if (!startAt || !endAt) return 0;
    const s = new Date(startAt), e = new Date(endAt);
    if (!(s < e)) return 0;
    return ceilHours(e - s) * hourlyPrice;
  })();

  const submit = async () => {
    if (!startAt || !endAt) return alert("Choisis début et fin");
    const call = httpsCallable(functions, "createBooking");
    setLoading(true);
    try {
      await call({ roomId: room.id, startAtISO: new Date(startAt).toISOString(), endAtISO: new Date(endAt).toISOString() });
      alert("Réservation confirmée 🎉");
    } catch (e) {
      alert(e?.message || "Réservation impossible");
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 p-3 border rounded">
      <h5>Réserver (min 1h)</h5>
      <div className="row g-2 align-items-end">
        <div className="col-md-4">
          <label className="form-label">Début</label>
          <input type="datetime-local" className="form-control" value={startAt} onChange={e=>setStartAt(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Fin</label>
          <input type="datetime-local" className="form-control" value={endAt} onChange={e=>setEndAt(e.target.value)} />
        </div>
        <div className="col-md-2">
          <div className="small text-muted">Tarif (h) : {hourlyPrice.toLocaleString()} XOF</div>
          <div className="fw-semibold">Total : {total.toLocaleString()} XOF</div>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" disabled={loading} onClick={submit}>
            {loading ? "Réservation..." : "Réserver"}
          </button>
        </div>
      </div>
    </div>
  );
}
