import React, { useState } from "react";
import TabCard from "../components/TabCard";

const CRUD = ["Add Service", "List Services", "Edit Service", "Remove Service"];

export default function Services(){
  const [log,setLog] = useState([]);
  const onAction = (a) => { setLog(s => [a,...s].slice(0,10)); alert(`${a} (sample)`); };

  return (
    <div className="space-y-4">
      <TabCard title="Services - Quick Actions" items={CRUD} onAction={onAction} />
      <div className="card">
        <h3 className="font-semibold mb-2">Services summary</h3>
        <p className="text-sm text-slate-600">Sample list of services and quick stats.</p>
      </div>
    </div>
  );
}
