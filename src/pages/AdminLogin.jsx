import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";

export default function AdminLogin(){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);

  const login=async()=>{
    setMsg(""); setLoading(true);
    try{
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setMsg("✅ Connecté");
    }catch(e){ setMsg("❌ " + (e.message||e)); }
    setLoading(false);
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={5}>
          <h1 className="h4 mb-3">Connexion admin</h1>
          {msg && <Alert variant={msg.startsWith("✅")?"success":"danger"}>{msg}</Alert>}
          <Form.Group className="mb-2">
            <Form.Label>Email</Form.Label>
            <Form.Control value={email} onChange={e=>setEmail(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control type="password" value={pass} onChange={e=>setPass(e.target.value)} />
          </Form.Group>
          <Button onClick={login} disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
