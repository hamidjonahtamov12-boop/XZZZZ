"use client";

import { useState } from "react";

import { copy, type Lang } from "@/app/i18n";

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

type LocationFieldProps = {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAccuracy?: number | null;
  lang: Lang;
};

export function LocationField({
  initialLatitude = null,
  initialLongitude = null,
  initialAccuracy = null,
  lang,
}: LocationFieldProps) {
  const t = copy[lang];
  const [latitude, setLatitude] = useState(
    initialLatitude === null ? "" : String(initialLatitude)
  );
  const [longitude, setLongitude] = useState(
    initialLongitude === null ? "" : String(initialLongitude)
  );
  const [accuracy, setAccuracy] = useState(
    initialAccuracy === null ? "" : String(initialAccuracy)
  );
  const [status, setStatus] = useState(
    initialLatitude !== null && initialLongitude !== null
      ? `${t.locationSaved}: ${formatCoordinate(initialLatitude)}, ${formatCoordinate(initialLongitude)}`
      : t.locationOptional
  );
  const [isLoading, setIsLoading] = useState(false);

  const hasLocation = latitude && longitude;

  function clearLocation() {
    setLatitude("");
    setLongitude("");
    setAccuracy("");
    setStatus(t.locationRemoved);
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus(t.locationUnavailable);
      return;
    }

    setIsLoading(true);
    setStatus(t.locationRequesting);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setAccuracy(String(position.coords.accuracy));
        setStatus(
          `${t.locationAttached}: ${formatCoordinate(position.coords.latitude)}, ${formatCoordinate(position.coords.longitude)}`
        );
        setIsLoading(false);
      },
      (error) => {
        setStatus(`${t.locationError}: ${error.message}`);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="location-box">
      <input name="latitude" type="hidden" value={latitude} />
      <input name="longitude" type="hidden" value={longitude} />
      <input name="location_accuracy_meters" type="hidden" value={accuracy} />

      <div className="location-head">
        <div>
          <span>{t.location}</span>
          <p className="helper">{status}</p>
        </div>
        <div className="location-actions">
          <button
            className="ghost-button"
            onClick={requestLocation}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? t.locationLocating : t.locationUseCurrent}
          </button>
          {hasLocation ? (
            <button className="ghost-button" onClick={clearLocation} type="button">
              {t.clear}
            </button>
          ) : null}
        </div>
      </div>

      {hasLocation ? (
        <div className="pill-row">
          <span className="pill">lat {formatCoordinate(Number(latitude))}</span>
          <span className="pill">lng {formatCoordinate(Number(longitude))}</span>
          {accuracy ? (
            <span className="pill">
              {t.accuracy} {Math.round(Number(accuracy))} m
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
