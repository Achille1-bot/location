import { fcfa, dateStr } from "../utils/format";

export default function RoomCard({ room, onClick }) {
  const cover = room.images?.[0];
  const occupied = room.status === "en_location";

  return (
    <div className={`room-card ${occupied ? "occupied" : ""}`} onClick={onClick} role="button">
      {cover && <img src={cover} alt={room.title} />}
      <div className="body">
        <h3>{room.title}</h3>
        <p className="loc">{room.city}{room.area ? ` • ${room.area}` : ""}</p>
        <p className="price">{fcfa(room.pricePerMonth)} / mois</p>
        {occupied ? (
          <p className="badge warn">En location — libération le {dateStr(room.releaseDate)}</p>
        ) : (
          <p className="badge ok">Libre</p>
        )}
      </div>
    </div>
  );
}