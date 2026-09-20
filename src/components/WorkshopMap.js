"use client";

export default function WorkshopMap({ workshops = [], selectedId, onSelect }) {
  return <div className="workshop-map" aria-label="Workshop location visualization">
    <div className="map-grid" /><div className="map-roads road-a" /><div className="map-roads road-b" /><div className="map-roads road-c" />
    <div className="map-locality locality-rohini">Rohini</div><div className="map-locality locality-pitampura">Pitampura</div><div className="map-locality locality-delhi">DELHI NCR</div>
    <div className="map-you"><span />You</div>
    {workshops.map((workshop, index) => <button key={workshop.id} className={`map-marker marker-${index} ${selectedId === workshop.id ? "selected" : ""}`} onClick={() => onSelect(workshop.id)} aria-label={`Select ${workshop.name}`}><span>{index + 1}</span><small>{workshop.distance}</small></button>)}
    <div className="map-legend"><span /><small>Prototype geographic context · replaceable with Google Maps / Maps results</small></div>
  </div>;
}
