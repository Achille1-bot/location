import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { fcfa, dateStr } from "../utils/format";

export default function RoomDetail({ roomId }) {
  const [room, setRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "Bonjour, je suis intéressé(e)." });

  useEffect(() => {
    (async () => {
      const ref = doc(db, "rooms", roomId);
      const snap = await getDoc(ref);
      setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    })();
  }, [roomId]);

  const sendInquiry = async () => {
    if (!form.name || !form.phone) return alert("Nom et téléphone obligatoires");
    setSending(true);
    await addDoc(collection(db, "inquiries"), {
      roomId: room.id,
      ...form,
      createdAt: new Date()
    });
    setSending(false);
    alert("Message envoyé. Nous vous recontactons vite !");
  };

  if (!room) return <p>Chargement…</p>;
  const occupied = room.status === "en_location";

  return (
    <div className="container">
      <h1>{room.title}</h1>
      <p className="loc">{room.city}{room.area ? ` • ${room.area}` : ""}</p>
      <p className="price">{fcfa(room.pricePerMonth)} / mois</p>

      {occupied ? (
        <p className="badge warn">Actuellement en location — libération prévue le {dateStr(room.releaseDate)}</p>
      ) : (
        <p className="badge ok">Libre maintenant</p>
      )}

      <div className="gallery">
        {(room.images || []).map((src, i) => (
          <img key={i} src={src} alt={`photo-${i}`} />
        ))}
      </div>

      <h3>Description</h3>
      <p>{room.description}</p>

      <h3>Équipements</h3>
      <ul>
        {(room.amenities || []).map((a, i) => <li key={i}>{a}</li>)}
      </ul>

      <h3>Contacter</h3>
      <div className="inq">
        <input placeholder="Votre nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Téléphone WhatsApp" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <button disabled={sending} onClick={sendInquiry}>{sending ? "Envoi…" : "Envoyer la demande"}</button>
      </div>
    </div>
  );
}
import { useParams } from "react-router-dom";
// ...
export default function RoomDetail() {
  const { id } = useParams();
  // utilisez id au lieu de prop roomId
}