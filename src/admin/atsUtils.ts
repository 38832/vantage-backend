import type { ATSApplication, ATSFilterCriteria, AttentionInfo } from './types';

export const REJECTION_REASONS = [
  'Salary Mismatch',
  'Document Incomplete',
  'Experience Mismatch',
  'Medical / Visa Issue',
  'Not Interested',
  'Other',
];

export function getAppExperienceYears(app: ATSApplication): number {
  if (typeof app.experience_years === 'number') return app.experience_years;
  if (typeof app.years_experience === 'number') return app.years_experience;
  const match = String(app.experience || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function getAppAttentionInfo(app: ATSApplication): AttentionInfo {
  const status = (app.application_status || app.status || 'new').toLowerCase();
  const activeStatuses = ['new', 'applied', 'contacted', 'shortlisted'];
  if (!activeStatuses.includes(status)) {
    return { needsAttention: false, daysInactive: 0, isUrgent: false, reason: '' };
  }
  if (typeof app.needs_attention === 'boolean') {
    const days = typeof app.days_inactive === 'number' ? app.days_inactive : 0;
    return {
      needsAttention: app.needs_attention,
      daysInactive: days,
      isUrgent: days >= 7,
      reason: app.attention_reason || (app.needs_attention ? `Inactive for ${days} days` : ''),
    };
  }
  const refIso = app.last_contacted_at || app.created_at;
  const refMs = refIso ? new Date(refIso).getTime() : Date.now();
  const daysInactive = Math.max(0, Math.floor((Date.now() - refMs) / 86400000));
  const needsAttention = daysInactive >= 5;
  return {
    needsAttention,
    daysInactive,
    isUrgent: daysInactive >= 7,
    reason: needsAttention
      ? app.last_contacted_at
        ? `No follow-up for ${daysInactive} days`
        : `No contact for ${daysInactive} days`
      : '',
  };
}

export function filterAndSortApplications(
  applications: ATSApplication[],
  criteria: ATSFilterCriteria
): ATSApplication[] {
  const {
    statusFilter,
    searchQuery,
    tradeFilter,
    minExperienceFilter,
    destinationFilter,
    passportFilter,
    attentionOnlyFilter,
    sortBy,
  } = criteria;

  return applications
    .filter((app) => {
      const appStatus = app.application_status || app.status || 'new';
      if (statusFilter !== 'all' && appStatus !== statusFilter) return false;

      const roleText = (
        app.target_trade ||
        app.candidate_job_title ||
        app.candidate_role ||
        app.trade ||
        app.job_title ||
        ''
      ).toLowerCase();
      const destText = (app.destination || app.destination_country || app.location_country || '').toLowerCase();
      const passText = (app.passport_status || app.passport || '').toLowerCase();

      if (tradeFilter.trim() && !roleText.includes(tradeFilter.trim().toLowerCase())) return false;

      if (minExperienceFilter !== '') {
        const minExp = parseInt(minExperienceFilter, 10);
        if (getAppExperienceYears(app) < minExp) return false;
      }

      if (destinationFilter) {
        const targetDest = destinationFilter.toLowerCase();
        if (targetDest === 'united arab emirates') {
          if (!destText.includes('united arab emirates') && !destText.includes('uae') && !destText.includes('dubai')) {
            return false;
          }
        } else if (!destText.includes(targetDest)) {
          return false;
        }
      }

      if (passportFilter) {
        if (passportFilter === 'ecnr_ready') {
          if (!passText.includes('ecnr') && !passText.includes('ready') && !passText.includes('valid')) return false;
        } else if (passportFilter === 'ecr') {
          if (!passText.includes('ecr') || passText.includes('ecnr')) return false;
        } else if (passportFilter === 'renewal') {
          if (!passText.includes('renew')) return false;
        }
      }

      if (attentionOnlyFilter && !getAppAttentionInfo(app).needsAttention) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = [
          app.candidate_name,
          app.name,
          app.full_name,
          app.candidate_phone,
          app.phone,
          app.candidate_email,
          app.email,
          roleText,
          app.company_name,
          destText,
          app.interview_notes,
          app.notes,
          app.recruiter_assigned,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === 'experience_desc') {
        return getAppExperienceYears(b) - getAppExperienceYears(a);
      }
      if (sortBy === 'experience_asc') {
        return getAppExperienceYears(a) - getAppExperienceYears(b);
      }
      if (sortBy === 'name_asc') {
        const nameA = a.candidate_name || a.name || a.full_name || '';
        const nameB = b.candidate_name || b.name || b.full_name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name_desc') {
        const nameA = a.candidate_name || a.name || a.full_name || '';
        const nameB = b.candidate_name || b.name || b.full_name || '';
        return nameB.localeCompare(nameA);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
}

function sanitizeSpreadsheetCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function escapeXmlCell(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportCandidatesToFile(
  filteredApps: ATSApplication[],
  selectedIds: string[],
  format: 'csv' | 'excel'
): void {
  const targetApps =
    selectedIds.length > 0 ? filteredApps.filter((app) => selectedIds.includes(app.id)) : filteredApps;

  if (targetApps.length === 0) return;

  const headers = [
    'Candidate Name',
    'Phone',
    'WhatsApp',
    'Email',
    'Target Trade',
    'Company / Pool',
    'Destination',
    'Experience',
    'Passport Status',
    'Medical Status',
    'Visa Status',
    'Pipeline Status',
    'Recruiter Assigned',
    'Applied Date',
  ];

  const rows = targetApps.map((app) => {
    const name = app.candidate_name || app.name || app.full_name || 'Applicant';
    const phone = app.candidate_phone || app.phone || '';
    const whatsapp = app.candidate_whatsapp || app.whatsapp || phone;
    const email = app.candidate_email || app.email || '';
    const trade =
      app.target_trade ||
      app.trade ||
      app.candidate_job_title ||
      app.candidate_role ||
      app.job_title ||
      'General Deployment';
    const company = app.company_name || "Nouman's Consultancy Pool";
    const dest = app.destination || app.destination_country || app.location_country || 'GCC / Overseas';
    const exp =
      app.experience ||
      (app.experience_years
        ? `${app.experience_years} yrs`
        : app.years_experience
        ? `${app.years_experience} yrs`
        : 'Fresher');
    const passport = app.passport_status || app.passport || 'ready';
    const appliedDate = app.created_at ? app.created_at.slice(0, 10) : '';

    return [
      name,
      phone,
      whatsapp,
      email,
      trade,
      company,
      dest,
      exp,
      passport,
      app.medical_status || 'pending',
      app.visa_status || 'not_started',
      app.application_status || app.status || 'new',
      app.recruiter_assigned || '',
      appliedDate,
    ].map(sanitizeSpreadsheetCell);
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  let blob: Blob;
  let filename: string;

  if (format === 'excel') {
    const headerXml = headers
      .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXmlCell(h)}</Data></Cell>`)
      .join('');
    const rowsXml = rows
      .map((r) => `<Row>${r.map((c) => `<Cell><Data ss:Type="String">${escapeXmlCell(c)}</Data></Cell>`).join('')}</Row>`)
      .join('\n');
    const xmlDoc = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?mso-application progid="Excel.Sheet"?>',
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">',
      '<Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F2B48" ss:Pattern="Solid"/></Style></Styles>',
      '<Worksheet ss:Name="Candidates"><Table>',
      `<Row>${headerXml}</Row>`,
      rowsXml,
      '</Table></Worksheet></Workbook>',
    ].join('\n');
    blob = new Blob([xmlDoc], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    filename = `candidates_export_${dateStamp}.xls`;
  } else {
    const csvLine = (cols: string[]) => cols.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');
    const csvText = '\uFEFF' + [csvLine(headers), ...rows.map(csvLine)].join('\r\n');
    blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    filename = `candidates_export_${dateStamp}.csv`;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
