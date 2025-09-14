// src/pages/AdminAddRoom.jsx
import { useEffect, useMemo, useState } from "react";
import { db, storage } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { Container, Row, Col, Form, Button, Alert, ProgressBar } from "react-bootstrap";

export default function AdminAddRoom() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    pricePerMonth: "",
    status: "libre",
    releaseDate: "",
    country: "Togo",
    region: "Maritime",
    city: "Lomé",
    area: "",
    address: "",
    imagesUrlsText: "", // URLs séparées par virgule (en plus des fichiers)
  });

  // FICHIERS À UPLOADER
  const [files, setFiles] = useState([]);            // File[]
  const [previews, setPreviews] = useState([]);      // objectURL[]
  const [progress, setProgress] = useState({});      // { filename: percent }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Génère les aperçus
  useEffect(() => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const p = files.map((f) => URL.createObjectURL(f));
    setPreviews(p);
    // cleanup on unmount
    return () => p.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const parsedTextUrls = useMemo(() => {
    return form.imagesUrlsText
      .split(/\s*,\s*/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [form.imagesUrlsText]);

  // Upload un fichier et renvoie sa downloadURL
  const uploadOne = (file, roomId) =>
    new Promise((resolve, reject) => {
      const path = `rooms/${roomId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setProgress((p) => ({ ...p, [file.name]: pct }));
        },
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });

  const handleSave = async () => {
    setMsg("");
    setSaving(true);
    try {
      if (!form.title.trim()) throw new Error("Titre requis");
      const price = Number(form.pricePerMonth);
      if (Number.isNaN(price) || price <= 0) throw new Error("Prix/mois invalide");

      // On prépare l'ID de doc pour ranger les fichiers à l’intérieur
      const docRef = doc(collection(db, "rooms"));

      // Upload des fichiers sélectionnés (si présents)
      let uploadedUrls = [];
      if (files.length > 0) {
        uploadedUrls = await Promise.all(files.map((f) => uploadOne(f, docRef.id)));
      }

      // Compose les URLs finales = upload + saisies texte
      const finalImages = [...uploadedUrls, ...parsedTextUrls];

      let release = null;
      if (form.status === "en_location") {
        if (!form.releaseDate) throw new Error("Date de libération requise pour 'en_location'");
        release = Timestamp.fromDate(new Date(form.releaseDate));
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        pricePerMonth: price,
        currency: "XOF",
        status: form.status,
        releaseDate: release,
        country: form.country.trim(),
        region: form.region.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        images: finalImages,
        amenities: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);

      setMsg("✅ Chambre enregistrée avec images !");
      setFiles([]);
      setPreviews([]);
      setProgress({});
      setForm((f) => ({
        ...f,
        title: "",
        description: "",
        pricePerMonth: "",
        area: "",
        address: "",
        imagesUrlsText: "",
      }));
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-3">
      <h1 className="mb-3">Ajouter une chambre</h1>
      {msg && <Alert variant={msg.startsWith("✅") ? "success" : "danger"}>{msg}</Alert>}

      <Row className="g-3">
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Titre</Form.Label>
            <Form.Control
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Studio meublé Adidogomé"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Form.Group>

          <Row className="g-2">
            <Col md={4}>
              <Form.Label>Prix / mois (FCFA)</Form.Label>
              <Form.Control
                type="number"
                value={form.pricePerMonth}
                onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })}
                min={1000}
              />
            </Col>
            <Col md={4}>
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="libre">Libre</option>
                <option value="en_location">En location</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Libération (si en location)</Form.Label>
              <Form.Control
                type="date"
                value={form.releaseDate}
                disabled={form.status !== "en_location"}
                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              />
            </Col>
          </Row>

          <Row className="g-2 mt-1">
            <Col md={3}>
              <Form.Label>Pays</Form.Label>
              <Form.Control
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Région</Form.Label>
              <Form.Control
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Ville</Form.Label>
              <Form.Control
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Quartier</Form.Label>
              <Form.Control
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </Col>
          </Row>

          <Form.Group className="mt-3">
            <Form.Label>Adresse</Form.Label>
            <Form.Control
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Form.Group>

          {/* URLs manuelles (optionnel) */}
          <Form.Group className="mt-3">
            <Form.Label>Images (URLs séparées par virgule) — optionnel</Form.Label>
            <Form.Control
              value={form.imagesUrlsText}
              onChange={(e) => setForm({ ...form, imagesUrlsText: e.target.value })}
              placeholder="https://... , https://..."
            />
          </Form.Group>

          {/* UPLOAD FICHIERS */}
          <Form.Group className="mt-3">
            <Form.Label>Uploader des images</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {previews.length > 0 && (
              <Row className="g-2 mt-2">
                {previews.map((src, i) => (
                  <Col xs={6} md={4} lg={3} key={i}>
                    <div className="border rounded p-1">
                      <img src={src} alt={`preview-${i}`} className="img-fluid rounded" />
                      {files[i] && progress[files[i].name] >= 0 && (
                        <div className="mt-1">
                          <ProgressBar now={progress[files[i].name] || 0} label={`${progress[files[i].name] || 0}%`} />
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Form.Group>

          <div className="d-flex gap-2 mt-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
