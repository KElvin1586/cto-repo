import { useMemo } from "react";
import { getSchema } from "~/app/qr/payloads";
import type { FieldDef } from "~/app/qr/payloads";
import type { QrType } from "~/app/types";

// Reusable, accessible form field renderer backed by the schema field defs.

export function FieldInput(props: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const { field, value, onChange } = props;
  const cls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

  if (field.kind === "textarea") {
    return (
      <textarea
        id={field.name}
        className={`${cls} min-h-[92px] resize-y`}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.kind === "boolean") {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={value === "on" || value === "true"}
          onChange={(e) => onChange(e.target.checked ? "on" : "")}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Hidden network
      </label>
    );
  }
  if (field.kind === "select") {
    return (
      <select id={field.name} className={cls} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.kind === "datetime") {
    return (
      <input
        id={field.name}
        type="datetime-local"
        className={cls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.kind === "number") {
    return (
      <input
        id={field.name}
        type="text"
        inputMode="decimal"
        className={cls}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      id={field.name}
      type="text"
      className={cls}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FieldGroup(props: {
  type: QrType;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  const { type, values, onChange } = props;
  const schema = getSchema(type);
  return (
    <div className="space-y-4">
      {schema.fields.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {f.label}
            {f.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <FieldInput field={f} value={values[f.name] ?? ""} onChange={(v) => onChange(f.name, v)} />
          {f.helper && <p className="mt-1 text-xs text-slate-500">{f.helper}</p>}
        </div>
      ))}
    </div>
  );
}

/** Simple dot-prefixed pill used across the UI. */
export function Pill({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export function useFieldDefaults(type: QrType): Record<string, string> {
  return useMemo(() => {
    const schema = getSchema(type);
    const init: Record<string, string> = {};
    schema.fields.forEach((f) => {
      if (f.kind === "boolean") init[f.name] = "";
      else if (f.kind === "select") init[f.name] = f.options?.[0]?.value ?? "";
      else init[f.name] = "";
    });
    return init;
  }, [type]);
}
