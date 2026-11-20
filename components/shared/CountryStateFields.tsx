"use client";

import { useState } from "react";
import { INDIA_STATES_UTS, COUNTRIES } from "@/lib/indiaGeo";

interface Props {
  /** Pre-selected country (for edit forms). Defaults to "India". */
  defaultCountry?: string;
  /** Pre-selected state value (for edit forms). */
  defaultState?: string;
  /** CSS class applied to each select/input element. */
  inputClassName?: string;
}

/**
 * Embeddable country + state/UT fields for server-action forms.
 * Renders a country dropdown (default: India) and a state dropdown
 * (Indian states/UTs). When a non-India country is selected, the
 * state field switches to a free-text input.
 */
export default function CountryStateFields({
  defaultCountry = "India",
  defaultState = "",
  inputClassName = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
}: Props) {
  const [country, setCountry] = useState(defaultCountry || "India");
  const [state, setState] = useState(defaultState || "");

  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Country
        </label>
        <select
          name="country"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setState("");
          }}
          className={inputClassName}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          State
        </label>
        {country === "India" ? (
          <select
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={inputClassName}
          >
            <option value="">Select State / UT</option>
            {INDIA_STATES_UTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State / Province"
            className={inputClassName}
          />
        )}
      </div>
    </>
  );
}
