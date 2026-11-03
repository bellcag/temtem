import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/lib/app-state";
import {
  CONTRACTOR_JOBS,
  jobById,
  LS_OUTLET,
  readSavedJobId,
  writeSavedJobId,
} from "@/lib/process-job-context";
import { OFFICER, UNITS, type Unit } from "@/lib/tenancy-data";
import { usesV37Cut } from "@/lib/process-v31-preview";
import { v37OutletLabel, v37UnitsForTenant } from "@/lib/process-v37";
import { V31UnitField } from "@/components/v31/UnitField";

function shortCompany(name: string) {
  return name.replace(/\s+Pte Ltd$/i, "");
}

export function V35SidebarUnit({ collapsed }: { collapsed?: boolean }) {
  const location = useLocation();
  const v37 = usesV37Cut(location.pathname);
  const {
    role,
    unit,
    setUnit,
    units,
    managedTenants,
    setOfficerScope,
  } = useApp();
  const isOfficer = role === "officer";
  const isContractor = role === "contractor";
  const [jobId, setJobId] = useState(readSavedJobId);
  const [officerFocus, setOfficerFocus] = useState("");

  useEffect(() => {
    const refresh = () => setJobId(readSavedJobId());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const tenantUnits = v37 ? v37UnitsForTenant() : units;
  const appointedJobs = useMemo(
    () => CONTRACTOR_JOBS.filter((job) => job.appointed),
    [],
  );
  const officerUnits = useMemo(() => {
    const seen = new Set<string>();
    const list: Unit[] = [];
    for (const row of [
      ...UNITS,
      ...managedTenants.flatMap((tenant) => tenant.units),
    ]) {
      if (row.terminal !== OFFICER.terminal || row.zone !== "Airside") continue;
      if (row.tenancyType !== "F&B" && row.tenancyType !== "Retail") continue;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      list.push(row);
    }
    return list;
  }, [managedTenants]);

  const contractorJob =
    appointedJobs.find((job) => job.id === jobId) ?? appointedJobs[0];
  const focusedOfficer =
    officerUnits.find((row) => row.id === officerFocus) ?? officerUnits[0] ?? null;

  useEffect(() => {
    if (role !== "officer") return;
    setOfficerScope(focusedOfficer ? { tenant: null, unit: focusedOfficer } : null);
  }, [role, focusedOfficer, setOfficerScope]);

  const scopedUnit: Unit | null = isOfficer
    ? focusedOfficer
    : isContractor
      ? (contractorJob?.unit ?? unit)
      : unit;

  const unitValue = isOfficer
    ? (focusedOfficer?.id ?? "")
    : isContractor
      ? (contractorJob?.id ?? "")
      : unit.id;
  const unitOptions = isOfficer
    ? officerUnits.map((row) => ({
        value: row.id,
        label: `${shortCompany(row.company)} · ${row.unitNo}`,
      }))
    : isContractor
      ? appointedJobs.map((job) => ({
          value: job.id,
          label: job.label,
        }))
      : tenantUnits.map((row) => ({
          value: row.id,
          label: v37 ? v37OutletLabel(row.id) : `${shortCompany(row.company)} · ${row.unitNo}`,
        }));

  const onScopeChange = (next: string) => {
    if (isOfficer) {
      setOfficerFocus(next);
      const hit = officerUnits.find((row) => row.id === next);
      if (hit) setOfficerScope({ tenant: null, unit: hit });
      return;
    }
    if (isContractor) {
      writeSavedJobId(next);
      setJobId(next);
      const job = jobById(next);
      setUnit(job.unit);
      window.localStorage.setItem(LS_OUTLET, job.unit.id);
      return;
    }
    const hit = tenantUnits.find((row) => row.id === next);
    if (!hit) return;
    setUnit(hit);
    window.localStorage.setItem(LS_OUTLET, hit.id);
  };

  if (collapsed) return null;
  if (!scopedUnit) return null;

  return (
    <div className="px-1 pb-3">
      <V31UnitField
        value={unitValue}
        options={unitOptions}
        chips={[scopedUnit.terminal, scopedUnit.zone, scopedUnit.tenancyType]}
        showSelect={unitOptions.length > 1}
        onChange={onScopeChange}
        className="w-full"
      />
    </div>
  );
}
