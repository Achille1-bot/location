import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection, query, where, orderBy, limit, getDocs, startAfter, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { Container, Row, Col, Form, Button, Table, Badge, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { dateStr } from "../utils/format";

export default function AdminRooms(){
  const [city,setCity]=useState("");
  const [status,setStatus]=useState("all");
  const [rooms,setRooms]=useState([]);
  const [cursor,setCursor]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const filters = useMemo(()=>({
    city: city.trim(),
    status
  }),[city,status]);

  const build = ()=> {
    let q = query(collection(db,"rooms"));
    if(filters.city) q = query(q, where("city","==",filters.city));
    if(filters.status!=="all") q = query(q, where("status","==",filters.status));
    q = query(q, orderBy("updatedAt","desc"), limit(20));
    return q;
  };

  const load = async (more=false)=>{
    setError(""); setLoading(true);
    try{
      let q = build();
      if(more && cursor) q = query(q, startAfter(cursor));
      const snap = await getDocs(q);
      const list = snap.docs.map(d=>({id:d.id, ...d.data()}));
      setRooms(prev => more ? [...prev, ...list] : list);
      setCursor(snap.docs[snap.docs.length-1]||null);
    }catch(e){ setError("Erreur de chargement"); console.error(e); }
    setLoading(false);
  };

  useEffect(()=>{ load(false); /* eslint-disable-next-line */ },[filters.city,filters.status]);

  const quickToggle = async (r)=>{
    try{
      await updateDoc(doc(db,"rooms",r.id), {
        status: r.status==="libre" ? "en_location" : "libre",
        updatedAt: new Date()
      });
      load(false);
    }catch(e){ alert("Maj impossible");}
  };

  const remove = async (r)=>{
    if(!window.confirm("Supprimer cette annonce ?")) return;
    try{
      await deleteDoc(doc(db,"rooms",r.id));
      setRooms(prev=>prev.filter(x=>x.id!==r.id));
    }catch(e){ alert("Suppression impossible");}
  };

  return (
    <Container className="py-3">
      <Row className="align-items-end g-2">
        <Col md={4}>
          <Form.Label>Ville</Form.Label>
          <Form.Control value={city} onChange={e=>setCity(e.target.value)} placeholder="ex: Lomé" />
        </Col>
        <Col md={3}>
          <Form.Label>Statut</Form.Label>
          <Form.Select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">Tous</option>
            <option value="libre">Libre</option>
            <option value="en_location">En location</option>
          </Form.Select>
        </Col>
        <Col md={5} className="text-md-end">
          <Link to="/admin/new" className="btn btn-primary">Nouvelle annonce</Link>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      <div className="mt-3">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Ville</th>
              <th>Prix</th>
              <th>Statut</th>
              <th>Libération</th>
              <th>Maj</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r=>(
              <tr key={r.id}>
                <td><Link to={`/admin/edit/${r.id}`}>{r.title}</Link></td>
                <td>{r.city}{r.area?` • ${r.area}`:""}</td>
                <td>{(r.pricePerMonth||0).toLocaleString()} XOF</td>
                <td>{r.status==="libre" ? <Badge bg="success">Libre</Badge> : <Badge bg="warning" text="dark">En location</Badge>}</td>
                <td>{r.releaseDate ? dateStr(r.releaseDate) : "-"}</td>
                <td>{r.updatedAt ? dateStr(r.updatedAt) : "-"}</td>
                <td className="text-nowrap">
                  <Button size="sm" variant="outline-secondary" onClick={()=>quickToggle(r)} className="me-1">
                    Toggle
                  </Button>
                  <Link to={`/admin/edit/${r.id}`} className="btn btn-sm btn-outline-primary me-1">Éditer</Link>
                  <Button size="sm" variant="outline-danger" onClick={()=>remove(r)}>Suppr.</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="d-flex justify-content-center my-3">
          {cursor && <Button onClick={()=>load(true)} disabled={loading}>
            {loading? <><Spinner size="sm"/> Chargement…</> : "Charger plus"}
          </Button>}
        </div>
      </div>
    </Container>
  );
}
