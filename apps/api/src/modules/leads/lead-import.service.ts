import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { LeadSource, LeadStatus, LeadType, PreferredContactMethod } from '@prisma/client';
import type {
  CsvImportPreviewResponse,
  CsvImportPreviewRow,
  ExecuteCsvImportResponse,
  StaffUserSummary,
} from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import { LeadAssignmentService } from './lead-assignment.service.js';
import { generateLeadReference } from './leads.service.js';

export function parseCsvRows(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export class LeadImportService {
  private readonly assignmentService: LeadAssignmentService;

  constructor(private readonly prisma: PrismaClient = defaultPrisma) {
    this.assignmentService = new LeadAssignmentService(prisma);
  }

  /**
   * Previews and validates a CSV payload without writing to the database.
   */
  async previewCsv(csvText: string): Promise<CsvImportPreviewResponse> {
    if (csvText.length > 5 * 1024 * 1024) {
      throw new AppError(400, 'FILE_TOO_LARGE', 'CSV file exceeds maximum allowed size of 5MB');
    }

    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      throw new AppError(
        400,
        'INVALID_CSV',
        'CSV must contain a header row and at least one data row',
      );
    }

    const headerRow = rows[0];
    if (!headerRow) {
      throw new AppError(
        422,
        'INVALID_CSV',
        'CSV must contain a header row and at least one data row',
      );
    }
    const headers = headerRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map column indices
    const nameIdx = headers.findIndex((h) =>
      ['customername', 'name', 'fullname', 'customer'].includes(h),
    );
    const phoneIdx = headers.findIndex((h) =>
      ['phone', 'mobile', 'contact', 'phonenumber'].includes(h),
    );
    const emailIdx = headers.findIndex((h) => ['email', 'emailaddress'].includes(h));
    const modelIdx = headers.findIndex((h) =>
      ['model', 'vehicle', 'car', 'interestedmodel'].includes(h),
    );
    const showroomIdx = headers.findIndex((h) =>
      ['showroom', 'location', 'dealership', 'facility'].includes(h),
    );
    const sourceIdx = headers.findIndex((h) => ['source', 'channel', 'leadsource'].includes(h));
    const messageIdx = headers.findIndex((h) =>
      ['message', 'notes', 'requirements', 'comments'].includes(h),
    );
    const externalIdIdx = headers.findIndex((h) =>
      ['externalid', 'leadid', 'id', 'portalid'].includes(h),
    );

    if (nameIdx === -1 || phoneIdx === -1 || emailIdx === -1 || showroomIdx === -1) {
      throw new AppError(
        422,
        'MISSING_REQUIRED_COLUMNS',
        'CSV must contain headers for Name, Phone, Email, and Showroom (or Location)',
      );
    }

    const showrooms = await this.prisma.showroom.findMany({
      where: { isActive: true },
    });

    const preview: CsvImportPreviewRow[] = [];
    const seenExternalIds = new Set<string>();
    const seenPhoneModel = new Set<string>();

    const indianPhoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const customerName = row[nameIdx] || '';
      const phoneRaw = row[phoneIdx] || '';
      const email = (row[emailIdx] || '').toLowerCase();
      const modelName = modelIdx !== -1 ? row[modelIdx] || '' : '';
      const showroomRaw = row[showroomIdx] || '';
      const source = sourceIdx !== -1 ? row[sourceIdx] || 'PORTAL_IMPORT' : 'PORTAL_IMPORT';
      const message = messageIdx !== -1 ? row[messageIdx] || '' : '';
      const externalId = externalIdIdx !== -1 ? row[externalIdIdx] || '' : '';

      const normalizedPhone = phoneRaw.replace(/[\s-]/g, '');

      let isValid = true;
      let isDuplicate = false;
      let validationError: string | undefined;

      // 1. Validation checks
      if (customerName.length < 2) {
        isValid = false;
        validationError = 'Customer name must be at least 2 characters';
      } else if (!indianPhoneRegex.test(normalizedPhone)) {
        isValid = false;
        validationError = 'Invalid Indian phone number (10 digits starting with 6-9 required)';
      } else if (!emailRegex.test(email)) {
        isValid = false;
        validationError = 'Invalid email address';
      }

      // Showroom matching (by code e.g. LKO-CENTRAL or name containing Central)
      const matchedShowroom = showrooms.find(
        (sh) =>
          sh.code.toLowerCase() === showroomRaw.toLowerCase() ||
          sh.name.toLowerCase().includes(showroomRaw.toLowerCase()) ||
          showroomRaw.toLowerCase().includes(sh.code.toLowerCase()),
      );

      if (!matchedShowroom && isValid) {
        isValid = false;
        validationError = `Showroom '${showroomRaw}' could not be resolved to an active facility (valid: ${showrooms.map((s) => s.code).join(', ')})`;
      }

      // Duplicate check: within file
      if (isValid) {
        if (externalId && seenExternalIds.has(externalId)) {
          isDuplicate = true;
          validationError = `Duplicate external ID '${externalId}' within CSV`;
        } else {
          const comboKey = `${normalizedPhone}_${modelName.toLowerCase()}`;
          if (seenPhoneModel.has(comboKey)) {
            isDuplicate = true;
            validationError = 'Duplicate customer and model combination within CSV';
          }
        }
      }

      // Duplicate check: against database
      if (isValid && !isDuplicate) {
        if (externalId) {
          const existing = await this.prisma.lead.findFirst({
            where: { externalLeadId: externalId },
            select: { id: true },
          });
          if (existing) {
            isDuplicate = true;
            validationError = `External lead ID '${externalId}' was already imported previously`;
          }
        }

        if (!isDuplicate) {
          const recentDbDuplicate = await this.prisma.lead.findFirst({
            where: {
              createdAt: { gte: sevenDaysAgo },
              customer: {
                OR: [{ phone: normalizedPhone }, { email }],
              },
            },
            select: { id: true },
          });
          if (recentDbDuplicate) {
            isDuplicate = true;
            validationError = 'Customer enquiry already exists within the last 7 days';
          }
        }
      }

      if (externalId) seenExternalIds.add(externalId);
      seenPhoneModel.add(`${normalizedPhone}_${modelName.toLowerCase()}`);

      preview.push({
        rowNumber: r,
        customerName,
        phone: normalizedPhone,
        email,
        modelName,
        showroomName: matchedShowroom?.name || showroomRaw,
        source,
        message,
        externalId: externalId || undefined,
        isValid: isValid && !isDuplicate,
        isDuplicate,
        validationError,
      });
    }

    const totalRows = preview.length;
    const validRows = preview.filter((p) => p.isValid).length;
    const duplicateRows = preview.filter((p) => p.isDuplicate).length;
    const invalidRows = preview.filter((p) => !p.isValid && !p.isDuplicate).length;

    return {
      totalRows,
      validRows,
      duplicateRows,
      invalidRows,
      preview,
    };
  }

  /**
   * Executes portal CSV import and performs automatic assignment for each lead.
   */
  async executeImport(
    filename: string,
    source: LeadSource,
    rows: Array<{
      customerName: string;
      phone: string;
      email: string;
      modelName?: string;
      showroomCodeOrName?: string;
      showroomName?: string;
      source?: string;
      message?: string;
      externalId?: string;
    }>,
    staffUser: StaffUserSummary,
  ): Promise<ExecuteCsvImportResponse> {
    if (staffUser.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only administrators are authorized to import leads');
    }

    const showrooms = await this.prisma.showroom.findMany({ where: { isActive: true } });
    const models = await this.prisma.vehicleModel.findMany({ where: { isActive: true } });

    const batchReference = `IMP-${new Date().getFullYear()}-${crypto.randomInt(10000, 99999)}`;

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    const batch = await this.prisma.leadImportBatch.create({
      data: {
        batchReference,
        filename,
        source,
        uploadedByStaffId: staffUser.id,
        totalRows: rows.length,
        importedRows: 0,
        failedRows: 0,
        duplicateRows: 0,
        status: 'PENDING',
      },
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const normalizedPhone = row.phone.replace(/[\s-]/g, '');

      try {
        // Resolve showroom
        const showroomInput = (row.showroomCodeOrName || row.showroomName || '').trim();
        const matchedShowroom = showrooms.find(
          (sh) =>
            sh.code.toLowerCase() === showroomInput.toLowerCase() ||
            sh.name.toLowerCase().includes(showroomInput.toLowerCase()),
        );

        if (!matchedShowroom) {
          failedCount++;
          errors.push({ row: i + 1, error: `Showroom '${showroomInput}' not found` });
          continue;
        }

        // Deduplication check
        if (row.externalId) {
          const existing = await this.prisma.lead.findFirst({
            where: { externalLeadId: row.externalId },
          });
          if (existing) {
            duplicateCount++;
            continue;
          }
        }

        // Resolve model
        const matchedModel = models.find(
          (m) =>
            row.modelName &&
            (m.name.toLowerCase().includes(row.modelName.toLowerCase()) ||
              row.modelName.toLowerCase().includes(m.name.toLowerCase())),
        );

        const leadReference = generateLeadReference();

        await this.prisma.$transaction(async (tx) => {
          let customer = await tx.customer.findFirst({
            where: {
              OR: [{ phone: normalizedPhone }, { email: row.email.toLowerCase() }],
            },
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                fullName: row.customerName.trim(),
                phone: normalizedPhone,
                email: row.email.toLowerCase(),
              },
            });
          }

          await tx.customerConsent.create({
            data: {
              customerId: customer.id,
              purpose: 'EXTERNAL_PORTAL_TRANSFER',
              noticeVersion: '2026.1',
              granted: false,
              verificationStatus: 'UNVERIFIED_THIRD_PARTY_PORTAL',
              source: 'PORTAL_IMPORT',
            },
          });

          const lead = await tx.lead.create({
            data: {
              leadReference,
              customerId: customer.id,
              type: LeadType.NEW_CAR,
              modelId: matchedModel?.id || null,
              showroomId: matchedShowroom.id,
              source: LeadSource.PORTAL_IMPORT,
              consentStatus: 'EXTERNAL_PORTAL_TRANSFER',
              status: LeadStatus.NEW,
              preferredContactMethod: PreferredContactMethod.PHONE,
              customerRequirements: row.message?.trim() || null,
              externalLeadId: row.externalId || null,
              importBatchId: batch.id,
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              staffUserId: staffUser.id,
              activityType: 'IMPORT',
              summary: `Imported from CSV batch ${batchReference}`,
              details: `Portal source: ${row.source || 'CSV'}`,
            },
          });

          // Route and assign
          await this.assignmentService.assignLead(
            lead.id,
            matchedShowroom.id,
            LeadType.NEW_CAR,
            tx,
          );
        });

        importedCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Import failed',
        });
      }
    }

    await this.prisma.leadImportBatch.update({
      where: { id: batch.id },
      data: {
        importedRows: importedCount,
        duplicateRows: duplicateCount,
        failedRows: failedCount,
        status: failedCount > 0 ? (importedCount > 0 ? 'PARTIAL' : 'FAILED') : 'COMPLETED',
        errorSummary: errors.length > 0 ? errors : undefined,
      },
    });

    return {
      batchReference,
      totalRows: rows.length,
      importedCount,
      duplicateCount,
      failedCount,
    };
  }

  /**
   * Lists import batch history.
   */
  async listImportBatches() {
    return this.prisma.leadImportBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        uploadedBy: {
          select: { fullName: true, email: true },
        },
      },
    });
  }
}
