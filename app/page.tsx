import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

const GEOCODE_API = "https://api.openrouteservice.org/geocode/search";
const OPTIMIZE_API = "https://api.openrouteservice.org/optimization";
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

export default function GeosortUpload() {
  const [fileName, setFileName] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [geocodedData, setGeocodedData] = useState([]);
  const [sortedData, setSortedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      setPreviewData(data);
    };
    reader.readAsBinaryString(file);
  };

  const geocodeAddresses = async () => {
    if (previewData.length < 2) return;

    const headers = {
      Authorization: API_KEY,
      Accept: "application/json"
    };

    const rows = previewData.slice(1);
    const results = [];
    setLoading(true);

    for (const row of rows) {
      const address = `${row[0]} ${row[1]}, ${row[2]} ${row[3]}`;
      try {
        const res = await fetch(`${GEOCODE_API}?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`, { headers });
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const coords = json.features[0].geometry.coordinates;
          results.push([...row, coords[1], coords[0]]);
        } else {
          results.push([...row, null, null]);
        }
      } catch (err) {
        results.push([...row, null, null]);
      }
    }

    const geocoded = [[...previewData[0], "Latitude", "Longitude"], ...results];
    setGeocodedData(geocoded);
    setLoading(false);
  };

  const sortGeocodedData = async () => {
    if (geocodedData.length < 2) return;

    const jobs = geocodedData.slice(1).map((row, index) => ({
      id: index + 1,
      location: [row[row.length - 1], row[row.length - 2]],
      service: 300
    }));

    const body = {
      jobs,
      vehicles: [
        {
          id: 1,
          profile: "foot",
          start: jobs[0].location
        }
      ]
    };

    const headers = {
      Authorization: API_KEY,
      Accept: "application/json",
      "Content-Type": "application/json"
    };

    setLoading(true);
    const res = await fetch(OPTIMIZE_API, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    const json = await res.json();
    setLoading(false);

    if (json.routes && json.routes.length > 0) {
      const sorted = json.routes[0].steps.map((step) => geocodedData[step.job + 1]);
      setSortedData([geocodedData[0], ...sorted]);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(sortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Geosortiert");
    XLSX.writeFile(wb, "geosortierte_laufliste.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">📥 Geosortierte Lauflisten</h1>

      <Card className="mb-6">
        <CardContent className="py-6">
          <label className="block mb-2 font-medium">Excel/CSV-Datei hochladen</label>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
          {fileName && <p className="mt-2 text-sm text-gray-500">Ausgewählt: {fileName}</p>}
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <Button onClick={geocodeAddresses} disabled={loading} className="mr-2">
              {loading ? "Geokodierung läuft..." : "Adressen geokodieren"}
            </Button>
            <Button onClick={sortGeocodedData} disabled={loading || geocodedData.length === 0} className="mr-2">
              {loading ? "Sortiere Route..." : "Route optimieren"}
            </Button>
            <Button onClick={exportToExcel} disabled={sortedData.length === 0}>
              Excel exportieren
            </Button>
          </CardContent>
        </Card>
      )}

      {sortedData.length > 0 && (
        <div className="h-[600px] mb-6 rounded-xl overflow-hidden">
          <Map
            points={sortedData.slice(1).map((row) => ({
              lat: row[row.length - 2],
              lng: row[row.length - 1],
            }))}
          />
        </div>
      )}
    </div>
  );
}