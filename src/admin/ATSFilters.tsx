import React from 'react';
import { Search } from 'lucide-react';
import { getAppAttentionInfo } from './atsUtils';
import type { ATSApplication, SortOption } from './types';

interface ATSFiltersProps {
  applications: ATSApplication[];
  filteredCount: number;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  tradeFilter: string;
  setTradeFilter: (val: string) => void;
  minExperienceFilter: string;
  setMinExperienceFilter: (val: string) => void;
  destinationFilter: string;
  setDestinationFilter: (val: string) => void;
  passportFilter: string;
  setPassportFilter: (val: string) => void;
  attentionOnlyFilter: boolean;
  setAttentionOnlyFilter: React.Dispatch<React.SetStateAction<boolean>>;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  onResetFilters: () => void;
}

export function ATSFilters({
  applications,
  filteredCount,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  tradeFilter,
  setTradeFilter,
  minExperienceFilter,
  setMinExperienceFilter,
  destinationFilter,
  setDestinationFilter,
  passportFilter,
  setPassportFilter,
  attentionOnlyFilter,
  setAttentionOnlyFilter,
  sortBy,
  setSortBy,
  onResetFilters,
}: ATSFiltersProps) {
  const hasActiveFilter =
    statusFilter !== 'all' ||
    Boolean(searchQuery) ||
    Boolean(tradeFilter) ||
    Boolean(minExperienceFilter) ||
    Boolean(destinationFilter) ||
    Boolean(passportFilter) ||
    sortBy !== 'date_desc';

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'all', label: `All (${applications.length})` },
            { id: 'new', label: 'New Review' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'interview_scheduled', label: 'Interviews' },
            { id: 'visa_pending', label: 'Visa Pending' },
            { id: 'hired', label: 'Hired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAttentionOnlyFilter((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg transition border ${
              attentionOnlyFilter
                ? 'bg-rose-600 text-white border-rose-500 font-bold'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            Needs Attention ({applications.filter((a) => getAppAttentionInfo(a).needsAttention).length})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, company, skill, remarks, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
        <input
          type="text"
          aria-label="Filter by trade or skill"
          placeholder="Trade / skill (e.g. Welder, HVAC)..."
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
        />
        <select
          aria-label="Filter by minimum experience"
          value={minExperienceFilter}
          onChange={(e) => setMinExperienceFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">Min Experience: Any</option>
          <option value="1">1+ Years</option>
          <option value="3">3+ Years</option>
          <option value="5">5+ Years</option>
          <option value="8">8+ Years</option>
          <option value="10">10+ Years</option>
        </select>
        <select
          aria-label="Filter by destination"
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Destinations</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="United Arab Emirates">UAE / Dubai</option>
          <option value="Qatar">Qatar</option>
          <option value="Oman">Oman</option>
          <option value="Kuwait">Kuwait</option>
          <option value="India">India</option>
        </select>
        <select
          aria-label="Filter by passport status"
          value={passportFilter}
          onChange={(e) => setPassportFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="">All Passports</option>
          <option value="ecnr_ready">ECNR / Ready</option>
          <option value="ecr">ECR</option>
          <option value="renewal">In Renewal</option>
        </select>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {filteredCount} / {applications.length} shown
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Sort by:</span>
          {[
            { id: 'date_desc', label: 'Newest' },
            { id: 'experience_desc', label: 'Most Experienced' },
            { id: 'name_asc', label: 'Name A–Z' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id as SortOption)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                sortBy === opt.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Sort candidates"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px] focus:outline-none focus:border-amber-500"
        >
          <option value="date_desc">Date: Newest First</option>
          <option value="date_asc">Date: Oldest First</option>
          <option value="experience_desc">Experience: High to Low</option>
          <option value="experience_asc">Experience: Low to High</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>
      </div>
    </div>
  );
}
