import { Card, Badge, Button } from "react-bootstrap";
import { fcfa, dateStr } from "../utils/format";

export default function RoomCard({ room, onClick }) {
  const occupied = room.status === "en_location";
  const reserved = room.status === "reservation";
  const cover = Array.isArray(room.images) && room.images[0];

  // Handler pour le bouton
  const handleRentClick = (e) => {
    e.stopPropagation();
    window.location.href = `/room/${room.id}`;
  };

  return (
    <Card className="h-100 shadow-sm" role="button" onClick={onClick}>
      {cover && (
        <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
          <Card.Img
            variant="top"
            src={cover}
            alt={room.title}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
      )}
      <Card.Body>
        <Card.Title className="h6 mb-1">{room.title}</Card.Title>
        <Card.Subtitle className="text-muted mb-2">
          {room.city}{room.area ? ` • ${room.area}` : ""}
        </Card.Subtitle>
        <div className="fw-semibold mb-2">{fcfa(room.pricePerMonth)} / mois</div>

        {occupied ? (
          <>
            <Badge bg="warning" text="dark">
              En location — libération le {dateStr(room.releaseDate)}
            </Badge>
          </>
        ) : reserved ? (
          <>
            <Badge bg="info" text="dark">
              En réservation
            </Badge>
            <div className="mt-2">
              <Button variant="primary" size="sm" onClick={handleRentClick}>
                Réserver
              </Button>
            </div>
          </>
        ) : (
          <>
            <Badge bg="success">Libre</Badge>
            <div className="mt-2">
              <Button variant="success" size="sm" onClick={handleRentClick}>
                Louer
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}