import React, { useState } from "react";
import TabCard from "../components/TabCard";

const CRUD = ["Add Clinic", "List Clinics", "Update Clinic", "Delete Clinic"];

export default function Clinics(){
  const [log, setLog] = useState([]);
  const onAction = (a) => {
    setLog((s) => [a, ...s].slice(0, 10));
    alert(`${a} (sample)`);
  };

  return (
    <div className="space-y-4">
      <TabCard title="Clinics - Quick Actions" items={CRUD} onAction={onAction} />
      <div className="card">
        <h3 className="font-semibold mb-2">Activity</h3>
        <ul className="list-disc pl-5 text-sm">
          {log.length === 0 ? <li>No activity yet</li> : log.map((l,i)=><li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}
