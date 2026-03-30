import { Injectable, signal, computed } from '@angular/core';
import { Report, ReportStatus } from '../models/report';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  // Master Signal for all incidents
  private _reports = signal<Report[]>([
    {
      id: 'RE-9921',
      reporter_id: 'CIT-001',
      type: 'theft',
      status: ReportStatus.SUBMITTED,
      description: 'Theft of bicycle near Union Station.',
      address: '65 Front St W, Toronto',
      lat: 43.6453,
      lng: -79.3806,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
      updated_at: new Date()
    },
    {
      id: 'RE-9922',
      reporter_id: 'CIT-002',
      type: 'vandalism',
      status: ReportStatus.IN_REVIEW,
      description: 'Graffiti on the wall of the community center.',
      address: '100 Queen St W, Toronto',
      lat: 43.6534,
      lng: -79.3841,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 25),
      updated_at: new Date()
    }
  ]);

  // Read-only access to reports
  public reports = this._reports.asReadonly();

  // Computed Stats
  public stats = computed(() => {
    const all = this._reports();
    return {
      total: all.length,
      pending: all.filter(r => r.status === ReportStatus.SUBMITTED).length,
      resolved: all.filter(r => r.status === ReportStatus.RESOLVED).length
    };
  });

  constructor() {}

  /**
   * Adds a new report to the central state.
   */
  addReport(reportData: Partial<Report>) {
    const newReport: Report = {
      id: `RE-${Math.floor(1000 + Math.random() * 9000)}`,
      reporter_id: 'CIT-CURRENT', 
      type: reportData.type || 'other',
      status: ReportStatus.SUBMITTED,
      description: reportData.description || '',
      lat: reportData.lat || 43.6532,
      lng: reportData.lng || -79.3832,
      address: reportData.address || 'Unknown Address',
      created_at: new Date(),
      updated_at: new Date(),
      ...reportData
    } as Report;

    this._reports.update(current => [newReport, ...current]);
    return newReport;
  }

  /**
   * Performs reactive administrative updates to a report's record.
   */
  updateReport(id: string, updates: Partial<Report>) {
    this._reports.update(all => 
      all.map(report => 
        report.id === id 
          ? { ...report, ...updates, updated_at: new Date() } 
          : report
      )
    );
  }
}
