import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { fcfa, dateStr } from "../utils/format";
import { Toast, ToastContainer } from "react-bootstrap";

export default function RoomDetail() {
  const { id: roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dateStart: "",
    dateEnd: "",
    message: "Bonjour, je suis intéressé(e)."
  });
  const [toast, setToast] = useState({ show: false, message: "", bg: "success" });

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      const snap = await getDoc(doc(db, "rooms", roomId));
      setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : undefined);
    })();
  }, [roomId]);

  const today = new Date().toISOString().slice(0, 10);

  const sendInquiry = async () => {
    if (!room) return;
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.dateStart ||
      !form.dateEnd
    ) {
      setToast({ show: true, message: "Nom, téléphone et dates obligatoires", bg: "danger" });
      return;
    }
    if (form.dateStart < today) {
      setToast({ show: true, message: "La date de début ne peut pas être antérieure à aujourd'hui.", bg: "danger" });
      return;
    }
    setSending(true);
    try {
      const docRef = await addDoc(collection(db, "inquiries"), {
        roomId: room.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        dateStart: form.dateStart,
        dateEnd: form.dateEnd,
        message: form.message.trim(),
        createdAt: serverTimestamp(),
      });
      setSending(false);

      const recap = `
Demande de réservation
Chambre : ${room.title}
Ville : ${room.city}
Nom : ${form.name}
Téléphone : ${form.phone}
Du : ${form.dateStart}
Au : ${form.dateEnd}
Message : ${form.message}
Voir la demande : https://location-sand-theta.vercel.app/demande/${docRef.id}
      `.trim();
      const whatsappMsg = encodeURIComponent(recap);
      const whatsappUrl = `https://wa.me/22896493791?text=${whatsappMsg}`;
      window.open(whatsappUrl, "_blank");
      setToast({ show: true, message: "Demande envoyée et récap transmis sur WhatsApp !", bg: "success" });
    } catch (e) {
      setSending(false);
      setToast({ show: true, message: "Erreur lors de l'envoi de la demande.", bg: "danger" });
    }
  };

  if (room === null)
    return <div className="container mt-4">Chargement…</div>;
  if (room === undefined)
    return <div className="container mt-4">Chambre introuvable.</div>;

  const occupied = room.status === "en_location";

  return (
    <div className="container mt-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toast.bg}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={3500}
          autohide
        >
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <h1 className="h4">{room.title}</h1>
      <p className="text-muted">
        {room.city}
        {room.area ? ` • ${room.area}` : ""}
        {room.address ? ` • ${room.address}` : ""}
      </p>
      <div className="fw-semibold mb-2">
        {fcfa(room.pricePerMonth)} / mois
      </div>

      {occupied ? (
        <div className="alert alert-warning p-2">
          Actuellement en location — libération prévue le{" "}
          <strong>{dateStr(room.releaseDate)}</strong>
        </div>
      ) : (
        <div className="alert alert-success p-2">Libre maintenant</div>
      )}

      {/* galerie */}
      {Array.isArray(room.images) && room.images.length > 0 && (
        <div className="row g-2 my-3">
          {room.images.map((src, i) => (
            <div className="col-6 col-md-3" key={i}>
              <img
                src={src}
                alt={`photo-${i}`}
                className="img-fluid rounded"
              />
            </div>
          ))}
        </div>
      )}

      {/* formulaire de réservation amélioré */}
      <h3 className="h6 mt-4">Demande de réservation</h3>
      <div className="row g-2">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Votre nom"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Téléphone WhatsApp"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="date"
            className="form-control"
            placeholder="Date de début"
            value={form.dateStart}
            min={today}
            onChange={e => setForm({ ...form, dateStart: e.target.value })}
            required
          />
        </div>
        <div className="col-md-4">
          <input
            type="date"
            className="form-control"
            placeholder="Date de fin"
            value={form.dateEnd}
            min={form.dateStart || today}
            onChange={e => setForm({ ...form, dateEnd: e.target.value })}
            required
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
        <div className="col-md-3">
          <button
            className="btn btn-success w-100"
            disabled={sending}
            onClick={sendInquiry}
          >
            {sending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </div>

      {/* réservation à l'heure (optionnel) */}
      <BookingWidget room={room} hourlyPrice={3000} setParentToast={setToast} />
    </div>
  );
}

function ceilHours(ms) {
  return Math.max(1, Math.ceil(ms / 3600000));
}

export function BookingWidget({ room, hourlyPrice = 3000, setParentToast }) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const nowISO = new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm

  const total = (() => {
    if (!startAt || !endAt) return 0;
    const s = new Date(startAt), e = new Date(endAt);
    if (!(s < e)) return 0;
    return ceilHours(e - s) * hourlyPrice;
  })();

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !startAt || !endAt) {
      setParentToast && setParentToast({ show: true, message: "Nom, téléphone et dates obligatoires", bg: "danger" });
      return;
    }
    if (new Date(startAt) < new Date()) {
      setParentToast && setParentToast({ show: true, message: "La date de début ne peut pas être antérieure à maintenant.", bg: "danger" });
      return;
    }
    setLoading(true);
    try {
      const recap = `
Demande de réservation horaire
Chambre : ${room.title}
Ville : ${room.city}
Nom : ${name}
Téléphone : ${phone}
Début : ${startAt.replace("T", " ")}
Fin : ${endAt.replace("T", " ")}
Durée : ${ceilHours(new Date(endAt) - new Date(startAt))} heure(s)
Total : ${total.toLocaleString()} XOF
      `.trim();
      const whatsappMsg = encodeURIComponent(recap);
      const whatsappUrl = `https://wa.me/22896493791?text=${whatsappMsg}`;
      window.open(whatsappUrl, "_blank");
      setParentToast && setParentToast({ show: true, message: "Demande envoyée sur WhatsApp !", bg: "success" });
    } catch (e) {
      setParentToast && setParentToast({ show: true, message: "Erreur lors de l'envoi.", bg: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 border rounded">
      <h5>Réserver (min 1h)</h5>
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Votre nom"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Téléphone WhatsApp"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Début</label>
          <input
            type="datetime-local"
            className="form-control"
            value={startAt}
            min={nowISO}
            onChange={e => setStartAt(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Fin</label>
          <input
            type="datetime-local"
            className="form-control"
            value={endAt}
            min={startAt || nowISO}
            onChange={e => setEndAt(e.target.value)}
            required
          />
        </div>
        <div className="col-md-3 mt-2">
          <div className="small text-muted">
            Tarif (h) : {hourlyPrice.toLocaleString()} XOF
          </div>
          <div className="fw-semibold">
            Total : {total.toLocaleString()} XOF
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <button
            className="btn btn-primary w-100"
            disabled={loading}
            onClick={submit}
          >
            {loading ? "Envoi..." : "Réserver"}
          </button>
        </div>
      </div>
    </div>
  );
}