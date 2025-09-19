import { useEffect, useState } from "react";
import { Row, Col, Form } from "react-bootstrap";

export default function SearchBar({ onChange }) {
  const [city, setCity] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [status, setStatus] = useState("all");

  // petit debounce 300ms
  useEffect(() => {
    const h = setTimeout(() => {
      onChange({
        city: city.trim(),
        budgetMax: budgetMax ? Number(budgetMax) : null,
        status,
      });
    }, 300);
    return () => clearTimeout(h);
  }, [city, budgetMax, status, onChange]);

  return (
    <Row className="g-2">
      <Col xs={12} md={6} lg={4}>
        <Form.Control
          placeholder="Ville (ex: Lomé)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </Col>
      <Col xs={12} md={4} lg={3}>
        <Form.Control
          type="number"
          placeholder="Budget max (FCFA)"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          min={0}
        />
      </Col>
      <Col xs={12} md={4} lg={3}>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="libre">Libre</option>
          <option value="en_location">En location</option>
        </Form.Select>
      </Col>
    </Row>
  );
}
