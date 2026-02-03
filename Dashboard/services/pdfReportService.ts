import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SummaryData, Attacker, Detection, AttackType } from '../types';

export class PDFReportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addHeader() {
    // Logo/Title Section
    this.doc.setFillColor(15, 23, 42); // slate-950
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('HONEYPOT SECURITY REPORT', this.pageWidth / 2, 20, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Attack Detection & Behavioral Analysis', this.pageWidth / 2, 30, { align: 'center' });
    
    this.currentY = 50;
  }

  private addFooter(pageNum: number) {
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(
      `Generated: ${new Date().toLocaleString()} | Page ${pageNum}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
  }

  private addSection(title: string) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFillColor(248, 113, 113); // rose-400
    this.doc.rect(this.margin, this.currentY, 4, 8, 'F');
    
    this.doc.setTextColor(15, 23, 42);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 8, this.currentY + 6);
    
    this.currentY += 15;
  }

  private addKeyValue(key: string, value: string | number, color: string = '#1e293b') {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(71, 85, 105);
    this.doc.text(key + ':', this.margin, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(String(value), this.margin + 60, this.currentY);
    
    this.currentY += 7;
  }

  private getSeverityColor(severity: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      critical: [220, 38, 38],
      high: [249, 115, 22],
      medium: [234, 179, 8],
      low: [34, 197, 94]
    };
    return colors[severity] || [100, 116, 139];
  }

  generateReport(
    summary: SummaryData,
    attacks: AttackType[],
    attackers: Attacker[],
    detections: Detection[],
    aiAnalysis?: string
  ): void {
    // Page 1: Header & Executive Summary
    this.addHeader();
    
    this.addSection('EXECUTIVE SUMMARY');
    this.addKeyValue('Report Generated', new Date().toLocaleString());
    this.addKeyValue('Analysis Period', `${new Date(summary.timeRange.start).toLocaleString()} - ${new Date(summary.timeRange.end).toLocaleString()}`);
    this.currentY += 5;
    
    this.addKeyValue('Total Logs Analyzed', summary.totalLogs.toLocaleString());
    this.addKeyValue('Threats Detected', summary.totalAttacks.toLocaleString());
    this.addKeyValue('Unique Attackers', summary.uniqueAttackers.toLocaleString());
    this.currentY += 10;

    // Severity Breakdown
    this.addSection('SEVERITY BREAKDOWN');
    const severityData = [
      ['Severity Level', 'Count', 'Percentage'],
      ...Object.entries(summary.severityBreakdown).map(([severity, count]) => [
        severity.toUpperCase(),
        count.toString(),
        `${((count / summary.totalAttacks) * 100).toFixed(1)}%`
      ])
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [severityData[0]],
      body: severityData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const severity = data.cell.text[0].toLowerCase();
          const color = this.getSeverityColor(severity);
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    // Attack Types
    this.addSection('ATTACK VECTORS');
    const attackData = [
      ['Attack Type', 'Incidents', 'Severity', 'Risk %'],
      ...attacks.map(atk => [
        atk.type.replace(/_/g, ' '),
        atk.count.toString(),
        atk.severity.toUpperCase(),
        `${((atk.count / summary.totalAttacks) * 100).toFixed(1)}%`
      ])
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [attackData[0]],
      body: attackData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const severity = data.cell.text[0].toLowerCase();
          const color = this.getSeverityColor(severity);
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    // Page 2: Top Attackers
    this.doc.addPage();
    this.currentY = 20;
    
    this.addSection('TOP THREAT ACTORS');
    attackers.slice(0, 5).forEach((attacker, idx) => {
      if (this.currentY > this.pageHeight - 60) {
        this.doc.addPage();
        this.currentY = 20;
      }

      // Attacker Box
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setFillColor(248, 250, 252);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 3, 3, 'FD');
      
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(15, 23, 42);
      this.doc.text(`#${idx + 1} ${attacker.ip}`, this.margin + 5, this.currentY + 8);
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      const color = this.getSeverityColor(attacker.maxSeverity);
      this.doc.setTextColor(...color);
      this.doc.text(attacker.behavior.replace(/_/g, ' '), this.margin + 5, this.currentY + 14);
      
      // Stats
      this.doc.setFontSize(9);
      this.doc.setTextColor(71, 85, 105);
      const statsY = this.currentY + 22;
      this.doc.text(`Threat Score: ${attacker.threatScore}`, this.margin + 5, statsY);
      this.doc.text(`Attacks: ${attacker.attackCount}`, this.margin + 50, statsY);
      this.doc.text(`Severity: ${attacker.maxSeverity.toUpperCase()}`, this.margin + 85, statsY);
      
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(`Techniques: ${attacker.attackTypes.join(', ')}`, this.margin + 5, statsY + 6);
      
      this.currentY += 42;
    });

    // Page 3: Detections
    this.doc.addPage();
    this.currentY = 20;
    
    this.addSection('DETECTION DETAILS');
    detections.slice(0, 10).forEach((detection, idx) => {
      if (this.currentY > this.pageHeight - 50) {
        this.doc.addPage();
        this.currentY = 20;
      }

      const color = this.getSeverityColor(detection.severity);
      
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.currentY, this.margin + 3, this.currentY);
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(15, 23, 42);
      this.doc.text(detection.ruleName, this.margin + 5, this.currentY + 1);
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(71, 85, 105);
      this.doc.text(`Rule: ${detection.ruleId} | IP: ${detection.ip} | Matched: ${detection.matchedLogs} logs`, this.margin + 5, this.currentY + 6);
      
      this.doc.setTextColor(...color);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(detection.severity.toUpperCase(), this.pageWidth - this.margin - 20, this.currentY + 1);
      
      this.currentY += 12;
    });

    // AI Analysis Section (if provided)
    if (aiAnalysis) {
      this.doc.addPage();
      this.currentY = 20;
      
      this.addSection('AI THREAT ANALYSIS');
      
      // AI Icon/Badge
      this.doc.setFillColor(248, 113, 113);
      this.doc.circle(this.margin + 3, this.currentY + 2, 2, 'F');
      
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(100, 116, 139);
      this.doc.text('Generated by Google Gemini AI', this.margin + 8, this.currentY + 3);
      
      this.currentY += 10;
      
      // AI Analysis Content
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(30, 41, 59);
      
      const lines = this.doc.splitTextToSize(aiAnalysis, this.pageWidth - 2 * this.margin);
      lines.forEach((line: string) => {
        if (this.currentY > this.pageHeight - 30) {
          this.doc.addPage();
          this.currentY = 20;
        }
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
    }

    // Footer on all pages
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter(i);
    }
  }

  download(filename: string = 'honeypot-security-report.pdf'): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }
}

export const pdfReportService = new PDFReportService();
