import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../auth/roles.enum';
import { ReportStatus } from './report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CITIZEN)
  async create(@Body() createReportDto: CreateReportDto, @Request() req: any) {
    return this.reportsService.create({
      ...createReportDto,
      reporter_id: req.user.id,
    });
  }

  @Get()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReportStatus
  ) {
    return this.reportsService.updateStatus(id, status);
  }
}
