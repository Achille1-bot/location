import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  addDoc, collection, doc, getDoc, setDoc, updateDoc,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Container, Row, Col, Form, Button, Alert, ProgressBar, Badge } from "react-bootstrap";

export default function AdminEditRoom(){
  const nav = useNavigate();
  const { id } = useParams(); // si présent => edition
  const [room,setRoom]=useState(null);
  const [form,setForm]=useState({
    title:"", description:"", pricePerMonth:"", status:"libre", releaseDate:"",
    country:"Togo", region:"Maritime", city:"Lomé", area:"", address:"", images:[]
  });
  const [files,setFiles]=useState([]); // nouveaux fichiers
  const [progress,setProgress]=useState({});
  const [msg,setMsg]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    (async ()=>{
      if(!id){ setRoom({id:null}); return; }
      const s = await getDoc(doc(db,"rooms",id));
      if(!s.exists()){ setMsg("Annonce introuvable"); return; }
      const data = s.data();
      setRoom({id:s.id, ...data});
      setForm({
        title:data.title||"", description:data.description||"",
        pricePerMonth: data.pricePerMonth||"",
        status: data.status||"libre",
        releaseDate: data.releaseDate ? new Date(data.releaseDate.toDate()).toISOString().slice(0,10) : "",
        country:data.country||"Togo", region:data.region||"Maritime", city:data.city||"", area:data.area||"", address:data.address||"",
        images: Array.isArray(data.images)? data.images : []
      });
    })();
  },[id]);

  const uploadOne = (file, roomId) => new Promise((resolve,reject)=>{
    const path = `rooms/${roomId}/${Date.now()}_${file.name}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, file);
    task.on("state_changed", snap=>{
      setProgress(p=>({...p,[file.name]: Math.round(100*snap.bytesTransferred/snap.totalBytes)}));
    }, reject, async ()=>{
      resolve(await getDownloadURL(task.snapshot.ref));
    });
  });

  const handleSave = async ()=>{
    setMsg(""); setSaving(true);
    try{
      const price = Number(form.pricePerMonth);
      if(!form.title.trim()) throw new Error("Titre requis");
      if(Number.isNaN(price) || price<=0) throw new Error("Prix invalide");

      // Crée docRef avant upload pour disposer d'un id
      const docRef = form.id ? doc(db,"rooms",form.id) : (id ? doc(db,"rooms",id) : doc(collection(db,"rooms")));
      const roomId = docRef.id;

      // upload nouveaux fichiers
      let newUrls = [];
      if(files.length){
        newUrls = await Promise.all(files.map(f=>uploadOne(f, roomId)));
      }

      let release = null;
      if(form.status==="en_location" && form.releaseDate){
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
        images: [...form.images, ...newUrls],
        updatedAt: serverTimestamp(),
        ...(room ? {} : { createdAt: serverTimestamp() })
      };

      if(roomId===id || room){ await setDoc(docRef, {...payload}, {merge:true}); }
      else{ await setDoc(docRef, payload); }

      setMsg("✅ Enregistré");
      setFiles([]); setProgress({});
      nav("/admin");
    }catch(e){ setMsg("❌ " + (e.message||e)); }
    setSaving(false);
  };

  const removeImage = async (url)=>{
    if(!window.confirm("Supprimer cette image ?")) return;
    try{
      // best-effort delete in storage
      const prefix = `https://firebasestorage.googleapis.com/v0/b/`;
      if(url.startsWith(prefix)){
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, path));
      }
      const imgs = form.images.filter(u=>u!==url);
      setForm(f=>({...f, images: imgs}));
      if(id){ await updateDoc(doc(db,"rooms",id), { images: imgs, updatedAt: new Date() }); }
    }catch(e){ alert("Suppression image impossible"); }
  };

  return (
    <Container className="py-3">
      <h1 className="h4 mb-3">{id ? "Éditer l'annonce" : "Nouvelle annonce"}</h1>
      {msg && <Alert variant={msg.startsWith("✅")?"success":"danger"}>{msg}</Alert>}

      <Row className="g-3">
        <Col md={8}>
          <Form.Group className="mb-2">
            <Form.Label>Titre</Form.Label>
            <Form.Control value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          </Form.Group>

          <Row className="g-2">
            <Col md={4}>
              <Form.Label>Prix / mois (FCFA)</Form.Label>
              <Form.Control type="number" value={form.pricePerMonth} onChange={e=>setForm({...form,pricePerMonth:e.target.value})}/>
            </Col>
            <Col md={4}>
              <Form.Label>Statut</Form.Label>
              <Form.Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="libre">Libre</option>
                <option value="en_location">En location</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Libération</Form.Label>
              <Form.Control type="date" disabled={form.status!=="en_location"} value={form.releaseDate} onChange={e=>setForm({...form,releaseDate:e.target.value})}/>
            </Col>
          </Row>

          <Row className="g-2 mt-1">
            <Col md={3}><Form.Label>Pays</Form.Label><Form.Control value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></Col>
            <Col md={3}><Form.Label>Région</Form.Label><Form.Control value={form.region} onChange={e=>setForm({...form,region:e.target.value})}/></Col>
            <Col md={3}><Form.Label>Ville</Form.Label><Form.Control value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></Col>
            <Col md={3}><Form.Label>Quartier</Form.Label><Form.Control value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/></Col>
          </Row>

          <Form.Group className="mt-3">
            <Form.Label>Adresse</Form.Label>
            <Form.Control value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
          </Form.Group>

          <div className="mt-3">
            <Form.Label className="d-block">Images</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {form.images.map((u,i)=>(
                <div key={i} className="border rounded p-1">
                  <img src={u} alt="" style={{width:120,height:90,objectFit:"cover"}}/>
                  <div className="text-end">
                    <Button size="sm" variant="outline-danger" onClick={()=>removeImage(u)}>Suppr</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Form.Group className="mt-2">
            <Form.Label>Ajouter des fichiers</Form.Label>
            <Form.Control type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
            <div className="mt-2">
              {files.map((f,i)=>(
                <div key={i} className="mb-1">
                  <Badge bg="secondary" className="me-2">{f.name}</Badge>
                  {progress[f.name]>=0 && <ProgressBar now={progress[f.name]||0} label={`${progress[f.name]||0}%`} style={{maxWidth:300,display:"inline-block"}}/>}
                </div>
              ))}
            </div>
          </Form.Group>

          <div className="d-flex gap-2 mt-3">
            <Button onClick={handleSave} disabled={saving}>{saving?"Enregistrement...":"Enregistrer"}</Button>
            <Button variant="outline-secondary" onClick={()=>nav("/admin")}>Retour</Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
