import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Report, ReportStatus } from './report.entity';

@Injectable()
export class ReportsService {
  private reports: Report[] = []; // Using in-memory array for demo purposes, TypeORM repository would be used in real DB

  constructor(private eventEmitter: EventEmitter2) {}

  async create(reportData: Partial<Report>): Promise<Report> {
    const report = new Report();
    Object.assign(report, {
      ...reportData,
      id: Math.random().toString(36).substr(2, 9),
      status: ReportStatus.SUBMITTED,
      created_at: new Date(),
      updated_at: new Date(),
    });
    this.reports.push(report);
    
    // Emit event for workflow engine
    this.eventEmitter.emit('report.created', report);
    
    return report;
  }

  async findAll(): Promise<Report[]> {
    return this.reports;
  }

  async findOne(id: string): Promise<Report> {
    const report = this.reports.find(r => r.id === id);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async updateStatus(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.findOne(id);
    const oldStatus = report.status;
    report.status = status;
    report.updated_at = new Date();
    
    this.eventEmitter.emit('report.status_updated', { report, oldStatus });
    
    return report;
  }
}
